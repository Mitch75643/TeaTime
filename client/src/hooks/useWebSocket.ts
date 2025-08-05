import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: 'post_reaction' | 'drama_vote' | 'comment_added' | 'post_view' | 'poll_vote' | 'debate_vote' | 'new_post' | 'posts_available' | 'username_updated' | 'profile_updated';
  postId?: string;
  data: any;
  section?: string;
  postContext?: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messageCallbacksRef = useRef<Set<(message: any) => void>>(new Set());
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('[WebSocket] Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message);

          // Notify all subscribers
          messageCallbacksRef.current.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('[WebSocket] Error in message callback:', error);
            }
          });

          // Update relevant queries based on message type
          switch (message.type) {
            case 'post_reaction':
              // Invalidate post reactions and main posts list
              if (message.postId) {
                queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'reactions'] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
              break;

            case 'drama_vote':
              // Invalidate drama votes
              if (message.postId) {
                queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'drama-votes'] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
              break;

            case 'comment_added':
              // Invalidate comments and comment count
              if (message.postId) {
                queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'comments'] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
              break;

            case 'post_view':
              // Update view stats
              if (message.postId) {
                queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'stats'] });
              }
              break;

            case 'poll_vote':
            case 'debate_vote':
              // Invalidate polls/debates and main posts
              queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
              break;

            case 'posts_available':
              // New posts are available - don't auto-refresh, just notify subscribers
              console.log('[WebSocket] New posts available:', message.data);
              break;

            case 'profile_updated':
              // Profile/username updated across devices
              queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
              queryClient.invalidateQueries({ queryKey: ['/api/user'] });
              break;

            case 'new_post':
              // A new post was created - notify but don't auto-show
              console.log('[WebSocket] New post created:', message.data);
              break;

            default:
              console.warn('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        
        // Attempt to reconnect if not a deliberate close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
      };

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      // Retry after a delay if initial connection fails
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, 2000);
      }
    }
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Component unmounting');
    }
    
    wsRef.current = null;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const subscribeToMessages = useCallback((callback: (message: any) => void) => {
    messageCallbacksRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      messageCallbacksRef.current.delete(callback);
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
    subscribeToMessages,
  };
}