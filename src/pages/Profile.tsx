import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Award, Calendar, TrendingUp } from "lucide-react";

const Profile = () => {
  const stats = [
    { label: "Total Distance", value: "342 km", icon: Activity, trend: "+12%" },
    { label: "Total Runs", value: "48", icon: Calendar, trend: "+8%" },
    { label: "Avg Pace", value: "5:24/km", icon: TrendingUp, trend: "+3%" },
    { label: "Achievements", value: "12", icon: Award, trend: "+2" },
  ];

  const recentRuns = [
    { date: "Jan 10, 2025", distance: "8.2 km", pace: "5:18/km", duration: "43:28" },
    { date: "Jan 8, 2025", distance: "5.0 km", pace: "5:30/km", duration: "27:30" },
    { date: "Jan 6, 2025", distance: "10.5 km", pace: "5:22/km", duration: "56:21" },
    { date: "Jan 4, 2025", distance: "6.5 km", pace: "5:25/km", duration: "35:12" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">Jane Doe</h1>
                  <p className="text-muted-foreground mb-4">Member since January 2024</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">Marathon Runner</Badge>
                    <Badge variant="secondary">100+ Runs</Badge>
                    <Badge variant="secondary">Early Bird</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Edit Profile</Button>
                  <Button variant="hero">Connect Strava</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium text-primary">{stat.trend}</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRuns.map((run, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="font-semibold text-foreground">{run.date}</div>
                      <div className="text-sm text-muted-foreground">Distance: {run.distance}</div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pace:</span>{" "}
                        <span className="font-medium">{run.pace}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        <span className="font-medium">{run.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="outline" className="w-full sm:w-auto">
                  View All Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
