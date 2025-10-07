import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Award, Calendar, TrendingUp, Flame, Clock, Loader2, MapPin } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface EventRegistration {
  id: string;
  event_id: string;
  events: {
    title: string;
    event_date: string;
    event_time: string;
    location: string;
    instructor: string | null;
  };
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [activityStats, setActivityStats] = useState({ count: 0, duration: 0, miles: 0 });
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState<{ week: string; miles: number }[]>([]);


  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    loadProfileData();
    loadActivityStats();
    checkStravaConnection();
    
    // Check for Strava callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('strava_connected') === 'true') {
      toast({ title: "Strava connected successfully!" });
      setIsStravaConnected(true);
      window.history.replaceState({}, '', '/profile');
    } else if (params.get('strava_error')) {
      toast({ 
        title: "Failed to connect Strava", 
        description: "Please try again",
        variant: "destructive" 
      });
      window.history.replaceState({}, '', '/profile');
    }
  }, [user, authLoading, navigate]);

  const checkStravaConnection = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("strava_tokens")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setIsStravaConnected(!!data);
    } catch (error) {
      console.error("Error checking Strava connection:", error);
    }
  };

  const loadActivityStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("activities")
        .select("duration, distance, activity_date")
        .eq("user_id", user.id);

      if (data) {
        // Calculate total miles (convert km to miles)
        const totalMiles = data.reduce((sum, a) => sum + ((a.distance || 0) * 0.621371), 0);
        
        setActivityStats({
          count: data.length,
          duration: data.reduce((sum, a) => sum + (a.duration || 0), 0),
          miles: Math.round(totalMiles * 10) / 10, // Round to 1 decimal
        });

        // Calculate weekly progress for the last 7 weeks
        const weeklyData: Record<string, number> = {};
        const now = new Date();
        
        // Initialize last 7 weeks
        for (let i = 6; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekLabel = `Week ${7 - i}`;
          weeklyData[weekLabel] = 0;
        }

        // Aggregate activity distances by week
        data.forEach((activity) => {
          const activityDate = new Date(activity.activity_date);
          const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(daysDiff / 7);
          
          if (weekIndex >= 0 && weekIndex < 7) {
            const weekLabel = `Week ${7 - weekIndex}`;
            // Convert km to miles (1 km = 0.621371 miles)
            const miles = (activity.distance || 0) * 0.621371;
            weeklyData[weekLabel] += miles;
          }
        });

        // Convert to chart format
        const chartData = Object.entries(weeklyData).map(([week, miles]) => ({
          week,
          miles: Math.round(miles * 10) / 10, // Round to 1 decimal place
        }));

        setWeeklyProgress(chartData);
      }
    } catch (error) {
      console.error("Error loading activity stats:", error);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Try to get profile, create if doesn't exist
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // If profile doesn't exist, create it
      if (!profileData && !profileError) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: null,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          profileData = newProfile;
        }
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
      }

      // Load event registrations
      const { data: eventRegsData, error: eventRegsError } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          events (
            title,
            event_date,
            event_time,
            location,
            instructor
          )
        `)
        .eq("user_id", user.id)
        .order("events(event_date)", { ascending: true });

      if (eventRegsData) setEventRegistrations(eventRegsData as EventRegistration[]);
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast({ title: "Error loading profile data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully" });
      setIsEditDialogOpen(false);
      loadProfileData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error updating profile", variant: "destructive" });
    }
  };


  const handleConnectStrava = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('strava-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error connecting to Strava:", error);
      toast({ 
        title: "Failed to connect to Strava", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
  };

  const handleDisconnectStrava = async () => {
    try {
      const { error } = await supabase
        .from('strava_tokens')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsStravaConnected(false);
      toast({ title: "Strava disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Strava:", error);
      toast({ 
        title: "Failed to disconnect Strava", 
        variant: "destructive" 
      });
    }
  };

  const handleSyncStrava = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('strava-sync');
      
      if (error) throw error;
      
      toast({ 
        title: "Strava sync complete", 
        description: `Synced ${data.syncedCount} new activities` 
      });
      
      loadActivityStats();
    } catch (error) {
      console.error("Error syncing Strava:", error);
      toast({ 
        title: "Failed to sync Strava activities", 
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCancelEventRegistration = async (registrationId: string) => {
    if (!confirm("Are you sure you want to cancel this event registration?")) return;

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;

      toast({ title: "Event registration cancelled" });
      loadProfileData();
    } catch (error) {
      console.error("Error cancelling registration:", error);
      toast({ title: "Error cancelling registration", variant: "destructive" });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "EVENTS", value: eventRegistrations.length.toString(), icon: Calendar, trend: "" },
    { label: "ACTIVITIES", value: activityStats.count.toString(), icon: Activity, trend: "" },
    { label: "MILES RUN", value: `${activityStats.miles}MI`, icon: TrendingUp, trend: "" },
    { label: "STREAK", value: "N/A", icon: Flame, trend: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8 border-4">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-foreground">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-foreground text-background font-black text-2xl">
                    {getInitials(profile?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-black uppercase mb-2 font-display tracking-wide">
                    {profile?.full_name || user?.email || "RUNNER"}
                  </h1>
                  <p className="text-muted-foreground mb-4 uppercase tracking-ultra-wide text-sm font-bold">
                    {user?.email}
                  </p>
                   <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary" className="uppercase tracking-ultra-wide font-black border-2 border-foreground">
                      MEMBER
                    </Badge>
                    {eventRegistrations.length > 0 && (
                      <Badge variant="secondary" className="uppercase tracking-ultra-wide font-black border-2 border-foreground">
                        {eventRegistrations.length} EVENTS
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="uppercase tracking-ultra-wide font-black"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    EDIT PROFILE
                  </Button>
                  {!isStravaConnected ? (
                    <Button 
                      className="uppercase tracking-ultra-wide font-black"
                      onClick={handleConnectStrava}
                    >
                      CONNECT STRAVA
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="uppercase tracking-ultra-wide font-black"
                        onClick={handleSyncStrava}
                        disabled={isSyncing}
                      >
                        {isSyncing ? "SYNCING..." : "SYNC STRAVA"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="uppercase tracking-ultra-wide font-black"
                        onClick={handleDisconnectStrava}
                      >
                        DISCONNECT
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 mb-8 border-4 border-foreground">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`p-6 border-foreground ${
                    index < 3 ? "border-r-4" : ""
                  } hover:bg-foreground hover:text-background transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-black mb-1">{stat.value}</div>
                  <div className="text-xs uppercase tracking-ultra-wide font-bold">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Weekly Progress Chart */}
          <Card className="border-4 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-ultra-wide font-display">
                WEEKLY PROGRESS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="week" 
                    stroke="hsl(var(--foreground))"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    label={{ value: 'MILES', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '4px solid hsl(var(--border))',
                      fontWeight: 'bold'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="miles" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={4}
                    dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>


          {/* Registered Events */}
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-ultra-wide font-display">
                MY EVENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventRegistrations.length === 0 ? (
                <div className="text-center py-8 border-4 border-border">
                  <p className="text-foreground uppercase tracking-ultra-wide font-bold">NO EVENTS REGISTERED</p>
                  <Button 
                    className="mt-4 uppercase tracking-ultra-wide font-black"
                    onClick={() => navigate("/events")}
                  >
                    BROWSE EVENTS
                  </Button>
                </div>
              ) : (
                <>
                  {/* Upcoming Events */}
                  {eventRegistrations.filter(reg => new Date(reg.events.event_date) >= new Date()).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-black uppercase tracking-wide mb-4 px-6 pt-6">
                        UPCOMING EVENTS
                      </h3>
                      <div className="space-y-0">
                        {eventRegistrations
                          .filter(reg => new Date(reg.events.event_date) >= new Date())
                          .map((reg, index, arr) => (
                            <div
                              key={reg.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 border-foreground gap-4 hover:bg-foreground hover:text-background transition-colors ${
                                index < arr.length - 1 ? "border-b-4" : ""
                              }`}
                            >
                              <div className="flex-1">
                                <h3 className="font-black uppercase tracking-wide mb-2">{reg.events.title}</h3>
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm uppercase tracking-wide font-bold opacity-70 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {reg.events.location}
                                  </p>
                                  {reg.events.instructor && (
                                    <p className="text-sm uppercase tracking-wide font-bold opacity-70">
                                      WITH {reg.events.instructor}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm font-bold">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(reg.events.event_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{reg.events.event_time}</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="uppercase tracking-ultra-wide font-black"
                                  onClick={() => handleCancelEventRegistration(reg.id)}
                                >
                                  CANCEL
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Past Events */}
                  {eventRegistrations.filter(reg => new Date(reg.events.event_date) < new Date()).length > 0 && (
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wide mb-4 px-6 pt-6 opacity-70">
                        PAST EVENTS
                      </h3>
                      <div className="space-y-0 opacity-60">
                        {eventRegistrations
                          .filter(reg => new Date(reg.events.event_date) < new Date())
                          .map((reg, index, arr) => (
                            <div
                              key={reg.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 border-foreground gap-4 ${
                                index < arr.length - 1 ? "border-b-4" : ""
                              }`}
                            >
                              <div className="flex-1">
                                <h3 className="font-black uppercase tracking-wide mb-2">{reg.events.title}</h3>
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm uppercase tracking-wide font-bold opacity-70 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {reg.events.location}
                                  </p>
                                  {reg.events.instructor && (
                                    <p className="text-sm uppercase tracking-wide font-bold opacity-70">
                                      WITH {reg.events.instructor}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-bold">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(reg.events.event_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{reg.events.event_time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wide">EDIT PROFILE</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="uppercase tracking-wide font-bold">FULL NAME</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-4"
                placeholder="ENTER YOUR NAME"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="uppercase tracking-ultra-wide font-black">
                SAVE
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="uppercase tracking-ultra-wide font-black"
              >
                CANCEL
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
