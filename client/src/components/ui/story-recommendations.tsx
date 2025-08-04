import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Heart, 
  Laugh, 
  Skull, 
  Brain,
  Shuffle,
  Eye,
  MessageCircle,
  ThumbsUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Post, StoryRecommendation, StoryPreferences } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StoryRecommendationWithPost extends StoryRecommendation {
  post: Post;
}

interface StoryRecommendationsProps {
  className?: string;
  limit?: number;
  showPreferences?: boolean;
}

const storyTypeIcons = {
  horror: Skull,
  funny: Laugh,
  weird: Brain,
  romantic: Heart,
  embarrassing: Users,
};

const storyTypeColors = {
  horror: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  funny: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  weird: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  romantic: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  embarrassing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const recommendationTypeLabels = {
  similar_stories: "Similar Stories",
  trending: "Trending",
  personalized: "For You",
  new_user: "Popular",
};

const recommendationTypeIcons = {
  similar_stories: BookOpen,
  trending: TrendingUp,
  personalized: Sparkles,
  new_user: Users,
};

export function StoryRecommendations({ className, limit = 5, showPreferences = false }: StoryRecommendationsProps) {
  const queryClient = useQueryClient();
  
  // Fetch recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<StoryRecommendationWithPost[]>({
    queryKey: ['/api/stories/recommendations', limit],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user preferences
  const { data: preferences } = useQuery<StoryPreferences>({
    queryKey: ['/api/stories/preferences'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Track interaction mutation
  const trackInteractionMutation = useMutation({
    mutationFn: async (data: { postId: string; interactionType: string; storyType?: string; category: string; tags: string[]; timeSpent?: number }) => {
      return apiRequest(`/api/stories/track-interaction`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      // Invalidate recommendations to get fresh ones
      queryClient.invalidateQueries({
        queryKey: ['/api/stories/recommendations']
      });
    },
  });

  // Mark as viewed mutation  
  const markViewedMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest(`/api/stories/recommendations/${postId}/viewed`, { method: 'POST' });
    },
  });

  // Mark as interacted mutation
  const markInteractedMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest(`/api/stories/recommendations/${postId}/interacted`, { method: 'POST' });
    },
  });

  const handlePostView = (recommendation: StoryRecommendationWithPost) => {
    if (!recommendation.wasViewed) {
      markViewedMutation.mutate(recommendation.recommendedPostId);
    }
    
    trackInteractionMutation.mutate({
      postId: recommendation.recommendedPostId,
      interactionType: 'view',
      storyType: recommendation.post.storyType || undefined,
      category: recommendation.post.category,
      tags: recommendation.post.tags || [],
      timeSpent: 0,
    });
  };

  const handlePostInteraction = (recommendation: StoryRecommendationWithPost, interactionType: 'reaction' | 'comment' | 'share') => {
    if (!recommendation.wasInteracted) {
      markInteractedMutation.mutate(recommendation.recommendedPostId);
    }
    
    trackInteractionMutation.mutate({
      postId: recommendation.recommendedPostId,
      interactionType,
      storyType: recommendation.post.storyType || undefined,
      category: recommendation.post.category,
      tags: recommendation.post.tags || [],
    });
  };

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

  if (recommendationsLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations yet.</p>
            <p className="text-sm">Start reading stories to get personalized recommendations!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recommended Stories
          {preferences && (
            <Badge variant="secondary" className="ml-auto">
              {preferences.favoriteStoryTypes?.length || 0} preferences
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {recommendations.map((recommendation: StoryRecommendationWithPost) => {
              const RecommendationIcon = recommendationTypeIcons[recommendation.recommendationType as keyof typeof recommendationTypeIcons];
              const StoryIcon = recommendation.post.storyType ? storyTypeIcons[recommendation.post.storyType as keyof typeof storyTypeIcons] : BookOpen;
              
              return (
                <Card 
                  key={recommendation.id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-orange-200 dark:border-orange-800"
                  onClick={() => handlePostView(recommendation)}
                >
                  <div className="space-y-3">
                    {/* Header with recommendation type and confidence */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RecommendationIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          {recommendationTypeLabels[recommendation.recommendationType as keyof typeof recommendationTypeLabels]}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.confidence}% match
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(recommendation.post.createdAt || new Date())}
                      </span>
                    </div>

                    {/* Story content preview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StoryIcon className="h-4 w-4" />
                        {recommendation.post.storyType && (
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", storyTypeColors[recommendation.post.storyType as keyof typeof storyTypeColors])}
                          >
                            {recommendation.post.storyType}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm line-clamp-3 text-gray-700 dark:text-gray-300">
                        {recommendation.post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {recommendation.post.tags && recommendation.post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recommendation.post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {recommendation.post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{recommendation.post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Engagement stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {recommendation.post.viewCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {getEngagementScore(recommendation.post)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {recommendation.post.commentCount || 0}
                      </div>
                    </div>

                    {/* Recommendation reasons */}
                    {recommendation.reasons && recommendation.reasons.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-muted-foreground">
                          💡 {recommendation.reasons.slice(0, 2).join(" • ")}
                        </p>
                      </div>
                    )}

                    {/* Quick action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostInteraction(recommendation, 'reaction');
                        }}
                      >
                        👍 React
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostInteraction(recommendation, 'comment');
                        }}
                      >
                        💬 Comment
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Preferences section */}
        {showPreferences && preferences && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Story Preferences
            </h4>
            <div className="space-y-2">
              {preferences.favoriteStoryTypes && preferences.favoriteStoryTypes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Favorite Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {preferences.favoriteStoryTypes.map((type: string) => (
                      <Badge 
                        key={type} 
                        variant="secondary" 
                        className={cn("text-xs", storyTypeColors[type as keyof typeof storyTypeColors])}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {preferences.engagementStyle && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reading Style:</p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {preferences.engagementStyle.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StoryRecommendations;