import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BrowsePage from "@/pages/BrowsePage";
import CreatorDashboard from "@/pages/CreatorDashboard";
import ConsumerDashboard from "@/pages/ConsumerDashboard";
import VideoPage from "@/pages/VideoPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={BrowsePage} />
      <Route path="/creator/dashboard" component={CreatorDashboard} />
      <Route path="/consumer/dashboard" component={ConsumerDashboard} />
      <Route path="/video/:id" component={VideoPage} />
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
