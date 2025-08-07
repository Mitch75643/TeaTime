import webpush from "web-push";
import { storage } from "./storage";
import { type PushSubscription, type ContentPrompt } from "@shared/schema";

// VAPID keys configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BFzKJv8W5XsNEhRjH5_gkKEL8N5PQRqNfz8T4w7oHt5YJXxoI8tVc1Nq3fFgEzEf8CiCrxR3d3pKfP2X4mwXyc0';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UeR4_9mJZ8x7kY2sD4fNqX8tV9oP5aL3iU7hG2kW9fM';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'notifications@postyn.app';

export class PushNotificationService {
  private notificationQueue: Array<{
    subscription: PushSubscription;
    payload: any;
    retryCount: number;
  }> = [];
  
  private isProcessing = false;
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 50; // Process 50 notifications at a time
  private readonly DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

  constructor() {
    // Configure VAPID details for web-push
    webpush.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    
    console.log('[Push Notifications] Service initialized');
  }

  // Subscribe a user to push notifications
  async subscribe(sessionId: string, subscription: any, notificationTypes: string[] = ["daily_prompt", "daily_debate"]): Promise<void> {
    try {
      // Check if subscription already exists for this session
      const existingSubscriptions = await storage.getPushSubscriptions(sessionId);
      
      // Deactivate old subscriptions for this session (user can only have one active subscription per session)
      for (const existingSub of existingSubscriptions) {
        await storage.deactivatePushSubscription(existingSub.id);
      }

      // Create new subscription
      await storage.createPushSubscription({
        sessionId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        notificationTypes,
      });

      console.log(`[Push Notifications] User ${sessionId} subscribed for: ${notificationTypes.join(', ')}`);
    } catch (error) {
      console.error('[Push Notifications] Failed to subscribe user:', error);
      throw error;
    }
  }

  // Unsubscribe a user from push notifications
  async unsubscribe(sessionId: string): Promise<void> {
    try {
      const subscriptions = await storage.getPushSubscriptions(sessionId);
      
      for (const subscription of subscriptions) {
        await storage.deactivatePushSubscription(subscription.id);
      }

      console.log(`[Push Notifications] User ${sessionId} unsubscribed`);
    } catch (error) {
      console.error('[Push Notifications] Failed to unsubscribe user:', error);
      throw error;
    }
  }

  // Update user's notification preferences
  async updatePreferences(sessionId: string, notificationTypes: string[]): Promise<void> {
    try {
      const subscriptions = await storage.getPushSubscriptions(sessionId);
      
      for (const subscription of subscriptions) {
        await storage.updatePushSubscriptionPreferences(subscription.id, notificationTypes);
      }

      console.log(`[Push Notifications] Updated preferences for ${sessionId}: ${notificationTypes.join(', ')}`);
    } catch (error) {
      console.error('[Push Notifications] Failed to update preferences:', error);
      throw error;
    }
  }

  // Send notification for new daily prompt
  async notifyNewPrompt(prompt: ContentPrompt): Promise<void> {
    try {
      const notificationType = prompt.type === 'daily_spill' ? 'daily_prompt' : 'daily_debate';
      const subscriptions = await storage.getActiveSubscriptionsForType(notificationType);

      if (subscriptions.length === 0) {
        console.log(`[Push Notifications] No active subscriptions for ${notificationType}`);
        return;
      }

      const title = prompt.type === 'daily_spill' 
        ? '🧠 New Daily Prompt is Live!' 
        : '🔥 New Daily Debate is Live!';

      const body = this.truncateContent(prompt.content, 100);
      const icon = '/favicon.ico';
      const badge = '/favicon.ico';
      const tag = `new-${notificationType}`;

      const payload = JSON.stringify({
        title,
        body,
        icon,
        badge,
        tag,
        data: {
          url: '/',  // Navigate to home page where the new prompt will be visible
          type: notificationType,
          promptId: prompt.id
        },
        actions: [
          {
            action: 'view',
            title: 'Share Your Story',
            icon: '/favicon.ico'
          }
        ],
        requireInteraction: false,
        silent: false
      });

      // Add all notifications to queue for staggered delivery
      for (const subscription of subscriptions) {
        this.notificationQueue.push({
          subscription,
          payload,
          retryCount: 0
        });
      }

      console.log(`[Push Notifications] Queued ${subscriptions.length} notifications for new ${notificationType}`);
      
      // Start processing queue if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      // Log the notification attempt
      for (const subscription of subscriptions) {
        await storage.logPushNotification(
          subscription.id,
          notificationType,
          prompt.content,
          'queued'
        );
      }

    } catch (error) {
      console.error('[Push Notifications] Failed to notify new prompt:', error);
    }
  }

