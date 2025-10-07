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
import { Loader2, Plus, Pencil, Trash2, Video, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Class {
  id?: string;
  title: string;
  description?: string;
  instructor: string;
  upload_date: string;
  thumbnail_url?: string;
  price?: number;
  is_free?: boolean;
}

interface ClassPart {
  id?: string;
  class_id?: string;
  title: string;
  description?: string;
  video_url: string;
  part_order: number;
  duration?: string;
}

interface Event {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_type: string;
  location: string;
  max_participants: number;
  instructor?: string;
  participant_count?: number;
}

interface EventRegistration {
  id: string;
  user_id: string;
  registered_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [classParts, setClassParts] = useState<ClassPart[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingPart, setEditingPart] = useState<ClassPart | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isPartsDialogOpen, setIsPartsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedClassForParts, setSelectedClassForParts] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<Event | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [isRegistrationsDialogOpen, setIsRegistrationsDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [classesRes, eventsRes, registrationsRes] = await Promise.all([
        supabase.from("classes").select("*").order("upload_date", { ascending: false }),
        supabase.from("events").select("*").order("event_date", { ascending: true }),
        supabase.from("event_registrations").select("event_id")
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      
      // Add participant counts to events
      if (eventsRes.data && registrationsRes.data) {
        const participantCounts = registrationsRes.data.reduce((acc, reg) => {
          acc[reg.event_id] = (acc[reg.event_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const eventsWithCounts = eventsRes.data.map(event => ({
          ...event,
          participant_count: participantCounts[event.id] || 0
        }));
        setEvents(eventsWithCounts);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoadingData(false);
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
    const imageFile = formData.get('thumbnail') as File;
    
    let thumbnailUrl = editingClass?.thumbnail_url || null;
    
    if (imageFile && imageFile.size > 0) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) thumbnailUrl = uploadedUrl;
    }

    const isFree = formData.get('is_free') === 'on';
    const price = isFree ? 0 : parseFloat(formData.get('price') as string);

    const classData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      instructor: formData.get('instructor') as string,
      upload_date: formData.get('upload_date') as string,
      thumbnail_url: thumbnailUrl,
      price,
      is_free: isFree
    };

    try {
      if (editingClass?.id) {
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
      setIsClassDialogOpen(false);
      setEditingClass(null);
      loadData();
    } catch (error) {
      console.error("Error saving class:", error);
      toast({ title: "Error saving class", variant: "destructive" });
    }
  };

  const handleSaveClassPart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const partData = {
      class_id: selectedClassForParts!,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      video_url: formData.get('video_url') as string,
      part_order: parseInt(formData.get('part_order') as string),
      duration: formData.get('duration') as string,
    };

    try {
      if (editingPart?.id) {
        const { error } = await supabase
          .from('class_parts')
          .update(partData)
          .eq('id', editingPart.id);
        if (error) throw error;
        toast({ title: "Part updated successfully" });
      } else {
        const { error } = await supabase
          .from('class_parts')
          .insert([partData]);
        if (error) throw error;
        toast({ title: "Part added successfully" });
      }
      setEditingPart(null);
      loadClassParts(selectedClassForParts!);
    } catch (error) {
      console.error("Error saving class part:", error);
      toast({ title: "Error saving part", variant: "destructive" });
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
      if (editingEvent?.id) {
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
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      loadData();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({ title: "Error saving event", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class and all its parts?")) return;
    
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

  const handleDeleteClassPart = async (id: string) => {
    if (!confirm("Are you sure you want to delete this part?")) return;
    
    try {
      const { error } = await supabase.from('class_parts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Part deleted successfully" });
      loadClassParts(selectedClassForParts!);
    } catch (error) {
      console.error("Error deleting part:", error);
      toast({ title: "Error deleting part", variant: "destructive" });
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

  const loadEventRegistrations = async (event: Event) => {
    try {
      // First get registrations
      const { data: registrations, error } = await supabase
        .from("event_registrations")
        .select("id, user_id, registered_at")
        .eq("event_id", event.id);

      if (error) throw error;

      // Then fetch profiles for each user
      const enrichedRegistrations = await Promise.all(
        (registrations || []).map(async (reg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", reg.user_id)
            .maybeSingle();

          return {
            ...reg,
            profiles: profile || { full_name: null }
          };
        })
      );

      setEventRegistrations(enrichedRegistrations);
      setSelectedEventForRegistrations(event);
      setIsRegistrationsDialogOpen(true);
    } catch (error) {
      console.error("Error loading registrations:", error);
      toast({ title: "Error loading registrations", variant: "destructive" });
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
            <TabsTrigger value="classes">Video Classes</TabsTrigger>
            <TabsTrigger value="events">Events & Live Classes</TabsTrigger>
          </TabsList>

          {/* Video Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Manage Video Classes</h2>
              <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingClass(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class Collection
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingClass?.id ? 'Edit Class Collection' : 'Add New Class Collection'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveClass} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" defaultValue={editingClass?.title} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" defaultValue={editingClass?.description} />
                    </div>
                    <div>
                      <Label htmlFor="instructor">Instructor</Label>
                      <Input id="instructor" name="instructor" defaultValue={editingClass?.instructor} required />
                    </div>
                    <div>
                      <Label htmlFor="upload_date">Upload Date</Label>
                      <Input id="upload_date" name="upload_date" type="date" defaultValue={editingClass?.upload_date || new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div>
                      <Label htmlFor="thumbnail">Thumbnail Image</Label>
                      <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
                      {editingClass?.thumbnail_url && (
                        <p className="text-sm text-muted-foreground mt-1">Current thumbnail will be kept if no new image is uploaded</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editingClass?.price || 0} />
                        <p className="text-sm text-muted-foreground mt-1">Set to 0 for free classes</p>
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <input 
                          id="is_free" 
                          name="is_free" 
                          type="checkbox" 
                          defaultChecked={editingClass?.is_free ?? true}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is_free">Make this class free</Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsClassDialogOpen(false)}>
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
                    {cls.thumbnail_url && (
                      <img src={cls.thumbnail_url} alt={cls.title} className="w-full h-40 object-cover rounded mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">Instructor: {cls.instructor}</p>
                    <p className="text-sm">Upload Date: {cls.upload_date}</p>
                    <p className="text-sm font-bold">
                      {cls.is_free ? 'FREE' : `$${cls.price?.toFixed(2)}`}
                    </p>
                    {cls.description && <p className="text-sm text-muted-foreground mt-2">{cls.description}</p>}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClassForParts(cls.id!);
                        loadClassParts(cls.id!);
                        setIsPartsDialogOpen(true);
                      }}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Parts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingClass(cls);
                        setIsClassDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClass(cls.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events & Live Classes Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Manage Events & Live Classes</h2>
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingEvent(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event/Live Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEvent?.id ? 'Edit Event' : 'Add New Event/Live Class'}</DialogTitle>
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
                        <Input id="event_date" name="event_date" type="date" defaultValue={editingEvent?.event_date?.split('T')[0]} required />
                      </div>
                      <div>
                        <Label htmlFor="event_time">Time</Label>
                        <Input id="event_time" name="event_time" defaultValue={editingEvent?.event_time} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_type">Type</Label>
                        <select id="event_type" name="event_type" defaultValue={editingEvent?.event_type || 'live_class'} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="live_class">Live Class</option>
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
                      <Input id="event_max_participants" name="max_participants" type="number" defaultValue={editingEvent?.max_participants || 30} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEventDialogOpen(false)}>
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
                    <p className="text-sm">{event.description}</p>
                    <p className="text-sm mt-2">Date: {event.event_date.split('T')[0]}</p>
                    <p className="text-sm">Time: {event.event_time}</p>
                    <p className="text-sm">Type: {event.event_type === 'live_class' ? 'Live Class' : event.event_type}</p>
                    <p className="text-sm">Location: {event.location}</p>
                    {event.instructor && <p className="text-sm">Instructor: {event.instructor}</p>}
                    <p className="text-sm font-bold">
                      Registered: {event.participant_count || 0}/{event.max_participants}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadEventRegistrations(event)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(event);
                        setIsEventDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEvent(event.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Class Parts Dialog */}
        <Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Class Parts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <form onSubmit={handleSaveClassPart} className="p-4 border rounded-lg space-y-3">
                <h3 className="font-semibold">{editingPart ? 'Edit Part' : 'Add New Part'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="part-title">Title</Label>
                    <Input id="part-title" name="title" defaultValue={editingPart?.title} required />
                  </div>
                  <div>
                    <Label htmlFor="part-order">Order</Label>
                    <Input id="part-order" name="part_order" type="number" defaultValue={editingPart?.part_order || classParts.length + 1} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="part-description">Description</Label>
                  <Textarea id="part-description" name="description" defaultValue={editingPart?.description} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="video_url">Video URL</Label>
                    <Input id="video_url" name="video_url" defaultValue={editingPart?.video_url} required />
                  </div>
                  <div>
                    <Label htmlFor="part-duration">Duration</Label>
                    <Input id="part-duration" name="duration" placeholder="e.g., 15 mins" defaultValue={editingPart?.duration} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {editingPart ? 'Update' : 'Add'} Part
                  </Button>
                  {editingPart && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingPart(null)}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-2">
                <h3 className="font-semibold">Parts ({classParts.length})</h3>
                {classParts.map((part) => (
                  <Card key={part.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">Part {part.part_order}: {part.title}</p>
                          {part.description && <p className="text-sm text-muted-foreground">{part.description}</p>}
                          <p className="text-sm">Video: {part.video_url}</p>
                          {part.duration && <p className="text-sm">Duration: {part.duration}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingPart(part)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClassPart(part.id!)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Event Registrations Dialog */}
        <Dialog open={isRegistrationsDialogOpen} onOpenChange={setIsRegistrationsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event Registrations - {selectedEventForRegistrations?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-2xl font-bold">
                    {eventRegistrations.length} / {selectedEventForRegistrations?.max_participants}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spots Available</p>
                  <p className="text-2xl font-bold">
                    {(selectedEventForRegistrations?.max_participants || 0) - eventRegistrations.length}
                  </p>
                </div>
              </div>

              {eventRegistrations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No registrations yet</p>
              ) : (
                <div className="space-y-2">
                  {eventRegistrations.map((reg, index) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {reg.profiles?.full_name || `User ${index + 1}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Registered: {new Date(reg.registered_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
