import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, MapPin, Users, LayoutGrid, List, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  type: string;
  date: Date;
  time: string;
  location: string;
  instructor?: string;
  participants: number;
  maxParticipants: number;
  description: string;
}

const Events = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch events from database
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch registration counts for each event
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select("event_id");

      if (regError) throw regError;

      // Count participants per event
      const participantCounts = registrations.reduce((acc, reg) => {
        acc[reg.event_id] = (acc[reg.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Transform events to match UI interface
      const transformedEvents: Event[] = eventsData.map((event) => ({
        id: event.id,
        title: event.title,
        type: event.event_type,
        date: new Date(event.event_date),
        time: event.event_time,
        location: event.location,
        instructor: event.instructor || undefined,
        participants: participantCounts[event.id] || 0,
        maxParticipants: event.max_participants,
        description: event.description || "",
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error loading events",
        description: "Could not load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filterType === "all") return true;
    return event.type === filterType;
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "running":
        return "bg-foreground text-background";
      case "hiit":
        return "bg-muted text-foreground";
      case "strength":
        return "bg-secondary text-secondary-foreground";
      case "social":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-foreground";
    }
  };

  const eventsOnSelectedDate = selectedDate
    ? filteredEvents.filter(
        (event) =>
          event.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">Events Calendar</h1>
            <p className="text-muted-foreground uppercase tracking-wide">
              Join our running community events
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-foreground" />
            </div>
          ) : (
            <>
              {/* Filters and View Toggle */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px] uppercase tracking-wider font-bold">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 border-2 border-border rounded-lg p-1">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="uppercase tracking-wider"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="uppercase tracking-wider"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-2">
                <CardHeader>
                  <CardTitle className="text-2xl font-black uppercase">Select Date</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-lg border-2 border-border p-3 pointer-events-auto"
                    modifiers={{
                      hasEvent: filteredEvents.map((e) => e.date),
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        fontWeight: "bold",
                        textDecoration: "underline",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl font-black uppercase">
                    {selectedDate?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsOnSelectedDate.length > 0 ? (
                    <div className="space-y-3">
                      {eventsOnSelectedDate.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="w-full text-left p-4 border-2 border-border hover:border-foreground transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-black uppercase text-sm">{event.title}</h3>
                            <Badge className={`uppercase text-xs ${getEventTypeColor(event.type)}`}>
                              {event.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{event.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm uppercase tracking-wide">
                      No events scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="border-2 hover:border-foreground transition-all cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-black uppercase">{event.title}</h3>
                          <Badge className={`uppercase text-xs ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {event.date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.participants}/{event.maxParticipants} participants
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button className="uppercase tracking-wider font-bold">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* Event Details Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-2xl font-black uppercase">
                    {selectedEvent.title}
                  </DialogTitle>
                  <Badge className={`uppercase ${getEventTypeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </Badge>
                </div>
                <DialogDescription className="text-base">
                  {selectedEvent.description}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                      <p className="font-bold">
                        {selectedEvent.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
                      <p className="font-bold">{selectedEvent.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                      <p className="font-bold">{selectedEvent.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Participants
                      </p>
                      <p className="font-bold">
                        {selectedEvent.participants}/{selectedEvent.maxParticipants}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedEvent.instructor && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Instructor
                    </p>
                    <p className="font-black text-lg uppercase">{selectedEvent.instructor}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button className="flex-1 uppercase tracking-wider font-bold" size="lg">
                    RSVP - Reserve Spot
                  </Button>
                  <Button
                    variant="outline"
                    className="uppercase tracking-wider font-bold"
                    size="lg"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;
