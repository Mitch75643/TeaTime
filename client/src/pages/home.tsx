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
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Filter out seen posts when in "new" mode
  const posts = feedType === "new" 
    ? allPosts.filter(post => !seenPostIds.has(post.id))
    : allPosts;

  // Track seen posts
  useEffect(() => {
    if (allPosts.length > 0) {
      const newSeenIds = new Set(seenPostIds);
      allPosts.forEach(post => newSeenIds.add(post.id));
      setSeenPostIds(newSeenIds);
    }
  }, [allPosts]);

  const handleRefresh = async () => {
    if (feedType !== "new") return;
    
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    setIsRefreshing(false);
  };

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

      <main className="pb-24 px-4 md:px-6 lg:px-8 pt-6 max-w-screen-sm lg:max-w-2xl mx-auto">
        <div className="space-y-6">



        {feedType === "new" && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Community Posts
              {posts.length !== allPosts.length && (
                <span className="ml-2 text-sm text-gray-500">
                  ({posts.length} new)
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 dark:text-purple-400"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        )}
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤷‍♀️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {activeCategory === "all" ? "No posts yet" : `No posts in ${categories.find(c => c.id === activeCategory)?.label} yet`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeCategory === "all" ? "Be the first to spill some tea!" : "Be the first to spill the tea in this category!"}
            </p>
            <Button 
              onClick={() => setIsPostModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
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
