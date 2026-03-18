import { useQuery } from "@tanstack/react-query";
import { watchlistApi, videoApi as videoApiModule } from "@/lib/api";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Bookmark } from "lucide-react";

export default function WatchlistPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [_location, navigate] = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const { data: watchlistItems = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistApi.getAll(),
    enabled: isAuthenticated,
  });

  const { data: allVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => videoApiModule.getAll(),
    enabled: isAuthenticated,
  });

  const watchlistVideoIds = new Set(watchlistItems.map((item: any) => item.videoId));
  const watchlistVideos = allVideos.filter((video: any) =>
    watchlistVideoIds.has(video.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={user?.role as any}
        username={user?.username}
        profileImage={user?.profileImage}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Bookmark className="w-6 h-6" />
          <h1 className="text-3xl font-bold">My Watchlist</h1>
        </div>

        {watchlistLoading || videosLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : watchlistVideos.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              You haven't saved any videos yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchlistVideos.map((video: any) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
