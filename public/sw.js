// Service Worker for Push Notifications with Deep Link Navigation
const CACHE_NAME = 'postyn-sw-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (!event.data) {
    console.log('[SW] No data in push message');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now(),
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Postyn', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push message:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Postyn', {
        body: 'You have a new notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    );
  }
});

// Notification click handler with deep link navigation
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  
  console.log('[SW] Notification click data:', notificationData);
  console.log('[SW] Target URL:', url);

  event.waitUntil(
    (async () => {
      try {
        // Get all window clients
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Check if there's already a window open
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );

        if (existingClient) {
          // Focus existing window and navigate to the URL
          console.log('[SW] Focusing existing window and navigating to:', url);
          await existingClient.focus();
          
          // Send message to the client with deep link data
          existingClient.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: {
              postId: notificationData.postId,
              commentId: notificationData.commentId,
              tab: 'posts',
              action: notificationData.action || 'view_post'
            }
          });
          
          // Navigate to the deep link URL
          if (url !== '/') {
            existingClient.navigate(url);
          }
        } else {
          // Open new window with the URL
          console.log('[SW] Opening new window with URL:', url);
          const newClient = await self.clients.openWindow(url);
          
          if (newClient) {
            // Wait a bit for the page to load, then send the deep link data
            setTimeout(() => {
              newClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                data: {
                  postId: notificationData.postId,
                  commentId: notificationData.commentId,
                  tab: 'posts',
                  action: notificationData.action || 'view_post'
                }
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('[SW] Error handling notification click:', error);
        
        // Fallback: just open the main page
        await self.clients.openWindow('/');
      }
    })()
  );
});

// Handle action button clicks (like "View Post")
self.addEventListener('notificationclick', (event) => {
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action);
    
    const notificationData = event.notification.data || {};
    
    switch (event.action) {
      case 'view':
        // Same as regular notification click
        event.notification.close();
        
        const url = notificationData.url || '/';
        
        event.waitUntil(
          (async () => {
            const clients = await self.clients.matchAll({
              type: 'window',
              includeUncontrolled: true
            });

            const existingClient = clients.find(client => 
              client.url.includes(self.location.origin)
            );

            if (existingClient) {
              await existingClient.focus();
              existingClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                data: {
                  postId: notificationData.postId,
                  commentId: notificationData.commentId,
                  tab: 'posts',
                  action: 'view_post'
                }
              });
              
              if (url !== '/') {
                existingClient.navigate(url);
              }
            } else {
              await self.clients.openWindow(url);
            }
          })()
        );
        break;
        
      default:
        console.log('[SW] Unknown action:', event.action);
        break;
    }
  }
});

// Background sync (for offline support if needed)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Add any background sync logic here
      Promise.resolve()
    );
  }
});

// Message handler from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');