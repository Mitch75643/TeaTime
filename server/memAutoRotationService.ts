import { storage } from "./storage";
import { type ContentPrompt, type WeeklyTheme, type RotationCycle, type Leaderboard } from "@shared/schema";
import { pushNotificationService } from "./pushNotificationService";

export class MemAutoRotationService {
  private rotationTimer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute

  constructor() {
    console.log('[Auto-Rotation] Memory service initialized');
  }

  start() {
    console.log('[Auto-Rotation] Starting memory scheduler...');
    this.rotationTimer = setInterval(() => {
      this.checkAndRotateContent();
    }, this.CHECK_INTERVAL);
    
    // Run initial check
    this.checkAndRotateContent();
  }

  stop() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('[Auto-Rotation] Memory scheduler stopped');
    }
  }

  private async checkAndRotateContent() {
    try {
      const now = new Date();
      
      // Get all active rotation cycles that need updating
      const allCycles = await storage.getRotationCycles();
      const expiredCycles = allCycles.filter(cycle => 
        cycle.isActive && cycle.nextRotationAt <= now
      );

      for (const cycle of expiredCycles) {
        await this.rotateCycle(cycle);
      }
    } catch (error) {
      console.error('[Auto-Rotation] Error checking content:', error);
    }
  }

  private async rotateCycle(cycle: RotationCycle) {
    const now = new Date();
    console.log(`[Auto-Rotation] Rotating ${cycle.type}...`);

    try {
      switch (cycle.type) {
        case 'daily_prompt':
          await this.rotateDailyPrompt();
          break;
        case 'daily_debate':
          await this.rotateDailyDebate();
          break;
        case 'tea_experiment':
          await this.rotateTeaExperiment();
          break;
        case 'weekly_theme':
          await this.rotateWeeklyTheme();
          break;
        case 'trending_feed':
          await this.rotateTrendingFeed();
          break;
        case 'celebrity_leaderboard':
          await this.rotateCelebrityLeaderboard();
          break;
        case 'hot_topics_leaderboard':
          await this.rotateHotTopicsLeaderboard();
          break;
      }

      // Update the cycle's next rotation time
      const nextRotation = this.calculateNextRotation(now, cycle.rotationInterval);
      await storage.updateRotationCycle(cycle.id, {
        lastRotatedAt: now,
        nextRotationAt: nextRotation
      });

      console.log(`[Auto-Rotation] Successfully rotated ${cycle.type}`);
    } catch (error) {
      console.error(`[Auto-Rotation] Failed to rotate ${cycle.type}:`, error);
    }
  }

  private calculateNextRotation(current: Date, interval: string): Date {
    const next = new Date(current);
    
    switch (interval) {
      case '24h':
        next.setHours(next.getHours() + 24);
        break;
      case '72h':
        next.setHours(next.getHours() + 72);
        break;
      case '7d':
        next.setDate(next.getDate() + 7);
        break;
      default:
        next.setHours(next.getHours() + 24); // Default to 24h
    }
    
    return next;
  }

  // Daily Spill prompts rotation
  private async rotateDailyPrompt() {
    const unusedPrompts = await storage.getContentPrompts('daily_spill', true);
    
    if (unusedPrompts.length > 0) {
      const prompt = unusedPrompts[0]; // Get highest priority unused prompt
      
      // Mark as used
      await storage.markPromptAsUsed(prompt.id);

      // Update rotation cycle
      const cycles = await storage.getRotationCycles();
      const dailyPromptCycle = cycles.find(c => c.type === 'daily_prompt');
      if (dailyPromptCycle) {
        await storage.updateRotationCycle(dailyPromptCycle.id, {
          currentContentId: prompt.id
        });
      }

      // Send push notifications for new prompt
      console.log('[Auto-Rotation] Sending push notifications for new daily prompt');
      await pushNotificationService.notifyNewPrompt(prompt);
    }
  }

  // Daily Debate prompts rotation
  private async rotateDailyDebate() {
    const unusedPrompts = await storage.getContentPrompts('daily_debate', true);
    
    if (unusedPrompts.length > 0) {
      const prompt = unusedPrompts[0];
      
      await storage.markPromptAsUsed(prompt.id);

      const cycles = await storage.getRotationCycles();
      const dailyDebateCycle = cycles.find(c => c.type === 'daily_debate');
      if (dailyDebateCycle) {
        await storage.updateRotationCycle(dailyDebateCycle.id, {
          currentContentId: prompt.id
        });
      }

      // Send push notifications for new debate
      console.log('[Auto-Rotation] Sending push notifications for new daily debate');
      await pushNotificationService.notifyNewPrompt(prompt);
    }
  }

  // Tea Experiments rotation
  private async rotateTeaExperiment() {
    const unusedPrompts = await storage.getContentPrompts('tea_experiment', true);
    
    if (unusedPrompts.length > 0) {
      const prompt = unusedPrompts[0];
      
      await storage.markPromptAsUsed(prompt.id);

      const cycles = await storage.getRotationCycles();
      const teaExperimentCycle = cycles.find(c => c.type === 'tea_experiment');
      if (teaExperimentCycle) {
        await storage.updateRotationCycle(teaExperimentCycle.id, {
          currentContentId: prompt.id
        });
      }
    }
  }

  // Weekly theme rotation
  private async rotateWeeklyTheme() {
    const themes = await storage.getWeeklyThemes();
    
    if (themes.length > 0) {
      // Find next theme to activate (cycle through all themes)
      const currentActiveTheme = themes.find(t => t.isActive);
      let nextThemeIndex = 0;
      
      if (currentActiveTheme) {
        const currentIndex = themes.findIndex(t => t.id === currentActiveTheme.id);
        nextThemeIndex = (currentIndex + 1) % themes.length;
      }
      
      const nextTheme = themes[nextThemeIndex];
      await storage.setActiveTheme(nextTheme.id);

      const cycles = await storage.getRotationCycles();
      const weeklyThemeCycle = cycles.find(c => c.type === 'weekly_theme');
      if (weeklyThemeCycle) {
        await storage.updateRotationCycle(weeklyThemeCycle.id, {
          currentContentId: nextTheme.id
        });
      }
    }
  }

  // Trending feed rotation (every 3 days)
  private async rotateTrendingFeed() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get all posts from last 3 days
    const allPosts = await storage.getPosts();
    const recentPosts = allPosts
      .filter(post => post.createdAt && post.createdAt >= threeDaysAgo && !post.isRemoved && !post.isHidden)
      .map(post => {
        const reactions = post.reactions as any || { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 };
        const score = (reactions.thumbsUp || 0) * 2 + 
                     (reactions.laugh || 0) * 1.5 + 
                     (post.commentCount || 0) * 3;
        return { ...post, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Store in leaderboards
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 3);

    await storage.deactivateLeaderboards('trending_posts');
    await storage.createLeaderboard({
      type: 'trending_posts',
      periodStart: threeDaysAgo,
      periodEnd: periodEnd,
      data: recentPosts,
      isActive: true
    });
  }

  // Celebrity leaderboard rotation (weekly)
  private async rotateCelebrityLeaderboard() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allPosts = await storage.getPosts();
    const celebrityPosts = allPosts
      .filter(post => 
        post.communitySection === 'celebrity-tea' && 
        post.createdAt && post.createdAt >= oneWeekAgo && 
        !post.isRemoved && 
        !post.isHidden &&
        post.celebrityName
      );

    // Group by celebrity and calculate stats
    const celebrityStats = new Map();
    
    celebrityPosts.forEach(post => {
      const celeb = post.celebrityName!;
      if (!celebrityStats.has(celeb)) {
        celebrityStats.set(celeb, { celebrityName: celeb, postCount: 0, totalReactions: 0 });
      }
      
      const stats = celebrityStats.get(celeb);
      stats.postCount++;
      
      const reactions = post.reactions as any || { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 };
      stats.totalReactions += (reactions.thumbsUp || 0) + 
                             (reactions.thumbsDown || 0) + 
                             (reactions.laugh || 0) + 
                             (reactions.sad || 0);
    });

    const topCelebs = Array.from(celebrityStats.values())
      .sort((a, b) => b.totalReactions - a.totalReactions)
      .slice(0, 5);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 7);

    await storage.deactivateLeaderboards('celebrity_tea');
    await storage.createLeaderboard({
      type: 'celebrity_tea',
      periodStart: oneWeekAgo,
      periodEnd: periodEnd,
      data: topCelebs,
      isActive: true
    });
  }

  // Hot Topics leaderboard rotation (weekly)
  private async rotateHotTopicsLeaderboard() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allPosts = await storage.getPosts();
    const hotTopicPosts = allPosts
      .filter(post => 
        post.communitySection === 'hot-topics' && 
        post.createdAt && post.createdAt >= oneWeekAgo && 
        !post.isRemoved && 
        !post.isHidden
      )
      .map(post => {
        const reactions = post.reactions as any || { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 };
        const score = (reactions.thumbsUp || 0) * 2 + 
                     (reactions.laugh || 0) * 1.5 + 
                     (post.commentCount || 0) * 3;
        return { ...post, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 7);

    await storage.deactivateLeaderboards('hot_topics');
    await storage.createLeaderboard({
      type: 'hot_topics',
      periodStart: oneWeekAgo,
      periodEnd: periodEnd,
      data: hotTopicPosts,
      isActive: true
    });
  }

  // Initialize rotation cycles if they don't exist
  async initializeRotationCycles() {
    console.log('[Auto-Rotation] Initializing memory rotation cycles...');
    
    const existingCycles = await storage.getRotationCycles();
    const cycleTypes = [
      { type: 'daily_prompt', interval: '24h' },
      { type: 'daily_debate', interval: '24h' },
      { type: 'tea_experiment', interval: '24h' },
      { type: 'weekly_theme', interval: '7d' },
      { type: 'trending_feed', interval: '72h' },
      { type: 'celebrity_leaderboard', interval: '7d' },
      { type: 'hot_topics_leaderboard', interval: '7d' }
    ];

    for (const cycleType of cycleTypes) {
      const exists = existingCycles.find(c => c.type === cycleType.type);
      if (!exists) {
        await storage.createRotationCycle({
          type: cycleType.type as any,
          rotationInterval: cycleType.interval as any,
          metadata: {}
        });
        
        console.log(`[Auto-Rotation] Created memory cycle for ${cycleType.type}`);
      }
    }
  }

  // Seed initial prompts and themes
  async seedInitialContent() {
    console.log('[Auto-Rotation] Seeding initial memory content...');
    
    // Check if we already have content
    const existingPrompts = await storage.getContentPrompts();
    const existingThemes = await storage.getWeeklyThemes();
    
    if (existingPrompts.length === 0) {
      await this.seedPrompts();
    }
    
    if (existingThemes.length === 0) {
      await this.seedThemes();
    }
  }

  private async seedPrompts() {
    const dailySpillPrompts = [
      "What's the most awkward thing that happened to you today?",
      "Share an unpopular opinion you secretly believe in",
      "What's a rumor you heard that you can't stop thinking about?",
      "Describe the weirdest interaction you had with a stranger",
      "What's something everyone does but no one talks about?",
      "Share a conspiracy theory about your workplace or school",
      "What's the most embarrassing thing in your search history?",
      "Tell us about a time you pretended to know something you didn't",
      "What's a weird habit you developed during quarantine?",
      "Share something you did that you immediately regretted"
    ];

    const debatePrompts = [
      "Pineapple on pizza: crime against humanity or misunderstood masterpiece?",
      "Is it worse to be 15 minutes early or 5 minutes late?",
      "Should you tell your friend if their partner is cheating?",
      "Is it okay to wear socks with sandals?",
      "Should people be required to take a test before having kids?",
      "Is social media making us more connected or more lonely?",
      "Should tipping be mandatory or abolished?",
      "Is it ethical to ghost someone you've been dating?",
      "Should schools start later in the day?",
      "Is it okay to break up with someone over text?"
    ];

    const teaExperiments = [
      "Would you rather know when you'll die or how you'll die?",
      "If you could read minds for one day, whose mind would you read first?",
      "Would you rather have the ability to fly or be invisible?",
      "If you had to choose: lose all your memories or never make new ones?",
      "Would you rather be famous for something embarrassing or never be known at all?",
      "If you could eliminate one social media platform forever, which would it be?",
      "Would you rather always say what you're thinking or never speak again?",
      "If you could know one secret about every person you meet, would you want to?",
      "Would you rather live without music or without movies?",
      "If you could undo one decision in your life, would you?"
    ];

    // Insert daily spill prompts
    for (const prompt of dailySpillPrompts) {
      await storage.createContentPrompt({
        type: 'daily_spill',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1,
        tags: []
      });
    }

    // Insert debate prompts
    for (const prompt of debatePrompts) {
      await storage.createContentPrompt({
        type: 'daily_debate',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1,
        tags: []
      });
    }

    // Insert tea experiment prompts
    for (const prompt of teaExperiments) {
      await storage.createContentPrompt({
        type: 'tea_experiment',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1,
        tags: []
      });
    }

    console.log('[Auto-Rotation] Seeded initial memory prompts');
  }

  private async seedThemes() {
    const themes = [
      { name: "Friendship Week", description: "Share stories about friendships, betrayals, and loyalty" },
      { name: "Embarrassing Moments Week", description: "Time to spill your most cringe-worthy experiences" },
      { name: "Family Drama Week", description: "The tea about relatives, holidays, and family secrets" },
      { name: "Workplace Tea Week", description: "Office gossip, coworker drama, and career confessions" },
      { name: "Dating Disasters Week", description: "Share your worst dates, relationship fails, and love stories" },
      { name: "School/College Chaos Week", description: "Academic drama, campus gossip, and student life" },
      { name: "Money Matters Week", description: "Financial confessions, spending habits, and money drama" },
      { name: "Social Media Secrets Week", description: "The truth about online personas and digital drama" }
    ];

    for (const theme of themes) {
      await storage.createWeeklyTheme({
        name: theme.name,
        description: theme.description
      });
    }

    console.log('[Auto-Rotation] Seeded initial memory themes');
  }

  // Get current active content
  async getCurrentContent() {
    const cycles = await storage.getRotationCycles();
    const result: Record<string, any> = {};

    for (const cycle of cycles.filter(c => c.isActive)) {
      if (cycle.currentContentId) {
        if (cycle.type === 'weekly_theme') {
          const themes = await storage.getWeeklyThemes();
          const theme = themes.find(t => t.id === cycle.currentContentId);
          if (theme) {
            result.weeklyTheme = theme;
          }
        } else {
          const prompts = await storage.getContentPrompts();
          const prompt = prompts.find(p => p.id === cycle.currentContentId);
          if (prompt) {
            result[cycle.type] = prompt;
          }
        }
      }
    }

    // Get active leaderboards
    const activeLeaderboards = await storage.getActiveLeaderboards();
    result.leaderboards = activeLeaderboards;

    return result;
  }
}

export const memAutoRotationService = new MemAutoRotationService();