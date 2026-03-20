import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { collectionApi, collectionPaymentApi } from "@/lib/api";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Lock, Unlock, Play, Image, FileText,
  ChevronLeft, ChevronRight, CheckCircle, Loader2,
  BookOpen, Film, LayoutGrid,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, any> = { series: Film, course: BookOpen, gallery: LayoutGrid };
const ITEM_ICON: Record<string, any> = { video: Play, image: Image, text: FileText };

async function checkCollectionAccess(collectionId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${API_BASE}/payments/check-collection/${collectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.hasAccess;
  } catch { return false; }
}

export default function CollectionPage() {
  const [_, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const collectionId = new URL(window.location.href).pathname.split("/").pop();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: collection, isLoading, refetch } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => collectionApi.getById(collectionId!),
    enabled: !!collectionId,
  });

  // ── FIX: Check access and refetch collection if access granted ──
  useEffect(() => {
    if (!collection || !collectionId) return;

    // If server already confirmed access, set it
    if (collection.isOwner || collection.hasAccess) {
      setHasAccess(true);
      return;
    }

    // Otherwise check payment records
    if (isAuthenticated) {
      checkCollectionAccess(collectionId).then((access) => {
        if (access) {
          setHasAccess(true);
          // ── CRITICAL: Refetch so server returns full videoUrls ──
          queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
          refetch();
        }
      });
    }
  }, [collection?.id, isAuthenticated, collectionId]);

  const items: any[] = collection?.items ?? [];
  const activeItem = items[activeIndex];
  const isOwnerOrHasAccess = collection?.isOwner || hasAccess;

  const canViewItem = (item: any) =>
    isOwnerOrHasAccess || item.position === 1;

  // ── FIX: Video player uses server-returned videoUrl ──
  // No need to check canViewItem for videoUrl since server already
  // strips it for locked items and returns it for unlocked items
  const getVideoUrl = (item: any) => {
    if (item.locked) return undefined;       // server said locked
    return item.videoUrl || undefined;        // server returned the url
  };

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/collection/${collectionId}`);
      return;
    }
    setCheckingOut(true);
    try {
      const { approvalUrl } = await collectionPaymentApi.createOrder(collectionId!);
      window.location.href = approvalUrl;
    } catch {
      toast({ title: "Failed to start checkout", variant: "destructive" });
      setCheckingOut(false);
    }
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= items.length) return;
    const target = items[index];
    // ── FIX: Check server-returned locked field, not client canViewItem ──
    if (target.locked) {
      toast({ 
        title: `Unlock the full collection to continue`, 
        description: `$${collection?.price} for all ${items.length} items` 
      });
      return;
    }
    setActiveIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Collection not found</p>
        <Button onClick={() => navigate("/browse")} className="rounded-2xl">
          Back to Browse
        </Button>
      </div>
    );
  }

  const TypeIcon = TYPE_ICON[collection.type] || Film;

  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        <button
          onClick={() => navigate("/browse")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* ── Video Player ── */}
            {activeItem ? (
              <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
                {activeItem.itemType === "video" && (
                  <VideoPlayer
                    isLocked={!!activeItem.locked}
                    videoUrl={getVideoUrl(activeItem)}  // ← USE getVideoUrl
                    thumbnail={activeItem.thumbnailUrl}
                    onUnlock={handleUnlock}
                  />
                )}

                {activeItem.itemType === "image" && !activeItem.locked && (
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <img
                      src={activeItem.imageUrl}
                      alt={activeItem.title || ""}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {activeItem.itemType === "image" && activeItem.locked && (
                  <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-3">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Unlock to view this image
                    </p>
                    <Button
                      onClick={handleUnlock}
                      className="rounded-full"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      Unlock for ${collection.price}
                    </Button>
                  </div>
                )}

                {activeItem.itemType === "text" && !activeItem.locked && (
                  <div className="p-6 min-h-[300px]">
                    {activeItem.title && (
                      <h2 className="text-xl font-bold mb-4">{activeItem.title}</h2>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                      {activeItem.textContent}
                    </p>
                  </div>
                )}

                {activeItem.itemType === "text" && activeItem.locked && (
                  <div className="p-6 min-h-[200px] flex flex-col items-center justify-center gap-3">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Unlock to read this post
                    </p>
                    <Button
                      onClick={handleUnlock}
                      className="rounded-full"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      Unlock for ${collection.price}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center">
                <TypeIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Active item info */}
            {activeItem && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {activeIndex + 1} / {items.length}
                  </span>
                  {activeItem.position === 1 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "hsl(var(--primary) / 0.1)",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      Free preview
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold mb-1">
                  {activeItem.title || `Episode ${activeItem.position}`}
                </h2>
                {activeItem.description && (
                  <p className="text-sm text-muted-foreground">
                    {activeItem.description}
                  </p>
                )}
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-full flex-1"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                className="rounded-full flex-1 text-white border-none"
                style={{ background: "hsl(var(--primary))" }}
                disabled={activeIndex === items.length - 1}
                onClick={() => goTo(activeIndex + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Unlock CTA */}
            {!isOwnerOrHasAccess && (
              <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    Unlock the full collection
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get access to all {items.length} items — one payment, forever
                  </p>
                </div>
                <Button
                  onClick={handleUnlock}
                  disabled={checkingOut}
                  className="rounded-full font-bold flex-shrink-0 text-white border-none"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  {checkingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `$${collection.price}`
                  )}
                </Button>
              </div>
            )}

            {/* Access confirmed */}
            {isOwnerOrHasAccess && !collection.isOwner && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Full access unlocked
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
              {collection.thumbnailUrl && (
                <img
                  src={collection.thumbnailUrl}
                  alt={collection.title}
                  className="w-full aspect-video object-cover rounded-xl mb-3"
                />
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {collection.type}
                </span>
              </div>
              <h1 className="font-bold text-base leading-snug mb-1">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {collection.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>{items.length} items</span>
                <span>·</span>
                <span
                  className="font-semibold"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  ${collection.price}
                </span>
              </div>
            </div>

            <h2 className="font-bold font-display text-xs mb-3 text-muted-foreground uppercase tracking-wider">
              All episodes
            </h2>

            <div className="space-y-2">
              {items.map((item: any, index: number) => {
                const ItemIcon = ITEM_ICON[item.itemType] || Play;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => goTo(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/60 border border-transparent"
                    }`}
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={
                        isActive
                          ? { background: "hsl(var(--primary))", color: "white" }
                          : {
                              background: "hsl(var(--muted))",
                              color: "hsl(var(--muted-foreground))",
                            }
                      }
                    >
                      {isActive ? <Play className="h-3 w-3" /> : item.position}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isActive ? "text-primary" : ""
                        }`}
                      >
                        {item.title || `Episode ${item.position}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ItemIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.itemType}
                        </span>
                        {item.position === 1 && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0 rounded"
                            style={{
                              background: "hsl(var(--primary) / 0.1)",
                              color: "hsl(var(--primary))",
                            }}
                          >
                            Free
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── FIX: Use server locked field ── */}
                    {item.locked && (
                      <Lock className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {!item.locked && isActive && (
                      <CheckCircle className="flex-shrink-0 h-3.5 w-3.5 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}