import Navigation from "@/components/Navigation";
import ClassCard from "@/components/ClassCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Play, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-runners.jpg";

const Index = () => {
  const featuredClasses = [
    {
      id: 1,
      title: "Morning Speed Intervals",
      instructor: "Sarah Johnson",
      date: "Mon, Jan 15",
      time: "6:00 AM",
      duration: "45 min",
      participants: 24,
      type: "livestream" as const,
      image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop",
    },
    {
      id: 2,
      title: "Trail Running Techniques",
      instructor: "Mike Chen",
      date: "Available Now",
      time: "Anytime",
      duration: "60 min",
      participants: 156,
      type: "video" as const,
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
    },
    {
      id: 3,
      title: "Endurance Building",
      instructor: "Emily Rodriguez",
      date: "Wed, Jan 17",
      time: "7:00 PM",
      duration: "90 min",
      participants: 42,
      type: "livestream" as const,
      image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop",
    },
  ];

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
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/90" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-7xl md:text-9xl font-black mb-6 leading-none tracking-tight">
              ELIT<span className="inline-block scale-x-[-1]">E</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold uppercase tracking-wider mb-4">
              Run Club
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Trae tu mejor actitud. Join the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="uppercase tracking-wider font-bold">
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="uppercase tracking-wider font-bold">
                Explore
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Why ELIT3?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto uppercase tracking-wide">
                Everything you need to elevate your performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-8 border-2 border-border bg-card transition-all duration-300 hover:border-foreground hover:shadow-elegant"
                  >
                    <div className="mb-6 inline-flex p-4 bg-foreground">
                      <Icon className="h-8 w-8 text-background" />
                    </div>
                    <h3 className="text-xl font-black uppercase mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Classes */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">Featured</h2>
                <p className="text-muted-foreground uppercase tracking-wide">This Week's Sessions</p>
              </div>
              <Link to="/classes">
                <Button variant="ghost" className="uppercase tracking-wider font-bold">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredClasses.map((classItem) => (
                <ClassCard key={classItem.id} {...classItem} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t-4 border-foreground bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black mb-6 text-background uppercase tracking-tight">
              Ready to Run?
            </h2>
            <p className="text-xl text-background/80 mb-8 uppercase tracking-wide font-bold">
              Join the community. Elevate your performance.
            </p>
            <Button size="lg" variant="secondary" className="shadow-elegant uppercase tracking-wider font-bold text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
