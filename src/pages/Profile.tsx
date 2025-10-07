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
          <Card className="mb-8 border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-foreground/20 grayscale">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" />
                  <AvatarFallback className="bg-foreground text-background font-black text-2xl">JD</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-black uppercase mb-2">Jane Doe</h1>
                  <p className="text-muted-foreground mb-4 uppercase tracking-wide text-sm">Member since January 2024</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary" className="uppercase tracking-wider">Marathon Runner</Badge>
                    <Badge variant="secondary" className="uppercase tracking-wider">100+ Runs</Badge>
                    <Badge variant="secondary" className="uppercase tracking-wider">Early Bird</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="uppercase tracking-wider">Edit Profile</Button>
                  <Button className="uppercase tracking-wider">Connect Strava</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-2 transition-all duration-300 hover:shadow-elegant hover:border-foreground">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-6 w-6 text-foreground" />
                      <span className="text-xs font-bold text-foreground">{stat.trend}</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRuns.map((run, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-border hover:border-foreground transition-all"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="font-bold text-foreground uppercase tracking-wide">{run.date}</div>
                      <div className="text-sm text-muted-foreground">Distance: <span className="font-bold">{run.distance}</span></div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground uppercase tracking-wider">Pace:</span>{" "}
                        <span className="font-bold">{run.pace}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase tracking-wider">Duration:</span>{" "}
                        <span className="font-bold">{run.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="outline" className="w-full sm:w-auto uppercase tracking-wider">
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
