import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AffiliateBanner } from "@/components/AffiliateBanner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoCard } from "@/components/VideoCard";
import {
  ThumbsUp, Share2, Loader2, Check, Eye, Calendar, ArrowLeft, Users, CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { videoApi, creatorApi, engagementApi, subscriptionApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function VideoPage() {
  const [_location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [subscribingInProgress, setSubscribingInProgress] = useState(false);

  const videoId = new URL(window.location.href).pathname.split("/").pop();

  const { data: video, isLoading, refetch: refetchVideo } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => videoId ? videoApi.getById(videoId) : null,
    enabled: !!videoId,
  });

  const { data: creator } = useQuery({
    queryKey: ["creator", video?.creatorId],
    queryFn: () => video?.creatorId ? creatorApi.getById(video.creatorId) : null,
    enabled: !!video?.creatorId,
  });

  const { data: relatedVideos = [] } = useQuery({
    queryKey: ["videos", "related", video?.creatorId],
    queryFn: () => video?.creatorId ? videoApi.getByCreatorId(video.creatorId) : Promise.resolve([]),
    enabled: !!video?.creatorId,
  });

  useEffect(() => {
    if (!isAuthenticated || !videoId) return;
    engagementApi.isLiked(videoId).then((r) => setIsLiked(r.liked)).catch(() => {});
  }, [videoId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !video?.creatorId) return;
    subscriptionApi.check(video.creatorId).then((r) => setIsSubscribed(r.subscribed || false)).catch(() => {});
  }, [video?.creatorId, isAuthenticated]);

  useEffect(() => {
    if (!videoId) return;
    engagementApi.trackView(videoId).then(() => refetchVideo()).catch(() => {});
  }, [videoId]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast({ title: "Sign in to like videos", variant: "destructive" }); return; }
    setLikingInProgress(true);
    try {
      if (isLiked) { await engagementApi.unlike(videoId!); setIsLiked(false); }
      else { await engagementApi.like(videoId!); setIsLiked(true); toast({ title: "Added to liked videos ❤️" }); }
    } catch { toast({ title: "Failed to update like", variant: "destructive" }); }
    finally { setLikingInProgress(false); }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/video/${videoId}`;
      navigator.clipboard.writeText(shareUrl);
      if (isAuthenticated) await engagementApi.share(videoId!);
      toast({ title: "Link copied!", description: "Share it with your friends." });
    } catch { toast({ title: "Failed to share", variant: "destructive" }); }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    setSubscribingInProgress(true);
    try {
      toast({
        title: `Subscribe to ${creator?.user?.username || "this creator"}`,
        description: `$${creator?.subscriptionPrice || "9.99"}/month. Payment integration coming soon.`,
      });
    } finally { setSubscribingInProgress(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole={user?.role as any} username={user?.username} isAuthenticated={isAuthenticated} />
        <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole={user?.role as any} username={user?.username} isAuthenticated={isAuthenticated} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Video not found</p>
          <Button onClick={() => navigate("/browse")} className="rounded-2xl">Back to Browse</Button>
        </div>
      </div>
    );
  }

  const isLocked = video.type === "paid" && user?.role !== "creator";
  const creatorName = creator?.user?.username || "Creator";
  const creatorInitials = creatorName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background mobile-content-pad page-enter">
      <Header userRole={user?.role as any} username={user?.username} isAuthenticated={isAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Back */}
        <button
          onClick={() => navigate("/browse")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player */}
            <div className="rounded-2xl overflow-hidden">
              <VideoPlayer
                isLocked={isLocked}
                videoUrl={video.videoUrl}
                thumbnail={video.thumbnailUrl}
                onUnlock={handleSubscribe}
              />
            </div>

            {/* ── BANNER directly below player ── */}
            <AffiliateBanner index={0} size="md" />

            {/* Video info */}
            <div>
              <div className="flex items-start gap-2 mb-2">
                {video.type === "paid" && (
                  <span className="premium-badge px-2 py-0.5 rounded-lg text-[10px] flex-shrink-0 mt-1">Premium</span>
                )}
                <h1 className="text-lg sm:text-xl font-bold font-display leading-snug">{video.title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {(video.views || 0).toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(video.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-5">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={likingInProgress}
                  className={`rounded-full font-medium ${isLiked ? "border-none text-white" : ""}`}
                  style={isLiked ? { background: "hsl(var(--primary))" } : {}}
                >
                  {likingInProgress
                    ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    : <ThumbsUp className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-current" : ""}`} />}
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full font-medium">
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-muted/40 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
                </div>
              )}

              {/* ── BANNER in description area ── */}
              <AffiliateBanner index={1} size="sm" className="mb-4" />

              {/* Creator card */}
              <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-2xl">
                  <AvatarImage src={creator?.imageUrl} />
                  <AvatarFallback
                    className="rounded-2xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}
                  >
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{creatorName}</p>
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(creator?.totalSubscribers || 0).toLocaleString()} subscribers
                  </p>
                </div>
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribingInProgress || isSubscribed}
                  size="sm"
                  className={`rounded-full font-bold flex-shrink-0 border-none ${isSubscribed ? "bg-muted text-muted-foreground" : "text-white"}`}
                  style={!isSubscribed ? { background: "hsl(var(--primary))" } : {}}
                >
                  {subscribingInProgress ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isSubscribed ? (
                    <><Check className="h-3.5 w-3.5 mr-1" />Subscribed</>
                  ) : (
                    `$${creator?.subscriptionPrice || "9.99"}/mo`
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-4">
            {/* ── TOP SIDEBAR BANNER ── */}
            <AffiliateBanner index={2} size="md" />

            <div>
              <h2 className="font-bold font-display text-sm mb-4 text-muted-foreground uppercase tracking-wider">
                More from {creatorName}
              </h2>
              <div className="space-y-4">
                {relatedVideos
                  .filter((v: any) => v.id !== video.id)
                  .slice(0, 2)
                  .map((v: any) => (
                    <VideoCard key={v.id} video={v} onClick={() => navigate(`/video/${v.id}`)} />
                  ))}
              </div>
            </div>

            {/* ── MID SIDEBAR BANNER ── */}
            <AffiliateBanner index={3} size="md" />

            <div className="space-y-4">
              {relatedVideos
                .filter((v: any) => v.id !== video.id)
                .slice(2, 4)
                .map((v: any) => (
                  <VideoCard key={v.id} video={v} onClick={() => navigate(`/video/${v.id}`)} />
                ))}
            </div>

            {/* ── BOTTOM SIDEBAR BANNER ── */}
            <AffiliateBanner index={4} size="md" />

            {relatedVideos.filter((v: any) => v.id !== video.id).length === 0 && (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">No other videos</p>
              </div>
            )}

            {/* ── FINAL SIDEBAR BANNER ── */}
            <AffiliateBanner index={5} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}