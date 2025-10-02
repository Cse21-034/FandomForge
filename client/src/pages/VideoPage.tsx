import { useState } from "react";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/VideoCard";
import { ThumbsUp, Share2 } from "lucide-react";

export default function VideoPage() {
  const [userRole] = useState<"creator" | "consumer" | null>("consumer");
  const [isLiked, setIsLiked] = useState(false);

  const relatedVideos = [
    {
      id: "1",
      title: "Evening Meditation Practice",
      thumbnail: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=450&fit=crop",
      duration: "20:15",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 7500,
    },
    {
      id: "2",
      title: "Strength Training Basics",
      thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop",
      duration: "25:45",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 9300,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VideoPlayer
              isLocked={true}
              thumbnail="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=675&fit=crop"
              onUnlock={() => console.log("Subscribe clicked")}
            />
            
            <div className="mt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">Morning Yoga Routine for Beginners</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>12,500 views</span>
                    <span>•</span>
                    <span>2 days ago</span>
                  </div>
                </div>
                <Badge variant="secondary">
                  Premium
                </Badge>
              </div>

              <div className="flex gap-2 mb-6">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={() => setIsLiked(!isLiked)}
                  data-testid="button-like"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" data-testid="button-share">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
                  <AvatarFallback>SW</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <div>
                      <h3 className="font-semibold">Sarah Wellness</h3>
                      <p className="text-sm text-muted-foreground">12.5K subscribers</p>
                    </div>
                    <div className="flex gap-2">
                      <Button data-testid="button-subscribe-creator">
                        Subscribe - $9.99/mo
                      </Button>
                      <div className="bg-[#0070BA] hover-elevate active-elevate-2 text-white rounded-md px-4 flex items-center justify-center font-semibold cursor-pointer min-w-[100px]" data-testid="button-paypal-subscribe-creator">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm">Pay</span>
                          <span className="font-bold text-sm">Pal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    Join me for a gentle morning yoga routine perfect for beginners. This 15-minute practice will help you wake up your body, improve flexibility, and start your day with positive energy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Related Videos</h2>
            <div className="space-y-4">
              {relatedVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
