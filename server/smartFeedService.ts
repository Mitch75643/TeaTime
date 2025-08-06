// Smart Feed Distribution and Sync System
// Prevents flooding while ensuring all posts are visible across devices
import { storage } from "./storage";
import type { Post } from "@shared/schema";

export class SmartFeedService {
  private readonly BATCH_SIZE = 30;
  private readonly LOW_ENGAGEMENT_THRESHOLD = 2;
  private readonly ZERO_ENGAGEMENT_PERCENT = 0.15; // 15%
  private readonly LOW_ENGAGEMENT_PERCENT = 0.15; // 15%

  constructor() {
    console.log('[Smart Feed] Service initialized');
  }

  // Get smart-distributed feed for Home page "New" section
  async getSmartHomeFeed(sessionId: string, lastFetchTime?: Date): Promise<{
    posts: Post[];
    hasMore: boolean;
    nextBatch: boolean;
  }> {
    try {
      // Get all new posts since last fetch
      const allPosts = await storage.getPosts(
        undefined, // category
        'new', // sortBy
        undefined, // tags
        undefined, // userOnly
        undefined, // postContext
        undefined, // section
        200 // limit - get more than we need for smart distribution
      );

      if (allPosts.length === 0) {
        return { posts: [], hasMore: false, nextBatch: false };
      }

      // Apply smart distribution logic
      const distributedPosts = this.applySmartDistribution(allPosts, sessionId);
      
      // Apply visibility boost for low-engagement posts
      const finalPosts = this.applyVisibilityBoost(distributedPosts);

      // Return batch with overflow indicator
      const posts = finalPosts.slice(0, this.BATCH_SIZE);
      const hasMore = finalPosts.length > this.BATCH_SIZE;

      console.log(`[Smart Feed] Distributed ${posts.length} posts for session ${sessionId}, hasMore: ${hasMore}`);

      return {
        posts,
        hasMore,
        nextBatch: hasMore
      };

    } catch (error) {
      console.error('[Smart Feed] Error getting smart feed:', error);
      
      // Fallback to regular feed
      const fallbackPosts = await storage.getPosts(
        undefined, // category
        'new', // sortBy
        undefined, // tags
        undefined, // userOnly
        undefined, // postContext
        undefined, // section
        this.BATCH_SIZE // limit
      );
      
      return {
        posts: fallbackPosts,
        hasMore: false,
        nextBatch: false
      };
    }
  }

  // Apply smart distribution to prevent user flooding
  private applySmartDistribution(posts: Post[], sessionId: string): Post[] {
    // Group posts by session (user)
    const postsByUser = new Map<string, Post[]>();
    
    for (const post of posts) {
      const userPosts = postsByUser.get(post.sessionId) || [];
      userPosts.push(post);
      postsByUser.set(post.sessionId, userPosts);
    }

    // If we have many users (100+), apply chunking logic
    if (postsByUser.size >= 100) {
      return this.applyChunkedDistribution(postsByUser, sessionId);
    }

    // For smaller user counts, apply light randomization while preserving time order
    return this.applyLightRandomization(posts);
  }

