import { Post } from "@shared/schema";

interface SmartFeedOptions {
  maxPostsPerBatch: number;
  lowEngagementBoostPercent: number;
  fairnessChunkSize: number;
  sessionId: string;
  includeVisibilityBoost: boolean;
}

interface SmartFeedResult {
  posts: Post[];
  hasMore: boolean;
  nextBatchAvailable: number;
  totalAvailable: number;
}

export class SmartFeedManager {
  private static readonly DEFAULT_OPTIONS: Partial<SmartFeedOptions> = {
    maxPostsPerBatch: 30,
    lowEngagementBoostPercent: 0.2, // 20% of posts should be low engagement
    fairnessChunkSize: 15,
  };

  private static sessionBatchState = new Map<string, {
    lastFetchTime: number;
    processedPostIds: Set<string>;
    queuedPosts: Post[];
  }>();

  /**
   * Apply smart feed distribution with anti-flooding and fairness logic
   */
  static async applySmartFeed(
    posts: Post[],
    options: SmartFeedOptions
  ): Promise<SmartFeedResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Get or create session state
    const sessionKey = `${options.sessionId}_${Date.now()}`;
    let batchState = this.sessionBatchState.get(options.sessionId);
    
    if (!batchState || (Date.now() - batchState.lastFetchTime) > 5 * 60 * 1000) {
      // Reset state if older than 5 minutes
      batchState = {
        lastFetchTime: Date.now(),
        processedPostIds: new Set(),
        queuedPosts: []
      };
      this.sessionBatchState.set(options.sessionId, batchState);
    }

    // Filter out already processed posts
    const unprocessedPosts = posts.filter(post => 
      !batchState!.processedPostIds.has(post.id)
    );

    // Add new posts to queue
    batchState.queuedPosts.push(...unprocessedPosts);

    // Apply smart distribution logic
    let batchPosts = batchState.queuedPosts.slice(0, opts.maxPostsPerBatch!);

    // Apply fairness and visibility boost only to "new" sections
    if (options.includeVisibilityBoost) {
      batchPosts = this.applyFairnessLogic(batchPosts, opts.fairnessChunkSize!);
      batchPosts = this.applyVisibilityBoost(batchPosts, opts.lowEngagementBoostPercent!);
    }

    // Mark processed posts
    batchPosts.forEach(post => batchState!.processedPostIds.add(post.id));

    // Remove processed posts from queue
    batchState.queuedPosts = batchState.queuedPosts.slice(batchPosts.length);

    // Update last fetch time
    batchState.lastFetchTime = Date.now();

    return {
      posts: batchPosts,
      hasMore: batchState.queuedPosts.length > 0,
      nextBatchAvailable: batchState.queuedPosts.length,
      totalAvailable: posts.length
    };
  }

  /**
   * Apply fairness logic to ensure all users get visibility
   */
  private static applyFairnessLogic(posts: Post[], chunkSize: number): Post[] {
    if (posts.length <= chunkSize) {
      return posts;
    }

    // Group posts by session to ensure fairness
    const postsBySession = new Map<string, Post[]>();
    posts.forEach(post => {
      if (!postsBySession.has(post.sessionId)) {
        postsBySession.set(post.sessionId, []);
      }
      postsBySession.get(post.sessionId)!.push(post);
    });

    // Randomly select posts from different users
    const fairPosts: Post[] = [];
    const sessionIds = Array.from(postsBySession.keys());
    let currentIndex = 0;

    while (fairPosts.length < Math.min(posts.length, chunkSize)) {
      const sessionId = sessionIds[currentIndex % sessionIds.length];
      const userPosts = postsBySession.get(sessionId)!;
      
      if (userPosts.length > 0) {
        // Take the most recent post from this user
        fairPosts.push(userPosts.shift()!);
      }

      currentIndex++;
      
      // Remove empty sessions
      if (userPosts.length === 0) {
        sessionIds.splice(sessionIds.indexOf(sessionId), 1);
        postsBySession.delete(sessionId);
      }

      // Break if no more sessions
      if (sessionIds.length === 0) {
        break;
      }
    }

    return fairPosts;
  }

  /**
   * Apply visibility boost to low-engagement posts
   */
  private static applyVisibilityBoost(posts: Post[], boostPercent: number): Post[] {
    if (posts.length === 0) return posts;

    const targetBoostCount = Math.floor(posts.length * boostPercent);
    
    // Identify low engagement posts (0 reactions, 0 comments, or very low engagement)
    const lowEngagementPosts = posts.filter(post => {
      const reactions = post.reactions as any || {};
      const totalReactions = Object.values(reactions).reduce((sum: number, count: any) => sum + (count || 0), 0);
      const commentCount = post.commentCount || 0;
      return totalReactions === 0 || commentCount === 0 || (totalReactions + commentCount) <= 2;
    });

    const highEngagementPosts = posts.filter(post => {
      const reactions = post.reactions as any || {};
      const totalReactions = Object.values(reactions).reduce((sum: number, count: any) => sum + (count || 0), 0);
      const commentCount = post.commentCount || 0;
      return (totalReactions + commentCount) > 2;
    });

    // Shuffle low engagement posts to randomize which ones get boosted
    const shuffledLowEngagement = this.shuffleArray([...lowEngagementPosts]);
    const boostedPosts = shuffledLowEngagement.slice(0, targetBoostCount);
    const remainingLowEngagement = shuffledLowEngagement.slice(targetBoostCount);

    // Mix the posts: boosted low engagement + high engagement + remaining low engagement
    const mixedPosts = [
      ...this.interleavePosts(boostedPosts, highEngagementPosts),
      ...remainingLowEngagement
    ];

    return mixedPosts.slice(0, posts.length);
  }

  /**
   * Interleave two arrays of posts
   */
  private static interleavePosts(array1: Post[], array2: Post[]): Post[] {
    const result: Post[] = [];
    const maxLength = Math.max(array1.length, array2.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < array1.length) result.push(array1[i]);
      if (i < array2.length) result.push(array2[i]);
    }

    return result;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get queued posts count for a session
   */
  static getQueuedPostsCount(sessionId: string): number {
    const batchState = this.sessionBatchState.get(sessionId);
    return batchState?.queuedPosts.length || 0;
  }

  /**
   * Clear session state (useful for manual refresh)
   */
  static clearSessionState(sessionId: string): void {
    this.sessionBatchState.delete(sessionId);
    console.log(`[Smart Feed] Cleared session state for: ${sessionId}`);
  }

  /**
   * Clean up old session states (run periodically)
   */
  static cleanupOldStates(): void {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [sessionId, state] of this.sessionBatchState.entries()) {
      if (state.lastFetchTime < fiveMinutesAgo) {
        this.sessionBatchState.delete(sessionId);
      }
    }
  }
}

// Cleanup old states every 10 minutes
setInterval(() => {
  SmartFeedManager.cleanupOldStates();
}, 10 * 60 * 1000);