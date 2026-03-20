import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/payment-success");
  const { toast } = useToast();

  useEffect(() => {
    const completePayment = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const orderId = searchParams.get("token");
        const subscriptionId = searchParams.get("subscription_id");
        const videoId = searchParams.get("videoId");
        const creatorId = searchParams.get("creatorId");

        if (orderId && videoId && creatorId) {
          // This is a PPV payment - need to capture it with PayPal
          // The orderId (token) and videoId/creatorId are provided by PayPal redirect
          // We need to create a temporary paymentId from these for capture
          const paymentId = `${orderId}-${Date.now()}`;
          
          await paymentApi.capturePPVOrder(orderId, paymentId);
          
          toast({
            title: "Payment Successful! 🎉",
            description: "You can now watch this video.",
          });

          // Redirect to video page after 2 seconds
          setTimeout(() => {
            navigate(`/video/${videoId}`);
          }, 2000);
        } else if (subscriptionId && creatorId) {
          // This is a subscription
          await paymentApi.confirmSubscription(subscriptionId, creatorId);
          toast({
            title: "Subscription Active! ✨",
            description: "You're now subscribed to this creator.",
          });

          // Redirect to creator page after 2 seconds
          setTimeout(() => {
            navigate(`/profile/${creatorId}`);
          }, 2000);
        }
      } catch (error) {
        console.error("Error completing payment:", error);
        toast({
          title: "Error",
          description: "Failed to complete payment. Please contact support.",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    };

    completePayment();
  }, [navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Redirecting you now...
          </p>
        </div>

        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>

        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="w-full"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}
