import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentApi } from "@/lib/api";

// Helper to safely parse amount (handles Decimal objects, strings, null/undefined)
const parseAmount = (amount: any): string => {
  if (!amount) return "0.00";
  const num = parseFloat(String(amount));
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

interface PayPalCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  creatorId: string;
  amount: string;
  videoTitle: string;
}

export function PPVCheckout({
  open,
  onOpenChange,
  videoId,
  creatorId,
  amount,
  videoTitle,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      // Create PayPal order
      const response = await paymentApi.createPPVOrder(videoId, creatorId, amount);

      if (!response.approvalUrl) {
        throw new Error("Failed to get PayPal approval URL");
      }

      // Redirect to PayPal
      window.location.href = response.approvalUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Video</p>
            <p className="font-semibold">{videoTitle}</p>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <span className="font-medium">Total Price</span>
            <span className="text-xl font-bold text-primary">${parseAmount(amount)}</span>
          </div>

          {/* Why PayPal? */}
          <div className="rounded-lg border border-blue-200/30 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💳 Pay securely with PayPal or your credit/debit card. No PayPal account required.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with PayPal
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-muted-foreground">
            You'll be redirected to PayPal to complete your purchase securely.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================

interface SubscriptionCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
  amount: string;
}

export function SubscriptionCheckout({
  open,
  onOpenChange,
  creatorId,
  creatorName,
  amount,
}: SubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError("");

      // Create PayPal subscription
      const response = await paymentApi.createSubscription(creatorId);

      if (!response.approvalUrl) {
        throw new Error("Failed to get PayPal approval URL");
      }

      // Redirect to PayPal
      window.location.href = response.approvalUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Subscription failed";
      setError(errorMessage);
      toast({
        title: "Subscription Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {creatorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Monthly Subscription</p>
            <p className="font-semibold">{creatorName}</p>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <span className="font-medium">Monthly Price</span>
              <p className="text-xs text-muted-foreground">Renews monthly</p>
            </div>
            <span className="text-xl font-bold text-primary">${parseAmount(amount)}</span>
          </div>

          {/* Benefits */}
          <div className="rounded-lg border border-green-200/30 bg-green-50/50 p-3 dark:border-green-900/30 dark:bg-green-950/20">
            <ul className="space-y-1 text-xs text-green-700 dark:text-green-300">
              <li>✓ Unlock exclusive content</li>
              <li>✓ Support your favorite creator</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe with PayPal
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-muted-foreground">
            You'll be redirected to PayPal to complete your subscription securely.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
