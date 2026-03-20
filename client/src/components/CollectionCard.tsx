import { useLocation } from "wouter";
import { Play, Images, FileText, Lock, Eye } from "lucide-react";

interface CollectionCardProps {
  collection: {
    id: string;
    title: string;
    description?: string;
    type: string;
    price: string;
    thumbnailUrl?: string;
    isPublished?: boolean;
    itemCount?: number;
    views?: number;
    // items array — we pull the first item's thumbnail/imageUrl if collection has no thumbnailUrl
    items?: Array<{
      position: number;
      itemType: string;
      videoUrl?: string;
      imageUrl?: string;
      thumbnailUrl?: string;
    }>;
  };
  creatorName?: string;
  creatorAvatar?: string;
  onClick?: () => void;
}

const TYPE_ICON: Record<string, any> = {
  series: Play,
  course: FileText,
  gallery: Images,
};

const TYPE_LABEL: Record<string, string> = {
  series: "Series",
  course: "Course",
  gallery: "Gallery",
};

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Derive the best thumbnail from the collection data
function getThumbnail(collection: CollectionCardProps["collection"]): string | undefined {
  // 1. Explicit collection thumbnail (creator-set)
  if (collection.thumbnailUrl) return collection.thumbnailUrl;

  // 2. First item in the items array
  if (collection.items && collection.items.length > 0) {
    // Sort by position to get item #1
    const sorted = [...collection.items].sort((a, b) => a.position - b.position);
    const first = sorted[0];

    // For image items use imageUrl
    if (first.imageUrl) return first.imageUrl;

    // For video items: Cloudinary videos generate a thumbnail by swapping extension to .jpg
    if (first.videoUrl) {
      return first.videoUrl
        .replace(/\/upload\//, "/upload/so_0/")
        .replace(/\.(mp4|mov|webm|avi)$/i, ".jpg");
    }

    // Fallback: thumbnailUrl on the item itself (if server attaches it)
    if ((first as any).thumbnailUrl) return (first as any).thumbnailUrl;
  }

  return undefined;
}

export function CollectionCard({ collection, creatorName, creatorAvatar, onClick }: CollectionCardProps) {
  const [_, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    navigate(`/collection/${collection.id}`);
  };

  const Icon = TYPE_ICON[collection.type] || Play;
  const thumbnail = getThumbnail(collection);
  const views = collection.views ?? 0;

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-card-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // If the auto-generated Cloudinary thumbnail fails, hide it
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Icon className="h-10 w-10 text-primary/40" />
          </div>
        )}

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-5 w-5 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm">
          <Icon className="h-3 w-3" />
          {TYPE_LABEL[collection.type] || "Collection"}
        </div>

        {/* Price badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white backdrop-blur-sm"
          style={{ background: "hsl(var(--primary) / 0.85)" }}>
          <Lock className="h-2.5 w-2.5" />
          ${collection.price}
        </div>

        {/* Item count */}
        {collection.itemCount !== undefined && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </div>
        )}

        {/* Views badge — bottom left */}
        {views > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
            <Eye className="h-2.5 w-2.5" />
            {formatViews(views)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{collection.title}</h3>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{collection.description}</p>
        )}

        {/* Creator info + views in text area */}
        <div className="flex items-center justify-between mt-2">
          {creatorName ? (
            <div className="flex items-center gap-1.5">
              {creatorAvatar ? (
                <img src={creatorAvatar} className="h-4 w-4 rounded-full object-cover flex-shrink-0" alt={creatorName} />
              ) : (
                <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}>
                  {creatorName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate">{creatorName}</span>
            </div>
          ) : <div />}

          {/* Views count in card footer */}
          {views > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
              <Eye className="h-2.5 w-2.5" />
              {formatViews(views)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}