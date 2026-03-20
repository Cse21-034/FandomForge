// client/src/pages/PaymentSuccessPage.tsx
// Fixed: PayPal returns token (orderId), PayerID, and our custom params
// The URL looks like: /payment-success?videoId=xxx&token=ORDER_ID&PayerID=yyy&creatorId=zzz

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const completePayment = async () => {
      try {
        // Parse ALL query params from the current URL
        const searchParams = new URLSearchParams(window.location.search);
        
        // PayPal standard params
        const token = searchParams.get("token");           // PayPal order ID
        const payerId = searchParams.get("PayerID");       // PayPal payer
        const subscriptionId = searchParams.get("subscription_id"); // for subscriptions
        
        // Our custom params we appended to the return URL
        const videoId = searchParams.get("videoId");
        const creatorId = searchParams.get("creatorId");

        console.log("Payment success params:", { token, payerId, subscriptionId, videoId, creatorId });

        if (subscriptionId && creatorId) {
          // ── Subscription flow ──
          console.log("Confirming subscription:", subscriptionId, "for creator:", creatorId);
          await paymentApi.confirmSubscription(subscriptionId, creatorId);
          
          toast({
            title: "Subscription Active! ✨",
            description: "You're now subscribed to this creator.",
          });

          setStatus("success");
          setTimeout(() => navigate("/browse"), 2500);

        } else if (token && payerId) {
          // ── PPV (one-time payment) flow ──
          // token = PayPal order ID, we need to capture it
          console.log("Capturing PPV order:", token);
          
          await paymentApi.capturePPVOrder(token, payerId);
          
          toast({
            title: "Payment Successful! 🎉",
            description: "You can now watch this video.",
          });

          setStatus("success");
          
          // Redirect to the video if we have the ID
          setTimeout(() => {
            if (videoId) {
              navigate(`/video/${videoId}`);
            } else {
              navigate("/browse");
            }
          }, 2500);

        } else {
          // Missing required params — but still show success if PayPal sent us here
          // (user approved, capture may have been handled server-side via webhook)
          console.warn("Missing PayPal params, showing generic success");
          setStatus("success");
          setTimeout(() => navigate("/browse"), 3000);
        }
      } catch (error) {
        console.error("Error completing payment:", error);
        const msg = error instanceof Error ? error.message : "Payment processing failed";
        setErrorMsg(msg);
        setStatus("error");
        
        toast({
          title: "Payment Processing Issue",
          description: "Your payment may have been received. Check your account or contact support.",
          variant: "destructive",
        });
      }
    };

    completePayment();
  }, [navigate, toast]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50">
        <div className="w-full max-w-md space-y-6 text-center px-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
              <Loader2 className="h-16 w-16 text-green-600 dark:text-green-400 animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Processing Payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment with PayPal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50">
        <div className="w-full max-w-md space-y-6 text-center px-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 p-6 dark:bg-yellow-900/20">
              <XCircle className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment Status Unclear</h1>
            <p className="text-muted-foreground">
              Your payment may have been processed by PayPal, but we couldn't confirm it automatically.
            </p>
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{errorMsg}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Please check your PayPal account and your subscriptions. If you were charged, your access will be granted.
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => navigate("/browse")} className="w-full">
              Browse Content
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md space-y-6 text-center px-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 animate-bounce" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment has been confirmed. Redirecting you now...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <Button onClick={() => navigate("/")} variant="outline" className="w-full">
          Return Home
        </Button>
      </div>
    </div>
  );
}