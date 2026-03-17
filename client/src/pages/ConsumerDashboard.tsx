import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { CreatorCard } from "@/components/CreatorCard";
import { AffiliateBanner, AffiliateBannerStrip } from "@/components/AffiliateBanner";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useLocation } from "wouter";
import { Users, Video, Heart, Compass, LayoutDashboard } from "lucide-react";
import { creatorApi, videoApi } from "@/lib/api";

function SkeletonCard() {
  return <div className="aspect-video rounded-2xl skeleton-wave" />;
}

export default function ConsumerDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [_location, navigate] = useLocation();

  const { data: creators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ["subscribed-creators"],
    queryFn: () => creatorApi.getAll(),
    enabled: isAuthenticated,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["consumer-videos"],
    queryFn: () => videoApi.getAll(),
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <LayoutDashboard className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading your library…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) { navigate("/auth"); return null; }

  const freeVideos = videos.filter((v: any) => v.type === "free");

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={user?.role as "creator" | "consumer" | null}
        username={user?.username}
        onLogout={logout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display">My Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Your subscriptions and available content</p>
        </div>

        {/* ── TOP BANNER STRIP ── */}
        <AffiliateBannerStrip className="mb-6" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-7">
          <StatCard title="Following" value={creators.length} icon={Users} color="primary" />
          <StatCard title="Videos" value={freeVideos.length} icon={Video} color="accent" />
          <StatCard title="Watchlist" value="0" icon={Heart} color="gold" />
        </div>

        {/* ── BANNER after stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          <AffiliateBanner index={0} size="sm" />
          <AffiliateBanner index={1} size="sm" />
        </div>

        {/* Creators */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display">Creators</h2>
            {creators.length > 4 && (
              <Button variant="ghost" size="sm" className="text-xs rounded-full" style={{ color: "hsl(var(--primary))" }}>
                View all
              </Button>
            )}
          </div>

          {creatorsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-3xl skeleton-wave" />)}
            </div>
          ) : creators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {creators.slice(0, 4).map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 py-12 px-4 text-center">
              <Users className="h-7 w-7 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground mb-1">No subscriptions yet</p>
              <p className="text-sm text-muted-foreground/60 mb-5">Discover amazing creators</p>
              <Button
                onClick={() => navigate("/browse")}
                className="rounded-2xl font-bold text-white border-none"
                style={{ background: "hsl(var(--primary))" }}
              >
                <Compass className="h-4 w-4 mr-2" /> Browse Creators
              </Button>
            </div>
          )}
        </section>

        {/* ── BANNER between creators and videos ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <AffiliateBanner index={2} size="md" />
          <AffiliateBanner index={3} size="md" />
          <AffiliateBanner index={4} size="md" />
        </div>

        {/* Available videos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display">Available Videos</h2>
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate("/browse")}
              className="text-xs rounded-full"
              style={{ color: "hsl(var(--primary))" }}
            >
              Browse all
            </Button>
          </div>

          {videosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : freeVideos.length > 0 ? (
            <>
              {/* First 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-5">
                {freeVideos.slice(0, 3).map((video: any) => (
                  <VideoCard key={video.id} video={video} onClick={() => navigate(`/video/${video.id}`)} />
                ))}
              </div>

              {/* Inline banner */}
              {freeVideos.length > 3 && (
                <AffiliateBanner index={5} size="md" className="mb-5" />
              )}

              {/* Rest */}
              {freeVideos.length > 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {freeVideos.slice(3).map((video: any) => (
                    <VideoCard key={video.id} video={video} onClick={() => navigate(`/video/${video.id}`)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 py-12 text-center">
              <Video className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No videos available yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}