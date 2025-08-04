// Push Notifications Utility Library

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  notificationTypes?: string[];
}

export interface PushNotificationStatus {
  isSubscribed: boolean;
  notificationTypes: string[];
  stats: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    sentNotifications: number;
    failedNotifications: number;
  };
}

class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Initialize push notifications
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[Push] Service Worker registered:', this.serviceWorkerRegistration);

      // Get VAPID public key from server
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();
      this.vapidPublicKey = publicKey;

      console.log('[Push] VAPID public key obtained');
    } catch (error) {
      console.error('[Push] Failed to initialize:', error);
      throw error;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(notificationTypes: string[] = ['daily_prompt', 'daily_debate']): Promise<void> {
    if (!this.serviceWorkerRegistration || !this.vapidPublicKey) {
      await this.initialize();
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      // Create push subscription
      const subscription = await this.serviceWorkerRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!),
      });

      console.log('[Push] Push subscription created:', subscription);

      // Send subscription to server
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        notificationTypes,
      };

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      console.log('[Push] Successfully subscribed to push notifications');
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Notify server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe on server');
      }

      console.log('[Push] Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('[Push] Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updatePreferences(notificationTypes: string[]): Promise<void> {
    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationTypes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      console.log('[Push] Notification preferences updated:', notificationTypes);
    } catch (error) {
      console.error('[Push] Failed to update preferences:', error);
      throw error;
    }
  }

  // Get current notification status
  async getStatus(): Promise<PushNotificationStatus> {
    try {
      const response = await fetch('/api/push/status');
      if (!response.ok) {
        throw new Error('Failed to get notification status');
      }

      return await response.json();
    } catch (error) {
      console.error('[Push] Failed to get status:', error);
      throw error;
    }
  }

  // Check if currently subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('[Push] Failed to check subscription status:', error);
      return false;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show a test notification (for debugging)
  async showTestNotification(): Promise<void> {
    const permission = await this.requestPermission();
    if (permission === 'granted') {
      new Notification('🧠 Tfess Push Notifications', {
        body: 'Push notifications are working! You\'ll get notified when new prompts go live.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
      });
    }
  }
}

export const pushNotificationManager = new PushNotificationManager();