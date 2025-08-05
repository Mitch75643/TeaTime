import type { Post } from "@shared/schema";

// Smart feed distribution and throttling system
export class SmartFeedManager {
  private static instance: SmartFeedManager;
  private postQueue: Map<string, Post[]> = new Map(); // sessionId -> queued posts
  private userLastSeen: Map<string, Date> = new Map(); // sessionId -> last seen timestamp
  private batchSize = 25; // Max posts per refresh
  private fairnessPoolSize = 15; // Size of randomization batches

  static getInstance(): SmartFeedManager {
    if (!SmartFeedManager.instance) {
      SmartFeedManager.instance = new SmartFeedManager();
    }
    return SmartFeedManager.instance;
  }

  // Add new posts to the distribution system
  addNewPosts(posts: Post[]): void {
    // Sort posts by creation time (newest first)
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Apply fairness distribution - randomize in batches
    const distributedPosts = this.applyFairnessDistribution(sortedPosts);

    // Add to all user queues
    Array.from(this.userLastSeen.keys()).forEach(sessionId => {
      if (!this.postQueue.has(sessionId)) {
        this.postQueue.set(sessionId, []);
      }
      this.postQueue.get(sessionId)!.push(...distributedPosts);
    });
  }

  // Apply fairness distribution logic
  private applyFairnessDistribution(posts: Post[]): Post[] {
    if (posts.length <= this.fairnessPoolSize) {
      return this.shuffleArray([...posts]);
    }

    const result: Post[] = [];
    const chunks = this.chunkArray(posts, this.fairnessPoolSize);

    for (const chunk of chunks) {
      // Randomize each chunk for fair visibility
      const shuffled = this.shuffleArray(chunk);
      result.push(...shuffled);
    }

    return result;
  }

  // Get posts for a specific user with throttling
  getPostsForUser(sessionId: string, includeLowEngagement = false): {
    posts: Post[];
    hasMore: boolean;
    totalQueued: number;
  } {
    // Initialize user if not exists
    if (!this.postQueue.has(sessionId)) {
      this.postQueue.set(sessionId, []);
    }
    if (!this.userLastSeen.has(sessionId)) {
      this.userLastSeen.set(sessionId, new Date());
    }

    const userQueue = this.postQueue.get(sessionId)!;
    const totalQueued = userQueue.length;

    // Apply post throttling - max 25 posts per refresh
    let postsToShow = userQueue.splice(0, this.batchSize);

    // Apply engagement boost logic (10-20% chance for low engagement posts)
    if (includeLowEngagement && postsToShow.length > 0) {
      postsToShow = this.applyEngagementBoost(postsToShow);
    }

    // Update last seen timestamp
    this.userLastSeen.set(sessionId, new Date());

    return {
      posts: postsToShow,
      hasMore: userQueue.length > 0,
      totalQueued: totalQueued
    };
  }

  // Apply engagement boost logic
  private applyEngagementBoost(posts: Post[]): Post[] {
    const boostedPosts = [...posts];
    
    // Find posts with low engagement
    const lowEngagementPosts = posts.filter(post => {
      const totalReactions = Object.values(post.reactions || {}).reduce((sum, count) => sum + count, 0);
      const commentCount = post.commentCount || 0;
      return totalReactions === 0 || commentCount === 0 || (totalReactions + commentCount) < 3;
    });

    if (lowEngagementPosts.length === 0) return boostedPosts;

    // 15% chance to boost low engagement posts
    const shouldBoost = Math.random() < 0.15;
    
    if (shouldBoost && lowEngagementPosts.length > 0) {
      // Select 1-2 low engagement posts to boost
      const boostCount = Math.min(2, Math.ceil(posts.length * 0.1));
      const postsToBoost = this.shuffleArray(lowEngagementPosts).slice(0, boostCount);
      
      // Move boosted posts towards the front (but not first position)
      postsToBoost.forEach(boostPost => {
        const index = boostedPosts.findIndex(p => p.id === boostPost.id);
        if (index > 2) {
          // Move to position 1-3 for visibility without being obvious
          const newIndex = Math.floor(Math.random() * 3) + 1;
          boostedPosts.splice(index, 1);
          boostedPosts.splice(newIndex, 0, boostPost);
        }
      });
    }

    return boostedPosts;
  }

  // Get count of queued posts for a user
  getQueuedCount(sessionId: string): number {
    if (!this.postQueue.has(sessionId)) {
      return 0;
    }
    return this.postQueue.get(sessionId)!.length;
  }

  // Register user for feed distribution
  registerUser(sessionId: string): void {
    if (!this.userLastSeen.has(sessionId)) {
      this.userLastSeen.set(sessionId, new Date());
    }
    if (!this.postQueue.has(sessionId)) {
      this.postQueue.set(sessionId, []);
    }
  }

  // Clean up inactive users (older than 24 hours)
  cleanupInactiveUsers(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    Array.from(this.userLastSeen.entries()).forEach(([sessionId, lastSeen]) => {
      if (lastSeen < cutoff) {
        this.userLastSeen.delete(sessionId);
        this.postQueue.delete(sessionId);
      }
    });
  }

  // Utility functions
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Reset queue for user (called when they manually refresh)
  resetUserQueue(sessionId: string): void {
    if (this.postQueue.has(sessionId)) {
      this.postQueue.set(sessionId, []);
    }
    this.userLastSeen.set(sessionId, new Date());
  }

  // Get stats for debugging
  getStats(): {
    totalUsers: number;
    totalQueuedPosts: number;
    averageQueueSize: number;
  } {
    const totalUsers = this.userLastSeen.size;
    const totalQueuedPosts = Array.from(this.postQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);
    const averageQueueSize = totalUsers > 0 ? totalQueuedPosts / totalUsers : 0;

    return {
      totalUsers,
      totalQueuedPosts,
      averageQueueSize
    };
  }
}

// Auto-cleanup every hour
setInterval(() => {
  SmartFeedManager.getInstance().cleanupInactiveUsers();
}, 60 * 60 * 1000);