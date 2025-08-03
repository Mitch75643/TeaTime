import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostCard } from "@/components/ui/post-card";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { Flame, TrendingUp } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Trending() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["/api/posts", activeCategory, "trending"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      params.append("sortBy", "trending");
      
      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

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
            Posts ranked by reactions, comments, and community engagement
          </p>
        </div>
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <main className="px-4 pt-4 pb-20 space-y-4 max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Spill the Tea ☕
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Share your anonymous stories and connect with the community
          </p>
        </div>
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading trending posts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load trending posts</p>
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No trending posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to create some buzz! Posts with high engagement appear here.
            </p>
          </div>
        )}

        {posts.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}