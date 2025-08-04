// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received:', event);

  if (!event.data) {
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Error parsing notification data:', error);
    return;
  }

  const { title, body, icon, badge, tag, data, actions, requireInteraction, silent } = notificationData;

  const options = {
    body,
    icon: icon || '/favicon.ico',
    badge: badge || '/favicon.ico',
    tag: tag || 'tfess-notification',
    data: data || {},
    actions: actions || [],
    requireInteraction: requireInteraction || false,
    silent: silent || false,
    vibrate: [100, 50, 100], // Vibration pattern for mobile
    timestamp: Date.now(),
    renotify: true // Allow replacing previous notifications with same tag
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();

  const { action, notification } = event;
  const { data } = notification;

  let urlToOpen = data.url || '/';

  // Handle different actions
  if (action === 'view') {
    urlToOpen = data.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if a window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Focus existing window and navigate to the URL
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }

      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
  // Optional: Track notification close events
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Basic fetch handler for offline functionality (optional)
self.addEventListener('fetch', function(event) {
  // Only handle requests to same origin
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Let the network handle the request normally
  // This is just here to register the service worker properly
  return;
});