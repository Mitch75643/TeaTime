import type { IStorage } from "./storage";
import type { 
  Post, 
  UserInteraction, 
  StoryRecommendation, 
  StoryPreferences,
  InsertUserInteraction,
  InsertStoryRecommendation,
  UpdateStoryPreferences
} from "@shared/schema";

interface RecommendationEngine {
  // Track user interactions
  trackInteraction(sessionId: string, interaction: InsertUserInteraction): Promise<void>;
  
  // Generate recommendations
  getRecommendations(sessionId: string, limit?: number): Promise<StoryRecommendation[]>;
  
  // Update user preferences
  updatePreferences(sessionId: string, preferences: UpdateStoryPreferences): Promise<void>;
  
  // Get trending stories
  getTrendingStories(limit?: number): Promise<Post[]>;
  
  // Get similar stories
  getSimilarStories(postId: string, limit?: number): Promise<Post[]>;
}

export class MemoryStoryRecommendationEngine implements RecommendationEngine {
  private userInteractions: Map<string, UserInteraction[]> = new Map();
  private storyRecommendations: Map<string, StoryRecommendation[]> = new Map();
  private userPreferences: Map<string, StoryPreferences> = new Map();
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async trackInteraction(sessionId: string, interaction: InsertUserInteraction): Promise<void> {
    const userInteraction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random()}`,
      sessionId,
      ...interaction,
      createdAt: new Date(),
    };

    // Store interaction
    const existingInteractions = this.userInteractions.get(sessionId) || [];
    existingInteractions.push(userInteraction);
    this.userInteractions.set(sessionId, existingInteractions);

    // Update user preferences based on interaction
    await this.updatePreferencesFromInteraction(sessionId, userInteraction);

    // Generate new recommendations after interaction
    await this.generateRecommendationsForUser(sessionId);

    console.log(`[Recommendation Engine] Tracked ${interaction.interactionType} interaction for session ${sessionId}`);
  }

  private async updatePreferencesFromInteraction(sessionId: string, interaction: UserInteraction): Promise<void> {
    let preferences = this.userPreferences.get(sessionId);
    
    if (!preferences) {
      preferences = {
        id: `pref_${sessionId}`,
        sessionId,
        favoriteStoryTypes: [],
        favoriteCategories: [],
        favoriteTags: [],
        preferredTimeOfDay: this.getTimeOfDay(),
        engagementStyle: this.inferEngagementStyle(interaction.interactionType),
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
    }

    // Update story type preferences
    if (interaction.storyType && !preferences.favoriteStoryTypes.includes(interaction.storyType)) {
      preferences.favoriteStoryTypes.push(interaction.storyType);
    }

    // Update category preferences
    if (!preferences.favoriteCategories.includes(interaction.category)) {
      preferences.favoriteCategories.push(interaction.category);
    }

    // Update tag preferences
    interaction.tags.forEach(tag => {
      if (!preferences!.favoriteTags.includes(tag)) {
        preferences!.favoriteTags.push(tag);
      }
    });

    // Update engagement style based on interaction patterns
    const userInteractions = this.userInteractions.get(sessionId) || [];
    preferences.engagementStyle = this.analyzeEngagementStyle(userInteractions);
    
    preferences.lastUpdated = new Date();
    this.userPreferences.set(sessionId, preferences);
  }

  private getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }

  private inferEngagementStyle(interactionType: string): "reader" | "commenter" | "reactor" {
    switch (interactionType) {
      case "comment": return "commenter";
      case "reaction": return "reactor";
      default: return "reader";
    }
  }

  private analyzeEngagementStyle(interactions: UserInteraction[]): "reader" | "commenter" | "reactor" {
    const commentCount = interactions.filter(i => i.interactionType === "comment").length;
    const reactionCount = interactions.filter(i => i.interactionType === "reaction").length;
    const viewCount = interactions.filter(i => i.interactionType === "view").length;

    if (commentCount > reactionCount && commentCount > viewCount) return "commenter";
    if (reactionCount > commentCount && reactionCount > viewCount) return "reactor";
    return "reader";
  }

  async generateRecommendationsForUser(sessionId: string): Promise<void> {
    const preferences = this.userPreferences.get(sessionId);
    const userInteractions = this.userInteractions.get(sessionId) || [];
    const allPosts = await this.storage.getAllPosts();
    
    // Filter to story posts only
    const storyPosts = allPosts.filter(post => 
      post.category === "story" && 
      post.storyType && 
      !post.isRemoved && 
      !post.isHidden
    );

    const recommendations: StoryRecommendation[] = [];
    let position = 0;

    // Strategy 1: Similar story types (if user has preferences)
    if (preferences && preferences.favoriteStoryTypes.length > 0) {
      const similarStories = storyPosts
        .filter(post => preferences.favoriteStoryTypes.includes(post.storyType!))
        .filter(post => !this.hasUserInteractedWith(sessionId, post.id))
        .sort((a, b) => this.getEngagementScore(b) - this.getEngagementScore(a))
        .slice(0, 3);

      similarStories.forEach(post => {
        recommendations.push({
          id: `rec_${Date.now()}_${position}`,
          sessionId,
          recommendedPostId: post.id,
          recommendationType: "similar_stories",
          confidence: this.calculateSimilarityConfidence(preferences, post),
          reasons: [`Similar to your favorite ${post.storyType} stories`, "High engagement"],
          position: position++,
          wasViewed: false,
          wasInteracted: false,
          createdAt: new Date(),
          viewedAt: null,
          interactedAt: null,
        });
      });
    }

    // Strategy 2: Trending stories
    const trendingStories = storyPosts
      .filter(post => !this.hasUserInteractedWith(sessionId, post.id))
      .sort((a, b) => this.getTrendingScore(b) - this.getTrendingScore(a))
      .slice(0, 2);

    trendingStories.forEach(post => {
      recommendations.push({
        id: `rec_${Date.now()}_${position}`,
        sessionId,
        recommendedPostId: post.id,
        recommendationType: "trending",
        confidence: 75,
        reasons: ["Trending in community", `Popular ${post.storyType} story`],
        position: position++,
        wasViewed: false,
        wasInteracted: false,
        createdAt: new Date(),
        viewedAt: null,
        interactedAt: null,
      });
    });

    // Strategy 3: Personalized based on tags and engagement style
    if (preferences) {
      const personalizedStories = storyPosts
        .filter(post => !this.hasUserInteractedWith(sessionId, post.id))
        .filter(post => this.matchesUserTags(preferences, post))
        .sort((a, b) => this.getPersonalizedScore(preferences, b) - this.getPersonalizedScore(preferences, a))
        .slice(0, 2);

      personalizedStories.forEach(post => {
        recommendations.push({
          id: `rec_${Date.now()}_${position}`,
          sessionId,
          recommendedPostId: post.id,
          recommendationType: "personalized",
          confidence: this.calculatePersonalizedConfidence(preferences, post),
          reasons: this.getPersonalizedReasons(preferences, post),
          position: position++,
          wasViewed: false,
          wasInteracted: false,
          createdAt: new Date(),
          viewedAt: null,
          interactedAt: null,
        });
      });
    }

    // Strategy 4: New user recommendations (fallback)
    if (recommendations.length < 3) {
      const newUserStories = storyPosts
        .filter(post => !this.hasUserInteractedWith(sessionId, post.id))
        .sort((a, b) => this.getEngagementScore(b) - this.getEngagementScore(a))
        .slice(0, 5 - recommendations.length);

      newUserStories.forEach(post => {
        recommendations.push({
          id: `rec_${Date.now()}_${position}`,
          sessionId,
          recommendedPostId: post.id,
          recommendationType: "new_user",
          confidence: 60,
          reasons: ["Popular story", "Great for new readers"],
          position: position++,
          wasViewed: false,
          wasInteracted: false,
          createdAt: new Date(),
          viewedAt: null,
          interactedAt: null,
        });
      });
    }

    // Store recommendations
    this.storyRecommendations.set(sessionId, recommendations);
    console.log(`[Recommendation Engine] Generated ${recommendations.length} recommendations for session ${sessionId}`);
  }

  private hasUserInteractedWith(sessionId: string, postId: string): boolean {
    const interactions = this.userInteractions.get(sessionId) || [];
    return interactions.some(interaction => interaction.postId === postId);
  }

  private getEngagementScore(post: Post): number {
    const reactions = typeof post.reactions === 'object' && post.reactions ? 
      Object.values(post.reactions).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0) : 0;
    const comments = post.commentCount || 0;
    const views = post.viewCount || 0;
    
    return reactions * 3 + comments * 5 + Math.min(views, 100);
  }

  private getTrendingScore(post: Post): number {
    const recency = Date.now() - new Date(post.createdAt).getTime();
    const hoursSinceCreated = recency / (1000 * 60 * 60);
    const engagementScore = this.getEngagementScore(post);
    
    // Trending algorithm: higher engagement with recency boost
    return engagementScore / Math.max(1, hoursSinceCreated / 24);
  }

  private calculateSimilarityConfidence(preferences: StoryPreferences, post: Post): number {
    let confidence = 50;
    
    if (preferences.favoriteStoryTypes.includes(post.storyType!)) confidence += 30;
    if (preferences.favoriteCategories.includes(post.category)) confidence += 10;
    
    const matchingTags = post.tags.filter(tag => preferences.favoriteTags.includes(tag)).length;
    confidence += matchingTags * 5;
    
    return Math.min(confidence, 95);
  }

  private matchesUserTags(preferences: StoryPreferences, post: Post): boolean {
    return post.tags.some(tag => preferences.favoriteTags.includes(tag)) ||
           preferences.favoriteCategories.includes(post.category);
  }

  private getPersonalizedScore(preferences: StoryPreferences, post: Post): number {
    let score = this.getEngagementScore(post);
    
    if (preferences.favoriteStoryTypes.includes(post.storyType!)) score += 20;
    if (preferences.favoriteCategories.includes(post.category)) score += 10;
    
    const matchingTags = post.tags.filter(tag => preferences.favoriteTags.includes(tag)).length;
    score += matchingTags * 5;
    
    return score;
  }

  private calculatePersonalizedConfidence(preferences: StoryPreferences, post: Post): number {
    let confidence = 60;
    
    if (preferences.favoriteStoryTypes.includes(post.storyType!)) confidence += 25;
    if (preferences.favoriteCategories.includes(post.category)) confidence += 10;
    
    const matchingTags = post.tags.filter(tag => preferences.favoriteTags.includes(tag)).length;
    confidence += matchingTags * 3;
    
    return Math.min(confidence, 90);
  }

  private getPersonalizedReasons(preferences: StoryPreferences, post: Post): string[] {
    const reasons: string[] = [];
    
    if (preferences.favoriteStoryTypes.includes(post.storyType!)) {
      reasons.push(`Matches your love for ${post.storyType} stories`);
    }
    
    if (preferences.favoriteCategories.includes(post.category)) {
      reasons.push(`From your favorite ${post.category} category`);
    }
    
    const matchingTags = post.tags.filter(tag => preferences.favoriteTags.includes(tag));
    if (matchingTags.length > 0) {
      reasons.push(`Tagged with ${matchingTags.slice(0, 2).join(', ')}`);
    }
    
    if (reasons.length === 0) {
      reasons.push("Recommended for you");
    }
    
    return reasons;
  }

  async getRecommendations(sessionId: string, limit = 5): Promise<StoryRecommendation[]> {
    let recommendations = this.storyRecommendations.get(sessionId) || [];
    
    // Generate recommendations if none exist
    if (recommendations.length === 0) {
      await this.generateRecommendationsForUser(sessionId);
      recommendations = this.storyRecommendations.get(sessionId) || [];
    }
    
    return recommendations.slice(0, limit);
  }

  async updatePreferences(sessionId: string, preferences: UpdateStoryPreferences): Promise<void> {
    let existingPreferences = this.userPreferences.get(sessionId);
    
    if (!existingPreferences) {
      existingPreferences = {
        id: `pref_${sessionId}`,
        sessionId,
        favoriteStoryTypes: [],
        favoriteCategories: [],
        favoriteTags: [],
        preferredTimeOfDay: this.getTimeOfDay(),
        engagementStyle: "reader",
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
    }

    // Update preferences
    if (preferences.favoriteStoryTypes) existingPreferences.favoriteStoryTypes = preferences.favoriteStoryTypes;
    if (preferences.favoriteCategories) existingPreferences.favoriteCategories = preferences.favoriteCategories;
    if (preferences.favoriteTags) existingPreferences.favoriteTags = preferences.favoriteTags;
    if (preferences.preferredTimeOfDay) existingPreferences.preferredTimeOfDay = preferences.preferredTimeOfDay;
    if (preferences.engagementStyle) existingPreferences.engagementStyle = preferences.engagementStyle;
    
    existingPreferences.lastUpdated = new Date();
    this.userPreferences.set(sessionId, existingPreferences);
    
    // Regenerate recommendations with new preferences
    await this.generateRecommendationsForUser(sessionId);
  }

  async getTrendingStories(limit = 10): Promise<Post[]> {
    const allPosts = await this.storage.getAllPosts();
    
    return allPosts
      .filter(post => post.category === "story" && post.storyType && !post.isRemoved && !post.isHidden)
      .sort((a, b) => this.getTrendingScore(b) - this.getTrendingScore(a))
      .slice(0, limit);
  }

  async getSimilarStories(postId: string, limit = 5): Promise<Post[]> {
    const allPosts = await this.storage.getAllPosts();
    const targetPost = allPosts.find(p => p.id === postId);
    
    if (!targetPost || !targetPost.storyType) {
      return [];
    }
    
    return allPosts
      .filter(post => 
        post.id !== postId &&
        post.category === "story" && 
        post.storyType === targetPost.storyType &&
        !post.isRemoved && 
        !post.isHidden
      )
      .sort((a, b) => {
        const aTagMatch = a.tags.filter(tag => targetPost.tags.includes(tag)).length;
        const bTagMatch = b.tags.filter(tag => targetPost.tags.includes(tag)).length;
        
        if (aTagMatch !== bTagMatch) return bTagMatch - aTagMatch;
        return this.getEngagementScore(b) - this.getEngagementScore(a);
      })
      .slice(0, limit);
  }

  // Mark recommendation as viewed/interacted
  async markRecommendationViewed(sessionId: string, postId: string): Promise<void> {
    const recommendations = this.storyRecommendations.get(sessionId) || [];
    const recommendation = recommendations.find(r => r.recommendedPostId === postId);
    
    if (recommendation) {
      recommendation.wasViewed = true;
      recommendation.viewedAt = new Date();
    }
  }

  async markRecommendationInteracted(sessionId: string, postId: string): Promise<void> {
    const recommendations = this.storyRecommendations.get(sessionId) || [];
    const recommendation = recommendations.find(r => r.recommendedPostId === postId);
    
    if (recommendation) {
      recommendation.wasInteracted = true;
      recommendation.interactedAt = new Date();
    }
  }

  // Get user preferences
  getUserPreferences(sessionId: string): StoryPreferences | null {
    return this.userPreferences.get(sessionId) || null;
  }

  // Get recommendation stats
  getRecommendationStats(sessionId: string) {
    const recommendations = this.storyRecommendations.get(sessionId) || [];
    const interactions = this.userInteractions.get(sessionId) || [];
    
    return {
      totalRecommendations: recommendations.length,
      viewedRecommendations: recommendations.filter(r => r.wasViewed).length,
      interactedRecommendations: recommendations.filter(r => r.wasInteracted).length,
      totalInteractions: interactions.length,
      storyInteractions: interactions.filter(i => i.category === "story").length,
    };
  }
}

let storyEngineInstance: MemoryStoryRecommendationEngine | null = null;

export function initializeStoryRecommendationEngine(storage: IStorage): MemoryStoryRecommendationEngine {
  if (!storyEngineInstance) {
    storyEngineInstance = new MemoryStoryRecommendationEngine(storage);
    console.log("[Story Recommendation Engine] Service initialized");
  }
  return storyEngineInstance;
}

export const memoryStoryRecommendationEngine = {
  get instance(): MemoryStoryRecommendationEngine {
    if (!storyEngineInstance) {
      throw new Error("Story recommendation engine not initialized. Call initializeStoryRecommendationEngine first.");
    }
    return storyEngineInstance;
  },
  
  // Proxy methods for easy access
  async trackInteraction(sessionId: string, interaction: InsertUserInteraction) {
    return this.instance.trackInteraction(sessionId, interaction);
  },
  
  async getRecommendations(sessionId: string, limit?: number) {
    return this.instance.getRecommendations(sessionId, limit);
  },
  
  async updatePreferences(sessionId: string, preferences: UpdateStoryPreferences) {
    return this.instance.updatePreferences(sessionId, preferences);
  },
  
  async getTrendingStories(limit?: number) {
    return this.instance.getTrendingStories(limit);
  },
  
  async getSimilarStories(postId: string, limit?: number) {
    return this.instance.getSimilarStories(postId, limit);
  },
  
  async markRecommendationViewed(sessionId: string, postId: string) {
    return this.instance.markRecommendationViewed(sessionId, postId);
  },
  
  async markRecommendationInteracted(sessionId: string, postId: string) {
    return this.instance.markRecommendationInteracted(sessionId, postId);
  },
  
  getUserPreferences(sessionId: string) {
    return this.instance.getUserPreferences(sessionId);
  },
  
  getRecommendationStats(sessionId: string) {
    return this.instance.getRecommendationStats(sessionId);
  }
};