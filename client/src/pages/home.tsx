import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { CategoryTabs } from "@/components/ui/category-tabs";

import { PostCard } from "@/components/ui/post-card";
import { PostModal } from "@/components/ui/post-modal";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { category: activeCategory, sortBy: "new" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      params.append("sortBy", "new");
      
      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800">
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <main className="pb-20 px-4 space-y-4 pt-4">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to spill some tea!</p>
            <Button 
              onClick={() => setIsPostModalOpen(true)}
              className="gradient-primary text-white"
            >
              Create Post
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-30"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <BottomNav />

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </div>
  );
}