  // Process the notification queue with staggered delivery
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[Push Notifications] Processing queue with ${this.notificationQueue.length} notifications`);

    while (this.notificationQueue.length > 0) {
      // Process batch of notifications
      const batch = this.notificationQueue.splice(0, this.BATCH_SIZE);
      const promises = batch.map(item => this.sendSingleNotification(item));
      
      await Promise.allSettled(promises);

      // Wait between batches to avoid overwhelming the push service
      if (this.notificationQueue.length > 0) {
        await this.delay(this.DELAY_BETWEEN_BATCHES);
      }
    }

    this.isProcessing = false;
    console.log('[Push Notifications] Queue processing completed');
  }

  // Send a single push notification
  private async sendSingleNotification(item: {
    subscription: PushSubscription;
    payload: any;
    retryCount: number;
  }): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: item.subscription.endpoint,
        keys: {
          p256dh: item.subscription.p256dh,
          auth: item.subscription.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, item.payload);
      
      // Update last used timestamp for successful delivery
      await storage.updatePushSubscriptionLastUsed(item.subscription.id);
      
      // Update log status to sent
      await storage.updatePushNotificationStatus(item.subscription.id, 'sent');

    } catch (error: any) {
      console.error(`[Push Notifications] Failed to send notification:`, error.message);
      
      // Handle different types of errors
      if (error.statusCode === 410 || error.statusCode === 413) {
        // Subscription is no longer valid, deactivate it
        console.log(`[Push Notifications] Deactivating invalid subscription: ${error.statusCode}`);
        await storage.deactivatePushSubscription(item.subscription.id);
        await storage.updatePushNotificationStatus(item.subscription.id, 'expired', error.message);
      } else if (item.retryCount < this.MAX_RETRIES) {
        // Retry for temporary failures
        console.log(`[Push Notifications] Retrying notification (attempt ${item.retryCount + 1}/${this.MAX_RETRIES})`);
        item.retryCount++;
        this.notificationQueue.push(item);
      } else {
        // Max retries reached, log as failed
        console.error(`[Push Notifications] Max retries reached for notification`);
        await storage.updatePushNotificationStatus(item.subscription.id, 'failed', error.message);
      }
    }
  }

  // Queue a single notification for sending
  queueEngagementNotification(subscription: PushSubscription, payload: string): void {
    this.notificationQueue.push({
      subscription,
      payload,
      retryCount: 0
    });

    // Start processing queue if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Get VAPID public key for client-side subscription
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  // Get notification statistics
  async getStats(sessionId?: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    sentNotifications: number;
    failedNotifications: number;
  }> {
    try {
      const stats = await storage.getPushNotificationStats(sessionId);
      return stats;
    } catch (error) {
      console.error('[Push Notifications] Failed to get stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        sentNotifications: 0,
        failedNotifications: 0,
      };
    }
  }

  // Utility methods
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + '...';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clean up old subscriptions and logs (call periodically)
  async cleanup(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await storage.cleanupOldPushSubscriptions(thirtyDaysAgo);
      await storage.cleanupOldPushNotificationLogs(thirtyDaysAgo);

      console.log('[Push Notifications] Cleanup completed');
    } catch (error) {
      console.error('[Push Notifications] Cleanup failed:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();