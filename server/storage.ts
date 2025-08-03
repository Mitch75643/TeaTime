import { type Post, type InsertPost, type Comment, type InsertComment, type Reaction, type DramaVote, type ReactionInput, type DramaVoteInput, type Report, type UserFlag, type Notification, type NotificationInput } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Posts
  createPost(post: InsertPost, alias: string, sessionId?: string, postContext?: string, communitySection?: string): Promise<Post>;
  getPosts(category?: string, sortBy?: 'trending' | 'new', tags?: string, userSessionId?: string, postContext?: string, section?: string, storyCategory?: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePostReactions(postId: string, reactions: Record<string, number>): Promise<void>;
  updatePostCommentCount(postId: string, count: number): Promise<void>;
  deletePost(postId: string, sessionId?: string): Promise<void>;
  
  // Comments
  createComment(comment: InsertComment, alias: string): Promise<Comment>;
  getComments(postId: string): Promise<Comment[]>;
  updateCommentReactions(commentId: string, reactions: Record<string, number>): Promise<void>;
  
  // Reactions
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
}

export class MemStorage implements IStorage {
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;
  private reactions: Map<string, Reaction>;
  private dramaVotes: Map<string, DramaVote>;
  private reports: Map<string, Report>;
  private userFlags: Map<string, UserFlag>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.posts = new Map();
    this.comments = new Map();
    this.reactions = new Map();
    this.dramaVotes = new Map();
    this.reports = new Map();
    this.userFlags = new Map();
    this.notifications = new Map();
  }

  async createPost(insertPost: InsertPost, alias: string, sessionId?: string): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      alias,
      avatarId: insertPost.avatarId || 'happy-face',
      reactions: { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 },
      commentCount: 0,
      isDrama: insertPost.category === 'drama',
      createdAt: new Date(),
      sessionId: sessionId || 'anonymous',
      postContext: insertPost.postContext || 'home',
      communitySection: insertPost.communitySection || undefined,
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
    
    // Filter by post context (home, daily, community)
    if (postContext) {
      posts = posts.filter(post => post.postContext === postContext);
    }
    
    // Filter by community section
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

  async createComment(insertComment: InsertComment, alias: string): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      alias,
      avatarId: 'happy-face',
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
  }

  async getNotifications(sessionId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientSessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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
    return Array.from(this.notifications.values())
      .filter(n => n.recipientSessionId === sessionId && !n.isRead)
      .length;
  }
}

export const storage = new MemStorage();
