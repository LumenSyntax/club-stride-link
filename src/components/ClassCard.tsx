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
    <Card className="group overflow-hidden hover:border-foreground bg-card">
      <div className="relative h-48 overflow-hidden border-b-4 border-border">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover contrast-125 saturate-0"
        />
        <Badge
          className={`absolute top-4 right-4 uppercase tracking-ultra-wide font-bold border-4 ${
            type === "livestream"
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-foreground"
          }`}
        >
          {type === "livestream" ? "LIVE" : "ON-DEMAND"}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase tracking-wide">{title}</CardTitle>
        <p className="text-sm text-muted-foreground uppercase tracking-ultra-wide">WITH {instructor}</p>
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
        <Button className="w-full uppercase tracking-ultra-wide font-black">
          {type === "livestream" ? "JOIN LIVE" : "WATCH NOW"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
