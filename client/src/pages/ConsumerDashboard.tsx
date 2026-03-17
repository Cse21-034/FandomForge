import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { CreatorCard } from "@/components/CreatorCard";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useLocation } from "wouter";
import { Users, Video, Heart, Compass, LayoutDashboard } from "lucide-react";
import { creatorApi, videoApi, creatorApi as importedCreatorApi } from "@/lib/api";

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

  const { data: videosWithCreators = [], isLoading: videosLoading } = useQuery({
    queryKey: ["consumer-videos-with-creators", isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const videos: any[] = await videoApi.getAll();
      const creatorIds: string[] = Array.from(new Set(videos.map((v: any) => v.creatorId)));
      const creators = await Promise.all(
        creatorIds.map((id) => importedCreatorApi.getById(id).catch(() => null))
      );
      const creatorMap = Object.fromEntries(
        creators.filter(Boolean).map((c: any) => [c.id, c])
      );
      return videos.map((v: any) => {
        const creator = creatorMap[v.creatorId] || null;
        const avatar = creator?.user?.profileImage || undefined;
        return {
          ...v,
          _creator: creator,
          _creatorAvatar: avatar,
        };
      });
    },
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--primary)/0.15)] mx-auto flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <LayoutDashboard className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading your library…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) { navigate("/auth"); return null; }

  const freeVideos = videosWithCreators.filter((v: any) => v.type === "free");

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={user?.role as "creator" | "consumer" | null}
        username={user?.username}
        profileImage={user?.profileImage}
        onLogout={logout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            My Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your subscriptions and available content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-7">
          <StatCard title="Following" value={creators.length} icon={Users} color="primary" />
          <StatCard title="Videos" value={freeVideos.length} icon={Video} color="accent" />
          <StatCard title="Watchlist" value="0" icon={Heart} color="gold" />
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
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-52 rounded-3xl skeleton-wave" />
              ))}
            </div>
          ) : creators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {creators.slice(0, 4).map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="font-medium text-muted-foreground mb-1">No subscriptions yet</p>
              <p className="text-sm text-muted-foreground/60 mb-5">
                Discover amazing creators and subscribe to their content
              </p>
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

        {/* Available videos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display">Available Videos</h2>
            <Button
              variant="ghost"
              size="sm"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {freeVideos.map((video: any) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  creatorName={video._creator?.user?.username || "Creator"}
                  creatorAvatar={video._creatorAvatar}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              ))}
            </div>
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