import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Play, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-runners.jpg";
import { supabase } from "@/integrations/supabase/client";

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

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  instructor: string | null;
  event_type: string;
  max_participants: number;
}

const Index = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    try {
      // Fetch latest 2 classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .order("upload_date", { ascending: false })
        .limit(2);

      // Fetch latest 1 upcoming event
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString().split('T')[0])
        .order("event_date", { ascending: true })
        .limit(1);

      setClasses(classesData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error loading featured content:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const features = [
    {
      icon: Play,
      title: "Live & On-Demand",
      description: "Join live classes or train on your schedule with our extensive video library",
    },
    {
      icon: Users,
      title: "Expert Coaches",
      description: "Learn from certified running coaches with years of competitive experience",
    },
    {
      icon: Award,
      title: "Track Progress",
      description: "Sync with Strava and other apps to monitor your running journey",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-background border-b-4 border-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center saturate-0 contrast-150"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/95" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-8xl md:text-[12rem] font-black mb-8 leading-none tracking-normal font-display">
              ELIT<span className="inline-block scale-x-[-1]">E</span>
            </h1>
            <p className="text-3xl md:text-4xl font-black uppercase tracking-ultra-wide mb-6">
              RUN CLUB
            </p>
            <p className="text-xl md:text-2xl text-foreground mb-16 max-w-2xl mx-auto uppercase tracking-wide font-bold">
              TRAE TU MEJOR ACTITUD. JOIN THE COMMUNITY.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="uppercase tracking-ultra-wide font-black text-lg" asChild>
                <Link to="/auth">
                  JOIN NOW
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="uppercase tracking-ultra-wide font-black text-lg"
                asChild
              >
                <a href="https://loselitemerch2.itemorder.com/shop/home/" target="_blank" rel="noopener noreferrer">
                  SHOP MERCH
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t-4 border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-normal mb-6 font-display">WHY ELIT<span className="inline-block scale-x-[-1]">E</span>?</h2>
              <p className="text-xl text-foreground max-w-2xl mx-auto uppercase tracking-wide font-bold">
                EVERYTHING YOU NEED TO ELEVATE YOUR PERFORMANCE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-12 border-4 border-border bg-card hover:bg-foreground hover:text-background"
                  >
                    <div className="mb-8 inline-flex p-6 bg-foreground group-hover:bg-background border-4 border-foreground">
                      <Icon className="h-12 w-12 text-background group-hover:text-foreground" />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-4 tracking-wide">{feature.title}</h3>
                    <p className="leading-relaxed uppercase text-sm tracking-wide">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Classes & Events */}
      <section className="py-24 border-t-4 border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-ultra-wide mb-3 font-display">FEATURED</h2>
                <p className="text-foreground uppercase tracking-ultra-wide font-bold">LATEST CLASSES & EVENTS</p>
              </div>
              <div className="flex gap-4">
                <Link to="/classes">
                  <Button variant="ghost" className="uppercase tracking-ultra-wide font-black">
                    ALL CLASSES
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="ghost" className="uppercase tracking-ultra-wide font-black">
                    ALL EVENTS
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-xl font-bold uppercase tracking-ultra-wide">LOADING...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Display Classes */}
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="border-4 hover:shadow-lg transition-shadow relative group">
                    <Badge className="absolute top-4 right-4 z-10 font-bold uppercase">
                      VIDEO
                    </Badge>
                    {classItem.is_free && (
                      <Badge variant="secondary" className="absolute top-4 left-4 z-10 font-bold">
                        FREE
                      </Badge>
                    )}
                    <CardHeader>
                      {classItem.thumbnail_url && (
                        <div className="relative mb-4 overflow-hidden">
                          <img 
                            src={classItem.thumbnail_url} 
                            alt={classItem.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Video className="h-16 w-16 text-white" />
                          </div>
                        </div>
                      )}
                      <CardTitle className="text-xl uppercase font-black tracking-wide">
                        {classItem.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {classItem.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{classItem.description}</p>
                      )}
                      <div className="space-y-2 text-sm font-bold mb-4">
                        <p className="uppercase tracking-wide">INSTRUCTOR: {classItem.instructor}</p>
                        <p className="uppercase tracking-wide">UPLOADED: {formatDate(classItem.upload_date)}</p>
                      </div>
                      <Link to="/classes">
                        <Button className="w-full uppercase tracking-ultra-wide font-black">
                          <Play className="mr-2 h-4 w-4" />
                          VIEW CLASS
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}

                {/* Display Event */}
                {events.map((event) => (
                  <Card key={event.id} className="border-4 hover:shadow-lg transition-shadow relative">
                    <Badge className="absolute top-4 right-4 z-10 font-bold uppercase bg-primary">
                      LIVE EVENT
                    </Badge>
                    <CardHeader>
                      <CardTitle className="text-xl uppercase font-black tracking-wide">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                      )}
                      <div className="space-y-2 text-sm font-bold mb-4">
                        <p className="uppercase tracking-wide">📍 {event.location}</p>
                        <p className="uppercase tracking-wide">📅 {formatDate(event.event_date)}</p>
                        <p className="uppercase tracking-wide">⏰ {event.event_time}</p>
                        {event.instructor && (
                          <p className="uppercase tracking-wide">INSTRUCTOR: {event.instructor}</p>
                        )}
                      </div>
                      <Link to="/events">
                        <Button className="w-full uppercase tracking-ultra-wide font-black">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          REGISTER NOW
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 border-t-4 border-foreground bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-6xl md:text-9xl font-black mb-8 text-background uppercase tracking-ultra-wide font-display leading-none">
              READY TO RUN?
            </h2>
            <p className="text-2xl md:text-3xl text-background mb-12 uppercase tracking-ultra-wide font-black">
              JOIN THE COMMUNITY. ELEVATE YOUR PERFORMANCE.
            </p>
            <Button size="lg" variant="secondary" className="uppercase tracking-ultra-wide font-black text-xl h-20 px-12">
              GET STARTED
              <ArrowRight className="ml-3 h-7 w-7" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
