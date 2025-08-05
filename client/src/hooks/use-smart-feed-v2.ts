import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "./useWebSocket";

interface SmartFeedOptions {
  queryKey: string[];
  apiEndpoint: string;
  category?: string;
  sortBy: 'new' | 'trending';
  postContext: string;
  enableSmartLogic?: boolean;
}

interface SmartFeedState {
  posts: any[];
  hasMorePosts: boolean;
  nextRefreshAvailable: boolean;
  queuedPostsCount: number;
  newPostsCount: number;
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
}

export function useSmartFeedV2(options: SmartFeedOptions) {
  const { queryKey, apiEndpoint, category, sortBy, postContext, enableSmartLogic = true } = options;
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();
  
  const [state, setState] = useState<SmartFeedState>({
    posts: [],
    hasMorePosts: false,
    nextRefreshAvailable: false,
    queuedPostsCount: 0,
    newPostsCount: 0,
    isRefreshing: false,
    lastRefreshTime: null,
  });

  const [displayedPostIds, setDisplayedPostIds] = useState<string[]>([]);

  // Build API parameters
  const buildApiParams = useCallback((excludePostIds: string[] = []) => {
    const params = new URLSearchParams();
    if (category && category !== "all") {
      params.append("category", category);
    }
    params.append("sortBy", sortBy);
    params.append("postContext", postContext);
    if (enableSmartLogic) {
      params.append("smartFeed", "true");
      if (excludePostIds.length > 0) {
        params.append("excludePostIds", excludePostIds.join(","));
      }
    }
    return params;
  }, [category, sortBy, postContext, enableSmartLogic]);

  // Main query for fetching posts
  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: [...queryKey, "smartfeed", displayedPostIds.length],
    queryFn: async () => {
      const params = buildApiParams(displayedPostIds);
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      
      const result = await response.json();
      
      // If smart feed is enabled, expect structured response
      if (enableSmartLogic && result.posts) {
        return result;
      }
      
      // Otherwise, treat as regular post array
      return {
        posts: result,
        hasMorePosts: false,
        nextRefreshAvailable: false,
        queuedPostsCount: 0,
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Update state when feed data changes
  useEffect(() => {
    if (feedData) {
      setState(prev => ({
        ...prev,
        posts: feedData.posts || [],
        hasMorePosts: feedData.hasMorePosts || false,
        nextRefreshAvailable: feedData.nextRefreshAvailable || false,
        queuedPostsCount: feedData.queuedPostsCount || 0,
        lastRefreshTime: new Date(),
      }));
      
      // Update displayed post IDs
      const newPostIds = (feedData.posts || []).map((post: any) => post.id);
      setDisplayedPostIds(prev => [...Array.from(new Set([...prev, ...newPostIds]))]);
    }
  }, [feedData]);

  // Subscribe to real-time updates for new posts
  useEffect(() => {
    if (!enableSmartLogic || sortBy !== 'new') return;

    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'post_created') {
        // Check if this post is relevant to current feed context
        const messageData = message.data;
        const isRelevantPost = 
          postContext === 'home' || // Home page shows all posts
          (postContext === 'community' && messageData?.communitySection) || // Community posts
          messageData?.postContext === postContext; // Exact context match
          
        if (isRelevantPost) {
          console.log('Smart Feed: New post detected for context:', postContext, message);
          setState(prev => {
            const newState = {
              ...prev,
              newPostsCount: prev.newPostsCount + 1,
              nextRefreshAvailable: true,
            };
            console.log('Smart Feed: Updated state after new post:', newState);
            return newState;
          });
        }
      }
    });

    return unsubscribe;
  }, [subscribeToMessages, enableSmartLogic, sortBy, postContext]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (state.isRefreshing) return;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      // Clear displayed post IDs to get completely fresh content
      setDisplayedPostIds([]);
      
      // Clear all related queries and force fresh fetch
      await queryClient.removeQueries({ 
        queryKey: [...queryKey, "smartfeed"],
        exact: false 
      });
      
      // Force immediate refetch with fresh data
      console.log('Smart Feed: Starting refresh...');
      const freshData = await refetch();
      console.log('Smart Feed: Fresh data received:', freshData.data);
      
      setState(prev => {
        const newState = {
          ...prev,
          newPostsCount: 0,
          isRefreshing: false,
          posts: freshData.data?.posts || [],
          hasMorePosts: freshData.data?.hasMorePosts || false,
          nextRefreshAvailable: false,
        };
        console.log('Smart Feed: Updated state after refresh:', newState);
        return newState;
      });
      
    } catch (error) {
      console.error("Failed to refresh feed:", error);
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [state.isRefreshing, queryClient, queryKey, refetch]);

  // Load more posts function
  const handleLoadMore = useCallback(async () => {
    if (!state.hasMorePosts || state.isRefreshing) return;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      // Fetch additional posts excluding already displayed ones
      const params = buildApiParams(displayedPostIds);
      params.append("offset", state.posts.length.toString());
      
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error("Failed to load more posts");
      
      const result = await response.json();
      const morePosts = enableSmartLogic && result.posts ? result.posts : result;
      
      if (morePosts && morePosts.length > 0) {
        setState(prev => ({
          ...prev,
          posts: [...prev.posts, ...morePosts],
          hasMorePosts: enableSmartLogic ? (result.hasMorePosts || false) : morePosts.length >= 20,
          isRefreshing: false,
        }));
        
        // Update displayed post IDs
        const newPostIds = morePosts.map((post: any) => post.id);
        setDisplayedPostIds(prev => [...prev, ...newPostIds]);
      } else {
        setState(prev => ({
          ...prev,
          hasMorePosts: false,
          isRefreshing: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [state.hasMorePosts, state.isRefreshing, state.posts.length, displayedPostIds, buildApiParams, apiEndpoint, enableSmartLogic]);

  // Reset session queue
  const resetFeed = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/smart-feed/reset", {});
      setDisplayedPostIds([]);
      setState(prev => ({
        ...prev,
        newPostsCount: 0,
        queuedPostsCount: 0,
      }));
      await handleRefresh();
    } catch (error) {
      console.error("Failed to reset feed:", error);
    }
  }, [handleRefresh]);

  return {
    // State
    posts: state.posts,
    isLoading,
    hasMorePosts: state.hasMorePosts,
    nextRefreshAvailable: state.nextRefreshAvailable,
    queuedPostsCount: state.queuedPostsCount,
    newPostsCount: state.newPostsCount,
    isRefreshing: state.isRefreshing,
    lastRefreshTime: state.lastRefreshTime,
    
    // Actions
    handleRefresh,
    handleLoadMore,
    resetFeed,
    
    // Utils
    shouldShowRefreshBanner: state.newPostsCount > 0,
    shouldShowLoadMoreButton: state.hasMorePosts && !state.nextRefreshAvailable,
    shouldShowRefreshButton: state.nextRefreshAvailable && state.queuedPostsCount > 0,
  };
}