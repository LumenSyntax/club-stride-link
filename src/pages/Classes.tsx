import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Play, Video, Lock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ClassData {
  id: string;
  title: string;
  description: string | null;
  instructor: string;
  upload_date: string;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
}

interface ClassPart {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  part_order: number;
  duration: string | null;
}

interface Purchase {
  class_id: string;
}

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [classParts, setClassParts] = useState<ClassPart[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [watchingPartId, setWatchingPartId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
    if (user) {
      loadPurchases();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast({ title: "Error loading classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("class_purchases")
        .select("class_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
  };

  const loadClassParts = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from("class_parts")
        .select("*")
        .eq("class_id", classId)
        .order("part_order", { ascending: true });

      if (error) throw error;
      setClassParts(data || []);
    } catch (error) {
      console.error("Error loading class parts:", error);
      toast({ title: "Error loading class parts", variant: "destructive" });
    }
  };

  const handleViewClass = async (classItem: ClassData) => {
    setSelectedClass(classItem);
    await loadClassParts(classItem.id);
    setIsDialogOpen(true);
  };

  const hasAccess = (classItem: ClassData) => {
    if (classItem.is_free) return true;
    if (!user) return false;
    return purchases.some(p => p.class_id === classItem.id);
  };

  const handleWatchPart = async (part: ClassPart) => {
    if (!user) {
      toast({ 
        title: "Login required", 
        description: "Please log in to watch videos",
        variant: "destructive" 
      });
      return;
    }

    if (!selectedClass) return;

    // Check if user has access
    if (!hasAccess(selectedClass)) {
      toast({ 
        title: "Purchase required", 
        description: "Please purchase this class to watch videos",
        variant: "destructive" 
      });
      return;
    }

    setWatchingPartId(part.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-access', {
        body: { classPartId: part.id }
      });

      if (error) throw error;

      setVideoUrl(data.signedUrl);
      setUserEmail(data.userEmail);
      
      // Open video in new tab
      window.open(data.signedUrl, '_blank');
      
      toast({ 
        title: "Video access granted", 
        description: "Opening video in new tab. Link expires in 1 hour." 
      });
    } catch (error: any) {
      console.error("Error generating video access:", error);
      toast({ 
        title: "Error accessing video", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setWatchingPartId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center border-b-4 border-foreground pb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tight font-display">
              VIDEO CLASSES
            </h1>
            <p className="text-lg text-foreground max-w-2xl mx-auto uppercase tracking-ultra-wide font-bold">
              TRAIN ON YOUR OWN SCHEDULE WITH OUR ON-DEMAND VIDEO COLLECTIONS
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12 border-4 border-border">
              <p className="text-xl font-bold uppercase tracking-ultra-wide">NO CLASSES AVAILABLE</p>
              <p className="text-muted-foreground mt-2 uppercase tracking-wide">CHECK BACK SOON FOR NEW VIDEOS</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="border-4 hover:shadow-lg transition-shadow relative">
                  {!classItem.is_free && (
                    <Badge className="absolute top-4 right-4 z-10 font-bold">
                      ${classItem.price.toFixed(2)}
                    </Badge>
                  )}
                  {classItem.is_free && (
                    <Badge variant="secondary" className="absolute top-4 right-4 z-10 font-bold">
                      FREE
                    </Badge>
                  )}
                  {hasAccess(classItem) && !classItem.is_free && (
                    <Badge variant="default" className="absolute top-4 left-4 z-10 font-bold bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      OWNED
                    </Badge>
                  )}
                  <CardHeader>
                    {classItem.thumbnail_url && (
                      <div className="relative mb-4">
                        <img 
                          src={classItem.thumbnail_url} 
                          alt={classItem.title}
                          className="w-full h-48 object-cover rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          {hasAccess(classItem) ? (
                            <Video className="h-16 w-16 text-white" />
                          ) : (
                            <Lock className="h-16 w-16 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    <CardTitle className="text-xl uppercase font-black tracking-wide">
                      {classItem.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classItem.description && (
                      <p className="text-sm text-muted-foreground mb-4">{classItem.description}</p>
                    )}
                    <div className="space-y-2 text-sm font-bold mb-4">
                      <p className="uppercase tracking-wide">INSTRUCTOR: {classItem.instructor}</p>
                      <p className="uppercase tracking-wide">UPLOADED: {formatDate(classItem.upload_date)}</p>
                    </div>
                    <Button 
                      className="w-full uppercase tracking-ultra-wide font-black"
                      onClick={() => handleViewClass(classItem)}
                    >
                      {hasAccess(classItem) ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          VIEW CLASS
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          PURCHASE TO VIEW
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Class Parts Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl uppercase font-black tracking-wide flex items-center gap-2">
              {selectedClass?.title}
              {selectedClass && !selectedClass.is_free && (
                <Badge variant="outline">
                  ${selectedClass.price.toFixed(2)}
                </Badge>
              )}
              {selectedClass && hasAccess(selectedClass) && !selectedClass.is_free && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  OWNED
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClass?.description && (
              <p className="text-muted-foreground">{selectedClass.description}</p>
            )}
            
            {selectedClass && !hasAccess(selectedClass) && (
              <div className="bg-muted p-4 rounded-lg border-2 border-destructive">
                <h4 className="font-bold text-destructive mb-2">🔒 PURCHASE REQUIRED</h4>
                <p className="text-sm mb-4">
                  This class costs ${selectedClass.price.toFixed(2)}. Purchase to unlock all video parts.
                </p>
                <Button className="w-full">
                  Purchase Class - ${selectedClass.price.toFixed(2)}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-bold uppercase tracking-wide">INSTRUCTOR: {selectedClass?.instructor}</h3>
              <h3 className="font-bold uppercase tracking-wide">CLASS PARTS ({classParts.length})</h3>
            </div>
            {classParts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No parts available yet</p>
            ) : (
              <div className="space-y-4">
                {classParts.map((part) => (
                  <Card key={part.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-black uppercase tracking-wide mb-2">
                            Part {part.part_order}: {part.title}
                          </h4>
                          {part.description && (
                            <p className="text-sm text-muted-foreground mb-2">{part.description}</p>
                          )}
                          {part.duration && (
                            <p className="text-sm font-bold uppercase tracking-wide">Duration: {part.duration}</p>
                          )}
                          {userEmail && videoUrl && watchingPartId === part.id && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Watermark: {userEmail}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleWatchPart(part)}
                          disabled={watchingPartId === part.id || (selectedClass && !hasAccess(selectedClass))}
                        >
                          {watchingPartId === part.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              LOADING
                            </>
                          ) : selectedClass && !hasAccess(selectedClass) ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              LOCKED
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              WATCH
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
