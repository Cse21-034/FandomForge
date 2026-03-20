import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import HomeUpdated from "@/pages/HomeUpdated";
import BrowsePageUpdated from "@/pages/BrowsePageUpdated";
import CreatorDashboardUpdated from "@/pages/CreatorDashboardUpdated";
import ConsumerDashboard from "@/pages/ConsumerDashboard";
import VideoPage from "@/pages/VideoPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import WatchlistPage from "@/pages/WatchlistPage";
import RewardsPage from "@/pages/RewardsPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import { useReferralTracker } from "@/hooks/useReferralTracker";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import CollectionPage from "@/pages/CollectionPage";

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/auth" component={AuthPage} />

      {/* Public */}
      <Route path="/" component={HomeUpdated} />
      <Route path="/browse" component={BrowsePageUpdated} />
      <Route path="/video/:id" component={VideoPage} />
      <Route path="/collection/:id" component={CollectionPage} />
      <Route path="/rewards" component={RewardsPage} />

      {/* Profile */}
      <Route path="/profile" component={ProfilePage} />

      {/* Protected — components handle their own auth redirects */}
      <Route path="/creator/dashboard" component={CreatorDashboardUpdated} />
      <Route path="/consumer/dashboard" component={ConsumerDashboard} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/watchlist" component={WatchlistPage} />

      {/* Payment */}
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-cancel" component={PaymentCancelPage} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useReferralTracker();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <PWAInstallBanner />
            <Header />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;