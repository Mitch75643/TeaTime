import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostCard } from "@/components/ui/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, ThumbsUp, Trophy, TrendingUp, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@shared/schema";

interface UserPostStats {
  postId: string;
  viewCount: number;
  commentCount: number;
  reactions: Record<string, number>;
  lastViewedAt?: Date;
  postContent: string;
  category: string;
  createdAt: Date;
}

const categoryEmojis: Record<string, string> = {
  school: "🏫",
  work: "💼",
  relationships: "💕",
  family: "👨‍👩‍👧",
  money: "💸",
  "hot-takes": "🌍",
  drama: "🎭",
  daily: "☕",
};

const categoryColors: Record<string, string> = {
  school: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  work: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  relationships: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  family: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  money: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "hot-takes": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  drama: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  daily: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function UserPosts() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "engagement">("recent");

  // Fetch user's posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { userOnly: true }],
    queryFn: async () => {
      const response = await fetch("/api/posts?userOnly=true");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Fetch user's post stats
  const { data: postStats = [], isLoading: statsLoading } = useQuery<UserPostStats[]>({
    queryKey: ["/api/user/post-stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/post-stats");
      if (!response.ok) throw new Error("Failed to fetch post stats");
      return response.json();
    },
  });

  // Calculate overall stats
  const totalViews = postStats.reduce((sum, stat) => sum + stat.viewCount, 0);
  const totalComments = postStats.reduce((sum, stat) => sum + stat.commentCount, 0);
  const totalReactions = postStats.reduce((sum, stat) => {
    return sum + Object.values(stat.reactions).reduce((reactionSum, count) => reactionSum + count, 0);
  }, 0);

  // Filter and sort stats
  const filteredStats = postStats
    .filter(stat => selectedCategory === "all" || stat.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.viewCount - a.viewCount;
        case "engagement":
          const aEngagement = a.commentCount + Object.values(a.reactions).reduce((sum, count) => sum + count, 0);
          const bEngagement = b.commentCount + Object.values(b.reactions).reduce((sum, count) => sum + count, 0);
          return bEngagement - aEngagement;
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  // Get unique categories from user's posts
  const userCategories = [...new Set(postStats.map(stat => stat.category))];

  const isLoading = postsLoading || statsLoading;

  const getMilestoneBadge = (viewCount: number) => {
    if (viewCount >= 100) return { text: "Trending!", icon: TrendingUp, color: "bg-orange-100 text-orange-700" };
    if (viewCount >= 50) return { text: "Popular", icon: Trophy, color: "bg-yellow-100 text-yellow-700" };
    if (viewCount >= 25) return { text: "Rising", icon: Eye, color: "bg-blue-100 text-blue-700" };
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="px-4 pt-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Your Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Track how your anonymous posts are performing in the community
          </p>
        </div>

        {/* Overall Stats Cards */}
        {!isLoading && postStats.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{totalViews}</div>
                <div className="text-xs text-gray-500 mt-1">Total Views</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{totalComments}</div>
                <div className="text-xs text-gray-500 mt-1">Total Replies</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{totalReactions}</div>
                <div className="text-xs text-gray-500 mt-1">Total Reactions</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col space-y-3 mb-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs"
            >
              All Categories
            </Button>
            {userCategories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {categoryEmojis[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex space-x-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className="text-xs flex items-center space-x-1"
            >
              <Calendar className="h-3 w-3" />
              <span>Recent</span>
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("popular")}
              className="text-xs flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>Most Viewed</span>
            </Button>
            <Button
              variant={sortBy === "engagement" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("engagement")}
              className="text-xs flex items-center space-x-1"
            >
              <ThumbsUp className="h-3 w-3" />
              <span>Most Engaging</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading your posts...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && postStats.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start sharing your stories to see how they perform!
            </p>
          </div>
        )}

        {/* Post Stats List */}
        <div className="space-y-4">
          {filteredStats.map((stat) => {
            const totalStatReactions = Object.values(stat.reactions).reduce((sum, count) => sum + count, 0);
            const milestone = getMilestoneBadge(stat.viewCount);
            
            return (
              <Card key={stat.postId} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Post Content Preview */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={cn("text-xs", categoryColors[stat.category])}>
                        {categoryEmojis[stat.category]} {stat.category.charAt(0).toUpperCase() + stat.category.slice(1)}
                      </Badge>
                      {milestone && (
                        <Badge className={cn("text-xs", milestone.color)}>
                          <milestone.icon className="h-3 w-3 mr-1" />
                          {milestone.text}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                      {stat.postContent}
                    </p>
                    <div className="text-xs text-gray-500">
                      Posted {formatDistanceToNow(stat.createdAt)} ago
                      {stat.lastViewedAt && (
                        <> • Last viewed {formatDistanceToNow(new Date(stat.lastViewedAt))} ago</>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <Eye className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-orange-600">{stat.viewCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">views</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-blue-600">{stat.commentCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">replies</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-600">{totalStatReactions}</span>
                      </div>
                      <div className="text-xs text-gray-500">reactions</div>
                    </div>
                  </div>

                  {/* Engagement Rate */}
                  {stat.viewCount > 0 && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-500">
                        Engagement Rate: <span className="font-medium">
                          {Math.round(((stat.commentCount + totalStatReactions) / stat.viewCount) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtered Empty State */}
        {!isLoading && postStats.length > 0 && filteredStats.length === 0 && (
          <div className="text-center py-8">
            <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No posts found with the selected filters</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}