// client/src/pages/AdminPayoutsPage.tsx
// Add route in App.tsx: <Route path="/admin/payouts" component={AdminPayoutsPage} />
// Only accessible to users with role "admin"

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle,
  Activity, AlertCircle, ExternalLink, Copy, Shield,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; hue: string; Icon: any }> = {
    pending:    { label: "Pending",    hue: "43 100% 50%",   Icon: Clock        },
    processing: { label: "Processing", hue: "195 100% 42%",  Icon: Activity     },
    completed:  { label: "Paid",       hue: "150 60% 42%",   Icon: CheckCircle2 },
    failed:     { label: "Failed",     hue: "0 72% 51%",     Icon: XCircle      },
  };
  const { label, hue, Icon } = map[status] ?? { label: status, hue: "220 10% 48%", Icon: AlertCircle };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `hsl(${hue}/0.15)`, color: `hsl(${hue})` }}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export default function AdminPayoutsPage() {
  const { user, loading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paypalIds, setPaypalIds] = useState<Record<string, string>>({});

  // Auth guard
  if (!loading && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // ── Fetch summary ─────────────────────────────────────────────────
  const { data: summary } = useQuery({
    queryKey: ["admin-payout-summary"],
    queryFn: () => apiFetch("/admin/payouts/summary"),
    enabled: user?.role === "admin",
    refetchInterval: 30_000,
  });

  // ── Fetch all payouts ─────────────────────────────────────────────
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => apiFetch("/admin/payouts"),
    enabled: user?.role === "admin",
    refetchInterval: 15_000,
  });

  // ── Update payout status ──────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, status, paypalPayoutId }: { id: string; status: string; paypalPayoutId?: string }) =>
      apiFetch(`/admin/payouts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, paypalPayoutId }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-summary"] });
      toast({
        title: vars.status === "completed"
          ? "Payout marked as paid ✓"
          : vars.status === "failed"
          ? "Payout marked as failed"
          : "Status updated",
      });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const pending = (payouts as any[]).filter((p) => p.status === "pending");
  const others = (payouts as any[]).filter((p) => p.status !== "pending");

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.10)" }}>
            <Shield className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Creator Payouts</h1>
            <p className="text-sm text-muted-foreground">Review and process creator payment requests</p>
          </div>
        </div>

        {/* ── Summary cards ── */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Platform Revenue", value: `$${parseFloat(summary.totalRevenue).toFixed(2)}`, hue: "195 100% 42%", Icon: TrendingUp },
              { label: "Your Commission", value: `$${parseFloat(summary.totalPlatformCommission).toFixed(2)}`, hue: "43 100% 45%", Icon: DollarSign },
              { label: "Owed to Creators", value: `$${parseFloat(summary.outstandingBalance).toFixed(2)}`, hue: "350 100% 62%", Icon: AlertCircle },
              { label: "Pending Requests", value: `${summary.pendingPayoutCount} ($${parseFloat(summary.pendingPayoutAmount).toFixed(2)})`, hue: "43 100% 50%", Icon: Clock },
            ].map(({ label, value, hue, Icon }) => (
              <div key={label} className="bg-card border border-card-border rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `hsl(${hue}/0.12)` }}>
                  <Icon className="h-4 w-4" style={{ color: `hsl(${hue})` }} />
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
                <p className="text-base font-bold font-display">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── HOW TO PAY guide ── */}
        <div className="bg-card border border-card-border rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            How to Send Payouts
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { n: "1", title: "Copy PayPal email", desc: "Copy the creator's PayPal email from the payout request below." },
              { n: "2", title: "Send via PayPal", desc: 'Log into your PayPal → Send Money → paste their email → enter the payout amount → send.' },
              { n: "3", title: "Mark as paid", desc: "Come back here, enter the PayPal Transaction ID, and click Mark Paid." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--primary))" }}>{n}</div>
                <div>
                  <p className="font-semibold mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <a href="https://www.paypal.com/myaccount/transfer/homepage/pay" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "hsl(var(--primary))" }}>
              Open PayPal Send Money <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* ── PENDING requests (action required) ── */}
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Pending — Action Required ({pending.length})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl skeleton-wave" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-muted/20 rounded-2xl border border-dashed border-border p-8 text-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending payout requests</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {pending.map((payout: any) => (
              <div key={payout.id} className="bg-card border-2 border-yellow-500/30 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-base">{payout.creatorName}</p>
                      <StatusBadge status={payout.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{payout.creatorEmail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested {new Date(payout.createdAt).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold font-display" style={{ color: "hsl(var(--primary))" }}>
                      ${parseFloat(payout.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">payout amount</p>
                  </div>
                </div>

                {/* PayPal email to send to */}
                <div className="bg-muted/40 rounded-xl p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Send payment to this PayPal:</p>
                  {payout.paypalEmail ? (
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono flex-1">{payout.paypalEmail}</code>
                      <button onClick={() => copyToClipboard(payout.paypalEmail)}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">⚠️ Creator hasn't set their PayPal email yet</p>
                  )}
                </div>

                {/* PayPal transaction ID input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="PayPal Transaction ID (from your PayPal receipt)"
                    value={paypalIds[payout.id] || ""}
                    onChange={(e) => setPaypalIds((prev) => ({ ...prev, [payout.id]: e.target.value }))}
                    className="rounded-xl h-9 text-sm flex-1"
                  />
                  <Button
                    onClick={() => updateMutation.mutate({
                      id: payout.id,
                      status: "completed",
                      paypalPayoutId: paypalIds[payout.id],
                    })}
                    disabled={updateMutation.isPending || !payout.paypalEmail}
                    className="rounded-xl h-9 text-white border-none text-xs font-bold"
                    style={{ background: "hsl(150 60% 42%)" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Mark Paid
                  </Button>
                  <Button
                    onClick={() => updateMutation.mutate({ id: payout.id, status: "failed" })}
                    disabled={updateMutation.isPending}
                    variant="outline"
                    className="rounded-xl h-9 text-destructive border-destructive/30 text-xs font-bold"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── History ── */}
        {others.length > 0 && (
          <>
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              History
            </h2>
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
              {others.map((payout: any, i: number) => (
                <div key={payout.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i < others.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{payout.creatorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {payout.paypalEmail || payout.creatorEmail}
                      {payout.paypalPayoutId && (
                        <> · TX: <code className="text-[10px]">{payout.paypalPayoutId}</code></>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">${parseFloat(payout.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payout.payoutDate
                        ? new Date(payout.payoutDate).toLocaleDateString()
                        : new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={payout.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}