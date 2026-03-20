import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, TrendingUp, Activity, Clock, CheckCircle2,
  XCircle, AlertCircle, ArrowDownToLine, Mail, Info,
  ChevronDown, ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.json();
}

// ── Status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    pending:    { label: "Pending Review", color: "hsl(43 100% 50%)",   icon: Clock        },
    processing: { label: "Processing",     color: "hsl(195 100% 42%)",  icon: Activity     },
    completed:  { label: "Paid ✓",         color: "hsl(150 60% 42%)",   icon: CheckCircle2 },
    failed:     { label: "Failed",         color: "hsl(0 72% 51%)",     icon: XCircle      },
  };
  const cfg = map[status] ?? { label: status, color: "hsl(220 10% 48%)", icon: Info };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `${cfg.color}20`, color: cfg.color }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────
export function CreatorEarningsDisplay() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const creatorId = user?.creator?.id;

  const [showHistory, setShowHistory] = useState(false);
  const [paypalEmailInput, setPaypalEmailInput] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  // Fetch earnings + payout info
  const { data: payoutInfo, isLoading } = useQuery({
    queryKey: ["my-payouts", creatorId],
    queryFn: () => apiFetch("/payouts/my"),
    enabled: !!creatorId,
    refetchInterval: 30_000,
  });

  // Save PayPal email
  const saveEmailMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch("/auth/creator-settings", {
        method: "PUT",
        body: JSON.stringify({ paypalEmail: email }),
      }),
    onSuccess: () => {
      setEditingEmail(false);
      queryClient.invalidateQueries({ queryKey: ["my-payouts", creatorId] });
      toast({ title: "PayPal email saved ✓" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Request payout
  const requestPayoutMutation = useMutation({
    mutationFn: () =>
      apiFetch("/payouts/request", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-payouts", creatorId] });
      toast({ title: "Payout requested! 🎉", description: data.message });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl skeleton-wave" />
        ))}
      </div>
    );
  }

  if (!payoutInfo) return null;

  const {
    totalEarned,
    totalPaidOut,
    availableBalance,
    pendingPayout,
    paypalEmail,
    payouts = [],
  } = payoutInfo;

  const available = parseFloat(availableBalance || "0");
  const hasPendingRequest = !!pendingPayout;
  const MIN_PAYOUT = 10;
  const canRequest = available >= MIN_PAYOUT && !hasPendingRequest && !!paypalEmail;

  return (
    <div className="space-y-4">

      {/* ── Earnings overview cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total earned */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Total Earned
              </p>
              <p className="text-2xl font-bold font-display" style={{ color: "hsl(150 60% 42%)" }}>
                ${parseFloat(totalEarned || "0").toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(150 60% 42% / 0.12)" }}>
              <TrendingUp className="h-5 w-5" style={{ color: "hsl(150 60% 42%)" }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Your 80% share of all sales</p>
        </div>

        {/* Total paid out */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Paid Out
              </p>
              <p className="text-2xl font-bold font-display" style={{ color: "hsl(195 100% 42%)" }}>
                ${parseFloat(totalPaidOut || "0").toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(195 100% 50% / 0.12)" }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(195 100% 42%)" }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Successfully transferred to you</p>
        </div>

        {/* Available balance */}
        <div className="bg-card border border-card-border rounded-2xl p-5"
          style={{ borderColor: available >= MIN_PAYOUT ? "hsl(var(--primary) / 0.3)" : undefined }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Available
              </p>
              <p className="text-2xl font-bold font-display" style={{ color: "hsl(var(--primary))" }}>
                ${available.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <DollarSign className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {available < MIN_PAYOUT
              ? `Min. payout is $${MIN_PAYOUT} · need $${(MIN_PAYOUT - available).toFixed(2)} more`
              : "Ready to withdraw!"}
          </p>
        </div>
      </div>

      {/* ── PayPal email setup ── */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Your PayPal Payout Email</h3>
          {paypalEmail && !editingEmail && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "hsl(150 60% 42% / 0.12)", color: "hsl(150 60% 42%)" }}>
              ✓ Set
            </span>
          )}
        </div>

        {!paypalEmail || editingEmail ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              We'll send your earnings to this PayPal account. Make sure it matches your PayPal login email.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your-paypal@email.com"
                value={paypalEmailInput || paypalEmail || ""}
                onChange={(e) => setPaypalEmailInput(e.target.value)}
                className="rounded-xl h-10 text-sm flex-1"
              />
              <Button
                onClick={() => saveEmailMutation.mutate(paypalEmailInput)}
                disabled={saveEmailMutation.isPending || !paypalEmailInput.includes("@")}
                className="rounded-xl text-white border-none h-10"
                style={{ background: "hsl(var(--primary))" }}
              >
                Save
              </Button>
              {editingEmail && (
                <Button variant="outline" onClick={() => setEditingEmail(false)} className="rounded-xl h-10">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-xl font-mono">
              {paypalEmail}
            </code>
            <Button variant="outline" size="sm" className="rounded-xl"
              onClick={() => { setPaypalEmailInput(paypalEmail); setEditingEmail(true); }}>
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* ── Payout request ── */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Request Payout</h3>

            {hasPendingRequest ? (
              <div className="flex items-start gap-2 mt-2">
                <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Payout of ${parseFloat(pendingPayout).toFixed(2)} is being reviewed
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll notify you and send payment within 3–5 business days.
                  </p>
                </div>
              </div>
            ) : !paypalEmail ? (
              <p className="text-xs text-muted-foreground mt-1">
                Set your PayPal email above to request a payout.
              </p>
            ) : available < MIN_PAYOUT ? (
              <p className="text-xs text-muted-foreground mt-1">
                Earn at least ${MIN_PAYOUT} to request a withdrawal. You have ${available.toFixed(2)} available.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Withdraw your available balance of{" "}
                <strong className="text-foreground">${available.toFixed(2)}</strong> to{" "}
                <strong className="text-foreground">{paypalEmail}</strong>.
              </p>
            )}
          </div>

          <Button
            onClick={() => requestPayoutMutation.mutate()}
            disabled={!canRequest || requestPayoutMutation.isPending}
            className={`rounded-xl font-bold text-white border-none flex-shrink-0 ${!canRequest ? "opacity-50" : ""}`}
            style={{ background: "hsl(var(--primary))" }}
          >
            <ArrowDownToLine className="h-4 w-4 mr-1.5" />
            {requestPayoutMutation.isPending ? "Requesting…" : "Request Payout"}
          </Button>
        </div>

        {/* How it works note */}
        <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payouts are processed manually via PayPal within 3–5 business days.
            You receive 80% of each sale; the platform retains 20%.
            Minimum payout: ${MIN_PAYOUT}.
          </p>
        </div>
      </div>

      {/* ── Payout history ── */}
      {payouts.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <span className="font-semibold text-sm">Payout History ({payouts.length})</span>
            {showHistory
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div className="divide-y divide-border">
              {(payouts as any[]).map((payout: any) => (
                <div key={payout.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">${parseFloat(payout.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(payout.requestedAt || payout.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                      {payout.payoutDate && (
                        <> · Paid {new Date(payout.payoutDate).toLocaleDateString("en-US", {
                          month: "short", day: "numeric"
                        })}</>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={payout.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}