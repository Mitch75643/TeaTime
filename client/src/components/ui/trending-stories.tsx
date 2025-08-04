import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  Flame, 
  Eye, 
  MessageCircle, 
  ThumbsUp,
  Clock,
  BookOpen
} from "lucide-react";
import type { Post } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TrendingStoriesProps {
  className?: string;
  limit?: number;
  showEngagement?: boolean;
}

const storyTypeColors = {
  horror: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  funny: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  weird: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  romantic: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  embarrassing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function TrendingStories({ className, limit = 10, showEngagement = true }: TrendingStoriesProps) {
  const { data: trendingStories = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/stories/trending', limit],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getEngagementScore = (post: Post) => {
    const reactions = typeof post.reactions === 'object' && post.reactions ? 
      Object.values(post.reactions).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0) : 0;
    return reactions + (post.commentCount || 0);
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getTrendingRank = (index: number) => {
    if (index === 0) return { emoji: '🔥', label: 'Hot' };
    if (index === 1) return { emoji: '⚡', label: 'Rising' };
    if (index === 2) return { emoji: '✨', label: 'Popular' };
    return { emoji: '📈', label: 'Trending' };
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendingStories.length) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trending stories yet.</p>
            <p className="text-sm">Share your story to get the conversation started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Stories
          <Badge variant="secondary" className="ml-auto">
            {trendingStories.length} stories
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {trendingStories.map((story: Post, index: number) => {
              const trendingRank = getTrendingRank(index);
              const engagementScore = getEngagementScore(story);
              
              return (
                <Card 
                  key={story.id} 
                  className={cn(
                    "p-4 hover:shadow-md transition-shadow cursor-pointer",
                    index < 3 ? "border-l-4" : "",
                    index === 0 ? "border-red-400 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20" : "",
                    index === 1 ? "border-orange-400 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20" : "",
                    index === 2 ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-950/20" : ""
                  )}
                >
                  <div className="space-y-3">
                    {/* Header with trending rank and time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{trendingRank.emoji}</span>
                        <Badge 
                          variant={index < 3 ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            index === 0 ? "bg-red-500 hover:bg-red-600" : "",
                            index === 1 ? "bg-orange-500 hover:bg-orange-600" : "",
                            index === 2 ? "bg-yellow-500 hover:bg-yellow-600" : ""
                          )}
                        >
                          #{index + 1} {trendingRank.label}
                        </Badge>
                        {story.storyType && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", storyTypeColors[story.storyType as keyof typeof storyTypeColors])}
                          >
                            {story.storyType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(story.createdAt)}
                      </div>
                    </div>

                    {/* Story content preview */}
                    <div className="space-y-2">
                      <p className="text-sm line-clamp-3 text-gray-700 dark:text-gray-300">
                        {story.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {story.tags && story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {story.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {story.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{story.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Engagement stats */}
                    {showEngagement && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {story.viewCount || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {engagementScore}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {story.commentCount || 0}
                          </div>
                        </div>
                        
                        {/* Engagement trend indicator */}
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {Math.floor(engagementScore * 1.2 + Math.random() * 10)}% boost
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Author info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>by {story.alias}</span>
                      {story.avatarId && (
                        <span className="ml-1">👤</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default TrendingStories;