import { Button } from "@/components/ui/button";
import { Users, Video, CheckCircle } from "lucide-react";

interface CreatorCardProps {
  id?: string;
  name?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  subscriberCount?: number;
  videoCount?: number;
  subscriptionPrice?: number;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  // Also support full creator object from DB
  creator?: any;
}

export function CreatorCard({
  id,
  name: nameProp,
  avatar,
  banner,
  bio: bioProp,
  subscriberCount: scProp,
  videoCount: vcProp,
  subscriptionPrice: spProp,
  isSubscribed = false,
  onSubscribe,
  creator,
}: CreatorCardProps) {
  const name = nameProp ?? creator?.user?.username ?? creator?.displayName ?? "Creator";
  const bio = bioProp ?? creator?.user?.bio ?? "No bio yet.";
  const subscriberCount = scProp ?? creator?.totalSubscribers ?? 0;
  const videoCount = vcProp ?? 0;
  const subscriptionPrice = spProp ?? parseFloat(creator?.subscriptionPrice ?? "9.99");

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="group relative bg-card border border-card-border rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      data-testid={`card-creator-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Banner */}
      <div className="relative h-24 overflow-hidden">
        {banner ? (
          <img src={banner} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="creator-banner-gradient w-full h-full" />
        )}
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Avatar */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-2xl border-3 border-card object-cover shadow-lg"
              style={{ borderWidth: 3 }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-card bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ borderWidth: 3, borderStyle: "solid", borderColor: "hsl(var(--card))" }}>
              {initials}
            </div>
          )}
          {/* Verified dot */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center shadow-md">
            <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-5 px-4 text-center">
        <h3 className="font-display font-bold text-base mt-1 truncate">{name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{bio}</p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-5 mt-4 mb-4">
          <div className="text-center">
            <div className="font-bold text-sm font-display">
              {subscriberCount >= 1000 ? `${(subscriberCount / 1000).toFixed(1)}K` : subscriberCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" /> fans
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-bold text-sm font-display">{videoCount}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Video className="w-2.5 h-2.5" /> videos
            </div>
          </div>
        </div>

        {/* CTA */}
        {isSubscribed ? (
          <div className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-2xl text-sm font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.10)]" style={{ background: "hsl(var(--primary) / 0.10)" }}>
            <CheckCircle className="h-3.5 w-3.5" />
            Subscribed
          </div>
        ) : (
          <Button
            className="w-full rounded-2xl font-semibold bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.9] text-white shadow-md"
            onClick={onSubscribe}
            data-testid="button-subscribe"
          >
            Subscribe · ${subscriptionPrice}/mo
          </Button>
        )}
      </div>
    </div>
  );
}