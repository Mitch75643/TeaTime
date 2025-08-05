import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketMessage {
  type: 'post_reaction' | 'drama_vote' | 'poll_vote' | 'debate_vote' | 'comment_added' | 'post_view';
  postId: string;
  data: any;
}

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      switch (message.type) {
        case 'post_reaction':
          // Invalidate post reactions to trigger real-time updates
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'comments'] });
          break;

        case 'drama_vote':
          // Update drama voting results
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'drama-votes'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'has-voted'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
          break;

        case 'poll_vote':
          // Update poll results
          queryClient.invalidateQueries({ queryKey: ['/api/polls', message.postId, 'results'] });
          queryClient.invalidateQueries({ queryKey: ['/api/polls', message.postId, 'has-voted'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
          break;

        case 'debate_vote':
          // Update debate results
          queryClient.invalidateQueries({ queryKey: ['/api/debates', message.postId, 'results'] });
          queryClient.invalidateQueries({ queryKey: ['/api/debates', message.postId, 'has-voted'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
          break;

        case 'comment_added':
          // Update comments for the post
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'comments'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] }); // For comment counts
          break;

        case 'post_view':
          // Update post view counts (less frequent updates for performance)
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'stats'] });
          break;

        default:
          console.debug('[WebSocket] Unknown message type:', message.type);
      }
    });

    return unsubscribe;
  }, [subscribeToMessages, queryClient]);

  return {
    // This hook sets up global real-time updates
    // Individual components can use specific hooks like usePollVoting, useDebateVoting, etc.
  };
}