import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";

interface ClassCardProps {
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  participants: number;
  type: "video" | "livestream";
  image: string;
}

const ClassCard = ({
  title,
  instructor,
  date,
  time,
  duration,
  participants,
  type,
  image,
}: ClassCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-card hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <Badge
          className={`absolute top-4 right-4 ${
            type === "livestream"
              ? "bg-destructive text-destructive-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {type === "livestream" ? "LIVE" : "On-Demand"}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">with {instructor}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {time} • {duration}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{participants} participants</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="hero" className="w-full">
          {type === "livestream" ? "Join Live" : "Watch Now"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
