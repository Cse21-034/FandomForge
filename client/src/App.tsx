import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import HomeUpdated from "@/pages/HomeUpdated";
import BrowsePageUpdated from "@/pages/BrowsePageUpdated";
import CreatorDashboardUpdated from "@/pages/CreatorDashboardUpdated";
import ConsumerDashboard from "@/pages/ConsumerDashboard";
import VideoPage from "@/pages/VideoPage";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Public Routes */}
      <Route path="/" component={HomeUpdated} />
      <Route path="/browse" component={BrowsePageUpdated} />
      <Route path="/video/:id" component={VideoPage} />

      {/* Protected Routes - Always render, let component handle auth checks */}
      <Route path="/creator/dashboard" component={CreatorDashboardUpdated} />
      <Route path="/consumer/dashboard" component={ConsumerDashboard} />

      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
