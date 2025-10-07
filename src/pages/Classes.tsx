import Navigation from "@/components/Navigation";
import ClassCard from "@/components/ClassCard";

const Classes = () => {
  const classes = [
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
    {
      id: 4,
      title: "Recovery Run & Stretch",
      instructor: "David Park",
      date: "Available Now",
      time: "Anytime",
      duration: "30 min",
      participants: 89,
      type: "video" as const,
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop",
    },
    {
      id: 5,
      title: "5K Race Prep",
      instructor: "Jessica Lee",
      date: "Sat, Jan 20",
      time: "8:00 AM",
      duration: "60 min",
      participants: 67,
      type: "livestream" as const,
      image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&h=600&fit=crop",
    },
    {
      id: 6,
      title: "Hill Training Bootcamp",
      instructor: "Alex Turner",
      date: "Available Now",
      time: "Anytime",
      duration: "45 min",
      participants: 134,
      type: "video" as const,
      image: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&h=600&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Training Classes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join live sessions with expert coaches or train on your own schedule with our video library
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} {...classItem} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Classes;
