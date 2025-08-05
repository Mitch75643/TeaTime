interface SmartFeedConfig {
  maxPostsPerRefresh: number;
  fairDistributionChunkSize: number;
  lowEngagementBoostPercentage: number;
  enableRandomization: boolean;
}

interface SmartFeedRequest {
  sessionId: string;
  category?: string;
  sortBy: 'new' | 'trending';
  postContext: string;
  lastRefreshTime?: Date;
  excludePostIds?: string[];
}

interface SmartFeedResponse {
  posts: any[];
  hasMorePosts: boolean;
  nextRefreshAvailable: boolean;
  queuedPostsCount: number;
  distributionMetrics?: {
    totalAvailable: number;
    lowEngagement: number;
    randomized: number;
  };
}

class SmartFeedService {
  private config: SmartFeedConfig = {
    maxPostsPerRefresh: 30,
    fairDistributionChunkSize: 12,
    lowEngagementBoostPercentage: 20,
    enableRandomization: true,
  };

  private sessionQueues: Map<string, string[]> = new Map();
  private sessionLastRefresh: Map<string, Date> = new Map();

  async getSmartFeed(request: SmartFeedRequest, storage: any): Promise<SmartFeedResponse> {
    const { sessionId, category, sortBy, postContext, lastRefreshTime, excludePostIds = [] } = request;

    // Get all available posts for this context
    const allPosts = await storage.getPosts(category, sortBy, undefined, undefined, postContext);
    
    // Apply smart distribution logic only for "new" feeds on specific pages
    if (this.shouldApplySmartLogic(sortBy, postContext)) {
      return this.applySmartDistribution(sessionId, allPosts, excludePostIds);
    }

    // For trending feeds or other contexts, always show 30 posts when available
    return {
      posts: allPosts.slice(0, this.config.maxPostsPerRefresh),
      hasMorePosts: allPosts.length > this.config.maxPostsPerRefresh,
      nextRefreshAvailable: true, // Allow refresh for new posts
      queuedPostsCount: 0,
    };
  }

  private shouldApplySmartLogic(sortBy: string, postContext: string): boolean {
    // Apply smart logic only to "new" feeds on home, daily, and community pages
    return sortBy === 'new' && ['home', 'daily', 'community'].includes(postContext);
  }

  private applySmartDistribution(sessionId: string, allPosts: any[], excludePostIds: string[]): SmartFeedResponse {
    // Filter out excluded posts
    const availablePosts = allPosts.filter(post => !excludePostIds.includes(post.id));
    
    if (availablePosts.length === 0) {
      return {
        posts: [],
        hasMorePosts: false,
        nextRefreshAvailable: false,
        queuedPostsCount: 0,
      };
    }

    // ALWAYS show 30 posts if available - only apply smart logic when there are 30+ posts
    if (availablePosts.length <= 30) {
      return {
        posts: availablePosts,
        hasMorePosts: false,
        nextRefreshAvailable: true, // Allow refresh for new posts
        queuedPostsCount: 0,
      };
    }

    // Get or initialize session queue
    let sessionQueue = this.sessionQueues.get(sessionId) || [];
    
    // If queue is empty or stale, rebuild it
    if (sessionQueue.length === 0 || this.isQueueStale(sessionId)) {
      sessionQueue = this.buildFairDistributionQueue(availablePosts);
      this.sessionQueues.set(sessionId, sessionQueue);
      this.sessionLastRefresh.set(sessionId, new Date());
    }

    // Apply engagement boost and randomization
    const distributedPosts = this.applyEngagementBoost(availablePosts, sessionQueue);
    
    // Get the batch for this refresh
    const batchSize = Math.min(this.config.maxPostsPerRefresh, distributedPosts.length);
    const batch = distributedPosts.slice(0, batchSize);
    
    // Update session queue (remove distributed posts)
    const distributedIds = batch.map(post => post.id);
    const updatedQueue = sessionQueue.filter(id => !distributedIds.includes(id));
    this.sessionQueues.set(sessionId, updatedQueue);

    const metrics = {
      totalAvailable: availablePosts.length,
      lowEngagement: batch.filter(post => this.isLowEngagement(post)).length,
      randomized: Math.floor(batch.length * 0.3), // Approximate randomization
    };

    return {
      posts: batch,
      hasMorePosts: availablePosts.length > batchSize,
      nextRefreshAvailable: updatedQueue.length > 0 || availablePosts.length > batchSize,
      queuedPostsCount: updatedQueue.length,
      distributionMetrics: metrics,
    };
  }

