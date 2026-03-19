import { useQuery } from "@tanstack/react-query";
import { watchlistApi, creatorApi } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Bookmark, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function WatchlistPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [_location, navigate] = useLocation();

  // Step 1: get watchlist items (just {userId, videoId} records)
  const { data: watchlistItems = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistApi.getAll(),
    enabled: isAuthenticated && !loading,
  });

  // Step 2: fetch actual video data for each watchlisted videoId
  const videoIds: string[] = (watchlistItems as any[])
    .map((item: any) => item.videoId)
    .filter(Boolean);

  const { data: watchlistVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["watchlist-videos", videoIds.join(",")],
    queryFn: async () => {
      if (!videoIds.length) return [];
      const token = localStorage.getItem("authToken");
      const results = await Promise.all(
        videoIds.map((id) =>
          fetch(`${API_BASE_URL}/videos/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: videoIds.length > 0,
  });

  // Step 3: collect unique creatorIds from the fetched videos
  const videos = watchlistVideos as any[];
  const creatorIds: string[] = Array.from(
    new Set(videos.map((v) => v.creatorId).filter(Boolean))
  );

  // Step 4: fetch creators — enabled only when we have creatorIds
  const { data: creatorsRaw = [] } = useQuery({
    queryKey: ["watchlist-creators", creatorIds.join(",")],
    queryFn: () =>
      Promise.all(
        creatorIds.map((id) => creatorApi.getById(id).catch(() => null))
      ),
    enabled: creatorIds.length > 0,
  });

  // Build lookup map
  const creatorMap: Record<string, any> = {};
  (creatorsRaw as any[]).filter(Boolean).forEach((c: any) => {
    if (c?.id) creatorMap[c.id] = c;
  });

  // ── Early returns AFTER all hooks ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.15)" }}
          >
            <Bookmark className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const isLoading = watchlistLoading || videosLoading;

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.10)" }}
          >
            <Bookmark className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display leading-tight">
              My Watchlist
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading saved videos…"
                : `${videos.length} saved video${videos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video rounded-2xl skeleton-wave" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full skeleton-wave flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded-full skeleton-wave w-3/4" />
                    <div className="h-3 rounded-full skeleton-wave w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">
              No saved videos yet
            </p>
            <p className="text-sm text-muted-foreground/60 mb-5">
              Click the "Save" button on any video to add it here
            </p>
            <Button
              onClick={() => navigate("/browse")}
              className="rounded-2xl font-bold text-white border-none"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Compass className="h-4 w-4 mr-2" />
              Browse Videos
            </Button>
          </div>
        ) : (
          /* Video grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {videos.map((video: any) => {
              const creator = creatorMap[video.creatorId];
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  creatorName={creator?.user?.username || "Creator"}
                  creatorAvatar={creator?.user?.profileImage || undefined}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}