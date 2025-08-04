import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AnonymousAuthProvider } from "@/lib/anonymousAuth";
import { DeviceBanGuard } from "@/components/ui/device-ban-guard";
import Home from "@/pages/home";
import Trending from "@/pages/trending";
import Community from "@/pages/community";
import TopicFeed from "@/pages/topic-feed";
import DailySpill from "@/pages/daily-spill";
import Profile from "@/pages/profile";
import UserPosts from "@/pages/user-posts";
import NotFound from "@/pages/not-found";
import { AuthPage } from "@/pages/AuthPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trending" component={Trending} />
      <Route path="/community" component={Community} />
      <Route path="/topic/:topicId" component={TopicFeed} />
      <Route path="/daily-spill" component={DailySpill} />
      <Route path="/profile" component={Profile} />
      <Route path="/user-posts" component={UserPosts} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AnonymousAuthProvider>
            <DeviceBanGuard allowPartialAccess={false}>
              <div className="app-container bg-background text-foreground">
                <Toaster />
                <Router />
              </div>
            </DeviceBanGuard>
          </AnonymousAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
