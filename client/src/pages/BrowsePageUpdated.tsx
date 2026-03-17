import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { videoApi, categoryApi, creatorApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, Compass } from "lucide-react";
import { useLocation } from "wouter";

function VideoSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-2xl skeleton-wave" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full skeleton-wave flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-full skeleton-wave w-3/4" />
          <div className="h-3 rounded-full skeleton-wave w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function BrowsePageUpdated() {
  const { user, isAuthenticated, logout } = useAuth();
  const [_location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [contentType, setContentType] = useState<"all" | "free" | "paid">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: videosWithCreators = [], isLoading } = useQuery({
    queryKey: ["videos-with-creators"],
    queryFn: async () => {
      const videos: any[] = await videoApi.getAll();
      const creatorIds: string[] = Array.from(new Set(videos.map((v: any) => v.creatorId)));
      const creators = await Promise.all(
        creatorIds.map((id) => creatorApi.getById(id).catch(() => null))
      );
      const creatorMap = Object.fromEntries(
        creators.filter(Boolean).map((c: any) => [c.id, c])
      );
      return videos.map((v: any) => {
        const creator = creatorMap[v.creatorId] || null;
        // FIXED: server returns creator.user.profileImage (not creator.profileImage)
        const avatar = creator?.user?.profileImage || undefined;
        return {
          ...v,
          _creator: creator,
          _creatorAvatar: avatar,
        };
      });
    },
  });

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll(),
  });

  const filteredVideos = videosWithCreators.filter((video: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!video.title?.toLowerCase().includes(q) && !video.description?.toLowerCase().includes(q)) return false;
    }
    if (selectedCategory !== "all" && video.categoryId !== selectedCategory) return false;
    if (contentType === "free" && video.type !== "free") return false;
    if (contentType === "paid" && video.type !== "paid") return false;
    if (!isAuthenticated && video.type !== "free") return false;
    return true;
  });

  const hasFilters = searchQuery || selectedCategory !== "all" || contentType !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setContentType("all");
  };

  const typeOptions: { value: "all" | "free" | "paid"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "free", label: "Free" },
    ...(isAuthenticated ? [{ value: "paid" as const, label: "Premium" }] : []),
  ];

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary)/0.10)] flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.10)" }}>
            <Compass className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display leading-tight">Browse</h1>
            <p className="text-sm text-muted-foreground">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""}
              {hasFilters ? " found" : " available"}
            </p>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search videos…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-2xl bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`h-10 w-10 rounded-2xl flex-shrink-0 ${filtersOpen || hasFilters ? "border-primary/50 text-primary" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-card border border-card-border rounded-3xl p-4 mb-5 space-y-4 shadow-lg">
            {/* Content type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content Type</p>
              <div className="flex gap-2 flex-wrap">
                {typeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setContentType(value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      contentType === value
                        ? "text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    style={contentType === value ? {
                      background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))"
                    } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === "all"
                        ? "text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    style={selectedCategory === "all" ? {
                      background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))"
                    } : {}}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      style={selectedCategory === cat.id ? {
                        background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))"
                      } : {}}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips (when panel closed) */}
        {!filtersOpen && hasFilters && (
          <div className="flex gap-2 flex-wrap mb-4">
            {contentType !== "all" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: "hsl(var(--primary))" }}>
                {contentType === "free" ? "Free" : "Premium"}
                <button onClick={() => setContentType("all")}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory("all")}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border">
              Clear all
            </button>
          </div>
        )}

        {/* Video grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(8)].map((_, i) => <VideoSkeleton key={i} />)}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredVideos.map((video: any) => (
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
          <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <Compass className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">
              {hasFilters ? "No videos match your filters" : "No videos yet"}
            </p>
            <p className="text-sm text-muted-foreground/60 mb-4">
              {hasFilters ? "Try adjusting your search or filters" : "Check back soon!"}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="rounded-2xl">
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}