// Deep Link Navigation Utility for Notifications
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

export interface DeepLinkData {
  postId?: string;
  tab?: 'posts' | 'settings';
  commentId?: string;
  highlightPost?: boolean;
}

// Parse URL parameters for deep link data
export function parseDeepLinkParams(): DeepLinkData | null {
  const urlParams = new URLSearchParams(window.location.search);
  
  const postId = urlParams.get('postId');
  const tab = urlParams.get('tab') as 'posts' | 'settings' || 'posts';
  const commentId = urlParams.get('commentId');
  const highlight = urlParams.get('highlight') === 'true';

  if (postId) {
    return {
      postId,
      tab,
      commentId: commentId || undefined,
      highlightPost: highlight
    };
  }

  return null;
}

// Generate deep link URL for notifications
export function generateDeepLinkURL(deepLinkData: DeepLinkData): string {
  const params = new URLSearchParams();
  
  if (deepLinkData.postId) {
    params.set('postId', deepLinkData.postId);
  }
  
  if (deepLinkData.tab) {
    params.set('tab', deepLinkData.tab);
  }
  
  if (deepLinkData.commentId) {
    params.set('commentId', deepLinkData.commentId);
  }
  
  if (deepLinkData.highlightPost) {
    params.set('highlight', 'true');
  }

  return `/profile?${params.toString()}`;
}

// Navigate to specific post in profile with highlighting
export function navigateToPost(postId: string, tab: 'posts' | 'settings' = 'posts', commentId?: string) {
  const deepLinkData: DeepLinkData = {
    postId,
    tab,
    commentId,
    highlightPost: true
  };
  
  const url = generateDeepLinkURL(deepLinkData);
  
  // Update URL without reload
  window.history.pushState({}, '', url);
  
  // Dispatch custom event for profile page to handle
  window.dispatchEvent(new CustomEvent('deepLinkNavigation', { 
    detail: deepLinkData 
  }));
}

// Clear deep link parameters from URL
export function clearDeepLinkParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('postId');
  url.searchParams.delete('tab');
  url.searchParams.delete('commentId');
  url.searchParams.delete('highlight');
  
  window.history.replaceState({}, '', url.toString());
}

// Hook for handling deep link navigation
export function useDeepLinkNavigation() {
  const [, setLocation] = useLocation();

  const handleNotificationClick = (notification: {
    postId?: string;
    deepLinkTab?: string;
    commentId?: string;
    type: string;
  }) => {
    if (!notification.postId) {
      // Fallback to general profile page
      setLocation('/profile');
      return;
    }

    const deepLinkData: DeepLinkData = {
      postId: notification.postId,
      tab: (notification.deepLinkTab as 'posts' | 'settings') || 'posts',
      commentId: notification.commentId,
      highlightPost: true
    };

    const url = generateDeepLinkURL(deepLinkData);
    setLocation(url);

    // Show helpful toast
    const actionText = notification.type === 'post_reaction' ? 'reacted to' :
                      notification.type === 'comment_reply' ? 'replied to' :
                      notification.type === 'poll_vote' ? 'voted on' :
                      notification.type === 'debate_vote' ? 'voted on' : 'interacted with';
                      
    toast({
      title: "Opening your post",
      description: `Taking you to the post someone ${actionText}`,
    });
  };

  const handleDirectNavigation = (postId: string, tab?: 'posts' | 'settings') => {
    navigateToPost(postId, tab);
  };

  return {
    handleNotificationClick,
    handleDirectNavigation,
    parseDeepLinkParams,
    clearDeepLinkParams
  };
}

// Service Worker message handler for notification clicks
export function setupNotificationClickHandler() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[Deep Link] Service Worker message received:', event.data);
      
      if (event.data.type === 'NOTIFICATION_CLICK') {
        const { postId, tab, commentId, action } = event.data.data || {};
        
        console.log('[Deep Link] Handling notification click:', { postId, tab, commentId, action });
        
        if (postId && action === 'view_post') {
          // Navigate to the post with highlighting
          navigateToPost(postId, tab || 'posts', commentId);
        } else {
          // Fallback navigation to profile
          console.log('[Deep Link] Using fallback navigation to profile');
          window.focus();
          
          // Check current location and navigate if needed
          if (!window.location.pathname.includes('/profile')) {
            window.location.href = '/profile';
          } else {
            // Already on profile, just trigger a refresh of posts
            window.dispatchEvent(new CustomEvent('refreshProfile'));
          }
        }
      }
    });
    
    console.log('[Deep Link] Notification click handler setup complete');
  } else {
    console.warn('[Deep Link] Service Worker not supported');
  }
}