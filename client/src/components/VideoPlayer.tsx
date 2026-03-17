import { Lock, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl?: string;
  isLocked: boolean;
  onUnlock?: () => void;
  thumbnail?: string;
}

export function VideoPlayer({ videoUrl, isLocked, onUnlock, thumbnail }: VideoPlayerProps) {
  if (isLocked) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden relative bg-black" data-testid="player-locked">
        {thumbnail && (
          <img
            src={thumbnail}
            alt="Video preview"
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-105"
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{ background: "linear-gradient(135deg, hsl(350,100%,65%/0.3), hsl(195,100%,50%/0.2))", border: "1px solid rgba(255,77,109,0.4)" }}>
            <Lock className="h-7 w-7 text-white" strokeWidth={2} />
          </div>

          <h3 className="text-white text-xl font-bold font-display mb-2">Premium Content</h3>
          <p className="text-white/60 text-sm mb-6 max-w-xs leading-relaxed">
            Subscribe to this creator to unlock this video and all their exclusive content.
          </p>

          <Button
            onClick={onUnlock}
            size="lg"
            className="rounded-2xl h-12 px-8 font-bold text-white shadow-2xl border-none"
            style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
            data-testid="button-unlock"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Subscribe to Unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black" data-testid="player-unlocked">
      {videoUrl ? (
        <video
          controls
          className="w-full h-full"
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Play className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Video unavailable</p>
        </div>
      )}
    </div>
  );
}