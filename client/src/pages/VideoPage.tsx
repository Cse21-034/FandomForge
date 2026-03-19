import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { CommentsSection } from "@/components/CommentsSection";
import { WatchlistButton } from "@/components/WatchlistButton";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoCard } from "@/components/VideoCard";
import { AffiliateCard } from "@/components/AffiliateCard";
import {
  ThumbsUp, Share2, Loader2, Check, Eye, Calendar,
  ArrowLeft, Users, CheckCircle,
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
    queryFn: () => (videoId ? videoApi.getById(videoId) : null),
    enabled: !!videoId,
  });

  const { data: creator } = useQuery({
    queryKey: ["creator", video?.creatorId],
    queryFn: () => (video?.creatorId ? creatorApi.getById(video.creatorId) : null),
    enabled: !!video?.creatorId,
  });

  const { data: relatedVideos = [] } = useQuery({
    queryKey: ["videos", "related", video?.creatorId],
    queryFn: async () => {
      if (!video?.creatorId) return [];
      const videos: any[] = await videoApi.getByCreatorId(video.creatorId);
      // Fetch all creators for these videos in parallel
      const creatorIds: string[] = Array.from(new Set(videos.map((v: any) => v.creatorId)));
      const creators = await Promise.all(
        creatorIds.map((id) => creatorApi.getById(id).catch(() => null))
      );
      const creatorMap = Object.fromEntries(
        creators.filter(Boolean).map((c: any) => [c.id, c])
      );
      // Attach creator info to each video
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
    enabled: !!video?.creatorId,
  });

  // Check like status
  useEffect(() => {
    if (!isAuthenticated || !videoId) return;
    engagementApi.isLiked(videoId).then((r) => setIsLiked(r.liked)).catch(() => {});
  }, [videoId, isAuthenticated]);

  // Check subscription status
  useEffect(() => {
    if (!isAuthenticated || !video?.creatorId) return;
    subscriptionApi
      .check(video.creatorId)
      .then((r) => setIsSubscribed(r.subscribed || false))
      .catch(() => {});
  }, [video?.creatorId, isAuthenticated]);

  // Track view
  useEffect(() => {
    if (!videoId) return;
    engagementApi.trackView(videoId).then(() => refetchVideo()).catch(() => {});
  }, [videoId]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in to like videos", variant: "destructive" });
      return;
    }
    setLikingInProgress(true);
    try {
      if (isLiked) {
        await engagementApi.unlike(videoId!);
        setIsLiked(false);
      } else {
        await engagementApi.like(videoId!);
        setIsLiked(true);
        toast({ title: "Added to liked videos ❤️" });
      }
    } catch {
      toast({ title: "Failed to update like", variant: "destructive" });
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/video/${videoId}`;
      navigator.clipboard.writeText(shareUrl);
      if (isAuthenticated) await engagementApi.share(videoId!);
      toast({ title: "Link copied!", description: "Share it with your friends." });
    } catch {
      toast({ title: "Failed to share", variant: "destructive" });
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    setSubscribingInProgress(true);
    try {
      toast({
        title: `Subscribe to ${creator?.user?.username || "this creator"}`,
        description: `$${creator?.subscriptionPrice || "9.99"}/month. Payment integration coming soon.`,
      });
    } finally {
      setSubscribingInProgress(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userRole={user?.role as any}
          username={user?.username}
          profileImage={user?.profileImage}
          isAuthenticated={isAuthenticated}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────
  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userRole={user?.role as any}
          username={user?.username}
          isAuthenticated={isAuthenticated}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Video not found</p>
          <Button onClick={() => navigate("/browse")} className="rounded-2xl">
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  // ── Access control ─────────────────────────────────────────────────
  // A paid video is ONLY unlocked when:
  //   1. The logged-in user is the creator who OWNS this specific video, OR
  //   2. The logged-in user has an active subscription to this creator.
  // Any other creator (who doesn't own it) must subscribe just like a fan.
  const isOwnVideo =
    !!user?.creator?.id && user.creator.id === video.creatorId;

  const isLocked =
    video.type === "paid" &&
    !isOwnVideo &&
    !isSubscribed;

  const creatorName = creator?.user?.username || "Creator";
  const creatorInitials = creatorName.slice(0, 2).toUpperCase();
  // Prefer profileImage, fallback to imageUrl
  const creatorAvatar = creator?.profileImage || creator?.imageUrl || undefined;

  return (
    <div className="min-h-screen bg-background mobile-content-pad page-enter">
      <Header
        userRole={user?.role as any}
        username={user?.username}
        profileImage={user?.profileImage}
        isAuthenticated={isAuthenticated}
      />

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

            {/* Title & meta */}
            <div>
              <div className="flex items-start gap-2 mb-2">
                {video.type === "paid" && (
                  <span className="premium-badge px-2 py-0.5 rounded-lg text-[10px] flex-shrink-0 mt-1">
                    Premium
                  </span>
                )}
                <h1 className="text-lg sm:text-xl font-bold font-display leading-snug">
                  {video.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {(video.views || 0).toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(video.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Like / Share */}
              <div className="flex gap-2 mb-5">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={likingInProgress}
                  className={`rounded-full font-medium ${
                    isLiked ? "border-none text-white" : ""
                  }`}
                  style={isLiked ? { background: "hsl(var(--primary))" } : {}}
                >
                  {likingInProgress ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ThumbsUp
                      className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-current" : ""}`}
                    />
                  )}
                  {isLiked ? "Liked" : "Like"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full font-medium"
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>

                <WatchlistButton videoId={videoId!} />
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-muted/40 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Creator card */}
              <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-2xl">
                  {creatorAvatar ? (
                    <AvatarImage src={creatorAvatar} />
                  ) : null}
                  <AvatarFallback
                    className="rounded-2xl text-sm font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))",
                    }}
                  >
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{creatorName}</p>
                    <CheckCircle
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(creator?.totalSubscribers || 0).toLocaleString()} subscribers
                  </p>
                </div>

                {/* Subscribe button — hidden for own videos */}
                {!isOwnVideo ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubscribe}
                      disabled={subscribingInProgress || isSubscribed}
                      size="sm"
                      className={`rounded-full font-bold flex-shrink-0 border-none ${
                        isSubscribed ? "bg-muted text-muted-foreground" : "text-white"
                      }`}
                      style={
                        !isSubscribed ? { background: "hsl(var(--primary))" } : {}
                      }
                    >
                      {subscribingInProgress ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Subscribed
                        </>
                      ) : (
                        `$${creator?.subscriptionPrice || "9.99"}/mo`
                      )}
                    </Button>
                    <SendMessageDialog
                      recipientId={creator?.userId || ""}
                      recipientName={creator?.user?.username || "Creator"}
                    />
                  </div>
                ) : (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: "hsl(var(--primary) / 0.10)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    Your video
                  </span>
                )}
              </div>

              {/* Comments Section */}
              <CommentsSection videoId={videoId!} />

               {/* ── SLOT 6: Affiliate banner below comments ── */}
            <div className="mt-8">
              <AffiliateCard slotIndex={5} variant="banner" />
            </div>


            </div>
          </div>

          {/* ── Sidebar — related videos only ── */}
          <div className="lg:col-span-1">


 {/* ── SLOT 5: Affiliate card in sidebar, below related videos ── */}
            <AffiliateCard slotIndex={4} variant="sidebar" />


            <h2 className="font-bold font-display text-sm mb-4 text-muted-foreground uppercase tracking-wider">
              More from {creatorName}
            </h2>

            <div className="space-y-4">
              {relatedVideos
                .filter((v: any) => v.id !== video.id)
                .slice(0, 5)
                .map((v: any) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    creatorName={v._creator?.user?.username || "Creator"}
                    creatorAvatar={v._creatorAvatar}
                    onClick={() => navigate(`/video/${v.id}`)}
                  />
                ))}

              {relatedVideos.filter((v: any) => v.id !== video.id).length === 0 && (
                <div className="text-center py-8 rounded-2xl border border-dashed border-border bg-muted/20">
                  <p className="text-sm text-muted-foreground">No other videos</p>
                </div>
              )}

               {/* ── SLOT 5: Affiliate card in sidebar, below related videos ── */}
            <AffiliateCard slotIndex={4} variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}