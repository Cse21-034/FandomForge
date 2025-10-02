import { Lock, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  isPaid: boolean;
  creatorName: string;
  creatorAvatar?: string;
  views: number;
  onClick?: () => void;
}

export function VideoCard({
  title,
  thumbnail,
  duration,
  isPaid,
  creatorName,
  creatorAvatar,
  views,
  onClick,
}: VideoCardProps) {
  return (
    <Card
      className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-video-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative aspect-video bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
            <Play className="h-8 w-8" fill="currentColor" />
          </div>
        </div>
        {isPaid && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Lock className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
            {duration}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={creatorAvatar} alt={creatorName} />
            <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">{creatorName}</p>
            <p className="text-xs text-muted-foreground">{views.toLocaleString()} views</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
