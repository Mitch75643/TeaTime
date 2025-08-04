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
const AUTO_REFRESH_INTERVAL = 25000; // 25 seconds

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

  // Fetch initial posts
  const { data: initialData = [], isLoading } = useQuery<Post[]>({
    queryKey: [...queryKey, currentPage, batchSize],
    queryFn: async () => {
      const params = buildQueryParams(0, batchSize);
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const posts = await response.json();
      
      setAllPosts(posts);
      setHasMore(posts.length === batchSize);
      lastFetchTime.current = Date.now();
      
      return posts;
    },
  });

  // Check for new posts in the background
  const checkForNewPosts = useCallback(async () => {
    try {
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
  }, [apiEndpoint, buildQueryParams, allPosts, newPosts, batchSize]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }
    
    autoRefreshTimer.current = setInterval(checkForNewPosts, autoRefreshInterval);
    
    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [checkForNewPosts, autoRefreshInterval]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
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
  }, [isLoadingMore, hasMore, allPosts, batchSize, buildQueryParams, apiEndpoint, queryClient, queryKey, currentPage, toast]);

  // Refresh posts
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Reset state
      setCurrentPage(0);
      setNewPosts([]);
      setShowNewPostsBanner(false);
      
      // Force fresh fetch
      await queryClient.invalidateQueries({ queryKey });
      const params = buildQueryParams(0, batchSize);
      const response = await fetch(`${apiEndpoint}?${params}`);
      
      if (!response.ok) throw new Error("Failed to refresh posts");
      
      const freshPosts = await response.json();
      setAllPosts(freshPosts);
      setHasMore(freshPosts.length === batchSize);
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
  }, [queryClient, queryKey, buildQueryParams, apiEndpoint, batchSize, toast]);

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
    hasMore,
    newPostsCount: newPosts.length,
    showNewPostsBanner,
    loadMore,
    refresh,
    acceptNewPosts,
    dismissNewPosts,
  };
}