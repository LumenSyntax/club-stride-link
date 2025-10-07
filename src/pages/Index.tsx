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
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-background border-b-4 border-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center saturate-0 contrast-150"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/95" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-8xl md:text-[12rem] font-black mb-8 leading-none tracking-[-0.05em] font-display">
              ELIT<span className="inline-block scale-x-[-1] -ml-[0.15em]">E</span>
            </h1>
            <p className="text-3xl md:text-4xl font-black uppercase tracking-ultra-wide mb-6">
              RUN CLUB
            </p>
            <p className="text-xl md:text-2xl text-foreground mb-16 max-w-2xl mx-auto uppercase tracking-wide font-bold">
              TRAE TU MEJOR ACTITUD. JOIN THE COMMUNITY.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="uppercase tracking-ultra-wide font-black text-lg">
                JOIN NOW
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button variant="outline" size="lg" className="uppercase tracking-ultra-wide font-black text-lg">
                EXPLORE
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
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.05em] mb-6 font-display">WHY ELIT<span className="inline-block scale-x-[-1] -ml-[0.15em]">E</span>?</h2>
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

      {/* Featured Classes */}
      <section className="py-24 border-t-4 border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-ultra-wide mb-3 font-display">FEATURED</h2>
                <p className="text-foreground uppercase tracking-ultra-wide font-bold">THIS WEEK'S SESSIONS</p>
              </div>
              <Link to="/classes">
                <Button variant="ghost" className="uppercase tracking-ultra-wide font-black">
                  VIEW ALL
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {featuredClasses.map((classItem) => (
                <ClassCard key={classItem.id} {...classItem} />
              ))}
            </div>
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
