import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { referralApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Copy, Share2, Twitter, Facebook, MessageCircle,
  TrendingUp, Users, MousePointerClick, Wallet,
  ArrowDownToLine, Clock, CheckCircle2, XCircle,
  Trophy, Medal, Coins, Gift, ChevronRight, Zap,
  Info, ExternalLink, Sparkles, BarChart3,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────
const f2  = (n: number) => n.toFixed(2);
const f0  = (n: number) => Math.floor(n).toLocaleString();
const usd = (n: number) => `$${n.toFixed(2)}`;

// ── StatusBadge ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; hue: string }> = {
    pending:  { label: "Pending",  hue: "43 100% 50%" },
    approved: { label: "Approved", hue: "150 60% 42%" },
    rejected: { label: "Rejected", hue: "0 72% 51%"  },
    paid:     { label: "Paid",     hue: "195 100% 42%"},
  };
  const { label, hue } = cfg[status] ?? { label: status, hue: "220 10% 48%" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `hsl(${hue}/0.15)`, color: `hsl(${hue})` }}
    >
      {status === "paid"     && <CheckCircle2 className="h-3 w-3" />}
      {status === "rejected" && <XCircle      className="h-3 w-3" />}
      {!["paid","rejected"].includes(status) && <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────
function Stat({
  icon: Icon, label, value, sub, hue,
}: { icon: any; label: string; value: string | number; sub?: string; hue: string }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `hsl(${hue}/0.12)` }}
      >
        <Icon className="h-5 w-5" style={{ color: `hsl(${hue})` }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-2xl font-bold font-display leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = ["Overview", "Share", "History", "Leaderboard", "Withdraw"] as const;
type Tab = (typeof TABS)[number];

// ══════════════════════════════════════════════════════════════════════
export default function RewardsPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate]  = useLocation();
  const { toast }     = useToast();
  const qc            = useQueryClient();
  const [tab, setTab] = useState<Tab>("Overview");

  // withdrawal form
  const [wMethod,  setWMethod]  = useState("paypal");
  const [wDetails, setWDetails] = useState("");
  const [wPoints,  setWPoints]  = useState("");

  // ── queries ──────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats"],
    queryFn:  () => referralApi.getStats(),
    enabled:  isAuthenticated && !loading,
  });

  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: ["referral-history"],
    queryFn:  () => referralApi.getHistory(),
    enabled:  isAuthenticated && !loading && tab === "History",
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn:  () => referralApi.getLeaderboard(),
    enabled:  tab === "Leaderboard",
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["referral-withdrawals"],
    queryFn:  () => referralApi.getWithdrawals(),
    enabled:  isAuthenticated && !loading && tab === "Withdraw",
  });

  // ── withdrawal mutation ───────────────────────────────────────────
  const withdrawMut = useMutation({
    mutationFn: () =>
      referralApi.withdraw({
        pointsAmount:   parseFloat(wPoints),
        paymentMethod:  wMethod,
        paymentDetails: { account: wDetails },
      }),
    onSuccess: () => {
      toast({ title: "Withdrawal requested ✅", description: "We'll process it within 24–48 h." });
      setWPoints(""); setWDetails("");
      qc.invalidateQueries({ queryKey: ["referral-stats"] });
      qc.invalidateQueries({ queryKey: ["referral-withdrawals"] });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── copy ──────────────────────────────────────────────────────────
  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copied! 📋" });
  };

  if (loading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  // constants from server (or sensible defaults)
  const bal      = stats?.balance            ?? 0;
  const estUsd   = stats?.estimatedUsd       ?? 0;
  const minPts   = stats?.minWithdrawalPoints ?? 50;
  const rate     = stats?.pointsToUsdRate    ?? 0.01;
  const link     = stats?.link               ?? "";
  const ptsClick = stats?.pointsPerClick     ?? 0.20;
  const ptsReg   = stats?.pointsPerRegistration ?? 1.00;

  const wPtsNum  = parseFloat(wPoints) || 0;
  const wUsd     = wPtsNum * rate;

  // quick-pick options (only those ≥ minimum and ≤ balance)
  const quickPicks = [minPts, Math.floor(bal / 2), Math.floor(bal)]
    .filter((v, i, a) => v >= minPts && v <= bal && a.indexOf(v) === i);

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6"
          style={{
            background:
              "linear-gradient(135deg,hsl(350,100%,62%) 0%,hsl(320,80%,55%) 55%,hsl(280,70%,58%) 100%)",
          }}
        >
          {/* decorative blobs */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute right-12 -bottom-12 w-32 h-32 rounded-full bg-white/8" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-white/75" />
                <span className="text-white/75 text-xs font-bold uppercase tracking-widest">
                  Rewards Programme
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white leading-tight">
                Share &amp; Earn
              </h1>
              <p className="text-white/65 text-sm mt-1">
                +{ptsClick} pts per click · +{ptsReg} pt per sign-up · 1 pt = {usd(rate)}
              </p>
            </div>

            {/* balance pill */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3.5 text-center border border-white/25 flex-shrink-0">
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-0.5">Balance</p>
              <p className="text-4xl font-bold font-display text-white leading-none">{f2(bal)}</p>
              <p className="text-white/60 text-xs mt-0.5">pts ≈ {usd(estUsd)}</p>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t
                  ? "text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={tab === t ? { background: "hsl(var(--primary))" } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* OVERVIEW                                                   */}
        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={Coins}            label="Balance"       value={`${f2(bal)} pts`}                   sub={`≈ ${usd(estUsd)}`}    hue="350 100% 62%" />
              <Stat icon={MousePointerClick} label="Total Clicks"  value={f0(stats?.totalClicks ?? 0)}         sub={`+${ptsClick} pts ea`} hue="195 100% 42%" />
              <Stat icon={Users}            label="Sign-ups"      value={f0(stats?.totalRegistrations ?? 0)}  sub={`+${ptsReg} pt ea`}    hue="150 60% 42%"  />
              <Stat icon={BarChart3}        label="Total Earned"  value={`${f2(stats?.totalEarned ?? 0)} pts`} sub={usd((stats?.totalEarned ?? 0) * rate)} hue="43 100% 45%" />
            </div>

            {/* How it works */}
            <div className="bg-card border border-card-border rounded-3xl p-5 sm:p-6">
              <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-5">
                How it works
              </h3>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  {
                    n: "1", icon: Share2, title: "Share your link",
                    desc: "Copy your unique link and share it anywhere — social media, WhatsApp groups, forums, or your profile bio.",
                  },
                  {
                    n: "2", icon: Zap, title: "Earn points",
                    desc: `You earn ${ptsClick} pts every time someone clicks, and ${ptsReg} pt when they create an account.`,
                  },
                  {
                    n: "3", icon: Wallet, title: "Cash out or spend",
                    desc: `Withdraw to cash (min ${minPts} pts = ${usd(minPts * rate)}) or spend points to unlock premium videos.`,
                  },
                ].map(({ n, icon: Icon, title, desc }) => (
                  <div key={n} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      {n}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate card */}
            <div
              className="rounded-3xl p-5 grid sm:grid-cols-3 gap-4 border"
              style={{ background:"hsl(var(--primary)/0.05)", borderColor:"hsl(var(--primary)/0.18)" }}
            >
              {[
                { label: "Per click",        value: `+${ptsClick} pts`, sub: `= ${usd(ptsClick * rate)}` },
                { label: "Per registration", value: `+${ptsReg} pt`,   sub: `= ${usd(ptsReg * rate)}`   },
                { label: "Min withdrawal",   value: `${minPts} pts`,    sub: `= ${usd(minPts * rate)}`   },
              ].map(({ label, value, sub }) => (
                <div key={label} className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-xl font-bold font-display mt-1" style={{ color: "hsl(var(--primary))" }}>
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { t: "Share" as Tab, icon: Share2, label: "Share link",  sub: "Start earning now", hue: "350 100% 62%" },
                { t: "Withdraw" as Tab, icon: ArrowDownToLine, label: "Withdraw", sub: `Min ${minPts} pts`, hue: "150 60% 42%" },
              ].map(({ t, icon: Icon, label, sub, hue }) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-4 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `hsl(${hue}/0.12)` }}>
                    <Icon className="h-5 w-5" style={{ color: `hsl(${hue})` }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SHARE                                                      */}
        {tab === "Share" && (
          <div className="space-y-5">
            {statsLoading ? (
              <div className="h-40 rounded-3xl skeleton-wave" />
            ) : (
              <>
                {/* Link card */}
                <div className="bg-card border border-card-border rounded-3xl p-5 sm:p-6">
                  <h3 className="font-display font-bold mb-1">Your Referral Link</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Every unique click earns <strong>+{ptsClick} pts</strong> and every
                    sign-up earns <strong>+{ptsReg} pt</strong> for you.
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Code:</span>
                    <code
                      className="px-3 py-1.5 rounded-xl text-sm font-bold font-mono tracking-widest"
                      style={{ background:"hsl(var(--primary)/0.10)", color:"hsl(var(--primary))" }}
                    >
                      {stats?.code}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={link}
                      readOnly
                      className="rounded-2xl bg-muted/50 border-transparent text-sm font-mono"
                    />
                    <Button
                      onClick={() => copyLink(link)}
                      className="rounded-2xl text-white border-none flex-shrink-0"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Social */}
                <div className="bg-card border border-card-border rounded-3xl p-5 sm:p-6">
                  <h3 className="font-display font-bold mb-4">Share on Social</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label:"WhatsApp", icon: MessageCircle, color:"#25D366", href: stats?.shareLinks?.whatsapp },
                      { label:"Twitter / X", icon: Twitter, color:"#1DA1F2", href: stats?.shareLinks?.twitter  },
                      { label:"Facebook",  icon: Facebook,  color:"#1877F2", href: stats?.shareLinks?.facebook },
                    ].map(({ label, icon: Icon, color, href }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl p-4 font-semibold text-sm transition-all hover:scale-[1.02] hover:shadow-md"
                        style={{ background: color + "18", color }}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                        <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div
                  className="rounded-3xl p-5 border flex gap-3"
                  style={{ background:"hsl(var(--primary)/0.05)", borderColor:"hsl(var(--primary)/0.18)" }}
                >
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color:"hsl(var(--primary))" }} />
                  <div className="text-sm">
                    <p className="font-bold mb-2" style={{ color:"hsl(var(--primary))" }}>
                      Programme rules
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Each unique IP earns 1 click credit every 24 hours</li>
                      <li>• Registration bonus is credited once per referred user</li>
                      <li>• You cannot earn from your own link (self-referral blocked)</li>
                      <li>• Points are credited instantly after the event</li>
                      <li>• Minimum withdrawal: {minPts} pts = {usd(minPts * rate)}</li>
                      <li>• 1 pt = {usd(rate)} · 100 pts = {usd(100 * rate)}</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* HISTORY                                                    */}
        {tab === "History" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold">Points History</h3>
              <span className="text-xs text-muted-foreground">Last 50 entries</span>
            </div>

            {histLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-2xl skeleton-wave" />
              ))
            ) : (history as any[]).length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
                <Coins className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Share your link to start earning
                </p>
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
                {(history as any[]).map((entry: any, i: number) => {
                  const isCredit = parseFloat(entry.amount) > 0;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 ${
                        i < (history as any[]).length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isCredit
                            ? "hsl(150 60% 42% / 0.12)"
                            : "hsl(0 72% 51% / 0.12)",
                        }}
                      >
                        {isCredit
                          ? <TrendingUp    className="h-4 w-4" style={{ color:"hsl(150 60% 42%)" }} />
                          : <ArrowDownToLine className="h-4 w-4" style={{ color:"hsl(0 72% 51%)" }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month:"short", day:"numeric",
                            hour:"2-digit", minute:"2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-bold text-sm"
                          style={{ color: isCredit ? "hsl(150 60% 42%)" : "hsl(0 72% 51%)" }}
                        >
                          {isCredit ? "+" : ""}{f2(parseFloat(entry.amount))} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          bal: {f2(parseFloat(entry.balanceAfter))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* LEADERBOARD                                                */}
        {tab === "Leaderboard" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background:"hsl(43 100% 55% / 0.12)" }}
              >
                <Trophy className="h-5 w-5" style={{ color:"hsl(43 100% 45%)" }} />
              </div>
              <div>
                <h3 className="font-display font-bold">Top Referrers</h3>
                <p className="text-xs text-muted-foreground">Ranked by total sign-ups</p>
              </div>
            </div>

            {lbLoading ? (
              [...Array(10)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton-wave" />)
            ) : (leaderboard as any[]).length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
                <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">Leaderboard is empty</p>
                <p className="text-sm text-muted-foreground/60">Be the first to refer someone!</p>
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
                {(leaderboard as any[]).map((row: any, i: number) => {
                  const podium = ["hsl(43 100% 45%)", "hsl(220 10% 58%)", "hsl(30 80% 50%)"];
                  const rankColor = podium[i] ?? "hsl(220 10% 48%)";
                  const isMe = row.userId === user?.id;

                  return (
                    <div
                      key={row.userId}
                      className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 ${
                        isMe ? "" : ""
                      } ${i < (leaderboard as any[]).length - 1 ? "border-b border-border" : ""}`}
                      style={isMe ? { background: "hsl(var(--primary)/0.05)" } : {}}
                    >
                      {/* rank */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: i < 3 ? rankColor + "25" : "hsl(var(--muted))",
                          color:      i < 3 ? rankColor       : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {i < 3 ? <Medal className="h-4 w-4" /> : i + 1}
                      </div>

                      {/* avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{
                          background: row.profileImage
                            ? undefined
                            : "linear-gradient(135deg,hsl(350,100%,65%),hsl(195,100%,50%))",
                        }}
                      >
                        {row.profileImage
                          ? <img src={row.profileImage} alt={row.username} className="w-full h-full object-cover" />
                          : row.username?.slice(0, 2).toUpperCase()
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                          {row.username}
                          {isMe && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background:"hsl(var(--primary)/0.15)", color:"hsl(var(--primary))" }}
                            >
                              you
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {f0(row.totalClicks)} clicks · {f0(row.totalRegistrations)} sign-ups
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm">{f2(row.totalEarned)} pts</p>
                        <p className="text-xs text-muted-foreground">{usd(row.totalEarned * rate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* WITHDRAW                                                   */}
        {tab === "Withdraw" && (
          <div className="space-y-5">

            {/* Balance banner */}
            <div
              className="rounded-3xl p-5 flex items-center gap-4 border"
              style={{
                background:   "linear-gradient(135deg,hsl(350,100%,65%/0.09),hsl(320,80%,58%/0.06))",
                borderColor:  "hsl(350 100% 65% / 0.22)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background:"hsl(var(--primary)/0.15)" }}
              >
                <Coins className="h-7 w-7" style={{ color:"hsl(var(--primary))" }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available to withdraw</p>
                <p className="text-4xl font-bold font-display leading-none" style={{ color:"hsl(var(--primary))" }}>
                  {f2(bal)}<span className="text-xl ml-1">pts</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">≈ {usd(estUsd)}</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-card-border rounded-3xl p-5 sm:p-6">
              <h3 className="font-display font-bold mb-1">Request Withdrawal</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Minimum {minPts} pts = {usd(minPts * rate)}. Paid within 24–48 hours.
              </p>

              <div className="space-y-5">
                {/* Payment method */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Payment method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id:"paypal",       label:"PayPal"  },
                      { id:"bank",         label:"Bank"    },
                      { id:"mobile_money", label:"Mobile"  },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setWMethod(id)}
                        className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                          wMethod === id
                            ? "text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={wMethod === id ? { background:"hsl(var(--primary))" } : {}}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account detail */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {wMethod === "paypal"       ? "PayPal email"
                    : wMethod === "bank"        ? "Account / IBAN"
                    :                            "Mobile number"}
                  </label>
                  <Input
                    value={wDetails}
                    onChange={(e) => setWDetails(e.target.value)}
                    placeholder={
                      wMethod === "paypal" ? "you@example.com"
                      : wMethod === "bank" ? "IBAN or account number"
                      : "+267 7X XXX XXX"
                    }
                    className="rounded-2xl h-11"
                  />
                </div>

                {/* Points amount */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Points to withdraw (min {minPts})
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={wPoints}
                      onChange={(e) => setWPoints(e.target.value)}
                      placeholder={`${minPts}`}
                      min={minPts}
                      max={bal}
                      className="rounded-2xl h-11 pr-24"
                    />
                    {wPtsNum > 0 && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                        style={{ color:"hsl(var(--primary))" }}
                      >
                        = {usd(wUsd)}
                      </span>
                    )}
                  </div>

                  {/* Quick-pick chips */}
                  {quickPicks.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {quickPicks.map((v) => (
                        <button
                          key={v}
                          onClick={() => setWPoints(String(v))}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {v} pts
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => withdrawMut.mutate()}
                  disabled={
                    withdrawMut.isPending ||
                    !wDetails.trim()      ||
                    !wPoints              ||
                    wPtsNum < minPts      ||
                    wPtsNum > bal
                  }
                  className="w-full h-12 rounded-2xl font-bold text-white border-none"
                  style={{
                    background:"linear-gradient(135deg,hsl(350,100%,65%),hsl(320,80%,58%))",
                  }}
                >
                  {withdrawMut.isPending
                    ? "Submitting…"
                    : `Withdraw ${wPtsNum > 0 ? f2(wPtsNum) : "—"} pts${wPtsNum > 0 ? ` (${usd(wUsd)})` : ""}`
                  }
                </Button>
              </div>
            </div>

            {/* Past withdrawals */}
            {(withdrawals as any[]).length > 0 && (
              <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-display font-bold text-sm">Withdrawal History</h3>
                </div>
                {(withdrawals as any[]).map((w: any, i: number) => (
                  <div
                    key={w.id}
                    className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 ${
                      i < (withdrawals as any[]).length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {f2(parseFloat(w.pointsAmount))} pts → {usd(parseFloat(w.usdAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {w.paymentMethod} · {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}