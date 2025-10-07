import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Class {
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  event_type: string;
  location: string;
  max_participants: number;
  instructor: string | null;
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [classesRes, eventsRes] = await Promise.all([
        supabase.from("classes").select("*").order("class_date", { ascending: true }),
        supabase.from("events").select("*").order("event_date", { ascending: true })
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('class-event-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error uploading image", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get('image') as File;
    
    let imageUrl = editingClass?.image_url || null;
    
    if (imageFile && imageFile.size > 0) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const classData = {
      title: formData.get('title') as string,
      instructor: formData.get('instructor') as string,
      class_date: formData.get('class_date') as string,
      class_time: formData.get('class_time') as string,
      duration: formData.get('duration') as string,
      class_type: formData.get('class_type') as string,
      max_participants: parseInt(formData.get('max_participants') as string),
      image_url: imageUrl
    };

    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', editingClass.id);
        if (error) throw error;
        toast({ title: "Class updated successfully" });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([classData]);
        if (error) throw error;
        toast({ title: "Class created successfully" });
      }
      setIsDialogOpen(false);
      setEditingClass(null);
      loadData();
    } catch (error) {
      console.error("Error saving class:", error);
      toast({ title: "Error saving class", variant: "destructive" });
    }
  };

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      event_date: formData.get('event_date') as string,
      event_time: formData.get('event_time') as string,
      event_type: formData.get('event_type') as string,
      location: formData.get('location') as string,
      max_participants: parseInt(formData.get('max_participants') as string),
      instructor: formData.get('instructor') as string,
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        if (error) throw error;
        toast({ title: "Event created successfully" });
      }
      setIsDialogOpen(false);
      setEditingEvent(null);
      loadData();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({ title: "Error saving event", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Class deleted successfully" });
      loadData();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({ title: "Error deleting class", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Event deleted successfully" });
      loadData();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error deleting event", variant: "destructive" });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Manage Classes</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingClass(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveClass} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" defaultValue={editingClass?.title} required />
                    </div>
                    <div>
                      <Label htmlFor="instructor">Instructor</Label>
                      <Input id="instructor" name="instructor" defaultValue={editingClass?.instructor} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="class_date">Date</Label>
                        <Input id="class_date" name="class_date" type="date" defaultValue={editingClass?.class_date} required />
                      </div>
                      <div>
                        <Label htmlFor="class_time">Time</Label>
                        <Input id="class_time" name="class_time" defaultValue={editingClass?.class_time} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration</Label>
                        <Input id="duration" name="duration" defaultValue={editingClass?.duration} placeholder="e.g., 60 mins" required />
                      </div>
                      <div>
                        <Label htmlFor="class_type">Type</Label>
                        <select id="class_type" name="class_type" defaultValue={editingClass?.class_type} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select type...</option>
                          <option value="video">Video</option>
                          <option value="livestream">Livestream</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input id="max_participants" name="max_participants" type="number" defaultValue={editingClass?.max_participants || 30} required />
                    </div>
                    <div>
                      <Label htmlFor="image">Image</Label>
                      <Input id="image" name="image" type="file" accept="image/*" />
                      {editingClass?.image_url && (
                        <p className="text-sm text-muted-foreground mt-1">Current image will be kept if no new image is uploaded</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{cls.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cls.image_url && (
                      <img src={cls.image_url} alt={cls.title} className="w-full h-40 object-cover rounded mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">Instructor: {cls.instructor}</p>
                    <p className="text-sm">Date: {cls.class_date}</p>
                    <p className="text-sm">Time: {cls.class_time}</p>
                    <p className="text-sm">Duration: {cls.duration}</p>
                    <p className="text-sm">Type: {cls.class_type}</p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingClass(cls);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClass(cls.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Manage Events</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingEvent(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div>
                      <Label htmlFor="event-title">Title</Label>
                      <Input id="event-title" name="title" defaultValue={editingEvent?.title} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" defaultValue={editingEvent?.description || ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_date">Date</Label>
                        <Input id="event_date" name="event_date" type="date" defaultValue={editingEvent?.event_date.split('T')[0]} required />
                      </div>
                      <div>
                        <Label htmlFor="event_time">Time</Label>
                        <Input id="event_time" name="event_time" defaultValue={editingEvent?.event_time} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_type">Type</Label>
                        <select id="event_type" name="event_type" defaultValue={editingEvent?.event_type} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select type...</option>
                          <option value="running">Running</option>
                          <option value="hiit">HIIT</option>
                          <option value="strength">Strength</option>
                          <option value="social">Social</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" defaultValue={editingEvent?.location} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event_instructor">Instructor (optional)</Label>
                      <Input id="event_instructor" name="instructor" defaultValue={editingEvent?.instructor || ''} />
                    </div>
                    <div>
                      <Label htmlFor="event_max_participants">Max Participants</Label>
                      <Input id="event_max_participants" name="max_participants" type="number" defaultValue={editingEvent?.max_participants || 50} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {event.description && (
                      <p className="text-sm mb-2">{event.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Type: {event.event_type}</p>
                    <p className="text-sm">Date: {new Date(event.event_date).toLocaleDateString()}</p>
                    <p className="text-sm">Time: {event.event_time}</p>
                    <p className="text-sm">Location: {event.location}</p>
                    {event.instructor && (
                      <p className="text-sm">Instructor: {event.instructor}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEvent(event);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
