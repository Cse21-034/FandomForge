import { useAuth } from "@/hooks/useAuth";
import { videoApi, creatorApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Play, Zap, Shield, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

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

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [_location, navigate] = useLocation();

  const { data: videosWithCreators = [], isLoading } = useQuery({
    queryKey: ["videos-with-creators-home", isAuthenticated],
    queryFn: async () => {
      const videos: any[] = await videoApi.getAll();
      const filtered = isAuthenticated
        ? videos.slice(0, 6)
        : videos.filter((v: any) => v.type === "free").slice(0, 6);
      const creatorIds: string[] = Array.from(new Set(filtered.map((v: any) => v.creatorId)));
      const creators = await Promise.all(
        creatorIds.map((id) => creatorApi.getById(id).catch(() => null))
      );
      const creatorMap = Object.fromEntries(
        creators.filter(Boolean).map((c: any) => [c.id, c])
      );
      return filtered.map((v: any) => ({
        ...v,
        _creator: creatorMap[v.creatorId] || null,
      }));
    },
  });

  const features = [
    {
      icon: Zap,
      title: "Upload & Earn",
      desc: "Monetize your content instantly with subscriptions and pay-per-view.",
      color: "hsl(43 100% 55%)",
      bg: "hsl(43 100% 55% / 0.08)",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      desc: "Stripe-powered payments. Get paid reliably every month.",
      color: "hsl(150 60% 42%)",
      bg: "hsl(150 60% 42% / 0.08)",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Audience",
      desc: "Analytics, subscriber insights, and tools to scale your reach.",
      color: "hsl(195 100% 42%)",
      bg: "hsl(195 100% 42% / 0.08)",
    },
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

      {/* ── Hero ── */}
      <section className="hero-gradient page-enter relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--primary)/0.10)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.20)] rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
            style={{ background: "hsl(var(--primary) / 0.08)", borderColor: "hsl(var(--primary) / 0.20)", color: "hsl(var(--primary))" }}>
            <Sparkles className="h-3 w-3" />
            The Creator Economy Platform
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            Create, Share,{" "}
            <span className="text-gradient">Get Paid</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of creators building their audience and earning from
            exclusive content on FandomForge.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="rounded-2xl h-12 px-8 font-bold text-white shadow-lg border-none"
                  style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Start for Free
                </Button>
                <Button
                  onClick={() => navigate("/browse")}
                  variant="outline"
                  size="lg"
                  className="rounded-2xl h-12 px-8 font-semibold"
                >
                  Browse Content
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/browse")}
                size="lg"
                className="rounded-2xl h-12 px-8 font-bold text-white shadow-lg border-none"
                style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
              >
                Browse Content
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-10 pt-8 border-t border-border/50">
            {[
              { value: "10K+", label: "Creators" },
              { value: "500K+", label: "Fans" },
              { value: "$2M+", label: "Earned" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl sm:text-2xl font-bold font-display text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Videos Grid ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                {isAuthenticated ? "Latest Content" : "Free Content"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAuthenticated ? "Fresh from your creators" : "No account needed"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/browse")}
              className="rounded-full text-[hsl(var(--primary))] font-semibold hidden sm:flex"
            >
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[...Array(6)].map((_, i) => <VideoSkeleton key={i} />)}
            </div>
          ) : videosWithCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {videosWithCreators.map((video: any) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  creatorName={video._creator?.user?.username || "Creator"}
                  creatorAvatar={video._creator?.imageUrl || undefined}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/30">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium mb-4">No content yet</p>
              {isAuthenticated && user?.role === "creator" && (
                <Button onClick={() => navigate("/creator/dashboard")} className="rounded-2xl">
                  Upload your first video
                </Button>
              )}
            </div>
          )}

          {/* Mobile view all */}
          <div className="mt-6 sm:hidden">
            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => navigate("/browse")}
            >
              View all content <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-muted/30 border-t border-border/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold font-display">Why FandomForge?</h2>
            <p className="text-sm text-muted-foreground mt-2">Everything you need to build and monetize your audience</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-card border border-card-border rounded-3xl p-5 sm:p-6 hover:shadow-lg transition-all">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="font-bold font-display mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!isAuthenticated && (
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(350,100%,65%/0.12) 0%, hsl(195,100%,50%/0.08) 100%)",
                border: "1px solid hsl(350 100% 65% / 0.20)",
              }}
            >
              <div className="absolute inset-0 rounded-3xl" style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(350 100% 65% / 0.08), transparent)"
              }} />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">
                  Ready to start creating?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Join FandomForge today — it's free to get started.
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="rounded-2xl h-12 px-8 font-bold text-white shadow-lg border-none"
                  style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
                >
                  Join Free Today
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}