import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, Clock, MapPin, Flame, TrendingUp, Activity as ActivityIcon, Trash2, Edit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  duration: number | null;
  distance: number | null;
  calories: number | null;
  activity_date: string;
  created_at: string;
  strava_activity_id: number | null;
}

const activityTypes = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'hiit', label: 'HIIT', icon: '💪' },
  { value: 'strength', label: 'Strength', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'other', label: 'Other', icon: '⚡' },
];

export default function Activities() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Stats
  const [weeklyStats, setWeeklyStats] = useState({ count: 0, duration: 0, distance: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ count: 0, duration: 0, distance: 0 });

  useEffect(() => {
    if (!authLoading && user) {
      loadActivities();
      loadStats();
    }
  }, [user, authLoading]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("activity_date", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Weekly stats
      const { data: weeklyData } = await supabase
        .from("activities")
        .select("duration, distance")
        .gte("activity_date", weekAgo.toISOString().split('T')[0]);

      if (weeklyData) {
        // Convert km to miles
        const distanceInMiles = weeklyData.reduce((sum, a) => sum + ((a.distance || 0) * 0.621371), 0);
        
        setWeeklyStats({
          count: weeklyData.length,
          duration: weeklyData.reduce((sum, a) => sum + (a.duration || 0), 0),
          distance: distanceInMiles,
        });
      }

      // Monthly stats
      const { data: monthlyData } = await supabase
        .from("activities")
        .select("duration, distance")
        .gte("activity_date", monthAgo.toISOString().split('T')[0]);

      if (monthlyData) {
        // Convert km to miles
        const distanceInMiles = monthlyData.reduce((sum, a) => sum + ((a.distance || 0) * 0.621371), 0);
        
        setMonthlyStats({
          count: monthlyData.length,
          duration: monthlyData.reduce((sum, a) => sum + (a.duration || 0), 0),
          distance: distanceInMiles,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSaveActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const activityType = formData.get("activity_type") as string;
    
    const activityData = {
      user_id: user?.id,
      activity_type: activityType as "running" | "cycling" | "swimming" | "hiit" | "strength" | "yoga" | "walking" | "other",
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      duration: formData.get("duration") ? parseInt(formData.get("duration") as string) : null,
      distance: formData.get("distance") ? parseFloat(formData.get("distance") as string) / 0.621371 : null, // Convert miles to km for storage
      calories: formData.get("calories") ? parseInt(formData.get("calories") as string) : null,
      activity_date: formData.get("activity_date") as string,
    };

    try {
      if (editingActivity) {
        const { error } = await supabase
          .from("activities")
          .update(activityData)
          .eq("id", editingActivity.id);

        if (error) throw error;
        toast({ title: "Activity updated successfully!" });
      } else {
        const { error } = await supabase
          .from("activities")
          .insert([activityData]);

        if (error) throw error;
        toast({ title: "Activity logged successfully!" });
      }

      setIsDialogOpen(false);
      setEditingActivity(null);
      loadActivities();
      loadStats();
      e.currentTarget.reset();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error",
        description: "Failed to save activity",
        variant: "destructive",
      });
    }
  };

  const handleDeleteActivity = async (id: string, isStravaActivity: boolean) => {
    if (isStravaActivity) {
      toast({
        title: "Cannot delete Strava activity",
        description: "Strava-synced activities must be deleted from Strava",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Activity deleted successfully!" });
      loadActivities();
      loadStats();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (activity: Activity) => {
    if (activity.strava_activity_id) {
      toast({
        title: "Cannot edit Strava activity",
        description: "Strava-synced activities must be edited on Strava",
        variant: "destructive",
      });
      return;
    }
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to track your activities.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-28">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Activity Tracker</h1>
            <p className="text-muted-foreground">Log and track your workouts and training sessions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingActivity(null);
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-50">
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit Activity" : "Log New Activity"}</DialogTitle>
                <DialogDescription>
                  {editingActivity ? "Update your activity details" : "Record your workout or training session"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSaveActivity} className="space-y-4">
                <div>
                  <Label htmlFor="activity_type">Activity Type</Label>
                  <Select name="activity_type" defaultValue={editingActivity?.activity_type || "running"} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      {activityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Morning run"
                    defaultValue={editingActivity?.title}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="activity_date">Date</Label>
                  <Input
                    id="activity_date"
                    name="activity_date"
                    type="date"
                    defaultValue={editingActivity?.activity_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    placeholder="30"
                    defaultValue={editingActivity?.duration || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="distance">Distance (miles)</Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    step="0.01"
                    placeholder="3.4"
                    defaultValue={editingActivity?.distance || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="calories">Calories Burned</Label>
                  <Input
                    id="calories"
                    name="calories"
                    type="number"
                    placeholder="300"
                    defaultValue={editingActivity?.calories || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Notes (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="How did it feel? Any achievements?"
                    defaultValue={editingActivity?.description || ""}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingActivity ? "Update Activity" : "Save Activity"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="text-2xl font-bold">{weeklyStats.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{weeklyStats.duration}min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">{weeklyStats.distance.toFixed(1)}mi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="text-2xl font-bold">{monthlyStats.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{monthlyStats.duration}min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">{monthlyStats.distance.toFixed(1)}mi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Activity History
            </CardTitle>
            <CardDescription>Your recent workouts and training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No activities logged yet</p>
                <p className="text-muted-foreground mb-4">Start tracking your workouts to see your progress!</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Your First Activity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const activityType = activityTypes.find(t => t.value === activity.activity_type);
                  const isStravaActivity = !!activity.strava_activity_id;
                  
                  return (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-3xl">{activityType?.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{activity.title}</h3>
                              {isStravaActivity && (
                                <Badge variant="secondary" className="text-xs">
                                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                                  </svg>
                                  Strava
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {activityType?.label} • {format(new Date(activity.activity_date), 'MMM dd, yyyy')}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {activity.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {activity.duration} min
                                </div>
                              )}
                              {activity.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {(activity.distance * 0.621371).toFixed(1)} mi
                                </div>
                              )}
                              {activity.calories && (
                                <div className="flex items-center gap-1">
                                  <Flame className="h-4 w-4" />
                                  {activity.calories} cal
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isStravaActivity ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`https://www.strava.com/activities/${activity.strava_activity_id}`, '_blank')}
                              title="View on Strava"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(activity)}
                              title="Edit activity"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteActivity(activity.id, isStravaActivity)}
                            title={isStravaActivity ? "Cannot delete Strava activities" : "Delete activity"}
                            className={isStravaActivity ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
