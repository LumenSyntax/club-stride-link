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
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center md:text-left">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Run Your Best,{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">Together</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
              Join our community of runners. Train with expert coaches, track your progress, and
              achieve your running goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button variant="hero" size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                Explore Classes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Join RunClub?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to elevate your running performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-8 rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-card hover:-translate-y-1"
                  >
                    <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-primary">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Classes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Classes</h2>
                <p className="text-muted-foreground">Popular sessions this week</p>
              </div>
              <Link to="/classes">
                <Button variant="ghost">
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
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
              Ready to Start Running?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Join thousands of runners improving their performance every day
            </p>
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
