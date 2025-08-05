import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface SmartFeedResponse {
  posts: any[];
  hasMore: boolean;
  nextBatchAvailable: number;
  totalAvailable: number;
  smartFeedActive: boolean;
}

interface UseSmartFeedOptions {
  category?: string;
  sortBy?: 'trending' | 'new';
  tags?: string;
  userOnly?: boolean;
  postContext?: string;
  section?: string;
  enabled?: boolean;
  smartFeedEnabled?: boolean;
}

export function useSmartFeed(options: UseSmartFeedOptions) {
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  const {
    category,
    sortBy = 'new',
    tags,
    userOnly,
    postContext,
    section,
    enabled = true,
    smartFeedEnabled = true
  } = options;

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  queryParams.set('sortBy', sortBy);
  if (tags) queryParams.set('tags', tags);
  if (userOnly) queryParams.set('userOnly', 'true');
  if (postContext) queryParams.set('postContext', postContext);
  if (section) queryParams.set('section', section);
  if (smartFeedEnabled && sortBy === 'new' && !userOnly) {
    queryParams.set('smartFeed', 'true');
  }

  const queryKey = section 
    ? ['/api/posts', section, sortBy, userOnly ? 'user' : 'all']
    : ['/api/posts'];

  // Main posts query
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...queryKey, queryParams.toString()],
    queryFn: async () => {
      const url = section 
        ? `/api/posts/${section}/${sortBy}/${userOnly ? 'user' : 'all'}?${queryParams.toString()}`
        : `/api/posts?${queryParams.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json() as Promise<SmartFeedResponse | any[]>;
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false
  });

  // Handle the response format (backward compatibility)
  const feedData: SmartFeedResponse = Array.isArray(response) 
    ? {
        posts: response,
        hasMore: false,
        nextBatchAvailable: 0,
        totalAvailable: response.length,
        smartFeedActive: false
      }
    : response || {
        posts: [],
        hasMore: false,
        nextBatchAvailable: 0,
        totalAvailable: 0,
        smartFeedActive: false
      };

  // Subscribe to WebSocket messages for new posts notifications
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'posts_available') {
        // Extract section and context from message
        const messageSection = message.data?.section || message.section || null;
        const messagePostContext = message.data?.postContext || message.postContext || 'home';
        
        console.log('[Smart Feed] Message received:', { messageSection, messagePostContext, section, postContext });
        
        // Check if this notification applies to our feed
        const sectionMatches = (messageSection === section) || (!messageSection && !section);
        const contextMatches = messagePostContext === (postContext || 'home');

        if (sectionMatches && contextMatches) {
          console.log('[Smart Feed] New posts available:', message.data?.count || 1);
          setNewPostsAvailable(prev => prev + (message.data?.count || 1));
        }
      }
    });

    return unsubscribe;
  }, [subscribeToMessages, section, postContext]);

  // Manual refresh function that clears queue and fetches fresh data
  const refreshFeed = useCallback(async () => {
    console.log('[Smart Feed] Refreshing feed, clearing new posts count:', newPostsAvailable);
    setNewPostsAvailable(0);
    setLastRefreshTime(Date.now());
    
    // Build the refresh URL with clearQueue parameter
    const refreshParams = new URLSearchParams(queryParams);
    refreshParams.set('clearQueue', 'true');
    refreshParams.set('timestamp', Date.now().toString()); // Force cache bust
    
    // Invalidate existing cache
    await queryClient.invalidateQueries({ queryKey });
    
    // Force refetch with fresh parameters
    const result = await refetch();
    const posts = Array.isArray(result.data) ? result.data : result.data?.posts || [];
    console.log('[Smart Feed] Refresh complete, new posts:', posts.length);
    
    return result;
  }, [queryClient, queryKey, queryParams, refetch, newPostsAvailable]);

  // Load more posts from the queue
  const loadMorePosts = useCallback(async () => {
    if (!feedData.hasMore) return;
    
    // Just refetch normally to get the next batch
    return refetch();
  }, [feedData.hasMore, refetch]);

  return {
    posts: feedData.posts,
    isLoading,
    error,
    hasMore: feedData.hasMore,
    nextBatchAvailable: feedData.nextBatchAvailable,
    totalAvailable: feedData.totalAvailable,
    smartFeedActive: feedData.smartFeedActive,
    newPostsAvailable,
    refreshFeed,
    loadMorePosts,
    lastRefreshTime
  };
}