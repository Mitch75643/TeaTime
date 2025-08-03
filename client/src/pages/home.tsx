import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "../components/ui/header";
import { CategoryTabs } from "../components/ui/category-tabs";
import { FeedToggle } from "../components/ui/feed-toggle";
import { PostCard } from "../components/ui/post-card";
import { PostModal } from "../components/ui/post-modal";
import { BottomNav } from "../components/ui/bottom-nav";
import { Button } from "../components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [feedType, setFeedType] = useState<"trending" | "new">("new");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { category: activeCategory, sortBy: feedType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      params.append("sortBy", feedType);
      
      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="sticky top-20 z-40">
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <FeedToggle
          feedType={feedType}
          onFeedTypeChange={setFeedType}
        />
      </div>

      <main className="pb-24 px-6 space-y-6 pt-6">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/60 rounded-3xl shadow-lg border-2 border-pink-100/50 p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-200/50 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-pink-200/50 rounded-full w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-pink-200/50 rounded-full"></div>
                      <div className="h-4 bg-pink-200/50 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">☕</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No tea to spill yet!</h3>
            <p className="text-gray-600 mb-8 font-medium">Be the first to share your story anonymously</p>
            <Button 
              onClick={() => setIsPostModalOpen(true)}
              className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 button-hover-lift"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Spill Some Tea
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <div
                key={post.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-slide-up"
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav onCreatePost={() => setIsPostModalOpen(true)} />

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </div>
  );
}