  private buildFairDistributionQueue(posts: any[]): string[] {
    if (!this.config.enableRandomization) {
      return posts.map(post => post.id);
    }

    // Group posts by session (user) to ensure fair distribution
    const postsBySession = new Map<string, any[]>();
    posts.forEach(post => {
      const sessionId = post.sessionId || 'unknown';
      if (!postsBySession.has(sessionId)) {
        postsBySession.set(sessionId, []);
      }
      postsBySession.get(sessionId)!.push(post);
    });

    // Create fair distribution queue
    const distributionQueue: string[] = [];
    const chunkSize = this.config.fairDistributionChunkSize;
    
    // Round-robin distribution in chunks
    const sessionIterators = Array.from(postsBySession.values()).map(userPosts => 
      [...userPosts].sort(() => Math.random() - 0.5) // Randomize user's posts
    );

    let remainingPosts = posts.length;
    while (remainingPosts > 0) {
      // Create a chunk with posts from different users
      const chunk: any[] = [];
      
      sessionIterators.forEach(userPosts => {
        if (userPosts.length > 0 && chunk.length < chunkSize) {
          chunk.push(userPosts.shift()!);
          remainingPosts--;
        }
      });

      // Randomize chunk order and add to queue
      chunk.sort(() => Math.random() - 0.5);
      distributionQueue.push(...chunk.map(post => post.id));

      // Remove empty iterators
      sessionIterators.splice(0, sessionIterators.length, 
        ...sessionIterators.filter(userPosts => userPosts.length > 0)
      );
    }

    return distributionQueue;
  }

  private applyEngagementBoost(allPosts: any[], sessionQueue: string[]): any[] {
    const queuedPosts = sessionQueue.map(id => 
      allPosts.find(post => post.id === id)
    ).filter(Boolean);

    if (queuedPosts.length === 0) return [];

    const batchSize = Math.min(this.config.maxPostsPerRefresh, queuedPosts.length);
    const lowEngagementSlots = Math.floor(batchSize * (this.config.lowEngagementBoostPercentage / 100));
    
    // Identify low engagement posts
    const lowEngagementPosts = queuedPosts.filter(post => this.isLowEngagement(post));
    const regularPosts = queuedPosts.filter(post => !this.isLowEngagement(post));

    // Build final batch with engagement boost
    const batch: any[] = [];
    
    // Add low engagement posts (up to the boost percentage)
    const lowEngagementToAdd = Math.min(lowEngagementSlots, lowEngagementPosts.length);
    batch.push(...lowEngagementPosts.slice(0, lowEngagementToAdd));
    
    // Fill remaining slots with regular posts
    const remainingSlots = batchSize - batch.length;
    batch.push(...regularPosts.slice(0, remainingSlots));
    
    // If we still have slots and more low engagement posts, add them
    if (batch.length < batchSize && lowEngagementPosts.length > lowEngagementToAdd) {
      const additionalLowEngagement = Math.min(
        batchSize - batch.length,
        lowEngagementPosts.length - lowEngagementToAdd
      );
      batch.push(...lowEngagementPosts.slice(lowEngagementToAdd, lowEngagementToAdd + additionalLowEngagement));
    }

    // Randomize final order while maintaining some engagement distribution
    return this.shuffleArray(batch);
  }

  private isLowEngagement(post: any): boolean {
    const reactions = post.reactions || {};
    const totalReactions = Object.values(reactions).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);
    const commentCount = Number(post.commentCount) || 0;
    
    // Consider low engagement if: no reactions and no comments, OR very low engagement
    return (totalReactions === 0 && commentCount === 0) || (totalReactions + commentCount <= 1);
  }

  private isQueueStale(sessionId: string): boolean {
    const lastRefresh = this.sessionLastRefresh.get(sessionId);
    if (!lastRefresh) return true;
    
    // Queue is stale after 5 minutes
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastRefresh.getTime() > staleThreshold;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Method to clear stale session data (should be called periodically)
  public cleanupStaleData(): void {
    const now = Date.now();
    const cleanupThreshold = 30 * 60 * 1000; // 30 minutes

    Array.from(this.sessionLastRefresh.entries()).forEach(([sessionId, lastRefresh]) => {
      if (now - lastRefresh.getTime() > cleanupThreshold) {
        this.sessionQueues.delete(sessionId);
        this.sessionLastRefresh.delete(sessionId);
      }
    });
  }

  // Method to manually refresh feed for a session
  public resetSessionQueue(sessionId: string): void {
    this.sessionQueues.delete(sessionId);
    this.sessionLastRefresh.delete(sessionId);
  }

  // Method to update config
  public updateConfig(newConfig: Partial<SmartFeedConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const smartFeedService = new SmartFeedService();

// Cleanup stale data every 15 minutes
setInterval(() => {
  smartFeedService.cleanupStaleData();
}, 15 * 60 * 1000);