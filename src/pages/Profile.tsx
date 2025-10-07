import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Award, Calendar, TrendingUp, Flame, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Profile = () => {
  const stats = [
    { label: "Total KM", value: "342", icon: Activity, trend: "+12%" },
    { label: "Best Time", value: "5:18/km", icon: TrendingUp, trend: "-6%" },
    { label: "Current Streak", value: "12 days", icon: Flame, trend: "+4" },
    { label: "Achievements", value: "12", icon: Award, trend: "+2" },
  ];

  const monthlyProgress = [
    { month: "Jul", km: 45 },
    { month: "Aug", km: 62 },
    { month: "Sep", km: 78 },
    { month: "Oct", km: 54 },
    { month: "Nov", km: 89 },
    { month: "Dec", km: 95 },
    { month: "Jan", km: 112 },
  ];

  const upcomingClasses = [
    { 
      title: "Morning Power Run", 
      instructor: "Mike Chen", 
      date: "Jan 15, 2025", 
      time: "06:00 AM",
      type: "livestream" as const
    },
    { 
      title: "HIIT & Run Combo", 
      instructor: "Sarah Johnson", 
      date: "Jan 17, 2025", 
      time: "07:00 AM",
      type: "video" as const
    },
    { 
      title: "Long Distance Training", 
      instructor: "Alex Rodriguez", 
      date: "Jan 20, 2025", 
      time: "08:00 AM",
      type: "livestream" as const
    },
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

          {/* Monthly Progress Chart */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Monthly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    label={{ value: 'KM', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontWeight: 'bold'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="km" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((classItem, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-border hover:border-foreground transition-all gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-black text-foreground uppercase tracking-wide">{classItem.title}</h3>
                        <Badge
                          className={`uppercase tracking-wider text-xs ${
                            classItem.type === "livestream"
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {classItem.type === "livestream" ? "LIVE" : "On-Demand"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">
                        with {classItem.instructor}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">{classItem.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">{classItem.time}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="uppercase tracking-wider">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
