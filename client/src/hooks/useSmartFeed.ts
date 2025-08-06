// Smart Feed Hook with Real-Time Sync Support
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useWebSocket } from "./useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";

interface SmartFeedResponse {
  posts: Post[];
  hasMore: boolean;
  nextBatch: boolean;
}

export function useSmartFeed(page: string, enabled = true) {
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const queryClient = useQueryClient();
  
  // WebSocket for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Smart feed query for Home page "New" section
  const {
    data: feedData,
    isLoading,
    refetch,
    error
  } = useQuery<SmartFeedResponse>({
    queryKey: ["/api/posts", "smart", page],
    queryFn: async () => {
      // Use smart feed only for Home page, regular feed for others
      if (page === "home") {
        return await apiRequest("/api/posts?smartFeed=true&sortBy=new");
      } else {
        const posts = await apiRequest(`/api/posts?sortBy=new&page=${page}`);
        return { posts, hasMore: false, nextBatch: false };
      }
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // Get next batch mutation
  const nextBatchMutation = useMutation({
    mutationFn: async (offset: number) => {
      return await apiRequest(`/api/posts/next-batch?offset=${offset}`);
    },
    onSuccess: (newPosts: Post[]) => {
      // Add new posts to existing feed
      queryClient.setQueryData(
        ["/api/posts", "smart", page],
        (old: SmartFeedResponse | undefined) => ({
          posts: [...(old?.posts || []), ...newPosts],
          hasMore: newPosts.length >= 30, // Still more if we got full batch
          nextBatch: false
        })
      );
    }
  });

  // Force refresh with cache invalidation
  const forceRefresh = useCallback(async () => {
    setLastFetchTime(new Date());
    setPendingCount(0);
    setShowRefreshPrompt(false);
    
    // Invalidate all related caches to ensure fresh data
    await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/reactions"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
    
    // Force refetch
    await refetch();
  }, [queryClient, refetch]);

  // Load more posts (for "Refresh to see more posts" button)
  const loadMorePosts = useCallback(() => {
    const currentCount = feedData?.posts.length || 0;
    nextBatchMutation.mutate(currentCount);
  }, [feedData?.posts.length, nextBatchMutation]);

  // WebSocket real-time listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewPost = (data: { post: Post; page: string }) => {
      if (data.page === page || page === "home") {
        // Don't auto-add to feed, just show refresh prompt
        setPendingCount(prev => prev + 1);
        setShowRefreshPrompt(true);
        
        console.log(`[Smart Feed] New post available for ${page}, pending count: ${pendingCount + 1}`);
      }
    };

    const handlePostUpdate = (data: { post: Post; type: string }) => {
      // Update existing post in cache immediately (reactions, comments, etc.)
      queryClient.setQueryData(
        ["/api/posts", "smart", page],
        (old: SmartFeedResponse | undefined) => {
          if (!old) return old;
          
          const updatedPosts = old.posts.map(post => 
            post.id === data.post.id ? { ...post, ...data.post } : post
          );
          
          return { ...old, posts: updatedPosts };
        }
      );
      
      console.log(`[Smart Feed] Updated post ${data.post.id} in ${page} feed`);
    };

    const handleReactionUpdate = (data: { postId: string; reactions: any[] }) => {
      queryClient.setQueryData(
        ["/api/posts", "smart", page],
        (old: SmartFeedResponse | undefined) => {
          if (!old) return old;
          
          const updatedPosts = old.posts.map(post => 
            post.id === data.postId 
              ? { ...post, reactions: data.reactions }
              : post
          );
          
          return { ...old, posts: updatedPosts };
        }
      );
    };

    const handleCommentUpdate = (data: { postId: string; comments: any[] }) => {
      queryClient.setQueryData(
        ["/api/posts", "smart", page],
        (old: SmartFeedResponse | undefined) => {
          if (!old) return old;
          
          const updatedPosts = old.posts.map(post => 
            post.id === data.postId 
              ? { ...post, comments: data.comments }
              : post
          );
          
          return { ...old, posts: updatedPosts };
        }
      );
    };

    // Subscribe to WebSocket events
    socket.on('new_post', handleNewPost);
    socket.on('post_updated', handlePostUpdate);
    socket.on('reactions_updated', handleReactionUpdate);
    socket.on('comments_updated', handleCommentUpdate);

    return () => {
      socket.off('new_post', handleNewPost);
      socket.off('post_updated', handlePostUpdate);
      socket.off('reactions_updated', handleReactionUpdate);
      socket.off('comments_updated', handleCommentUpdate);
    };
  }, [socket, isConnected, page, queryClient, pendingCount]);

  return {
    posts: feedData?.posts || [],
    isLoading,
    error,
    hasMore: feedData?.hasMore || false,
    nextBatch: feedData?.nextBatch || false,
    pendingCount,
    showRefreshPrompt,
    forceRefresh,
    loadMorePosts,
    isLoadingMore: nextBatchMutation.isPending
  };
}