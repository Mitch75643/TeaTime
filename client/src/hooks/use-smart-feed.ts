import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAnonymousAuth } from '@/lib/anonymousAuth';

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
  const { user } = useAnonymousAuth();

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
          const allNewPosts = await response.json();
          
          // Get current Express session ID for comparison
          const sessionResponse = await fetch('/api/session');
          const sessionData = await sessionResponse.json();
          const currentSessionId = sessionData.sessionId;
          
          // Filter out posts from the current user's session
          const otherUsersNewPosts = allNewPosts.filter((post: any) => 
            post.sessionId !== currentSessionId
          );
          
          console.log(`[Smart Feed] Found ${allNewPosts.length} new posts, ${otherUsersNewPosts.length} from other users`);
          console.log(`[Smart Feed] Current sessionId: ${currentSessionId}`);
          if (allNewPosts.length > 0) {
            console.log(`[Smart Feed] Sample post sessionId: ${allNewPosts[0].sessionId}`);
          }
          
          if (otherUsersNewPosts.length > 0) {
            setNewPostsCount(otherUsersNewPosts.length);
            setShowNewPostsBanner(true);
          }
        }
      } catch (error) {
        // Silent fail for background polling
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [category, sortBy, postContext, lastFetchTime, apiEndpoint, pollingInterval, user?.sessionId]);

  // Smart capped feed logic with engagement prioritization
  const applyCappedFeedLogic = (allPosts: any[]) => {
    // If fewer than 20 posts, show them all normally
    if (allPosts.length < 20) {
      return {
        posts: allPosts,
        hasMorePosts: false,
        needsRefresh: false,
      };
    }

    // Only apply engagement prioritization if user manually refreshed or initial load
    const shouldPrioritizeEngagement = true;
    
    if (shouldPrioritizeEngagement && allPosts.length >= 20) {
      // Smart sampling logic to prioritize under-engaged posts
      const cappedPosts = applySamplingLogic(allPosts);
      
      return {
        posts: cappedPosts,
        hasMorePosts: allPosts.length > 20,
        needsRefresh: true,
      };
    }

    // Fallback to showing first 20 posts
    return {
      posts: allPosts.slice(0, 20),
      hasMorePosts: allPosts.length > 20,
      needsRefresh: true,
    };
  };

  // Sampling logic for engagement prioritization
  const applySamplingLogic = (posts: any[]) => {
    const maxPosts = 20;
    
    // Categorize posts by engagement level
    const zeroEngagement = posts.filter(post => 
      (post.reactionCount || 0) === 0 && (post.commentCount || 0) === 0
    );
    const lowEngagement = posts.filter(post => {
      const reactions = post.reactionCount || 0;
      const comments = post.commentCount || 0;
      return (reactions + comments) > 0 && (reactions + comments) < 2;
    });
    const normalEngagement = posts.filter(post => {
      const reactions = post.reactionCount || 0;
      const comments = post.commentCount || 0;
      return (reactions + comments) >= 2;
    });

    // Calculate target counts based on percentages
    const zeroTarget = Math.floor(maxPosts * 0.2); // 20%
    const lowTarget = Math.floor(maxPosts * 0.1);  // 10%
    const normalTarget = maxPosts - zeroTarget - lowTarget; // 70%

    // Sample posts from each category
    const selectedPosts = [];
    
    // Add zero engagement posts (up to target)
    const shuffledZero = [...zeroEngagement].sort(() => Math.random() - 0.5);
    selectedPosts.push(...shuffledZero.slice(0, Math.min(zeroTarget, shuffledZero.length)));
    
    // Add low engagement posts (up to target)
    const shuffledLow = [...lowEngagement].sort(() => Math.random() - 0.5);
    selectedPosts.push(...shuffledLow.slice(0, Math.min(lowTarget, shuffledLow.length)));
    
    // Fill remaining slots with normal engagement posts
    const remainingSlots = maxPosts - selectedPosts.length;
    const shuffledNormal = [...normalEngagement].sort(() => Math.random() - 0.5);
    selectedPosts.push(...shuffledNormal.slice(0, Math.min(remainingSlots, shuffledNormal.length)));
    
    // If we still don't have enough posts, fill with any remaining posts
    if (selectedPosts.length < maxPosts) {
      const usedIds = new Set(selectedPosts.map(p => p.id));
      const remainingPosts = posts.filter(p => !usedIds.has(p.id));
      const shuffledRemaining = [...remainingPosts].sort(() => Math.random() - 0.5);
      selectedPosts.push(...shuffledRemaining.slice(0, maxPosts - selectedPosts.length));
    }

    // Shuffle final result to avoid predictable ordering
    return selectedPosts.sort(() => Math.random() - 0.5).slice(0, maxPosts);
  };

  // Legacy batching function for backward compatibility
  const applyBatching = (allPosts: any[]) => {
    return applyCappedFeedLogic(allPosts);
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
    applyCappedFeedLogic,
    handleRefresh,
    handleLoadNewPosts,
    handleLoadMore,
  };
}