  // Apply chunked distribution for high-traffic scenarios
  private applyChunkedDistribution(postsByUser: Map<string, Post[]>, sessionId: string): Post[] {
    const allUsers = Array.from(postsByUser.keys());
    const chunkSize = Math.min(15, Math.max(10, Math.floor(allUsers.length / 8)));
    
    // Create deterministic but varied chunk based on session
    const sessionHash = this.simpleHash(sessionId);
    const startIndex = sessionHash % Math.max(1, allUsers.length - chunkSize);
    
    const selectedUsers = allUsers.slice(startIndex, startIndex + chunkSize);
    
    // If we don't have enough users in the chunk, wrap around
    if (selectedUsers.length < chunkSize) {
      const remaining = chunkSize - selectedUsers.length;
      selectedUsers.push(...allUsers.slice(0, remaining));
    }

    // Collect posts from selected users
    const distributedPosts: Post[] = [];
    for (const userId of selectedUsers) {
      const userPosts = postsByUser.get(userId) || [];
      distributedPosts.push(...userPosts);
    }

    // Sort by creation time but maintain user diversity
    return distributedPosts.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  // Apply light randomization while preserving general time order
  private applyLightRandomization(posts: Post[]): Post[] {
    // Group posts into small time windows (15-minute intervals)
    const timeWindows = new Map<number, Post[]>();
    
    for (const post of posts) {
      const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
      const timeWindow = Math.floor(createdAt.getTime() / (15 * 60 * 1000));
      const windowPosts = timeWindows.get(timeWindow) || [];
      windowPosts.push(post);
      timeWindows.set(timeWindow, windowPosts);
    }

    // Randomize within each time window, then combine
    const result: Post[] = [];
    const sortedWindows = Array.from(timeWindows.keys()).sort((a, b) => b - a);

    for (const window of sortedWindows) {
      const windowPosts = timeWindows.get(window) || [];
      // Light shuffle within the time window
      const shuffled = this.lightShuffle(windowPosts);
      result.push(...shuffled);
    }

    return result;
  }

  // Apply visibility boost for low-engagement posts
  private applyVisibilityBoost(posts: Post[]): Post[] {
    const zeroEngagementPosts = posts.filter(p => 
      (p.reactions?.length || 0) === 0 && (p.comments?.length || 0) === 0
    );
    
    const lowEngagementPosts = posts.filter(p => {
      const reactions = p.reactions?.length || 0;
      const comments = p.comments?.length || 0;
      return (reactions + comments) > 0 && (reactions + comments) <= this.LOW_ENGAGEMENT_THRESHOLD;
    });

    const regularPosts = posts.filter(p => {
      const reactions = p.reactions?.length || 0;
      const comments = p.comments?.length || 0;
      return (reactions + comments) > this.LOW_ENGAGEMENT_THRESHOLD;
    });

    // Calculate how many low-engagement posts to include
    const targetZeroCount = Math.floor(posts.length * this.ZERO_ENGAGEMENT_PERCENT);
    const targetLowCount = Math.floor(posts.length * this.LOW_ENGAGEMENT_PERCENT);

    // Select posts for visibility boost
    const selectedZero = this.lightShuffle(zeroEngagementPosts).slice(0, targetZeroCount);
    const selectedLow = this.lightShuffle(lowEngagementPosts).slice(0, targetLowCount);
    
    // Combine all posts, maintaining time-based order with boosted posts mixed in
    const boostedPosts = [...selectedZero, ...selectedLow];
    const remainingRegular = regularPosts.slice(0, posts.length - boostedPosts.length);
    
    const combined = [...boostedPosts, ...remainingRegular];
    
    // Final sort by creation time with slight randomization for boosted posts
    return combined.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // Add slight randomization for low-engagement posts to boost visibility
      const aIsBoosted = boostedPosts.includes(a);
      const bIsBoosted = boostedPosts.includes(b);
      
      if (aIsBoosted && !bIsBoosted) return -0.1; // Slight boost
      if (!aIsBoosted && bIsBoosted) return 0.1;
      
      return bTime - aTime; // Normal time sort
    });
  }

  // Get next batch of posts (for "Refresh to see more posts" button)
  async getNextBatch(sessionId: string, offset: number): Promise<Post[]> {
    try {
      const posts = await storage.getPosts(
        undefined, // category
        'new', // sortBy
        undefined, // tags
        undefined, // userOnly
        undefined, // postContext
        undefined, // section
        this.BATCH_SIZE, // limit
        offset // offset
      );

      console.log(`[Smart Feed] Retrieved next batch: ${posts.length} posts at offset ${offset}`);
      return posts;

    } catch (error) {
      console.error('[Smart Feed] Error getting next batch:', error);
      return [];
    }
  }

  // Get regular feed for pages that don't use smart distribution
  async getRegularFeed(options: {
    page: string;
    sortBy: 'new' | 'trending' | 'hot';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    try {
      return await storage.getPosts(
        options.category,
        options.sortBy as 'new' | 'trending',
        undefined, // tags
        undefined, // userOnly
        undefined, // postContext
        undefined, // section
        options.limit || 50,
        options.offset || 0
      );
    } catch (error) {
      console.error('[Smart Feed] Error getting regular feed:', error);
      return [];
    }
  }

  // Utility: Simple hash function for deterministic randomization
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Utility: Light shuffle that maintains some order
  private lightShuffle<T>(array: T[]): T[] {
    const result = [...array];
    const shuffleCount = Math.floor(result.length * 0.3); // Only shuffle 30%
    
    for (let i = 0; i < shuffleCount; i++) {
      const j = Math.floor(Math.random() * result.length);
      const k = Math.floor(Math.random() * result.length);
      [result[j], result[k]] = [result[k], result[j]];
    }
    
    return result;
  }
}

export const smartFeedService = new SmartFeedService();