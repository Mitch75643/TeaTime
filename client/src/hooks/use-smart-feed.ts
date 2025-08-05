import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SmartFeedOptions {
  queryKey: string[];
  apiEndpoint: string;
  category?: string;
  sortBy?: string;
  postContext?: string;
  initialBatchSize?: number;
  pollingInterval?: number;
}

export function useSmartFeed(options: SmartFeedOptions) {
  const {
    queryKey,
    apiEndpoint,
    category,
    sortBy,
    postContext,
    initialBatchSize = 30,
    pollingInterval = 25000,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedPostsCount, setLoadedPostsCount] = useState(initialBatchSize);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Auto-polling for new posts
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (category && category !== "all") {
          params.append("category", category);
        }
        if (sortBy) {
          params.append("sortBy", sortBy);
        }
        if (postContext) {
          params.append("postContext", postContext);
        }
        params.append("since", lastFetchTime.toString());
        
        const response = await fetch(`${apiEndpoint}?${params}`);
        if (response.ok) {
          const newPosts = await response.json();
          if (newPosts.length > 0) {
            setNewPostsCount(newPosts.length);
            setShowNewPostsBanner(true);
          }
        }
      } catch (error) {
        // Silent fail for background polling
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [category, sortBy, postContext, lastFetchTime, apiEndpoint, pollingInterval]);

  // Apply batching logic: show all if < 10 posts, otherwise limit to loadedPostsCount
  const applyBatching = (allPosts: any[]) => {
    if (allPosts.length < 10) {
      return {
        posts: allPosts,
        hasMorePosts: false,
      };
    }
    
    return {
      posts: allPosts.slice(0, loadedPostsCount),
      hasMorePosts: allPosts.length > loadedPostsCount,
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all relevant queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["/api/posts"] }); // Base posts query
      await queryClient.invalidateQueries({ queryKey: ["/api/debates"] }); // Debate voting data
      await queryClient.invalidateQueries({ queryKey: ["/api/polls"] }); // Poll voting data
      await queryClient.invalidateQueries({ queryKey: ["/api/posts/daily-debate"] }); // Daily debate posts
      await queryClient.invalidateQueries({ queryKey: ["/api/comments"] }); // Comment counts
      await queryClient.invalidateQueries({ queryKey: ["/api/reactions"] }); // Reaction counts
      
      // Force refetch the main query
      await queryClient.refetchQueries({ queryKey });
      
      // Reset state
      setLastFetchTime(Date.now());
      setNewPostsCount(0);
      setShowNewPostsBanner(false);
      setLoadedPostsCount(initialBatchSize);
      
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      console.log(`Smart feed refresh completed for queryKey:`, queryKey);
      
      toast({
        title: "Posts refreshed!",
        description: "Latest content and interactions have been loaded.",
      });
    } catch (error) {
      console.error('Smart feed refresh error:', error);
      toast({
        title: "Refresh failed",
        description: "Unable to load latest posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadNewPosts = () => {
    handleRefresh();
  };

  const handleLoadMore = () => {
    setLoadedPostsCount(prev => prev + 20);
  };

  return {
    isRefreshing,
    newPostsCount,
    showNewPostsBanner,
    applyBatching,
    handleRefresh,
    handleLoadNewPosts,
    handleLoadMore,
  };
}