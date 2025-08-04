import { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";
import { PostCard } from "@/components/ui/post-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import { 
  NewPostsBanner, 
  StickyRefreshHeader, 
  LoadMoreButton, 
  FeedSkeleton, 
  SmartFeedContainer 
} from "@/components/ui/smart-feed-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Clock, Calendar } from "lucide-react";
import type { Post } from "@shared/schema";

function getCurrentTrendingCycle(): number {
  const now = new Date();
  const startOfEpoch = new Date('2025-01-01T00:00:00Z');
  const diffInDays = Math.floor((now.getTime() - startOfEpoch.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffInDays / 3); // Every 3 days
}

function getNextResetTime(): string {
  const now = new Date();
  const startOfEpoch = new Date('2025-01-01T00:00:00Z');
  const diffInDays = Math.floor((now.getTime() - startOfEpoch.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleDays = diffInDays % 3;
  const daysUntilReset = 3 - currentCycleDays;
  
  const resetDate = new Date(now);
  resetDate.setDate(now.getDate() + daysUntilReset);
  resetDate.setHours(0, 0, 0, 0);
  
  return resetDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric'
  });
}

export default function Trending() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [trendingCycle, setTrendingCycle] = useState(getCurrentTrendingCycle());
  const [nextReset, setNextReset] = useState(getNextResetTime());

  // Update trending cycle info every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingCycle(getCurrentTrendingCycle());
      setNextReset(getNextResetTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Smart feed hook with batching and auto-refresh
  const smartFeed = useSmartFeed({
    queryKey: ["/api/posts", activeCategory, "trending"],
    apiEndpoint: "/api/posts",
    queryParams: {
      ...(activeCategory !== "all" && { category: activeCategory }),
      sortBy: "trending",
    },
    postContext: "trending",
    batchSize: 25,
    autoRefreshInterval: 30000, // 30 seconds for trending
  });

  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    newPostsCount,
    showNewPostsBanner,
    loadMore,
    refresh,
    acceptNewPosts,
    dismissNewPosts,
  } = smartFeed;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Trending Now</h2>
            <Flame className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Posts ranked by recent reactions, comments, and engagement
          </p>
        </div>
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Trending Cycle Info */}
      <div className="px-4 pt-4">
        <Card className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Trending Cycle #{trendingCycle}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  Resets {nextReset}
                </span>
              </div>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Trending resets every 3 days with fresh posts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Posts Banner */}
      <NewPostsBanner
        count={newPostsCount}
        onAccept={acceptNewPosts}
        onDismiss={dismissNewPosts}
        show={showNewPostsBanner}
      />

      {/* Sticky Header */}
      <StickyRefreshHeader
        title="Trending Posts"
        subtitle={`Cycle #${trendingCycle} • ${posts.length} posts`}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        className="top-32"
      />

      <SmartFeedContainer>
        {isLoading ? (
          <FeedSkeleton count={5} />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No trending posts this cycle
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Be the first to create buzz in Cycle #{trendingCycle}!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post: Post, index: number) => (
                <div key={post.id} className="relative">
                  {index === 0 && (
                    <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                      🔥 #1 Trending
                    </Badge>
                  )}
                  {index === 1 && (
                    <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                      ⭐ #2 Trending
                    </Badge>
                  )}
                  {index === 2 && (
                    <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
                      🥉 #3 Trending
                    </Badge>
                  )}
                  <PostCard post={post} />
                </div>
              ))}
            </div>
            <LoadMoreButton
              onLoadMore={loadMore}
              isLoading={isLoadingMore}
              hasMore={hasMore}
            />
          </>
        )}
      </SmartFeedContainer>

      <BottomNav />
    </div>
  );
}