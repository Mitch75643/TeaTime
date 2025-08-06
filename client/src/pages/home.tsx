import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { FeedToggle } from "@/components/ui/feed-toggle";
import { FloatingPostButton } from "@/components/ui/floating-post-button";
import { PostCard } from "@/components/ui/post-card";
import { PostModal } from "@/components/ui/post-modal";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { SmartFeedBanner } from "@/components/ui/smart-feed-banner";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import type { Post } from "@shared/schema";

const categories = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "school", label: "School", emoji: "🏫" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "relationships", label: "Relationships", emoji: "💕" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "money", label: "Money", emoji: "💸" },
  { id: "hot-takes", label: "Hot Takes", emoji: "🌍" },
  { id: "drama", label: "Am I in the Wrong?", emoji: "🎭" },
  { id: "other", label: "Other", emoji: "📝" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [feedType, setFeedType] = useState<"new" | "trending">("new");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [focusPostId, setFocusPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check for focus parameter in URL (from notifications)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const focusParam = urlParams.get('focus');
    if (focusParam) {
      setFocusPostId(focusParam);
      // Remove the parameter from URL without page reload
      window.history.replaceState({}, '', window.location.pathname);
      
      // Scroll to post after a brief delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(`post-${focusParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          element.style.background = 'linear-gradient(135deg, rgba(255, 122, 0, 0.1) 0%, rgba(255, 216, 178, 0.1) 100%)';
          setTimeout(() => {
            element.style.background = '';
          }, 2000);
        }
      }, 100);
    }
  }, []);

  // Initialize smart feed
  const smartFeed = useSmartFeed({
    queryKey: ["/api/posts", activeCategory, feedType],
    apiEndpoint: "/api/posts",
    category: activeCategory,
    sortBy: feedType,
    postContext: "home",
  });

  const { data: allPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { category: activeCategory, sortBy: feedType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      params.append("sortBy", feedType);
      
      params.append("postContext", "home");
      
      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Apply smart capped feed logic (only for "new" feed type, not trending)
  const feedResult = feedType === "new" 
    ? smartFeed.applyCappedFeedLogic(allPosts)
    : smartFeed.applyBatching(allPosts);
  
  const { posts, hasMorePosts, needsRefresh } = feedResult;

  // Update visible posts tracking whenever posts change
  useEffect(() => {
    if (posts && posts.length > 0) {
      smartFeed.updateVisiblePosts(posts);
    }
  }, [posts, smartFeed.updateVisiblePosts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
      <Header />
      
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800">
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <FeedToggle
          feedType={feedType}
          onFeedTypeChange={setFeedType}
        />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-24 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="px-4 md:px-6 lg:px-8 py-3 max-w-screen-sm lg:max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {feedType === "new" ? "Latest Posts" : "Trending Posts"}
              {activeCategory !== "all" && (
                <span className="ml-2 text-sm text-gray-500">
                  in {categories.find(c => c.id === activeCategory)?.label}
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={smartFeed.handleRefresh}
              disabled={smartFeed.isRefreshing}
              className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${smartFeed.isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* New Posts Banner */}
      {smartFeed.showNewPostsBanner && (
        <SmartFeedBanner
          newPostsCount={smartFeed.newPostsCount}
          onLoadNewPosts={smartFeed.handleLoadNewPosts}
        />
      )}

      <main className="pb-24 px-4 md:px-6 lg:px-8 pt-6 max-w-screen-sm lg:max-w-2xl mx-auto">
        <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="relative text-center min-h-[40vh] sm:min-h-[50vh] flex flex-col items-center justify-center py-8">
            {/* Animated Tea Cup Icon */}
            <div className="relative mb-4 sm:mb-6">
              <div className="text-5xl sm:text-6xl mb-2 animate-pulse leading-none flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                <span className="block" style={{ fontSize: '2.5rem', lineHeight: '1', fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"' }}>☕</span>
              </div>
              {/* Steam Animation */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="flex space-x-1">
                  <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '2s' }}></div>
                  <div className="w-0.5 h-3 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '2s' }}></div>
                  <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '2s' }}></div>
                </div>
              </div>
            </div>
            
            {/* Fun Headlines */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 px-4">
              {activeCategory === "all" ? "It's quiet in here..." : `Still brewing in ${categories.find(c => c.id === activeCategory)?.label}...`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4">
              {activeCategory === "all" ? "No one's spilled yet... will you be the first?" : "Be bold—spill the first sip in this category!"}
            </p>


            
            {/* Subtle Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-orange-200 dark:bg-orange-800 rounded-full opacity-20 animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
              <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-orange-300 dark:bg-orange-700 rounded-full opacity-30 animate-ping" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
              <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-orange-200 dark:bg-orange-800 rounded-full opacity-25 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            
            {/* Refresh to Load More Button for Capped Feed */}
            {needsRefresh && hasMorePosts && feedType === "new" && (
              <div className="text-center py-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Showing {posts.length} posts optimized for visibility
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.floor(posts.length * 0.2)} zero-engagement • {Math.floor(posts.length * 0.1)} low-engagement • {posts.length - Math.floor(posts.length * 0.2) - Math.floor(posts.length * 0.1)} regular posts
                  </p>
                </div>
                <Button
                  onClick={smartFeed.handleRefresh}
                  disabled={smartFeed.isRefreshing}
                  variant="outline"
                  className="px-6 py-2 text-sm border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
                >
                  🔁 Refresh to load more posts
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {allPosts.length - posts.length} more posts available
                </p>
              </div>
            )}
            
            {/* Traditional Load More Button for Trending */}
            {!needsRefresh && hasMorePosts && (
              <LoadMoreButton
                onLoadMore={smartFeed.handleLoadMore}
                remainingCount={allPosts.length - posts.length}
              />
            )}
          </div>
        )}
        </div>
      </main>

      <FloatingPostButton />
      <BottomNav />

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        postContext={{ page: 'home' }}
      />
    </div>
  );
}
