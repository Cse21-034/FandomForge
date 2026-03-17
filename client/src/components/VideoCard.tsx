import { Lock, Play, Eye } from "lucide-react";

interface VideoCardProps {
  id?: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  isPaid?: boolean;
  creatorName?: string;
  creatorAvatar?: string;
  views?: number;
  onClick?: () => void;
  video?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    type: "free" | "paid";
    price?: string | number;
    views?: number;
    createdAt?: string;
  };
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function VideoCard(props: VideoCardProps) {
  const v = props.video;
  const id          = v?.id           ?? props.id           ?? "";
  const title       = v?.title        ?? props.title        ?? "Untitled";
  const thumbnail   = v?.thumbnailUrl ?? props.thumbnail    ?? "";
  const isPaid      = v ? v.type === "paid" : (props.isPaid ?? false);
  const views       = v?.views        ?? props.views        ?? 0;
  const creatorName = props.creatorName  ?? "Creator";
  const duration    = props.duration  ?? "";
  const onClick     = props.onClick;

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      data-testid={`card-video-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted mb-3">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Play className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl">
              <Play className="h-6 w-6 text-gray-900" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Gradient overlay for text */}
        {(isPaid || duration) && (
          <div className="absolute inset-0 video-card-overlay pointer-events-none" />
        )}

        {/* Premium badge */}
        {isPaid && (
          <div className="absolute top-2.5 left-2.5">
            <span className="premium-badge px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" />
              Premium
            </span>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded-md">
              {duration}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-3 px-0.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.7)] to-[hsl(var(--accent)/0.7)] flex items-center justify-center text-white text-xs font-bold shadow-sm mt-0.5">
          {creatorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-[hsl(var(--primary))] transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{creatorName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Eye className="h-3 w-3 text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground/70">{formatViews(views)} views</p>
          </div>
        </div>
      </div>
    </div>
  );
}