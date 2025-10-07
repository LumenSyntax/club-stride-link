import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ClassCard from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassData {
  id: string;
  title: string;
  instructor: string;
  class_date: string;
  class_time: string;
  duration: string;
  class_type: string;
  image_url: string | null;
  max_participants: number;
}

const Classes = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
    loadRegistrations();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("class_date", { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast({ title: "Error loading classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("class_registrations")
        .select("class_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setRegistrations(new Set(data?.map(r => r.class_id) || []));
    } catch (error) {
      console.error("Error loading registrations:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
              TRAINING CLASSES
            </h1>
            <p className="text-lg text-foreground max-w-2xl mx-auto uppercase tracking-ultra-wide font-bold">
              JOIN LIVE SESSIONS WITH EXPERT COACHES OR TRAIN ON YOUR OWN SCHEDULE
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12 border-4 border-border">
              <p className="text-xl font-bold uppercase tracking-ultra-wide">NO CLASSES AVAILABLE</p>
              <p className="text-muted-foreground mt-2 uppercase tracking-wide">CHECK BACK SOON FOR NEW SESSIONS</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {classes.map((classItem) => (
                <ClassCard 
                  key={classItem.id} 
                  title={classItem.title}
                  instructor={classItem.instructor}
                  date={formatDate(classItem.class_date)}
                  time={classItem.class_time}
                  duration={classItem.duration}
                  participants={classItem.max_participants}
                  type={classItem.class_type === "livestream" ? "livestream" : "video"}
                  image={classItem.image_url || "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop"}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Classes;
