import { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { FeedToggle } from "@/components/ui/feed-toggle";
import { FloatingPostButton } from "@/components/ui/floating-post-button";
import { PostCard } from "@/components/ui/post-card";
import { PostModal } from "@/components/ui/post-modal";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import { 
  NewPostsBanner, 
  StickyRefreshHeader, 
  LoadMoreButton, 
  FeedSkeleton, 
  SmartFeedContainer 
} from "@/components/ui/smart-feed-ui";
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
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [feedType, setFeedType] = useState<"new" | "trending">("new");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [focusPostId, setFocusPostId] = useState<string | null>(null);

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

  // Smart feed hook with batching and auto-refresh
  const smartFeed = useSmartFeed({
    queryKey: ["/api/posts", activeCategory, feedType],
    apiEndpoint: "/api/posts",
    queryParams: {
      ...(activeCategory !== "all" && { category: activeCategory }),
      sortBy: feedType,
    },
    postContext: "home",
    batchSize: 25,
    autoRefreshInterval: 25000, // 25 seconds
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

      {/* New Posts Banner */}
      <NewPostsBanner
        count={newPostsCount}
        onAccept={acceptNewPosts}
        onDismiss={dismissNewPosts}
        show={showNewPostsBanner}
      />

      {/* Sticky Header */}
      <StickyRefreshHeader
        title={feedType === "new" ? "Latest Posts" : "Trending Posts"}
        subtitle={activeCategory !== "all" ? `in ${categories.find(c => c.id === activeCategory)?.label}` : undefined}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      <SmartFeedContainer>
        {isLoading ? (
          <FeedSkeleton count={5} />
        ) : posts.length === 0 ? (
          <div className="relative text-center min-h-[60vh] flex flex-col items-center justify-center">
            {/* Animated Tea Cup Icon */}
            <div className="relative mb-6">
              <div className="text-6xl mb-2 animate-pulse leading-none flex items-center justify-center w-16 h-16 mx-auto">
                <span className="block" style={{ fontSize: '3.5rem', lineHeight: '1', fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"' }}>☕</span>
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {activeCategory === "all" ? "It's quiet in here..." : `Still brewing in ${categories.find(c => c.id === activeCategory)?.label}...`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base">
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
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
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
