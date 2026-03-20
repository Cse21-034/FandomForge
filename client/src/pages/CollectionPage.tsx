import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { collectionApi, collectionPaymentApi } from "@/lib/api";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Lock, Unlock, Play, ImageIcon, FileText,
  ChevronLeft, ChevronRight, CheckCircle, Loader2,
  BookOpen, Film, LayoutGrid, ThumbsUp, Share2,
  Bookmark, MessageCircle, Eye, Users, Trash2, Sparkles,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function checkCollectionAccess(collectionId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    const res = await fetch(`${API_BASE}/payments/check-collection/${collectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    return !!(await res.json()).hasAccess;
  } catch { return false; }
}

const TYPE_ICON: Record<string, any> = { series: Film, course: BookOpen, gallery: LayoutGrid };
const ITEM_ICON: Record<string, any> = { video: Play, image: ImageIcon, text: FileText };

// ── Comments ──────────────────────────────────────────────────────────
function CollectionComments({ collectionId, currentUserId }: { collectionId: string; currentUserId?: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["collection-comments", collectionId],
    queryFn: () => apiFetch(`/collections/${collectionId}/comments`),
  });

  const addMutation = useMutation({
    mutationFn: () => apiFetch(`/collections/${collectionId}/comments`, {
      method: "POST", body: JSON.stringify({ content }),
    }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["collection-comments", collectionId] });
    },
    onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => apiFetch(`/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collection-comments", collectionId] }),
  });

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-bold text-base">Comments ({(comments as any[]).length})</h3>
      </div>

      {isAuthenticated ? (
        <div className="space-y-2 bg-muted/30 rounded-2xl p-4">
          <Textarea
            placeholder="Add a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none rounded-xl bg-background border-border text-sm"
          />
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !content.trim()}
            className="rounded-full text-white border-none"
            style={{ background: "hsl(var(--primary))" }}
            size="sm"
          >
            {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Post Comment
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3 bg-muted/20 rounded-2xl">
          Sign in to leave a comment
        </p>
      )}

      <div className="space-y-3">
        {isLoading
          ? [...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton-wave" />)
          : (comments as any[]).length === 0
          ? <p className="text-center text-sm text-muted-foreground py-6">No comments yet — be the first!</p>
          : (comments as any[]).map((c: any) => (
            <div key={c.id} className="bg-card border border-card-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}>
                    {(c.userId || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold">User {c.userId?.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                </div>
                {currentUserId === c.userId && (
                  <button onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed">{c.content}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Watchlist button ──────────────────────────────────────────────────
function CollectionWatchlistButton({ collectionId }: { collectionId: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checkResult } = useQuery({
    queryKey: ["collection-watchlist-check", collectionId],
    queryFn: () => apiFetch(`/watchlist/collection/check/${collectionId}`),
    enabled: isAuthenticated,
  });
  const isInWatchlist = checkResult?.isInWatchlist ?? false;

  const addMutation = useMutation({
    mutationFn: () => apiFetch("/watchlist/collection", { method: "POST", body: JSON.stringify({ collectionId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-watchlist-check", collectionId] });
      toast({ title: "Saved to watchlist ✓" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiFetch(`/watchlist/collection/${collectionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-watchlist-check", collectionId] });
      toast({ title: "Removed from watchlist" });
    },
  });

  if (!isAuthenticated) return null;
  const busy = addMutation.isPending || removeMutation.isPending;

  return (
    <Button
      variant={isInWatchlist ? "default" : "outline"} size="sm"
      className={`rounded-full font-medium ${isInWatchlist ? "text-white border-none" : ""}`}
      style={isInWatchlist ? { background: "hsl(var(--primary))" } : {}}
      disabled={busy}
      onClick={() => isInWatchlist ? removeMutation.mutate() : addMutation.mutate()}
    >
      {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Bookmark className={`h-4 w-4 mr-1.5 ${isInWatchlist ? "fill-current" : ""}`} />}
      {isInWatchlist ? "Saved" : "Save"}
    </Button>
  );
}

// ── Locked overlay for image/text items ──────────────────────────────
function LockedItemOverlay({ price, onUnlock, checkingOut, type }: { price: string; onUnlock: () => void; checkingOut: boolean; type: "image" | "text" }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 rounded-2xl overflow-hidden"
      style={{ minHeight: type === "image" ? 300 : 280, background: "linear-gradient(135deg, hsl(222,28%,10%), hsl(222,28%,7%))" }}>
      <div className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(350,100%,65%), transparent)" }} />
      <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg, hsl(350,100%,65%/0.25), hsl(195,100%,50%/0.15))", border: "1px solid rgba(255,77,109,0.35)" }}>
        <Lock className="h-7 w-7 text-white" strokeWidth={2} />
      </div>
      <div className="relative z-10 text-center px-6">
        <h3 className="text-white text-lg font-bold font-display mb-1">Premium Content</h3>
        <p className="text-white/55 text-sm leading-relaxed mb-5">
          Unlock the full collection to access this {type === "image" ? "image" : "post"}.
        </p>
        <Button onClick={onUnlock} disabled={checkingOut} size="lg"
          className="rounded-2xl h-12 px-8 font-bold text-white shadow-2xl border-none"
          style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}>
          {checkingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Unlock for ${price}
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════
export default function CollectionPage() {
  const [_, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const collectionId = new URL(window.location.href).pathname.split("/").pop();

  const [activeIndex, setActiveIndex] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  const { data: collection, isLoading, refetch } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => collectionApi.getById(collectionId!),
    enabled: !!collectionId,
  });

  useEffect(() => {
    if (!isAuthenticated || !collectionId) return;
    apiFetch(`/collections/${collectionId}/like`).then((r) => setIsLiked(r.liked)).catch(() => {});
  }, [collectionId, isAuthenticated]);

  useEffect(() => {
    if (!collectionId || !isAuthenticated) return;
    apiFetch(`/collections/${collectionId}/view`, { method: "POST" }).catch(() => {});
  }, [collectionId, isAuthenticated]);

  useEffect(() => {
    if (!collection || !collectionId) return;
    if (collection.isOwner || collection.hasAccess) { setHasAccess(true); return; }
    if (isAuthenticated) {
      checkCollectionAccess(collectionId).then((access) => {
        if (access) {
          setHasAccess(true);
          queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
          refetch();
        }
      });
    }
  }, [collection?.id, isAuthenticated, collectionId]);

  const items: any[] = collection?.items ?? [];
  const activeItem = items[activeIndex];
  const isOwnerOrHasAccess = collection?.isOwner || hasAccess;

  // ── KEY: No blocking navigation. Always navigate, show lock UI inline.
  const isItemLocked = (item: any): boolean => !!item.locked && !isOwnerOrHasAccess;
  const getVideoUrl = (item: any): string | undefined => isItemLocked(item) ? undefined : item.videoUrl || undefined;

  // Navigate to ANY item — locked ones show lock overlay instead of blocking
  const goTo = (index: number) => {
    if (index < 0 || index >= items.length) return;
    setActiveIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLike = async () => {
    if (!isAuthenticated) { toast({ title: "Sign in to like this collection", variant: "destructive" }); return; }
    setLikingInProgress(true);
    try {
      if (isLiked) {
        await apiFetch(`/collections/${collectionId}/like`, { method: "DELETE" });
        setIsLiked(false);
      } else {
        await apiFetch(`/collections/${collectionId}/like`, { method: "POST" });
        setIsLiked(true);
        toast({ title: "Added to liked collections ❤️" });
      }
    } catch { toast({ title: "Failed to update like", variant: "destructive" }); }
    finally { setLikingInProgress(false); }
  };

  const handleShare = async () => {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${collectionId}`);
    if (isAuthenticated) apiFetch(`/collections/${collectionId}/share`, { method: "POST" }).catch(() => {});
    toast({ title: "Link copied!", description: "Share it with your friends." });
  };

  const handleUnlock = async () => {
    if (!isAuthenticated) { navigate(`/auth?redirect=/collection/${collectionId}`); return; }
    setCheckingOut(true);
    try {
      const { approvalUrl } = await collectionPaymentApi.createOrder(collectionId!);
      window.location.href = approvalUrl;
    } catch {
      toast({ title: "Failed to start checkout", variant: "destructive" });
      setCheckingOut(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!collection) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Collection not found</p>
      <Button onClick={() => navigate("/browse")} className="rounded-2xl">Back to Browse</Button>
    </div>
  );

  const TypeIcon = TYPE_ICON[collection.type] || Film;
  const creatorName = collection.creator?.user?.username || collection.user?.username || "Creator";
  const creatorAvatar = collection.creator?.user?.profileImage || collection.user?.profileImage;
  const creatorUserId = collection.creator?.userId || collection.creator?.user?.id;

  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        <button onClick={() => navigate("/browse")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main viewer ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {activeItem ? (
              <div className="rounded-2xl overflow-hidden bg-card border border-card-border">

                {/* VIDEO — VideoPlayer handles lock UI internally */}
                {activeItem.itemType === "video" && (
                  <VideoPlayer
                    key={activeItem.id}
                    isLocked={isItemLocked(activeItem)}
                    videoUrl={getVideoUrl(activeItem)}
                    thumbnail={activeItem.thumbnailUrl}
                    onUnlock={handleUnlock}
                  />
                )}

                {/* IMAGE */}
                {activeItem.itemType === "image" && (
                  isItemLocked(activeItem)
                    ? <LockedItemOverlay price={collection.price} onUnlock={handleUnlock} checkingOut={checkingOut} type="image" />
                    : <div className="aspect-video bg-black flex items-center justify-center">
                        <img src={activeItem.imageUrl} alt={activeItem.title || ""} className="max-h-full max-w-full object-contain" />
                      </div>
                )}

                {/* TEXT */}
                {activeItem.itemType === "text" && (
                  isItemLocked(activeItem)
                    ? <LockedItemOverlay price={collection.price} onUnlock={handleUnlock} checkingOut={checkingOut} type="text" />
                    : <div className="p-6 min-h-[300px]">
                        {activeItem.title && <h2 className="text-xl font-bold mb-4">{activeItem.title}</h2>}
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{activeItem.textContent}</p>
                      </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center">
                <TypeIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Item info */}
            {activeItem && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-medium">{activeIndex + 1} / {items.length}</span>
                  {activeItem.position === 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                      Free preview
                    </span>
                  )}
                  {isItemLocked(activeItem) && (
                    <span className="premium-badge px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Premium
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold mb-1">{activeItem.title || `Episode ${activeItem.position}`}</h2>
                {activeItem.description && <p className="text-sm text-muted-foreground">{activeItem.description}</p>}
              </div>
            )}

            {/* Engagement bar */}
            <div className="flex flex-wrap gap-2">
              <Button variant={isLiked ? "default" : "outline"} size="sm" onClick={handleLike} disabled={likingInProgress}
                className={`rounded-full font-medium ${isLiked ? "border-none text-white" : ""}`}
                style={isLiked ? { background: "hsl(var(--primary))" } : {}}>
                {likingInProgress ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ThumbsUp className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-current" : ""}`} />}
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full font-medium" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share
              </Button>
              {collectionId && <CollectionWatchlistButton collectionId={collectionId} />}
            </div>

            {/* Prev / Next */}
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full flex-1" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button className="rounded-full flex-1 text-white border-none" style={{ background: "hsl(var(--primary))" }}
                disabled={activeIndex === items.length - 1} onClick={() => goTo(activeIndex + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Unlock CTA */}
            {!isOwnerOrHasAccess && items.some(isItemLocked) && (
              <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-sm">Unlock the full collection</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Get access to all {items.length} items — one payment, forever</p>
                </div>
                <Button onClick={handleUnlock} disabled={checkingOut}
                  className="rounded-full font-bold flex-shrink-0 text-white border-none"
                  style={{ background: "hsl(var(--primary))" }}>
                  {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : `$${collection.price}`}
                </Button>
              </div>
            )}

            {isOwnerOrHasAccess && !collection.isOwner && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" /> Full access unlocked
              </div>
            )}

            {/* Creator card */}
            <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-2xl">
                {creatorAvatar && <AvatarImage src={creatorAvatar} />}
                <AvatarFallback className="rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}>
                  {creatorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{creatorName}</p>
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                </div>
                {collection.creator?.totalSubscribers !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {collection.creator.totalSubscribers.toLocaleString()} subscribers
                  </p>
                )}
              </div>
              {!collection.isOwner && creatorUserId && (
                <SendMessageDialog recipientId={creatorUserId} recipientName={creatorName} />
              )}
            </div>

            {/* Comments */}
            {collectionId && <CollectionComments collectionId={collectionId} currentUserId={user?.id} />}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
              {collection.thumbnailUrl && (
                <img src={collection.thumbnailUrl} alt={collection.title}
                  className="w-full aspect-video object-cover rounded-xl mb-3" />
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{collection.type}</span>
              </div>
              <h1 className="font-bold text-base leading-snug mb-1">{collection.title}</h1>
              {collection.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">{collection.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                <span>{items.length} items</span>
                <span>·</span>
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>${collection.price}</span>
                {(collection.views ?? 0) > 0 && (
                  <><span>·</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(collection.views ?? 0).toLocaleString()} views</span></>
                )}
              </div>
              {isOwnerOrHasAccess ? (
                <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-green-600 dark:text-green-400">
                  <Unlock className="h-3.5 w-3.5" />
                  {collection.isOwner ? "You own this collection" : "Full access unlocked"}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Episodes 2+ are locked
                </div>
              )}
            </div>

            <h2 className="font-bold font-display text-xs mb-3 text-muted-foreground uppercase tracking-wider">All episodes</h2>

            <div className="space-y-2">
              {items.map((item: any, index: number) => {
                const ItemIcon = ITEM_ICON[item.itemType] || Play;
                const isActive = index === activeIndex;
                const locked = isItemLocked(item);
                return (
                  <button key={item.id} onClick={() => goTo(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"
                    }`}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={isActive ? { background: "hsl(var(--primary))", color: "white" } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                      {isActive ? <Play className="h-3 w-3" /> : item.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                        {item.title || `Episode ${item.position}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ItemIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">{item.itemType}</span>
                        {item.position === 1 && (
                          <span className="text-[10px] font-medium px-1.5 py-0 rounded"
                            style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>Free</span>
                        )}
                      </div>
                    </div>
                    {locked
                      ? <Lock className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground" />
                      : isActive
                      ? <CheckCircle className="flex-shrink-0 h-3.5 w-3.5 text-green-500" />
                      : null}
                  </button>
                );
              })}
            </div>

            {user && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {user.profileImage && <AvatarImage src={user.profileImage} />}
                  <AvatarFallback className="text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))" }}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{user.username}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}