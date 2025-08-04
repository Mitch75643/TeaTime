import { apiRequest } from "./queryClient";
import type { 
  InsertUserInteraction, 
  UpdateStoryPreferences,
  StoryRecommendation,
  StoryPreferences 
} from "@shared/schema";

// Story recommendation API utilities
export const storyRecommendationsApi = {
  // Track user interactions
  async trackInteraction(interaction: InsertUserInteraction): Promise<{ success: boolean }> {
    return apiRequest('/api/stories/track-interaction', {
      method: 'POST',
      body: interaction,
    });
  },

  // Get personalized recommendations
  async getRecommendations(limit = 5): Promise<StoryRecommendation[]> {
    return apiRequest(`/api/stories/recommendations?limit=${limit}`);
  },

  // Get trending stories
  async getTrendingStories(limit = 10) {
    return apiRequest(`/api/stories/trending?limit=${limit}`);
  },

  // Get similar stories
  async getSimilarStories(postId: string, limit = 5) {
    return apiRequest(`/api/stories/${postId}/similar?limit=${limit}`);
  },

  // Update user preferences
  async updatePreferences(preferences: UpdateStoryPreferences): Promise<{ success: boolean }> {
    return apiRequest('/api/stories/preferences', {
      method: 'PUT',
      body: preferences,
    });
  },

  // Get user preferences
  async getPreferences(): Promise<StoryPreferences | null> {
    return apiRequest('/api/stories/preferences');
  },

  // Mark recommendation as viewed
  async markRecommendationViewed(postId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/stories/recommendations/${postId}/viewed`, {
      method: 'POST',
    });
  },

  // Mark recommendation as interacted
  async markRecommendationInteracted(postId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/stories/recommendations/${postId}/interacted`, {
      method: 'POST',
    });
  },

  // Get recommendation stats
  async getStats() {
    return apiRequest('/api/stories/stats');
  },
};

// Helper functions for interaction tracking
export const trackStoryInteraction = {
  // Track when user views a story
  view: async (postId: string, storyType?: string, category = "story", tags: string[] = [], timeSpent = 0) => {
    return storyRecommendationsApi.trackInteraction({
      postId,
      interactionType: "view",
      storyType,
      category,
      tags,
      timeSpent,
      deviceType: getDeviceType(),
    });
  },

  // Track when user reacts to a story  
  reaction: async (postId: string, storyType?: string, category = "story", tags: string[] = []) => {
    return storyRecommendationsApi.trackInteraction({
      postId,
      interactionType: "reaction",
      storyType,
      category,
      tags,
      deviceType: getDeviceType(),
    });
  },

  // Track when user comments on a story
  comment: async (postId: string, storyType?: string, category = "story", tags: string[] = []) => {
    return storyRecommendationsApi.trackInteraction({
      postId,
      interactionType: "comment",
      storyType,
      category,
      tags,
      deviceType: getDeviceType(),
    });
  },

  // Track when user shares a story
  share: async (postId: string, storyType?: string, category = "story", tags: string[] = []) => {
    return storyRecommendationsApi.trackInteraction({
      postId,
      interactionType: "share",
      storyType,
      category,
      tags,
      deviceType: getDeviceType(),
    });
  },
};

// Helper function to detect device type
function getDeviceType(): "mobile" | "desktop" | "tablet" | "unknown" {
  if (typeof window === 'undefined') return "unknown";
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|ios|iphone|ipad|blackberry|opera mini|webos/i.test(userAgent);
  const isTablet = /ipad|tablet|kindle|silk/i.test(userAgent);
  
  if (isTablet) return "tablet";
  if (isMobile) return "mobile";
  return "desktop";
}

// Story preference helpers
export const storyPreferences = {
  // Quick preference updates for common actions
  async addFavoriteStoryType(storyType: "horror" | "funny" | "weird" | "romantic" | "embarrassing") {
    const currentPrefs = await storyRecommendationsApi.getPreferences();
    const favoriteStoryTypes = currentPrefs?.favoriteStoryTypes || [];
    
    if (!favoriteStoryTypes.includes(storyType)) {
      favoriteStoryTypes.push(storyType);
      return storyRecommendationsApi.updatePreferences({ favoriteStoryTypes });
    }
    
    return { success: true };
  },

  async removeFavoriteStoryType(storyType: "horror" | "funny" | "weird" | "romantic" | "embarrassing") {
    const currentPrefs = await storyRecommendationsApi.getPreferences();
    const favoriteStoryTypes = currentPrefs?.favoriteStoryTypes?.filter(type => type !== storyType) || [];
    
    return storyRecommendationsApi.updatePreferences({ favoriteStoryTypes });
  },

  async setEngagementStyle(style: "reader" | "commenter" | "reactor") {
    return storyRecommendationsApi.updatePreferences({ engagementStyle: style });
  },

  async addFavoriteTag(tag: string) {
    const currentPrefs = await storyRecommendationsApi.getPreferences();
    const favoriteTags = currentPrefs?.favoriteTags || [];
    
    if (!favoriteTags.includes(tag)) {
      favoriteTags.push(tag);
      return storyRecommendationsApi.updatePreferences({ favoriteTags });
    }
    
    return { success: true };
  },
};

// Auto-tracking hooks for components
export const useStoryTracking = () => {
  return {
    trackView: trackStoryInteraction.view,
    trackReaction: trackStoryInteraction.reaction,
    trackComment: trackStoryInteraction.comment,
    trackShare: trackStoryInteraction.share,
  };
};

// Analytics helpers
export const storyAnalytics = {
  // Calculate reading time estimate
  estimateReadingTime: (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  },

  // Calculate engagement score
  calculateEngagementScore: (reactions: any, commentCount: number, viewCount: number): number => {
    const reactionScore = typeof reactions === 'object' && reactions ? 
      Object.values(reactions).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0) : 0;
    
    return reactionScore * 3 + commentCount * 5 + Math.min(viewCount, 100);
  },

  // Get story popularity tier
  getPopularityTier: (engagementScore: number): "low" | "medium" | "high" | "viral" => {
    if (engagementScore < 10) return "low";
    if (engagementScore < 50) return "medium"; 
    if (engagementScore < 200) return "high";
    return "viral";
  },

  // Format engagement numbers
  formatEngagementNumber: (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
    return `${(num / 1000000).toFixed(1)}m`;
  },
};