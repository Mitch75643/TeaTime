import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@shared/schema";

interface SmartFeedOptions {
  queryKey: string[];
  apiEndpoint: string;
  queryParams?: Record<string, string>;
  batchSize?: number;
  autoRefreshInterval?: number;
  postContext?: string;
}

interface SmartFeedState {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  newPostsCount: number;
  showNewPostsBanner: boolean;
}

interface SmartFeedActions {
  loadMore: () => void;
  refresh: () => void;
  acceptNewPosts: () => void;
  dismissNewPosts: () => void;
}

const BATCH_SIZE = 25;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const MIN_POSTS_FOR_THROTTLING = 10; // Only apply throttling if 10+ posts

export function useSmartFeed(options: SmartFeedOptions): SmartFeedState & SmartFeedActions {
  const {
    queryKey,
    apiEndpoint,
    queryParams = {},
    batchSize = BATCH_SIZE,
    autoRefreshInterval = AUTO_REFRESH_INTERVAL,
    postContext
  } = options;

  const [currentPage, setCurrentPage] = useState(0);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const lastFetchTime = useRef<number>(Date.now());
  const autoRefreshTimer = useRef<NodeJS.Timeout>();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build query parameters
  const buildQueryParams = useCallback((page = 0, limit = batchSize) => {
    const params = new URLSearchParams({
      ...queryParams,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (postContext) {
      params.append("postContext", postContext);
    }
    
    return params.toString();
  }, [queryParams, batchSize, postContext]);

  // Fetch initial posts with smart batching based on total count
  const { data: initialData = [], isLoading } = useQuery<Post[]>({
    queryKey: [...queryKey, currentPage, batchSize],
    queryFn: async () => {
      // First, get total count to determine if we should apply throttling
      const countParams = new URLSearchParams({ ...queryParams, count_only: "true" });
      if (postContext) countParams.append("postContext", postContext);
      
      const countResponse = await fetch(`${apiEndpoint}?${countParams}`);
      const countData = await countResponse.json();
      const totalCount = countData.total || 0;
      setTotalPostsCount(totalCount);
      
      // If fewer than MIN_POSTS_FOR_THROTTLING posts, fetch all at once
      const shouldApplyThrottling = totalCount >= MIN_POSTS_FOR_THROTTLING;
      const fetchLimit = shouldApplyThrottling ? Math.min(batchSize, 30) : totalCount;
      
      const params = buildQueryParams(0, fetchLimit);
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const posts = await response.json();
      
      setAllPosts(posts);
      setHasMore(shouldApplyThrottling && posts.length === fetchLimit);
      lastFetchTime.current = Date.now();
      
      return posts;
    },
  });

  // Check for new posts in the background (only if throttling is active)
  const checkForNewPosts = useCallback(async () => {
    try {
      // Only check for new posts if we have enough posts to warrant throttling
      if (totalPostsCount < MIN_POSTS_FOR_THROTTLING) {
        return; // Skip background checks for small feeds
      }
      
      const params = buildQueryParams(0, batchSize);
      const response = await fetch(`${apiEndpoint}?${params}&since=${lastFetchTime.current}`);
      if (!response.ok) return;
      
      const latestPosts = await response.json();
      const trulyNewPosts = latestPosts.filter((post: Post) => 
        !allPosts.some(existingPost => existingPost.id === post.id) &&
        !newPosts.some(newPost => newPost.id === post.id)
      );
      
      if (trulyNewPosts.length > 0) {
        setNewPosts(prev => [...trulyNewPosts, ...prev]);
        setShowNewPostsBanner(true);
      }
    } catch (error) {
      console.warn("Failed to check for new posts:", error);
    }
  }, [apiEndpoint, buildQueryParams, allPosts, newPosts, batchSize, totalPostsCount]);

  // Auto-refresh setup (only for throttled feeds)
  useEffect(() => {
    if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }
    
    // Only set up background refresh for feeds that need throttling
    if (totalPostsCount >= MIN_POSTS_FOR_THROTTLING) {
      autoRefreshTimer.current = setInterval(checkForNewPosts, autoRefreshInterval);
    }
    
    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [checkForNewPosts, autoRefreshInterval, totalPostsCount]);

  // Load more posts (only available for throttled feeds)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || totalPostsCount < MIN_POSTS_FOR_THROTTLING) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = Math.floor(allPosts.length / batchSize);
      const params = buildQueryParams(nextPage, batchSize);
      const response = await fetch(`${apiEndpoint}?${params}`);
      
      if (!response.ok) throw new Error("Failed to load more posts");
      
      const newBatch = await response.json();
      setAllPosts(prev => [...prev, ...newBatch]);
      setHasMore(newBatch.length === batchSize);
      
      // Invalidate cache for consistency
      queryClient.setQueryData([...queryKey, currentPage, batchSize], [...allPosts, ...newBatch]);
    } catch (error) {
      toast({
        title: "Failed to load more posts",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, allPosts, batchSize, buildQueryParams, apiEndpoint, queryClient, queryKey, currentPage, toast, totalPostsCount]);

  // Refresh posts (intelligent batching based on total count)
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Reset state
      setCurrentPage(0);
      setNewPosts([]);
      setShowNewPostsBanner(false);
      
      // Force fresh fetch with count check
      await queryClient.invalidateQueries({ queryKey });
      
      // Get updated total count
      const countParams = new URLSearchParams({ ...queryParams, count_only: "true" });
      if (postContext) countParams.append("postContext", postContext);
      
      const countResponse = await fetch(`${apiEndpoint}?${countParams}`);
      const countData = await countResponse.json();
      const totalCount = countData.total || 0;
      setTotalPostsCount(totalCount);
      
      // Smart batching: fetch all if < MIN_POSTS_FOR_THROTTLING, otherwise batch
      const shouldApplyThrottling = totalCount >= MIN_POSTS_FOR_THROTTLING;
      const fetchLimit = shouldApplyThrottling ? Math.min(batchSize, 30) : totalCount;
      
      const params = buildQueryParams(0, fetchLimit);
      const response = await fetch(`${apiEndpoint}?${params}`);
      
      if (!response.ok) throw new Error("Failed to refresh posts");
      
      const freshPosts = await response.json();
      setAllPosts(freshPosts);
      setHasMore(shouldApplyThrottling && freshPosts.length === fetchLimit);
      lastFetchTime.current = Date.now();
      
      toast({
        title: "Posts refreshed!",
        description: "Latest content has been loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to load latest posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKey, buildQueryParams, apiEndpoint, batchSize, toast, queryParams, postContext]);

  // Accept new posts
  const acceptNewPosts = useCallback(() => {
    setAllPosts(prev => [...newPosts, ...prev]);
    setNewPosts([]);
    setShowNewPostsBanner(false);
    lastFetchTime.current = Date.now();
    
    // Smooth scroll to top to show new posts
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [newPosts]);

  // Dismiss new posts banner
  const dismissNewPosts = useCallback(() => {
    setShowNewPostsBanner(false);
  }, []);

  return {
    posts: allPosts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore: totalPostsCount >= MIN_POSTS_FOR_THROTTLING && hasMore, // Only show "load more" for throttled feeds
    newPostsCount: newPosts.length,
    showNewPostsBanner: totalPostsCount >= MIN_POSTS_FOR_THROTTLING && showNewPostsBanner, // Only show banner for throttled feeds
    loadMore,
    refresh,
    acceptNewPosts,
    dismissNewPosts,
  };
}