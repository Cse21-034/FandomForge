import { Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VideoPlayerProps {
  videoUrl?: string;
  isLocked: boolean;
  onUnlock?: () => void;
  thumbnail?: string;
}

export function VideoPlayer({ videoUrl, isLocked, onUnlock, thumbnail }: VideoPlayerProps) {
  if (isLocked) {
    return (
      <Card className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden" data-testid="player-locked">
        {thumbnail && (
          <img
            src={thumbnail}
            alt="Video preview"
            className="absolute inset-0 w-full h-full object-cover blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="relative text-center p-8 z-10 max-w-md mx-auto">
          <div className="bg-primary/10 rounded-full p-6 mx-auto w-fit mb-6">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Premium Content</h3>
          <p className="text-muted-foreground mb-6">
            Subscribe to this creator to unlock this video
          </p>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={onUnlock} data-testid="button-unlock">
              Subscribe to Unlock
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-background/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 backdrop-blur-sm px-2 text-muted-foreground">Or pay with</span>
              </div>
            </div>
            <div className="bg-[#0070BA] hover-elevate active-elevate-2 text-white rounded-md py-3 px-4 text-center font-semibold cursor-pointer" onClick={onUnlock} data-testid="button-paypal-unlock">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-lg">Pay</span>
                <span className="font-bold text-lg">Pal</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="aspect-video bg-background rounded-lg overflow-hidden border" data-testid="player-unlocked">
      {videoUrl ? (
        <video controls className="w-full h-full">
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center">
            <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Video player</p>
          </div>
        </div>
      )}
    </div>
  );
}
