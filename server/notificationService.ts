// Comprehensive Notification Service for User Engagement
import { storage } from "./storage";
import { pushNotificationService } from "./pushNotificationService";
import { type InsertNotification } from "@shared/schema";

export class NotificationService {
  constructor() {
    console.log('[Notifications] Service initialized');
  }

  // Create a new post reaction notification
  async createPostReactionNotification(
    postId: string,
    postOwnerId: string,
    triggerAlias: string,
    triggerAvatarId: string,
    reactionType: string
  ): Promise<void> {
    try {
      // Don't notify users about their own reactions
      if (postOwnerId === triggerAlias) return;

      const reactionEmoji = this.getReactionEmoji(reactionType);
      const message = `${triggerAlias} ${reactionEmoji} reacted to your post`;

      const notificationData: InsertNotification = {
        recipientSessionId: postOwnerId,
        type: 'post_reaction',
        message,
        postId,
        triggerAlias,
        triggerAvatarId,
        reactionType,
        deepLinkTab: 'posts'
      };

      await storage.createNotification(notificationData);
      console.log(`[Notifications] Created post reaction notification for ${postOwnerId}`);

      // Send push notification if enabled
      await this.sendPushNotificationForEngagement(postOwnerId, {
        title: '👍 Someone reacted to your post!',
        body: message,
        postId,
        type: 'post_reaction'
      });

    } catch (error) {
      console.error('[Notifications] Failed to create post reaction notification:', error);
    }
  }

  // Create a new comment notification
  async createCommentNotification(
    postId: string,
    postOwnerId: string,
    commentId: string,
    triggerAlias: string,
    triggerAvatarId: string,
    commentContent: string
  ): Promise<void> {
    try {
      // Don't notify users about their own comments
      if (postOwnerId === triggerAlias) return;

      const truncatedComment = this.truncateContent(commentContent, 50);
      const message = `${triggerAlias} commented: "${truncatedComment}"`;

      const notificationData: InsertNotification = {
        recipientSessionId: postOwnerId,
        type: 'post_reply',
        message,
        postId,
        commentId,
        triggerAlias,
        triggerAvatarId,
        deepLinkTab: 'posts'
      };

      await storage.createNotification(notificationData);
      console.log(`[Notifications] Created comment notification for ${postOwnerId}`);

      // Send push notification if enabled
      await this.sendPushNotificationForEngagement(postOwnerId, {
        title: '💬 New comment on your post!',
        body: message,
        postId,
        commentId,
        type: 'comment'
      });

    } catch (error) {
      console.error('[Notifications] Failed to create comment notification:', error);
    }
  }

  // Create poll vote notification
  async createPollVoteNotification(
    postId: string,
    postOwnerId: string,
    triggerAlias: string,
    triggerAvatarId: string,
    optionChosen: string
  ): Promise<void> {
    try {
      // Don't notify users about their own votes
      if (postOwnerId === triggerAlias) return;

      const message = `${triggerAlias} voted "${optionChosen}" on your poll`;

      const notificationData: InsertNotification = {
        recipientSessionId: postOwnerId,
        type: 'poll_vote',
        message,
        postId,
        triggerAlias,
        triggerAvatarId,
        deepLinkTab: 'posts'
      };

      await storage.createNotification(notificationData);
      console.log(`[Notifications] Created poll vote notification for ${postOwnerId}`);

      // Send push notification if enabled
      await this.sendPushNotificationForEngagement(postOwnerId, {
        title: '🗳️ Someone voted on your poll!',
        body: message,
        postId,
        type: 'poll_vote'
      });

    } catch (error) {
      console.error('[Notifications] Failed to create poll vote notification:', error);
    }
  }

  // Create debate vote notification
  async createDebateVoteNotification(
    postId: string,
    postOwnerId: string,
    triggerAlias: string,
    triggerAvatarId: string,
    voteType: 'up' | 'down'
  ): Promise<void> {
    try {
      // Don't notify users about their own votes
      if (postOwnerId === triggerAlias) return;

      const voteEmoji = voteType === 'up' ? '👍' : '👎';
      const message = `${triggerAlias} voted ${voteEmoji} on your debate`;

      const notificationData: InsertNotification = {
        recipientSessionId: postOwnerId,
        type: 'debate_vote',
        message,
        postId,
        triggerAlias,
        triggerAvatarId,
        deepLinkTab: 'posts'
      };

      await storage.createNotification(notificationData);
      console.log(`[Notifications] Created debate vote notification for ${postOwnerId}`);

      // Send push notification if enabled
      await this.sendPushNotificationForEngagement(postOwnerId, {
        title: '🔥 Someone voted on your debate!',
        body: message,
        postId,
        type: 'debate_vote'
      });

    } catch (error) {
      console.error('[Notifications] Failed to create debate vote notification:', error);
    }
  }

  // Send push notification for user engagement
  private async sendPushNotificationForEngagement(
    sessionId: string,
    options: {
      title: string;
      body: string;
      postId: string;
      commentId?: string;
      type: string;
    }
  ): Promise<void> {
    try {
      // Check if user has engagement notifications enabled
      const subscriptions = await storage.getActiveSubscriptionsForType('engagement');
      const userSubscriptions = subscriptions.filter(sub => sub.sessionId === sessionId);

      if (userSubscriptions.length === 0) {
        return; // User doesn't have engagement notifications enabled
      }

      const payload = JSON.stringify({
        title: options.title,
        body: options.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `engagement-${options.postId}`,
        data: {
          url: `/profile?postId=${options.postId}&tab=posts&highlight=true${options.commentId ? `&commentId=${options.commentId}` : ''}`,
          type: options.type,
          postId: options.postId,
          commentId: options.commentId,
          action: 'view_post'
        },
        actions: [
          {
            action: 'view',
            title: 'View Post',
            icon: '/favicon.ico'
          }
        ],
        requireInteraction: false,
        silent: false
      });

      // Queue notifications for all user's subscriptions
      for (const subscription of userSubscriptions) {
        pushNotificationService.queueEngagementNotification(subscription, payload);
      }

      console.log(`[Notifications] Queued ${userSubscriptions.length} engagement notifications`);

    } catch (error) {
      console.error('[Notifications] Failed to send engagement push notification:', error);
    }
  }

  // Get reaction emoji for notification display
  private getReactionEmoji(reactionType: string): string {
    const emojiMap: Record<string, string> = {
      thumbsUp: '👍',
      thumbsDown: '👎',
      laugh: '😂',
      sad: '😢'
    };
    return emojiMap[reactionType] || '👍';
  }

  // Truncate content for notifications
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + '...';
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, sessionId: string): Promise<void> {
    try {
      await storage.markNotificationAsRead(notificationId, sessionId);
      console.log(`[Notifications] Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('[Notifications] Failed to mark notification as read:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount(sessionId: string): Promise<number> {
    try {
      return await storage.getUnreadNotificationCount(sessionId);
    } catch (error) {
      console.error('[Notifications] Failed to get unread count:', error);
      return 0;
    }
  }

  // Get notifications for user
  async getNotifications(sessionId: string): Promise<any[]> {
    try {
      return await storage.getNotifications(sessionId);
    } catch (error) {
      console.error('[Notifications] Failed to get notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();