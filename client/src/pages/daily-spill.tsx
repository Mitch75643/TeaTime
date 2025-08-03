import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { PostCard } from "@/components/ui/post-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostModal } from "@/components/ui/post-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Plus, Calendar, Users, MessageCircle } from "lucide-react";
import type { Post } from "@shared/schema";

const DAILY_PROMPTS = [
  "What's the wildest thing you saw this week?",
  "Tell us about a moment that made you question everything",
  "What's the most embarrassing thing that happened to you recently?",
  "Share something that made you laugh until you cried",
  "What's a secret you've been dying to tell someone?",
  "Describe the most awkward encounter you had this month",
  "What's something you did that you're secretly proud of?",
];

function getDailyPrompt() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function getDateString() {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function DailySpill() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const todayPrompt = getDailyPrompt();
  const dateString = getDateString();

  // Get posts with daily spill tag
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { tags: "#dailyspill" }],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const allPosts = await response.json();
      // Filter for posts with #dailyspill tag and from today
      const today = new Date().toDateString();
      return allPosts.filter((post: Post) => 
        post.tags?.includes("#dailyspill") && 
        new Date(post.createdAt!).toDateString() === today
      );
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Daily Prompt Card */}
      <div className="px-4 pt-6 pb-4">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Coffee className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">{dateString}</span>
            </div>
            <CardTitle className="text-xl font-bold">☕ Daily Spill</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-lg font-medium mb-4 leading-relaxed">
              "{todayPrompt}"
            </p>
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Spill Your Tea
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Today's Prompt</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{posts.length}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <MessageCircle className="h-4 w-4" />
              <span>{posts.reduce((sum, post) => sum + (post.commentCount || 0), 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <main className="px-4 pb-20 space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading today's spills...</p>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No spills yet today
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Be the first to respond to today's prompt!
            </p>
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Your Story
            </Button>
          </div>
        )}

        {posts.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>

      <PostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)}
        defaultCategory="daily"
        defaultTags={["#dailyspill"]}
        promptText={todayPrompt}
      />
      
      <BottomNav />
    </div>
  );
}