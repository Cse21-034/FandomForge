import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { videoApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { UploadVideoDialog } from "@/components/UploadVideoDialog";
import { AffiliateBanner, AffiliateBannerStrip } from "@/components/AffiliateBanner";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import {
  Upload, Video, DollarSign, Users, Eye, Lock, Unlock,
  TrendingUp, Pencil, Trash2, Plus, LayoutDashboard,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function fetchCreatorSubscriptions(creatorId: string) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE_URL}/subscriptions/creator/${creatorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center text-center px-4 rounded-2xl bg-muted/30 border border-dashed border-border">
      <Icon className="w-8 h-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-44 rounded-2xl skeleton-wave" />;
}

export default function CreatorDashboardUpdated() {
  const { user, isCreator, loading, logout } = useAuth();
  const [_location, navigate] = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);

  const creatorId = user?.creator?.id;

  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos } = useQuery({
    queryKey: ["creator-videos", creatorId],
    queryFn: () => videoApi.getByCreatorId(creatorId!),
    enabled: !!creatorId,
  });

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["creator-subscriptions", creatorId],
    queryFn: () => fetchCreatorSubscriptions(creatorId!),
    enabled: !!creatorId,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <LayoutDashboard className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading your studio…</p>
        </div>
      </div>
    );
  }

  if (!isCreator) { navigate("/"); return null; }

  const totalVideos = videos.length;
  const freeVideos = videos.filter((v: any) => v.type === "free").length;
  const paidVideos = videos.filter((v: any) => v.type === "paid").length;
  const totalViews = videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);
  const totalSubscribers = user?.creator?.totalSubscribers || subscriptions.length || 0;
  const storedEarnings = parseFloat(user?.creator?.totalEarnings || "0");
  const subPrice = parseFloat(user?.creator?.subscriptionPrice || "9.99");
  const estimatedEarnings = storedEarnings > 0 ? storedEarnings : totalSubscribers * subPrice;

  const viewsChartData = [...videos]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 6)
    .map((v: any) => ({
      name: v.title.length > 12 ? v.title.slice(0, 12) + "…" : v.title,
      views: v.views || 0,
    }));

  const contentMixData = [
    { name: "Free", value: freeVideos, color: "#10b981" },
    { name: "Paid", value: paidVideos, color: "hsl(350,100%,65%)" },
  ].filter((d) => d.value > 0);

  const subsByMonth: Record<string, number> = {};
  subscriptions.forEach((sub: any) => {
    const date = new Date(sub.createdAt || sub.startDate);
    if (!isNaN(date.getTime())) {
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      subsByMonth[key] = (subsByMonth[key] || 0) + 1;
    }
  });
  const subsChartData = Object.entries(subsByMonth).slice(-6).map(([month, count]) => ({ month, subscribers: count }));

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12, fontSize: 12,
    },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
    itemStyle: { color: "hsl(var(--primary))" },
  };

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <Header isAuthenticated userRole="creator" username={user?.username} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full live-dot" style={{ background: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creator Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Hey, {user?.username} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your content.</p>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="rounded-2xl font-bold text-white shadow-lg border-none flex-shrink-0 h-10 sm:h-11"
            style={{ background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(320,80%,58%))" }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Upload
          </Button>
        </div>

        {/* ── TOP BANNER STRIP ── */}
        <AffiliateBannerStrip className="mb-6" />

        {/* Main stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <StatCard title="Videos" value={totalVideos} icon={Video} color="primary" />
          <StatCard title="Total Views" value={totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews} icon={Eye} color="accent" />
          <StatCard title="Subscribers" value={totalSubscribers} icon={Users} color="green" />
          <StatCard title="Earnings" value={`$${estimatedEarnings.toFixed(0)}`} icon={DollarSign} color="gold" description="Estimated" />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Free", value: freeVideos, icon: Unlock, color: "#10b981", bg: "hsl(150 60% 42% / 0.08)" },
            { label: "Premium", value: paidVideos, icon: Lock, color: "hsl(350,100%,65%)", bg: "hsl(350 100% 65% / 0.08)" },
            { label: "Avg Views", value: totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0, icon: TrendingUp, color: "hsl(195 100% 42%)", bg: "hsl(195 100% 50% / 0.08)" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-card-border rounded-2xl p-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-1" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-xl font-bold font-display">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ── BANNER between stats and charts ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <AffiliateBanner index={0} size="sm" />
          <AffiliateBanner index={1} size="sm" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="bg-card border border-card-border rounded-3xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h3 className="font-display font-semibold text-sm">Views by Video</h3>
            </div>
            {videosLoading ? <ChartSkeleton /> :
              !totalVideos ? <EmptyState icon={Video} message="Upload videos to see analytics" /> :
              viewsChartData.every(v => v.views === 0) ? <EmptyState icon={Eye} message="No views yet — share your content!" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={viewsChartData} margin={{ top: 0, right: 0, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="views" fill="hsl(350,100%,65%)" radius={[6, 6, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Video className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h3 className="font-display font-semibold text-sm">Content Mix</h3>
            </div>
            {videosLoading ? <ChartSkeleton /> :
              !totalVideos ? <EmptyState icon={Video} message="Upload to see breakdown" /> : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={contentMixData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value">
                      {contentMixData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle.contentStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-3">
                  {contentMixData.map((e) => (
                    <div key={e.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-xs text-muted-foreground">{e.name} ({e.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subscriber growth */}
        {subsChartData.length > 0 && (
          <div className="bg-card border border-card-border rounded-3xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h3 className="font-display font-semibold text-sm">Subscriber Growth</h3>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={subsChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} itemStyle={{ color: "hsl(195 100% 42%)" }} />
                <Bar dataKey="subscribers" fill="hsl(195 100% 42%)" radius={[6, 6, 0, 0]} name="Subscribers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── BANNER between charts and video list ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <AffiliateBanner index={2} size="md" />
          <AffiliateBanner index={3} size="md" />
          <AffiliateBanner index={4} size="md" />
        </div>

        {/* Videos list */}
        <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-display font-semibold">Your Videos</h3>
            <Button
              size="sm" onClick={() => setUploadOpen(true)}
              className="rounded-xl text-xs font-bold text-white border-none h-8"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Plus className="h-3 w-3 mr-1" /> Upload
            </Button>
          </div>

          {videosLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton-wave" />)}
            </div>
          ) : videos.length > 0 ? (
            <div className="divide-y divide-border">
              {videos.map((video: any, idx: number) => (
                <>
                  <div key={video.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                    <div className="w-16 sm:w-20 h-10 sm:h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate max-w-[180px] sm:max-w-none">{video.title}</p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0"
                          style={{
                            background: video.type === "paid" ? "hsl(350 100% 65% / 0.10)" : "rgb(16 185 129 / 0.10)",
                            color: video.type === "paid" ? "hsl(350 100% 58%)" : "rgb(5 150 105)",
                          }}
                        >
                          {video.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(video.views || 0).toLocaleString()}</span>
                        {video.type === "paid" && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {video.price}</span>}
                        <span className="hidden sm:inline">{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* ── INLINE BANNER after every 5th video ── */}
                  {(idx + 1) % 5 === 0 && idx !== videos.length - 1 && (
                    <div key={`banner-${idx}`} className="px-4 sm:px-5 py-3">
                      <AffiliateBanner index={idx % 6} size="sm" />
                    </div>
                  )}
                </>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Video className="h-7 w-7 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground mb-1">No videos yet</p>
              <p className="text-sm text-muted-foreground/60 mb-5">Upload your first video to get started</p>
              <Button
                onClick={() => setUploadOpen(true)}
                className="rounded-2xl font-bold text-white border-none"
                style={{ background: "hsl(var(--primary))" }}
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Video
              </Button>
            </div>
          )}
        </div>

        {/* ── FOOTER BANNER ── */}
        <AffiliateBanner index={5} size="lg" className="mt-6" />
      </div>

      <UploadVideoDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadSuccess={() => { setUploadOpen(false); refetchVideos(); }}
      />
    </div>
  );
}