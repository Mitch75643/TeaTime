import { type Post, type InsertPost, type Comment, type InsertComment, type Reaction, type DramaVote, type ReactionInput, type DramaVoteInput, type Report, type UserFlag, type Notification, type NotificationInput, type AnonymousUser, type DeviceSession, type BannedDevice, type RestrictedDevice, type CreateAnonymousUserInput, type UpgradeAccountInput, type LoginInput, type ContentPrompt, type InsertContentPrompt, type WeeklyTheme, type InsertWeeklyTheme, type RotationCycle, type InsertRotationCycle, type Leaderboard, type PushSubscription, type InsertPushSubscription, type PushNotificationLog, type DailyPromptStreak, type InsertDailyPromptStreak, type DailyPromptSubmission, type InsertDailyPromptSubmission } from "@shared/schema";
import { type AdminFingerprint, type InsertAdminFingerprint, type AdminEmail, type InsertAdminEmail, type AdminSession, type InsertAdminSession, type AdminActivityLog, type InsertAdminActivityLog } from "@shared/admin-schema";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export interface IStorage {
  // Posts
  createPost(post: InsertPost, alias: string, sessionId?: string, anonId?: string, deviceFingerprint?: string): Promise<Post>;
  getPosts(category?: string, sortBy?: 'trending' | 'new', tags?: string, userSessionId?: string, postContext?: string, section?: string, storyCategory?: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePostReactions(postId: string, reactions: Record<string, number>): Promise<void>;
  updatePostCommentCount(postId: string, count: number): Promise<void>;
  deletePost(postId: string, sessionId?: string): Promise<void>;
  // Post Stats tracking
  trackPostView(postId: string, sessionId: string): Promise<void>;
  getPostStats(postId: string): Promise<{ viewCount: number; commentCount: number; reactions: Record<string, number>; lastViewedAt?: Date }>;
  getUserPostStats(sessionId: string): Promise<Array<{ postId: string; viewCount: number; commentCount: number; reactions: Record<string, number>; lastViewedAt?: Date; postContent: string; category: string; createdAt: Date }>>;
  
  // Comments
  createComment(comment: InsertComment, alias: string, sessionId: string): Promise<Comment>;
  getComments(postId: string): Promise<Comment[]>;
  updateCommentReactions(commentId: string, reactions: Record<string, number>): Promise<void>;
  
  // Reactions
  createReaction(reaction: ReactionInput, sessionId: string): Promise<Reaction>;
  addReaction(reaction: ReactionInput, sessionId: string): Promise<void>;
  removeReaction(reaction: ReactionInput, sessionId: string): Promise<void>;
  hasUserReacted(postId: string | undefined, commentId: string | undefined, type: string, sessionId: string): Promise<boolean>;
  getUserReactionForPost(postId: string, sessionId: string): Promise<string | null>;
  getUserReactionForComment(commentId: string, sessionId: string): Promise<string | null>;
  removeAllUserReactionsForPost(postId: string, sessionId: string): Promise<void>;
  removeAllUserReactionsForComment(commentId: string, sessionId: string): Promise<void>;
  
  // Drama Votes
  addDramaVote(vote: DramaVoteInput, sessionId: string): Promise<void>;
  getDramaVotes(postId: string): Promise<Record<string, number>>;
  hasUserVoted(postId: string, sessionId: string): Promise<boolean>;
  
  // Poll and Debate Voting
  addPollVote(postId: string, sessionId: string, option: 'optionA' | 'optionB'): Promise<void>;
  addDebateVote(postId: string, sessionId: string, vote: 'up' | 'down'): Promise<void>;
  hasUserVotedInPoll(postId: string, sessionId: string): Promise<boolean>;
  hasUserVotedInDebate(postId: string, sessionId: string): Promise<boolean>;
  
  // Reports and Moderation
  reportPost(postId: string, reporterSessionId: string, reason: string): Promise<{ success: boolean; error?: string; postRemoved?: boolean; userFlagged?: boolean }>;
  getUserFlags(sessionId: string): Promise<UserFlag | undefined>;
  flagUser(sessionId: string): Promise<void>;
  
  // Notifications
  createNotification(notification: NotificationInput): Promise<void>;
  getNotifications(sessionId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, sessionId: string): Promise<void>;
  markAllNotificationsAsRead(sessionId: string): Promise<void>;
  getUnreadNotificationCount(sessionId: string): Promise<number>;
  
  // Anonymous User System
  findUserByDeviceFingerprint(deviceFingerprint: string): Promise<AnonymousUser | undefined>;
  createAnonymousUser(userData: CreateAnonymousUserInput, sessionId: string): Promise<AnonymousUser>;
  getAnonymousUser(anonId: string): Promise<AnonymousUser | undefined>;
  getAnonymousUserBySession(sessionId: string): Promise<AnonymousUser | undefined>;
  syncUserSession(anonId: string, sessionId: string, deviceFingerprint?: string): Promise<AnonymousUser>;
  upgradeAccount(anonId: string, upgradeData: UpgradeAccountInput): Promise<{ success: boolean; error?: string }>;
  loginUser(loginData: LoginInput & { deviceFingerprint?: string }): Promise<{ success: boolean; error?: string; user?: AnonymousUser }>;
  updateUserProfile(anonId: string, updates: { alias?: string; avatarId?: string }): Promise<void>;
  updateUserAvatarColor(userId: string, avatarColor: string): Promise<void>;
  createDeviceSession(anonUserId: string, sessionId: string, deviceFingerprint?: string): Promise<DeviceSession>;
  
  // Username uniqueness checks
  isUsernameUnique(alias: string): Promise<boolean>;
  generateUniqueUsername(baseAlias?: string): Promise<string>;
  
  // Device Ban System
  createBannedDevice(banData: { deviceFingerprint: string; bannedBy?: string; banReason?: string; isTemporary?: boolean; expiresAt?: string; deviceMetadata?: Record<string, any> }): Promise<BannedDevice>;
  getBannedDevice(deviceFingerprint: string): Promise<BannedDevice | undefined>;
  getAllBannedDevices(): Promise<BannedDevice[]>;
  updateBannedDevice(deviceFingerprint: string, updates: Partial<BannedDevice>): Promise<boolean>;
  removeBannedDevice(deviceFingerprint: string): Promise<boolean>;

  // Device Restriction System
  createRestrictedDevice(restrictionData: { deviceFingerprint: string; restrictedBy?: string; restrictionReason?: string; restrictionType: string; isTemporary?: boolean; expiresAt?: string; restrictions?: Record<string, any>; deviceMetadata?: Record<string, any> }): Promise<RestrictedDevice>;
  getRestrictedDevice(deviceFingerprint: string): Promise<RestrictedDevice | undefined>;
  getAllRestrictedDevices(): Promise<RestrictedDevice[]>;
  updateRestrictedDevice(deviceFingerprint: string, updates: Partial<RestrictedDevice>): Promise<boolean>;
  removeRestrictedDevice(deviceFingerprint: string): Promise<boolean>;

  // Auto-rotation System
  createContentPrompt(prompt: InsertContentPrompt): Promise<ContentPrompt>;
  getContentPrompts(type?: string, onlyUnused?: boolean): Promise<ContentPrompt[]>;
  markPromptAsUsed(promptId: string): Promise<void>;
  createWeeklyTheme(theme: InsertWeeklyTheme): Promise<WeeklyTheme>;
  getWeeklyThemes(): Promise<WeeklyTheme[]>;
  setActiveTheme(themeId: string): Promise<void>;
  createRotationCycle(cycle: InsertRotationCycle): Promise<RotationCycle>;
  getRotationCycles(): Promise<RotationCycle[]>;
  updateRotationCycle(cycleId: string, updates: Partial<RotationCycle>): Promise<void>;
  createLeaderboard(leaderboard: Omit<Leaderboard, 'id' | 'createdAt'>): Promise<Leaderboard>;
  getActiveLeaderboards(type?: string): Promise<Leaderboard[]>;
  deactivateLeaderboards(type: string): Promise<void>;

  // Push Notifications
  createPushSubscription(subscription: any): Promise<any>;
  getPushSubscriptions(sessionId: string): Promise<any[]>;
  getActiveSubscriptionsForType(notificationType: string): Promise<any[]>;
  deactivatePushSubscription(subscriptionId: string): Promise<void>;
  updatePushSubscriptionPreferences(subscriptionId: string, notificationTypes: string[]): Promise<void>;
  updatePushSubscriptionLastUsed(subscriptionId: string): Promise<void>;
  logPushNotification(subscriptionId: string, notificationType: string, promptContent: string, status: string): Promise<void>;
  updatePushNotificationStatus(subscriptionId: string, status: string, failureReason?: string): Promise<void>;
  getPushNotificationStats(sessionId?: string): Promise<{ totalSubscriptions: number; activeSubscriptions: number; sentNotifications: number; failedNotifications: number }>;
  cleanupOldPushSubscriptions(cutoffDate: Date): Promise<void>;
  cleanupOldPushNotificationLogs(cutoffDate: Date): Promise<void>;

  // Daily Prompt Streak Tracking
  getUserStreak(sessionId: string): Promise<DailyPromptStreak | undefined>;
  createOrUpdateStreak(sessionId: string, promptId: string, promptContent: string): Promise<{ streak: DailyPromptStreak; streakBroken: boolean; newSubmission: DailyPromptSubmission }>;
  recordDailyPromptSubmission(submission: InsertDailyPromptSubmission): Promise<DailyPromptSubmission>;
  validateDailyPromptSubmission(sessionId: string, promptId: string, submissionDate: string): Promise<{ isValid: boolean; reason?: string }>;
  getDailyPromptSubmissions(sessionId: string, limit?: number): Promise<DailyPromptSubmission[]>;

  // Admin Authentication System
  createAdminFingerprint(fingerprintData: InsertAdminFingerprint): Promise<AdminFingerprint>;
  getAdminFingerprint(fingerprint: string): Promise<AdminFingerprint | undefined>;
  deactivateAdminFingerprint(fingerprint: string): Promise<void>;
  createAdminEmail(emailData: InsertAdminEmail): Promise<AdminEmail>;
  getAdminEmail(email: string, fingerprint: string): Promise<AdminEmail | undefined>;
  getAdminEmailByEmail(email: string): Promise<AdminEmail | undefined>;
  updateAdminEmailLastLogin(email: string): Promise<void>;
  deactivateAdminEmail(email: string): Promise<void>;
  createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(sessionId: string): Promise<AdminSession | undefined>;
  updateAdminSessionActivity(sessionId: string): Promise<void>;
  deactivateAdminSession(sessionId: string): Promise<void>;
  deactivateAdminSessionsByEmail(email: string): Promise<void>;
  createAdminActivityLog(logData: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAllActiveAdmins(): Promise<Array<{
    email: string;
    fingerprint: string;
    fingerprintLabel: string;
    role: string;
    isRootHost: boolean;
    lastLogin?: Date;
    createdAt: Date;
  }>>;
  
  // User Management for Admin
  getAllUsersForManagement(): Promise<any[]>;
  
  // Get all banned users for admin panel
  getAllBannedUsers(): Promise<BannedDevice[]>;
  getAdminEmail(email: string, fingerprint: string): Promise<AdminEmail | undefined>;
  getAdminEmailByEmail(email: string): Promise<AdminEmail | undefined>;
  updateAdminEmailLastLogin(email: string): Promise<void>;
  deactivateAdminEmail(email: string): Promise<void>;
  createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(sessionId: string): Promise<AdminSession | undefined>;
  updateAdminSessionActivity(sessionId: string): Promise<void>;
  deactivateAdminSession(sessionId: string): Promise<void>;
  deactivateAdminSessionsByEmail(email: string): Promise<void>;
  createAdminActivityLog(logData: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAllActiveAdmins(): Promise<Array<{
    email: string;
    fingerprint: string;
    fingerprintLabel: string;
    role: string;
    isRootHost: boolean;
    lastLogin?: Date;
    createdAt: Date;
  }>>;
  
  // Get all banned users for admin panel
  getAllBannedUsers(): Promise<BannedDevice[]>;
}

export class MemStorage implements IStorage {
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;
  private reactions: Map<string, Reaction>;
  private dramaVotes: Map<string, DramaVote>;
  private reports: Map<string, Report>;
  private userFlags: Map<string, UserFlag>;
  private notifications: Map<string, Notification>;
  private anonymousUsers: Map<string, AnonymousUser>;
  private deviceSessions: Map<string, DeviceSession>;
  private bannedDevices: Map<string, BannedDevice>;
  private restrictedDevices: Map<string, RestrictedDevice>;
  private contentPrompts: Map<string, ContentPrompt>;
  private weeklyThemes: Map<string, WeeklyTheme>;
  private rotationCycles: Map<string, RotationCycle>;
  private leaderboards: Map<string, Leaderboard>;
  private pushSubscriptions: Map<string, any>;
  private pushNotificationLogs: Map<string, any>;
  private dailyPromptStreaks: Map<string, DailyPromptStreak>;
  private dailyPromptSubmissions: Map<string, DailyPromptSubmission>;
  private adminFingerprints: Map<string, AdminFingerprint>;
  private adminEmails: Map<string, AdminEmail>;
  private adminSessions: Map<string, AdminSession>;
  private adminActivityLogs: Map<string, AdminActivityLog>;
  private pollVotes: Map<string, { sessionId: string; postId: string; option: 'optionA' | 'optionB' }>;
  private debateVotes: Map<string, { sessionId: string; postId: string; vote: 'up' | 'down' }>;

  constructor() {
    this.posts = new Map();
    this.comments = new Map();
    this.reactions = new Map();
    this.dramaVotes = new Map();
    this.reports = new Map();
    this.userFlags = new Map();
    this.notifications = new Map();
    this.anonymousUsers = new Map();
    this.deviceSessions = new Map();
    this.bannedDevices = new Map();
    this.restrictedDevices = new Map();
    this.contentPrompts = new Map();
    this.weeklyThemes = new Map();
    this.rotationCycles = new Map();
    this.leaderboards = new Map();
    this.pushSubscriptions = new Map();
    this.pushNotificationLogs = new Map();
    this.dailyPromptStreaks = new Map();
    this.dailyPromptSubmissions = new Map();
    this.adminFingerprints = new Map();
    this.adminEmails = new Map();
    this.adminSessions = new Map();
    this.adminActivityLogs = new Map();
    this.pollVotes = new Map();
    this.debateVotes = new Map();
  }

  async createPost(insertPost: InsertPost, alias: string, sessionId?: string, anonId?: string, deviceFingerprint?: string): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      alias,
      avatarId: insertPost.avatarId || 'happy-face',
      avatarColor: insertPost.avatarColor,
      reactions: { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 },
      commentCount: 0,
      isDrama: insertPost.category === 'drama',
      createdAt: new Date(),
      sessionId: sessionId || 'anonymous',
      anonId: anonId || null,
      deviceFingerprint: deviceFingerprint || null,
      postContext: insertPost.postContext || 'home',
      communitySection: insertPost.communitySection || null,
      reportCount: 0,
      isRemoved: false,
      postType: insertPost.postType || 'standard',
      celebrityName: insertPost.celebrityName || null,
      storyType: insertPost.storyType || null,
      topicTitle: insertPost.topicTitle || null,
      pollOptions: insertPost.pollOptions,
      pollVotes: insertPost.postType === 'poll' ? {optionA: 0, optionB: 0} : undefined,
      debateVotes: insertPost.postType === 'debate' ? {up: 0, down: 0} : undefined,
      allowComments: insertPost.allowComments !== false,
      // Initialize post stats fields
      viewCount: 0,
      lastViewedAt: undefined,
      viewSessions: [],
    };
    this.posts.set(id, post);
    return post;
  }

  async getPosts(category?: string, sortBy: 'trending' | 'new' = 'new', tags?: string, userSessionId?: string, postContext?: string, section?: string, storyCategory?: string, hotTopicFilter?: string): Promise<Post[]> {
    let posts = Array.from(this.posts.values());
    
    // Filter out removed posts
    posts = posts.filter(post => !post.isRemoved);
    
    // Filter by user session if requested
    if (userSessionId) {
      posts = posts.filter(post => post.sessionId === userSessionId);
    }
    
    // STRICT POST ISOLATION: Filter by post context (home, daily, community)
    if (postContext) {
      posts = posts.filter(post => post.postContext === postContext);
    }
    
    // STRICT ISOLATION: When requesting HOME posts, explicitly exclude community posts
    if (postContext === 'home') {
      posts = posts.filter(post => !post.communitySection || post.communitySection === null);
    }
    
    // STRICT ISOLATION: When requesting community posts, only show posts from that specific section
    if (section) {
      posts = posts.filter(post => post.communitySection === section);
    }
    
    // Filter by story category (for Story Time topic)
    if (storyCategory && storyCategory !== 'all' && section === 'story-time') {
      posts = posts.filter(post => post.storyType === storyCategory);
    }
    
    // Filter by hot topic (for Hot Topics section)
    if (hotTopicFilter && hotTopicFilter !== 'all' && section === 'hot-topics') {
      posts = posts.filter(post => post.topicTitle === hotTopicFilter);
    }
    
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }
    
    if (tags) {
      posts = posts.filter(post => 
        post.tags && post.tags.some(tag => tag === tags)
      );
    }
    
    if (sortBy === 'trending') {
      posts.sort((a, b) => {
        const aReactions = a.reactions as any || {};
        const bReactions = b.reactions as any || {};
        const aScore = (aReactions.laugh || 0) * 3 + (aReactions.thumbsUp || 0) * 2 + (aReactions.sad || 0) + (aReactions.thumbsDown || 0) * 0.5 + (a.commentCount || 0) * 2;
        const bScore = (bReactions.laugh || 0) * 3 + (bReactions.thumbsUp || 0) * 2 + (bReactions.sad || 0) + (bReactions.thumbsDown || 0) * 0.5 + (b.commentCount || 0) * 2;
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }

  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async updatePostReactions(postId: string, reactions: Record<string, number>): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.reactions = reactions;
      this.posts.set(postId, post);
    }
  }

  async updatePostCommentCount(postId: string, count: number): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.commentCount = count;
      this.posts.set(postId, post);
    }
  }

  async createComment(insertComment: InsertComment, alias: string, sessionId: string): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      alias,
      avatarId: 'happy-face',
      avatarColor: insertComment.avatarColor,
      sessionId,
      parentCommentId: insertComment.parentCommentId || null,
      reactions: { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 },
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    
    // Update post comment count (only count top-level comments)
    const postComments = Array.from(this.comments.values()).filter(c => 
      c.postId === insertComment.postId && !c.parentCommentId
    );
    await this.updatePostCommentCount(insertComment.postId, postComments.length);
    
    return comment;
  }

  async getComments(postId: string): Promise<Comment[]> {
    const allComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    // Organize comments hierarchically
    const topLevelComments = allComments.filter(c => !c.parentCommentId);
    const replies = allComments.filter(c => c.parentCommentId);
    
    // Build the hierarchical structure
    const commentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parentCommentId === comment.id)
    }));
    
    return commentsWithReplies;
  }

  async updateCommentReactions(commentId: string, reactions: Record<string, number>): Promise<void> {
    const comment = this.comments.get(commentId);
    if (comment) {
      comment.reactions = reactions;
      this.comments.set(commentId, comment);
    }
  }

  async createReaction(reaction: ReactionInput, sessionId: string): Promise<Reaction> {
    const id = randomUUID();
    const newReaction: Reaction = {
      id,
      postId: reaction.postId || null,
      commentId: reaction.commentId || null,
      type: reaction.type,
      sessionId,
      createdAt: new Date(),
    };
    this.reactions.set(id, newReaction);
    return newReaction;
  }

  async addReaction(reaction: ReactionInput, sessionId: string): Promise<void> {
    const id = randomUUID();
    const newReaction: Reaction = {
      id,
      postId: reaction.postId || null,
      commentId: reaction.commentId || null,
      type: reaction.type,
      sessionId,
      createdAt: new Date(),
    };
    this.reactions.set(id, newReaction);

    // Update reaction counts
    if (reaction.postId) {
      await this.updateReactionCounts('post', reaction.postId);
    } else if (reaction.commentId) {
      await this.updateReactionCounts('comment', reaction.commentId);
    }
  }

  async removeReaction(reaction: ReactionInput, sessionId: string): Promise<void> {
    const existingReaction = Array.from(this.reactions.values()).find(r => 
      r.sessionId === sessionId && 
      r.type === reaction.type &&
      r.postId === reaction.postId &&
      r.commentId === reaction.commentId
    );
    
    if (existingReaction) {
      this.reactions.delete(existingReaction.id);
      
      // Update reaction counts
      if (reaction.postId) {
        await this.updateReactionCounts('post', reaction.postId);
      } else if (reaction.commentId) {
        await this.updateReactionCounts('comment', reaction.commentId);
      }
    }
  }

  private async updateReactionCounts(type: 'post' | 'comment', id: string): Promise<void> {
    const reactions = Array.from(this.reactions.values()).filter(r => 
      type === 'post' ? r.postId === id : r.commentId === id
    );
    
    const counts = {
      thumbsUp: reactions.filter(r => r.type === 'thumbsUp').length,
      thumbsDown: reactions.filter(r => r.type === 'thumbsDown').length,
      laugh: reactions.filter(r => r.type === 'laugh').length,
      sad: reactions.filter(r => r.type === 'sad').length,
    };

    if (type === 'post') {
      await this.updatePostReactions(id, counts);
    } else {
      await this.updateCommentReactions(id, counts);
    }
  }

  async hasUserReacted(postId: string | undefined, commentId: string | undefined, type: string, sessionId: string): Promise<boolean> {
    return Array.from(this.reactions.values()).some(r => 
      r.sessionId === sessionId && 
      r.type === type &&
      r.postId === postId &&
      r.commentId === commentId
    );
  }

  async getUserReactionForPost(postId: string, sessionId: string): Promise<string | null> {
    const userReaction = Array.from(this.reactions.values()).find(r => 
      r.sessionId === sessionId && r.postId === postId
    );
    return userReaction ? userReaction.type : null;
  }

  async getUserReactionForComment(commentId: string, sessionId: string): Promise<string | null> {
    const userReaction = Array.from(this.reactions.values()).find(r => 
      r.sessionId === sessionId && r.commentId === commentId
    );
    return userReaction ? userReaction.type : null;
  }

  async removeAllUserReactionsForPost(postId: string, sessionId: string): Promise<void> {
    const userReactions = Array.from(this.reactions.values()).filter(r => 
      r.sessionId === sessionId && r.postId === postId
    );
    
    for (const reaction of userReactions) {
      this.reactions.delete(reaction.id);
    }
    
    await this.updateReactionCounts('post', postId);
  }

  async removeAllUserReactionsForComment(commentId: string, sessionId: string): Promise<void> {
    const userReactions = Array.from(this.reactions.values()).filter(r => 
      r.sessionId === sessionId && r.commentId === commentId
    );
    
    userReactions.forEach(reaction => {
      this.reactions.delete(reaction.id);
    });

    // Update reaction counts after removing all user reactions
    await this.updateReactionCounts('comment', commentId);
  }

  async addDramaVote(vote: DramaVoteInput, sessionId: string): Promise<void> {
    // Remove existing vote from this session for this post
    const existingVote = Array.from(this.dramaVotes.values()).find(v => 
      v.postId === vote.postId && v.sessionId === sessionId
    );
    if (existingVote) {
      this.dramaVotes.delete(existingVote.id);
    }

    const id = randomUUID();
    const newVote: DramaVote = {
      id,
      postId: vote.postId,
      voteType: vote.voteType,
      sessionId,
      createdAt: new Date(),
    };
    this.dramaVotes.set(id, newVote);
  }

  async getDramaVotes(postId: string): Promise<Record<string, number>> {
    const votes = Array.from(this.dramaVotes.values()).filter(v => v.postId === postId);
    
    return {
      wrong: votes.filter(v => v.voteType === 'wrong').length,
      valid: votes.filter(v => v.voteType === 'valid').length,
      both_wild: votes.filter(v => v.voteType === 'both_wild').length,
      iconic: votes.filter(v => v.voteType === 'iconic').length,
    };
  }

  async hasUserVoted(postId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.dramaVotes.values()).some(v => 
      v.postId === postId && v.sessionId === sessionId
    );
  }

  async deletePost(postId: string, sessionId?: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Check if the session owns this post (for user posts only)
    if (sessionId && post.sessionId !== sessionId) {
      throw new Error("Not authorized to delete this post");
    }
    
    this.posts.delete(postId);
    // Also delete related comments and reactions
    const commentsToDelete = Array.from(this.comments.values()).filter(c => c.postId === postId);
    commentsToDelete.forEach(comment => this.comments.delete(comment.id));
    
    const reactionsToDelete = Array.from(this.reactions.values()).filter(r => r.postId === postId);
    reactionsToDelete.forEach(reaction => this.reactions.delete(reaction.id));
    
    const votesToDelete = Array.from(this.dramaVotes.values()).filter(v => v.postId === postId);
    votesToDelete.forEach(vote => this.dramaVotes.delete(vote.id));
  }

  async reportPost(postId: string, reporterSessionId: string, reason: string): Promise<{ success: boolean; error?: string; postRemoved?: boolean; userFlagged?: boolean }> {
    const post = this.posts.get(postId);
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check if user already reported this post
    const existingReport = Array.from(this.reports.values()).find(r => 
      r.postId === postId && r.reporterSessionId === reporterSessionId
    );
    if (existingReport) {
      return { success: false, error: "You have already reported this post" };
    }

    // Create new report
    const reportId = randomUUID();
    const report: Report = {
      id: reportId,
      postId,
      reporterSessionId,
      reason,
      createdAt: new Date(),
    };
    this.reports.set(reportId, report);

    // Increment report count on post
    const updatedPost = { ...post, reportCount: (post.reportCount || 0) + 1 };
    this.posts.set(postId, updatedPost);

    // Auto-moderation: Remove post if it gets 3+ reports
    let postRemoved = false;
    let userFlagged = false;
    
    if (updatedPost.reportCount >= 3) {
      // Mark post as removed
      this.posts.set(postId, { ...updatedPost, isRemoved: true });
      postRemoved = true;

      // Flag the post author
      if (post.sessionId) {
        await this.flagUser(post.sessionId);
        userFlagged = true;
      }
    }

    return { 
      success: true, 
      postRemoved,
      userFlagged
    };
  }

  async getUserFlags(sessionId: string): Promise<UserFlag | undefined> {
    return Array.from(this.userFlags.values()).find(f => f.sessionId === sessionId);
  }

  async flagUser(sessionId: string): Promise<void> {
    const existingFlag = await this.getUserFlags(sessionId);
    
    if (existingFlag) {
      // Increment flag count
      const updatedFlag = {
        ...existingFlag,
        flagCount: (existingFlag.flagCount || 0) + 1,
        lastFlaggedAt: new Date(),
        isBanned: ((existingFlag.flagCount || 0) + 1) >= 3 // Ban after 3 flags
      };
      this.userFlags.set(existingFlag.id, updatedFlag);
    } else {
      // Create new flag record
      const flagId = randomUUID();
      const newFlag: UserFlag = {
        id: flagId,
        sessionId,
        flagCount: 1,
        isBanned: false,
        lastFlaggedAt: new Date(),
        createdAt: new Date(),
      };
      this.userFlags.set(flagId, newFlag);
    }
  }

  // Notification methods
  async createNotification(notification: NotificationInput): Promise<void> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      recipientSessionId: notification.recipientSessionId,
      type: notification.type,
      message: notification.message,
      postId: notification.postId || null,
      commentId: notification.commentId || null,
      triggerAlias: notification.triggerAlias,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    console.log('[Storage] Created notification:', id, 'for session:', notification.recipientSessionId, 'total notifications:', this.notifications.size);
  }

  async getNotifications(sessionId: string): Promise<Notification[]> {
    const allNotifications = Array.from(this.notifications.values());
    const userNotifications = allNotifications.filter(n => n.recipientSessionId === sessionId);
    console.log('[Storage] Getting notifications for session:', sessionId, 'found:', userNotifications.length, 'total in storage:', allNotifications.length);
    return userNotifications.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async markNotificationAsRead(notificationId: string, sessionId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification && notification.recipientSessionId === sessionId) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
    }
  }

  async markAllNotificationsAsRead(sessionId: string): Promise<void> {
    for (const [id, notification] of Array.from(this.notifications.entries())) {
      if (notification.recipientSessionId === sessionId && !notification.isRead) {
        notification.isRead = true;
        this.notifications.set(id, notification);
      }
    }
  }

  async getUnreadNotificationCount(sessionId: string): Promise<number> {
    const allNotifications = Array.from(this.notifications.values());
    const unreadForUser = allNotifications.filter(n => n.recipientSessionId === sessionId && !n.isRead);
    console.log('[Storage] Getting unread count for session:', sessionId, 'unread:', unreadForUser.length, 'total notifications:', allNotifications.length);
    return unreadForUser.length;
  }

  // Anonymous User System methods
  private generateAnonId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'anon_';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  async findUserByDeviceFingerprint(deviceFingerprint: string): Promise<AnonymousUser | undefined> {
    return Array.from(this.anonymousUsers.values())
      .find(user => user.deviceFingerprint === deviceFingerprint);
  }

  async createAnonymousUser(userData: CreateAnonymousUserInput, sessionId: string): Promise<AnonymousUser> {
    // First check if a user already exists with this device fingerprint
    if (userData.deviceFingerprint) {
      const existingUser = await this.findUserByDeviceFingerprint(userData.deviceFingerprint);
      if (existingUser) {
        // User exists on this device, sync the session and return existing user
        console.log(`Found existing user for device fingerprint: ${userData.deviceFingerprint}`);
        return await this.syncUserSession(existingUser.anonId, sessionId, userData.deviceFingerprint);
      }
    }

    // No existing user found, create new one
    const id = randomUUID();
    const anonId = this.generateAnonId();
    
    // Generate unique username
    const uniqueAlias = userData.alias ? 
      await this.generateUniqueUsername(userData.alias) : 
      await this.generateUniqueUsername();
    
    const user: AnonymousUser = {
      id,
      anonId,
      sessionId,
      deviceFingerprint: userData.deviceFingerprint || null,
      alias: uniqueAlias,
      avatarId: userData.avatarId || 'happy-face',
      avatarColor: userData.avatarColor || 'from-purple-400 to-pink-500',
      isUpgraded: false,
      passphraseHash: null,
      email: null,
      emailVerified: false,
      biometricEnabled: false,
      secureTokenHash: null,
      biometricDevices: [],
      preferences: {},
      postCount: 0,
      totalReactions: 0,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isBanned: false,
      banReason: null,
    };

    this.anonymousUsers.set(id, user);
    console.log(`Created new user with device fingerprint: ${userData.deviceFingerprint}`);
    
    // Create device session
    await this.createDeviceSession(id, sessionId, userData.deviceFingerprint);
    
    return user;
  }

  async getAnonymousUser(anonId: string): Promise<AnonymousUser | undefined> {
    return Array.from(this.anonymousUsers.values()).find(user => user.anonId === anonId);
  }

  async getAnonymousUserBySession(sessionId: string): Promise<AnonymousUser | undefined> {
    return Array.from(this.anonymousUsers.values()).find(user => user.sessionId === sessionId);
  }

  async syncUserSession(anonId: string, sessionId: string, deviceFingerprint?: string): Promise<AnonymousUser> {
    const user = await this.getAnonymousUser(anonId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update session ID and last active
    user.sessionId = sessionId;
    user.lastActiveAt = new Date();
    this.anonymousUsers.set(user.id, user);

    // Create new device session if needed
    const existingSession = Array.from(this.deviceSessions.values())
      .find(session => session.anonUserId === user.id && session.sessionId === sessionId);
    
    if (!existingSession) {
      await this.createDeviceSession(user.id, sessionId, deviceFingerprint);
    }

    return user;
  }

  async upgradeAccount(anonId: string, upgradeData: UpgradeAccountInput): Promise<{ success: boolean; error?: string }> {
    const user = await this.getAnonymousUser(anonId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.isUpgraded) {
      return { success: false, error: 'Account already upgraded' };
    }

    try {
      if (upgradeData.upgradeType === 'passphrase' && upgradeData.passphrase) {
        user.passphraseHash = this.hashPassword(upgradeData.passphrase);
      } else if (upgradeData.upgradeType === 'email' && upgradeData.email) {
        // Check if email already exists
        const existingUser = Array.from(this.anonymousUsers.values())
          .find(u => u.email === upgradeData.email && u.id !== user.id);
        
        if (existingUser) {
          return { success: false, error: 'Email already in use' };
        }
        
        user.email = upgradeData.email;
        user.emailVerified = true; // For demo purposes
      }

      user.isUpgraded = true;
      this.anonymousUsers.set(user.id, user);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to upgrade account' };
    }
  }

  async loginUser(loginData: LoginInput & { deviceFingerprint?: string }): Promise<{ success: boolean; error?: string; user?: AnonymousUser }> {
    try {
      let user: AnonymousUser | undefined;

      if (loginData.loginType === 'passphrase' && loginData.passphrase) {
        const hashedPassphrase = this.hashPassword(loginData.passphrase);
        user = Array.from(this.anonymousUsers.values())
          .find(u => u.passphraseHash === hashedPassphrase && u.isUpgraded);
      } else if (loginData.loginType === 'email' && loginData.email) {
        user = Array.from(this.anonymousUsers.values())
          .find(u => u.email === loginData.email && u.isUpgraded);
      }

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate new session for this device
      const newSessionId = randomUUID();
      user.sessionId = newSessionId;
      user.lastActiveAt = new Date();
      this.anonymousUsers.set(user.id, user);

      // Create device session
      await this.createDeviceSession(user.id, newSessionId, loginData.deviceFingerprint);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  async updateUserProfile(anonId: string, updates: { alias?: string; avatarId?: string }): Promise<void> {
    const user = await this.getAnonymousUser(anonId);
    if (!user) {
      throw new Error('User not found');
    }

    // If updating alias, ensure it's unique
    if (updates.alias) {
      const uniqueAlias = await this.generateUniqueUsername(updates.alias);
      user.alias = uniqueAlias;
    }
    
    if (updates.avatarId) user.avatarId = updates.avatarId;
    
    user.lastActiveAt = new Date();
    this.anonymousUsers.set(user.id, user);
  }

  async updateUserAvatarColor(userId: string, avatarColor: string): Promise<void> {
    const user = this.anonymousUsers.get(userId);
    if (user) {
      user.avatarColor = avatarColor;
      this.anonymousUsers.set(userId, user);
    }
  }

  async updateUserAvatarColorBySession(sessionId: string, avatarColor: string): Promise<void> {
    const user = Array.from(this.anonymousUsers.values()).find(u => u.sessionId === sessionId);
    if (user) {
      user.avatarColor = avatarColor;
      this.anonymousUsers.set(user.id, user);
    } else {
      throw new Error('User not found');
    }
  }

  async createDeviceSession(anonUserId: string, sessionId: string, deviceFingerprint?: string): Promise<DeviceSession> {
    const id = randomUUID();
    const session: DeviceSession = {
      id,
      anonUserId,
      sessionId,
      deviceFingerprint: deviceFingerprint || null,
      deviceName: null, // Could be enhanced with user agent parsing
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    };

    this.deviceSessions.set(id, session);
    return session;
  }

  // Username uniqueness methods
  async isUsernameUnique(alias: string): Promise<boolean> {
    // Check if username exists in the entire database
    const existingUser = Array.from(this.anonymousUsers.values())
      .find(user => user.alias.toLowerCase() === alias.toLowerCase());
    
    return !existingUser;
  }

  async generateUniqueUsername(baseAlias?: string): Promise<string> {
    // Username generation with fun prefixes and suffixes
    const dramaPrefixes = ['Spill', 'Tea', 'Drama', 'Chaos', 'Petty', 'Sassy', 'Messy', 'Shady'];
    const chillPrefixes = ['Calm', 'Zen', 'Cool', 'Chill', 'Smooth', 'Easy', 'Laid', 'Mellow'];
    const funnyPrefixes = ['Giggle', 'Laugh', 'Joke', 'Fun', 'Silly', 'Goofy', 'Witty', 'Quirky'];
    const mysteriousPrefixes = ['Shadow', 'Whisper', 'Secret', 'Hidden', 'Mystery', 'Enigma', 'Phantom', 'Ghost'];
    const coolPrefixes = ['Masked', 'Swift', 'Bold', 'Wild', 'Fierce', 'Rebel', 'Elite', 'Cosmic'];
    
    const suffixes = ['Queen', 'King', 'Master', 'Expert', 'Pro', 'Legend', 'Boss', 'Star', 'Hero', 'Ninja', 'Fox', 'Wolf', 'Tiger', 'Eagle', 'Storm', 'Flame', 'Sage', 'Vibe'];
    
    // If a base alias is provided, try variations first
    if (baseAlias) {
      // Try the base alias first
      if (await this.isUsernameUnique(baseAlias)) {
        return baseAlias;
      }
      
      // Try with numbers appended (e.g., MaskedFox23)
      for (let i = 1; i <= 99; i++) {
        const variant = `${baseAlias}${i}`;
        if (await this.isUsernameUnique(variant)) {
          return variant;
        }
      }
    }
    
    // Generate completely new usernames until unique
    const allPrefixes = [...dramaPrefixes, ...chillPrefixes, ...funnyPrefixes, ...mysteriousPrefixes, ...coolPrefixes];
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const randomPrefix = allPrefixes[Math.floor(Math.random() * allPrefixes.length)];
      const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      
      const newUsername = `${randomPrefix}${randomSuffix}${randomNumber}`;
      
      if (await this.isUsernameUnique(newUsername)) {
        return newUsername;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `AnonymousUser${timestamp}`;
  }

  // Device Ban System methods
  async createBannedDevice(banData: { deviceFingerprint: string; bannedBy?: string; banReason?: string; isTemporary?: boolean; expiresAt?: string; deviceMetadata?: Record<string, any> }): Promise<BannedDevice> {
    const id = randomUUID();
    const bannedDevice: BannedDevice = {
      id,
      deviceFingerprint: banData.deviceFingerprint,
      bannedBy: banData.bannedBy || null,
      banReason: banData.banReason || null,
      isTemporary: banData.isTemporary || false,
      expiresAt: banData.expiresAt || null,
      deviceMetadata: banData.deviceMetadata || {},
      createdAt: new Date(),
    };

    this.bannedDevices.set(banData.deviceFingerprint, bannedDevice);
    return bannedDevice;
  }

  async getBannedDevice(deviceFingerprint: string): Promise<BannedDevice | undefined> {
    return this.bannedDevices.get(deviceFingerprint);
  }

  async getAllBannedDevices(): Promise<BannedDevice[]> {
    return Array.from(this.bannedDevices.values());
  }

  async updateBannedDevice(deviceFingerprint: string, updates: Partial<BannedDevice>): Promise<boolean> {
    const existingBan = this.bannedDevices.get(deviceFingerprint);
    if (!existingBan) {
      return false;
    }

    const updatedBan = { ...existingBan, ...updates };
    this.bannedDevices.set(deviceFingerprint, updatedBan);
    return true;
  }

  async removeBannedDevice(deviceFingerprint: string): Promise<boolean> {
    return this.bannedDevices.delete(deviceFingerprint);
  }

  // Device Restriction System methods
  async createRestrictedDevice(restrictionData: { deviceFingerprint: string; restrictedBy?: string; restrictionReason?: string; restrictionType: string; isTemporary?: boolean; expiresAt?: string; restrictions?: Record<string, any>; deviceMetadata?: Record<string, any> }): Promise<RestrictedDevice> {
    const id = randomUUID();
    const restriction: RestrictedDevice = {
      id,
      deviceFingerprint: restrictionData.deviceFingerprint,
      restrictedBy: restrictionData.restrictedBy || null,
      restrictionReason: restrictionData.restrictionReason || null,
      restrictionType: restrictionData.restrictionType,
      isTemporary: restrictionData.isTemporary || false,
      expiresAt: restrictionData.expiresAt ? new Date(restrictionData.expiresAt) : null,
      restrictions: restrictionData.restrictions || {},
      deviceMetadata: restrictionData.deviceMetadata || {},
      createdAt: new Date(),
    };
    this.restrictedDevices.set(restrictionData.deviceFingerprint, restriction);
    return restriction;
  }

  async getRestrictedDevice(deviceFingerprint: string): Promise<RestrictedDevice | undefined> {
    return this.restrictedDevices.get(deviceFingerprint);
  }

  async getAllRestrictedDevices(): Promise<RestrictedDevice[]> {
    return Array.from(this.restrictedDevices.values())
      .map(restriction => ({
        ...restriction,
        isActive: !restriction.expiresAt || new Date() < restriction.expiresAt
      }));
  }

  async updateRestrictedDevice(deviceFingerprint: string, updates: Partial<RestrictedDevice>): Promise<boolean> {
    const restriction = this.restrictedDevices.get(deviceFingerprint);
    if (!restriction) return false;
    
    Object.assign(restriction, updates);
    this.restrictedDevices.set(deviceFingerprint, restriction);
    return true;
  }

  async removeRestrictedDevice(deviceFingerprint: string): Promise<boolean> {
    return this.restrictedDevices.delete(deviceFingerprint);
  }

  // Post Stats tracking methods
  async trackPostView(postId: string, sessionId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) return;

    // Only count unique views per session
    if (!post.viewSessions.includes(sessionId)) {
      post.viewSessions.push(sessionId);
      post.viewCount = (post.viewCount || 0) + 1;
      post.lastViewedAt = new Date();
      this.posts.set(postId, post);
    }
  }

  async getPostStats(postId: string): Promise<{ viewCount: number; commentCount: number; reactions: Record<string, number>; lastViewedAt?: Date }> {
    const post = this.posts.get(postId);
    if (!post) {
      return { viewCount: 0, commentCount: 0, reactions: {} };
    }

    return {
      viewCount: post.viewCount || 0,
      commentCount: post.commentCount || 0,
      reactions: post.reactions || {},
      lastViewedAt: post.lastViewedAt,
    };
  }

  async getUserPostStats(sessionId: string): Promise<Array<{ postId: string; viewCount: number; commentCount: number; reactions: Record<string, number>; lastViewedAt?: Date; postContent: string; category: string; createdAt: Date }>> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.sessionId === sessionId)
      .map(post => ({
        postId: post.id,
        viewCount: post.viewCount || 0,
        commentCount: post.commentCount || 0,
        reactions: post.reactions || {},
        lastViewedAt: post.lastViewedAt,
        postContent: post.content,
        category: post.category,
        createdAt: post.createdAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userPosts;
  }

  // Auto-rotation System methods
  async createContentPrompt(prompt: InsertContentPrompt): Promise<ContentPrompt> {
    const id = randomUUID();
    const newPrompt: ContentPrompt = {
      id,
      type: prompt.type,
      content: prompt.content,
      isUsed: false,
      usedAt: null,
      priority: prompt.priority || 1,
      tags: prompt.tags || [],
      createdAt: new Date()
    };
    this.contentPrompts.set(id, newPrompt);
    return newPrompt;
  }

  async getContentPrompts(type?: string, onlyUnused?: boolean): Promise<ContentPrompt[]> {
    let prompts = Array.from(this.contentPrompts.values());
    
    if (type) {
      prompts = prompts.filter(p => p.type === type);
    }
    
    if (onlyUnused) {
      prompts = prompts.filter(p => !p.isUsed);
    }
    
    return prompts.sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markPromptAsUsed(promptId: string): Promise<void> {
    const prompt = this.contentPrompts.get(promptId);
    if (prompt) {
      prompt.isUsed = true;
      prompt.usedAt = new Date();
      this.contentPrompts.set(promptId, prompt);
    }
  }

  async createWeeklyTheme(theme: InsertWeeklyTheme): Promise<WeeklyTheme> {
    const id = randomUUID();
    const newTheme: WeeklyTheme = {
      id,
      name: theme.name,
      description: theme.description,
      isActive: false,
      startDate: null,
      endDate: null,
      createdAt: new Date()
    };
    this.weeklyThemes.set(id, newTheme);
    return newTheme;
  }

  async getWeeklyThemes(): Promise<WeeklyTheme[]> {
    return Array.from(this.weeklyThemes.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async setActiveTheme(themeId: string): Promise<void> {
    // Deactivate all themes
    for (const theme of this.weeklyThemes.values()) {
      theme.isActive = false;
    }
    
    // Activate specified theme
    const theme = this.weeklyThemes.get(themeId);
    if (theme) {
      theme.isActive = true;
      theme.startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      theme.endDate = endDate;
      this.weeklyThemes.set(themeId, theme);
    }
  }

  async createRotationCycle(cycle: InsertRotationCycle): Promise<RotationCycle> {
    const id = randomUUID();
    const now = new Date();
    const nextRotation = new Date(now);
    
    // Calculate next rotation based on interval
    switch (cycle.rotationInterval) {
      case '24h':
        nextRotation.setHours(nextRotation.getHours() + 24);
        break;
      case '72h':
        nextRotation.setHours(nextRotation.getHours() + 72);
        break;
      case '7d':
        nextRotation.setDate(nextRotation.getDate() + 7);
        break;
    }
    
    const newCycle: RotationCycle = {
      id,
      type: cycle.type,
      currentContentId: null,
      lastRotatedAt: now,
      nextRotationAt: nextRotation,
      rotationInterval: cycle.rotationInterval,
      isActive: true,
      metadata: cycle.metadata || {},
      createdAt: now
    };
    
    this.rotationCycles.set(id, newCycle);
    return newCycle;
  }

  async getRotationCycles(): Promise<RotationCycle[]> {
    return Array.from(this.rotationCycles.values());
  }

  async updateRotationCycle(cycleId: string, updates: Partial<RotationCycle>): Promise<void> {
    const cycle = this.rotationCycles.get(cycleId);
    if (cycle) {
      Object.assign(cycle, updates);
      this.rotationCycles.set(cycleId, cycle);
    }
  }

  async createLeaderboard(leaderboard: Omit<Leaderboard, 'id' | 'createdAt'>): Promise<Leaderboard> {
    const id = randomUUID();
    const newLeaderboard: Leaderboard = {
      id,
      ...leaderboard,
      createdAt: new Date()
    };
    this.leaderboards.set(id, newLeaderboard);
    return newLeaderboard;
  }

  async getActiveLeaderboards(type?: string): Promise<Leaderboard[]> {
    let leaderboards = Array.from(this.leaderboards.values())
      .filter(l => l.isActive);
    
    if (type) {
      leaderboards = leaderboards.filter(l => l.type === type);
    }
    
    return leaderboards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deactivateLeaderboards(type: string): Promise<void> {
    for (const leaderboard of this.leaderboards.values()) {
      if (leaderboard.type === type) {
        leaderboard.isActive = false;
      }
    }
  }

  // Push Notification methods
  async createPushSubscription(subscriptionData: any): Promise<any> {
    const id = randomUUID();
    const subscription = {
      id,
      sessionId: subscriptionData.sessionId,
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.p256dh,
      auth: subscriptionData.auth,
      isActive: true,
      notificationTypes: subscriptionData.notificationTypes || ["daily_prompt", "daily_debate"],
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
    this.pushSubscriptions.set(id, subscription);
    return subscription;
  }

  async getPushSubscriptions(sessionId: string): Promise<any[]> {
    return Array.from(this.pushSubscriptions.values())
      .filter(sub => sub.sessionId === sessionId);
  }

  async getActiveSubscriptionsForType(notificationType: string): Promise<any[]> {
    return Array.from(this.pushSubscriptions.values())
      .filter(sub => 
        sub.isActive && 
        sub.notificationTypes.includes(notificationType)
      );
  }

  async deactivatePushSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.pushSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.pushSubscriptions.set(subscriptionId, subscription);
    }
  }

  async updatePushSubscriptionPreferences(subscriptionId: string, notificationTypes: string[]): Promise<void> {
    const subscription = this.pushSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.notificationTypes = notificationTypes;
      this.pushSubscriptions.set(subscriptionId, subscription);
    }
  }

  async updatePushSubscriptionLastUsed(subscriptionId: string): Promise<void> {
    const subscription = this.pushSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastUsedAt = new Date();
      this.pushSubscriptions.set(subscriptionId, subscription);
    }
  }

  async logPushNotification(subscriptionId: string, notificationType: string, promptContent: string, status: string): Promise<void> {
    const id = randomUUID();
    const log = {
      id,
      subscriptionId,
      notificationType,
      promptContent,
      status,
      failureReason: null,
      sentAt: new Date(),
    };
    this.pushNotificationLogs.set(id, log);
  }

  async updatePushNotificationStatus(subscriptionId: string, status: string, failureReason?: string): Promise<void> {
    // Find the most recent log entry for this subscription
    const logs = Array.from(this.pushNotificationLogs.values())
      .filter(log => log.subscriptionId === subscriptionId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    if (logs.length > 0) {
      const latestLog = logs[0];
      latestLog.status = status;
      if (failureReason) {
        latestLog.failureReason = failureReason;
      }
      this.pushNotificationLogs.set(latestLog.id, latestLog);
    }
  }

  async getPushNotificationStats(sessionId?: string): Promise<{ totalSubscriptions: number; activeSubscriptions: number; sentNotifications: number; failedNotifications: number }> {
    let subscriptions = Array.from(this.pushSubscriptions.values());
    
    if (sessionId) {
      subscriptions = subscriptions.filter(sub => sub.sessionId === sessionId);
    }

    const subscriptionIds = subscriptions.map(sub => sub.id);
    const logs = Array.from(this.pushNotificationLogs.values())
      .filter(log => sessionId ? subscriptionIds.includes(log.subscriptionId) : true);

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(sub => sub.isActive).length,
      sentNotifications: logs.filter(log => log.status === 'sent').length,
      failedNotifications: logs.filter(log => log.status === 'failed').length,
    };
  }

  async cleanupOldPushSubscriptions(cutoffDate: Date): Promise<void> {
    const toRemove: string[] = [];
    
    for (const [id, subscription] of this.pushSubscriptions.entries()) {
      if (!subscription.isActive && subscription.lastUsedAt && subscription.lastUsedAt < cutoffDate) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.pushSubscriptions.delete(id);
    }
  }

  async cleanupOldPushNotificationLogs(cutoffDate: Date): Promise<void> {
    const toRemove: string[] = [];
    
    for (const [id, log] of this.pushNotificationLogs.entries()) {
      if (log.sentAt < cutoffDate) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.pushNotificationLogs.delete(id);
    }
  }

  // Daily Prompt Streak Tracking Methods
  async getUserStreak(sessionId: string): Promise<DailyPromptStreak | undefined> {
    return Array.from(this.dailyPromptStreaks.values())
      .find(streak => streak.sessionId === sessionId);
  }

  async createOrUpdateStreak(sessionId: string, promptId: string, promptContent: string): Promise<{ streak: DailyPromptStreak; streakBroken: boolean; newSubmission: DailyPromptSubmission }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if user already submitted for this prompt today
    const existingSubmission = Array.from(this.dailyPromptSubmissions.values())
      .find(sub => sub.sessionId === sessionId && sub.promptId === promptId && sub.submissionDate === today);
    
    if (existingSubmission) {
      const streak = await this.getUserStreak(sessionId);
      if (!streak) {
        throw new Error('Streak not found');
      }
      return { streak, streakBroken: false, newSubmission: existingSubmission };
    }

    // Create submission record
    const submissionId = randomUUID();
    const newSubmission: DailyPromptSubmission = {
      id: submissionId,
      sessionId,
      postId: '',
      promptId,
      promptContent,
      submissionDate: today,
      submittedAt: new Date(),
      isValid: true,
    };
    this.dailyPromptSubmissions.set(submissionId, newSubmission);

    // Get or create streak
    let existingStreak = await this.getUserStreak(sessionId);
    let streakBroken = false;

    if (!existingStreak) {
      // Create new streak
      const streakId = randomUUID();
      existingStreak = {
        id: streakId,
        sessionId,
        currentStreak: 1,
        longestStreak: 1,
        lastSubmissionDate: today,
        lastPromptId: promptId,
        submissionDates: [today],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.dailyPromptStreaks.set(streakId, existingStreak);
    } else {
      // Update existing streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (existingStreak.lastSubmissionDate === yesterdayStr) {
        // Consecutive day - increment streak
        existingStreak.currentStreak += 1;
        existingStreak.longestStreak = Math.max(existingStreak.longestStreak, existingStreak.currentStreak);
      } else if (existingStreak.lastSubmissionDate !== today) {
        // Streak broken - reset to 1
        existingStreak.currentStreak = 1;
        streakBroken = true;
      }

      existingStreak.lastSubmissionDate = today;
      existingStreak.lastPromptId = promptId;
      existingStreak.submissionDates = [...(existingStreak.submissionDates || []), today]
        .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
        .sort();
      existingStreak.updatedAt = new Date();

      this.dailyPromptStreaks.set(existingStreak.id, existingStreak);
    }

    return { streak: existingStreak, streakBroken, newSubmission };
  }

  async recordDailyPromptSubmission(submission: InsertDailyPromptSubmission): Promise<DailyPromptSubmission> {
    const id = randomUUID();
    const newSubmission: DailyPromptSubmission = {
      ...submission,
      id,
      submittedAt: new Date(),
    };
    this.dailyPromptSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async validateDailyPromptSubmission(sessionId: string, promptId: string, submissionDate: string): Promise<{ isValid: boolean; reason?: string }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if submission is for today
    if (submissionDate !== today) {
      return { isValid: false, reason: 'Submission must be for today' };
    }

    // Check if user already submitted for this prompt today
    const existingSubmission = Array.from(this.dailyPromptSubmissions.values())
      .find(sub => sub.sessionId === sessionId && sub.promptId === promptId && sub.submissionDate === submissionDate);
    
    if (existingSubmission) {
      return { isValid: false, reason: 'Already submitted for this prompt today' };
    }

    return { isValid: true };
  }

  async getDailyPromptSubmissions(sessionId: string, limit = 30): Promise<DailyPromptSubmission[]> {
    return Array.from(this.dailyPromptSubmissions.values())
      .filter(sub => sub.sessionId === sessionId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, limit);
  }

  // Admin Authentication System Implementation
  async createAdminFingerprint(fingerprintData: InsertAdminFingerprint): Promise<AdminFingerprint> {
    const id = randomUUID();
    const fingerprint: AdminFingerprint = {
      ...fingerprintData,
      id,
      createdAt: new Date(),
      lastUsed: null,
    };
    this.adminFingerprints.set(fingerprint.fingerprint, fingerprint);
    return fingerprint;
  }

  async getAdminFingerprint(fingerprint: string): Promise<AdminFingerprint | undefined> {
    return this.adminFingerprints.get(fingerprint);
  }

  async deactivateAdminFingerprint(fingerprint: string): Promise<void> {
    const adminFingerprint = this.adminFingerprints.get(fingerprint);
    if (adminFingerprint) {
      adminFingerprint.isActive = false;
      this.adminFingerprints.set(fingerprint, adminFingerprint);
    }
  }

  async createAdminEmail(emailData: InsertAdminEmail): Promise<AdminEmail> {
    const id = randomUUID();
    const adminEmail: AdminEmail = {
      ...emailData,
      id,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.adminEmails.set(`${emailData.email}:${emailData.fingerprint}`, adminEmail);
    return adminEmail;
  }

  async getAdminEmail(email: string, fingerprint: string): Promise<AdminEmail | undefined> {
    return this.adminEmails.get(`${email}:${fingerprint}`);
  }

  async getAdminEmailByEmail(email: string): Promise<AdminEmail | undefined> {
    return Array.from(this.adminEmails.values())
      .find(adminEmail => adminEmail.email === email && adminEmail.isActive);
  }

  async updateAdminEmailLastLogin(email: string): Promise<void> {
    const adminEmail = Array.from(this.adminEmails.values())
      .find(ae => ae.email === email);
    if (adminEmail) {
      adminEmail.lastLogin = new Date();
      this.adminEmails.set(`${adminEmail.email}:${adminEmail.fingerprint}`, adminEmail);
    }
  }

  async deactivateAdminEmail(email: string): Promise<void> {
    const adminEmail = Array.from(this.adminEmails.values())
      .find(ae => ae.email === email);
    if (adminEmail) {
      adminEmail.isActive = false;
      this.adminEmails.set(`${adminEmail.email}:${adminEmail.fingerprint}`, adminEmail);
    }
  }

  async createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession> {
    const id = randomUUID();
    const session: AdminSession = {
      ...sessionData,
      id,
      isActive: true, // Ensure new sessions are active
      expiresAt: typeof sessionData.expiresAt === 'string' ? new Date(sessionData.expiresAt) : sessionData.expiresAt,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.adminSessions.set(session.sessionId, session);
    return session;
  }

  async getAdminSession(sessionId: string): Promise<AdminSession | undefined> {
    return this.adminSessions.get(sessionId);
  }

  async updateAdminSessionActivity(sessionId: string): Promise<void> {
    const session = this.adminSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.adminSessions.set(sessionId, session);
    }
  }

  async deactivateAdminSession(sessionId: string): Promise<void> {
    const session = this.adminSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.adminSessions.set(sessionId, session);
    }
  }

  async deactivateAdminSessionsByEmail(email: string): Promise<void> {
    Array.from(this.adminSessions.values())
      .filter(session => session.email === email)
      .forEach(session => {
        session.isActive = false;
        this.adminSessions.set(session.sessionId, session);
      });
  }

  async createAdminActivityLog(logData: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const id = randomUUID();
    const log: AdminActivityLog = {
      ...logData,
      id,
      createdAt: new Date(),
    };
    this.adminActivityLogs.set(id, log);
    return log;
  }

  async getAllActiveAdmins(): Promise<Array<{
    email: string;
    fingerprint: string;
    fingerprintLabel: string;
    role: string;
    isRootHost: boolean;
    lastLogin?: Date;
    createdAt: Date;
  }>> {
    const activeEmails = Array.from(this.adminEmails.values())
      .filter(email => email.isActive);
    
    // Group by email to show all devices for each admin
    const adminsByEmail = new Map<string, any>();
    
    activeEmails.forEach(emailRecord => {
      const fingerprintRecord = this.adminFingerprints.get(emailRecord.fingerprint);
      const adminInfo = {
        email: emailRecord.email,
        fingerprint: emailRecord.fingerprint,
        fingerprintLabel: fingerprintRecord?.label || 'Unknown Device',
        role: emailRecord.role || 'admin',
        isRootHost: emailRecord.role === 'root_host',
        lastLogin: emailRecord.lastLogin || undefined,
        createdAt: emailRecord.createdAt,
      };
      
      if (!adminsByEmail.has(emailRecord.email)) {
        adminsByEmail.set(emailRecord.email, adminInfo);
      } else {
        // If multiple devices for same email, keep the most recent login
        const existing = adminsByEmail.get(emailRecord.email);
        if (!existing.lastLogin || (emailRecord.lastLogin && emailRecord.lastLogin > existing.lastLogin)) {
          adminsByEmail.set(emailRecord.email, adminInfo);
        }
      }
    });
    
    return Array.from(adminsByEmail.values())
      .sort((a, b) => {
        // Root hosts first, then by creation date
        if (a.isRootHost && !b.isRootHost) return -1;
        if (!a.isRootHost && b.isRootHost) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  // Initialize root admin - call this on startup
  async initializeRootAdmin(fingerprint: string, email: string, label?: string): Promise<void> {
    console.log('[Admin System] Initializing root admin...');

    // Create root fingerprint if it doesn't exist
    const existingFingerprint = await this.getAdminFingerprint(fingerprint);
    if (!existingFingerprint) {
      await this.createAdminFingerprint({
        fingerprint,
        label: label || 'Root Host Device',
        addedBy: 'system',
        isActive: true
      });
      console.log('[Admin System] Root fingerprint created');
    }

    // Create root email if it doesn't exist
    const existingEmail = await this.getAdminEmailByEmail(email);
    if (!existingEmail) {
      await this.createAdminEmail({
        email,
        fingerprint,
        role: 'root_host',
        addedBy: 'system',
        isActive: true
      });
      console.log('[Admin System] Root email created');
    } else if (existingEmail.role !== 'root_host') {
      // Upgrade existing admin to root host
      existingEmail.role = 'root_host';
      console.log('[Admin System] Existing admin upgraded to root host');
    }

    console.log('[Admin System] Root admin initialization complete');
  }
  
  // Poll and Debate Voting Methods
  async addPollVote(postId: string, sessionId: string, option: 'optionA' | 'optionB'): Promise<void> {
    const voteId = randomUUID();
    const vote = { sessionId, postId, option };
    this.pollVotes.set(voteId, vote);
    
    // Update post vote counts
    const post = this.posts.get(postId);
    if (post && post.postType === 'poll' && post.pollVotes) {
      post.pollVotes[option] = (post.pollVotes[option] || 0) + 1;
      this.posts.set(postId, post);
    }
  }

  async addDebateVote(postId: string, sessionId: string, vote: 'up' | 'down'): Promise<void> {
    const voteId = randomUUID();
    const debateVote = { sessionId, postId, vote };
    this.debateVotes.set(voteId, debateVote);
    
    // Update post vote counts
    const post = this.posts.get(postId);
    if (post && post.postType === 'debate' && post.debateVotes) {
      post.debateVotes[vote] = (post.debateVotes[vote] || 0) + 1;
      this.posts.set(postId, post);
    }
  }

  async hasUserVotedInPoll(postId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.pollVotes.values()).some(
      vote => vote.postId === postId && vote.sessionId === sessionId
    );
  }

  async hasUserVotedInDebate(postId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.debateVotes.values()).some(
      vote => vote.postId === postId && vote.sessionId === sessionId
    );
  }

  async getUserDebateVote(postId: string, sessionId: string): Promise<'up' | 'down' | null> {
    const vote = Array.from(this.debateVotes.values()).find(
      vote => vote.postId === postId && vote.sessionId === sessionId
    );
    return vote ? vote.vote : null;
  }

  // Get all banned users for admin panel (alias for getAllBannedDevices)
  async getAllBannedUsers(): Promise<BannedDevice[]> {
    return this.getAllBannedDevices();
  }

  async getAllUsersForManagement(): Promise<any[]> {
    const anonymousUsers = Array.from(this.anonymousUsers.values());
    const deviceSessions = Array.from(this.deviceSessions.values());
    
    // Create a comprehensive user list combining anonymous users and device sessions
    const userMap = new Map();
    
    // First, add all anonymous users
    anonymousUsers.forEach(user => {
      if (!userMap.has(user.deviceFingerprint)) {
        userMap.set(user.deviceFingerprint, {
          id: user.anonId,
          alias: user.alias,
          avatarId: user.avatarId,
          avatarColor: user.avatarColor,
          deviceFingerprint: user.deviceFingerprint,
          sessionId: null,
          createdAt: user.createdAt,
          lastActivity: user.lastActivity,
          postCount: 0
        });
      }
    });
    
    // Then, add device sessions and merge with existing users
    deviceSessions.forEach(session => {
      const existing = userMap.get(session.deviceFingerprint);
      if (existing) {
        // Update with session information
        existing.sessionId = session.sessionId;
        if (session.lastActivity && (!existing.lastActivity || new Date(session.lastActivity) > new Date(existing.lastActivity))) {
          existing.lastActivity = session.lastActivity;
        }
      } else {
        // Create new entry for session-only users
        userMap.set(session.deviceFingerprint, {
          id: session.sessionId,
          alias: null,
          avatarId: null,
          avatarColor: null,
          deviceFingerprint: session.deviceFingerprint,
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          postCount: 0
        });
      }
    });
    
    // Calculate post counts for each user
    const posts = Array.from(this.posts.values());
    posts.forEach(post => {
      // Find user by session ID or device fingerprint
      for (const [fingerprint, user] of userMap.entries()) {
        if (post.sessionId === user.sessionId || 
            (post.deviceFingerprint && post.deviceFingerprint === fingerprint)) {
          user.postCount++;
          break;
        }
      }
    });
    
    // Convert map to array and sort by creation date (newest first)
    const userList = Array.from(userMap.values());
    userList.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
    
    return userList;
  }
}

export const storage = new MemStorage();

// Initialize root admin on startup if environment variables are provided
const initializeAdminSystem = async () => {
  const rootFingerprint = process.env.ROOT_ADMIN_FINGERPRINT;
  const rootEmail = process.env.ROOT_ADMIN_EMAIL;
  
  if (rootFingerprint && rootEmail) {
    try {
      await storage.initializeRootAdmin(rootFingerprint, rootEmail, 'Root Host Device');
      console.log('[Admin System] Root admin initialized successfully');
    } catch (error) {
      console.error('[Admin System] Failed to initialize root admin:', error);
    }
  } else {
    console.log('[Admin System] No root admin environment variables found - manual setup required');
  }
};

// Call initialization after a short delay to ensure storage is ready
setTimeout(initializeAdminSystem, 1000);
