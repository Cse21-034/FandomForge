import { useLocation } from "wouter";
import { Play, Images, FileText, Lock } from "lucide-react";

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

export function CollectionCard({ collection, creatorName, creatorAvatar, onClick }: CollectionCardProps) {
  const [_, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    navigate(`/collection/${collection.id}`);
  };

  const Icon = TYPE_ICON[collection.type] || Play;

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-card-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {collection.thumbnailUrl ? (
          <img
            src={collection.thumbnailUrl}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Icon className="h-10 w-10 text-primary/40" />
          </div>
        )}

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

        {/* Item count overlay */}
        {collection.itemCount !== undefined && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{collection.title}</h3>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{collection.description}</p>
        )}
        {creatorName && (
          <div className="flex items-center gap-1.5 mt-2">
            {creatorAvatar ? (
              <img src={creatorAvatar} className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}>
                {creatorName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">{creatorName}</span>
          </div>
        )}
      </div>
    </div>
  );
}