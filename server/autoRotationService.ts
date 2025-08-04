import { db } from "./db";
import { 
  contentPrompts, 
  weeklyThemes, 
  rotationCycles, 
  leaderboards, 
  posts,
  type ContentPrompt,
  type WeeklyTheme,
  type RotationCycle,
  type Leaderboard 
} from "@shared/schema";
import { eq, and, desc, asc, sql, count, gt, gte, lte } from "drizzle-orm";

export class AutoRotationService {
  private rotationTimer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute

  constructor() {
    console.log('[Auto-Rotation] Service initialized');
  }

  start() {
    console.log('[Auto-Rotation] Starting scheduler...');
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
      console.log('[Auto-Rotation] Scheduler stopped');
    }
  }

  private async checkAndRotateContent() {
    try {
      const now = new Date();
      
      // Get all active rotation cycles that need updating
      const expiredCycles = await db
        .select()
        .from(rotationCycles)
        .where(and(
          eq(rotationCycles.isActive, true),
          lte(rotationCycles.nextRotationAt, now)
        ));

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
      await db
        .update(rotationCycles)
        .set({
          lastRotatedAt: now,
          nextRotationAt: nextRotation
        })
        .where(eq(rotationCycles.id, cycle.id));

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
    const unusedPrompt = await db
      .select()
      .from(contentPrompts)
      .where(and(
        eq(contentPrompts.type, 'daily_spill'),
        eq(contentPrompts.isUsed, false)
      ))
      .orderBy(desc(contentPrompts.priority), asc(contentPrompts.createdAt))
      .limit(1);

    if (unusedPrompt.length > 0) {
      const prompt = unusedPrompt[0];
      
      // Mark as used
      await db
        .update(contentPrompts)
        .set({
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(contentPrompts.id, prompt.id));

      // Update rotation cycle
      await db
        .update(rotationCycles)
        .set({ currentContentId: prompt.id })
        .where(eq(rotationCycles.type, 'daily_prompt'));
    }
  }

  // Daily Debate prompts rotation
  private async rotateDailyDebate() {
    const unusedPrompt = await db
      .select()
      .from(contentPrompts)
      .where(and(
        eq(contentPrompts.type, 'daily_debate'),
        eq(contentPrompts.isUsed, false)
      ))
      .orderBy(desc(contentPrompts.priority), asc(contentPrompts.createdAt))
      .limit(1);

    if (unusedPrompt.length > 0) {
      const prompt = unusedPrompt[0];
      
      await db
        .update(contentPrompts)
        .set({
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(contentPrompts.id, prompt.id));

      await db
        .update(rotationCycles)
        .set({ currentContentId: prompt.id })
        .where(eq(rotationCycles.type, 'daily_debate'));
    }
  }

  // Tea Experiments rotation
  private async rotateTeaExperiment() {
    const unusedPrompt = await db
      .select()
      .from(contentPrompts)
      .where(and(
        eq(contentPrompts.type, 'tea_experiment'),
        eq(contentPrompts.isUsed, false)
      ))
      .orderBy(desc(contentPrompts.priority), asc(contentPrompts.createdAt))
      .limit(1);

    if (unusedPrompt.length > 0) {
      const prompt = unusedPrompt[0];
      
      await db
        .update(contentPrompts)
        .set({
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(contentPrompts.id, prompt.id));

      await db
        .update(rotationCycles)
        .set({ currentContentId: prompt.id })
        .where(eq(rotationCycles.type, 'tea_experiment'));
    }
  }

  // Weekly theme rotation
  private async rotateWeeklyTheme() {
    // Deactivate current theme
    await db
      .update(weeklyThemes)
      .set({ isActive: false })
      .where(eq(weeklyThemes.isActive, true));

    // Get next unused theme or cycle back to start
    const nextTheme = await db
      .select()
      .from(weeklyThemes)
      .orderBy(asc(weeklyThemes.createdAt))
      .limit(1);

    if (nextTheme.length > 0) {
      const theme = nextTheme[0];
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);

      await db
        .update(weeklyThemes)
        .set({
          isActive: true,
          startDate: now,
          endDate: endDate
        })
        .where(eq(weeklyThemes.id, theme.id));

      await db
        .update(rotationCycles)
        .set({ currentContentId: theme.id })
        .where(eq(rotationCycles.type, 'weekly_theme'));
    }
  }

  // Trending feed rotation (every 3 days)
  private async rotateTrendingFeed() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Calculate trending posts based on reactions and comments in last 72 hours
    const trendingPosts = await db
      .select({
        id: posts.id,
        content: posts.content,
        category: posts.category,
        alias: posts.alias,
        avatarId: posts.avatarId,
        reactions: posts.reactions,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        score: sql<number>`(
          COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) * 2 +
          COALESCE((${posts.reactions}->>'laugh')::int, 0) * 1.5 +
          ${posts.commentCount} * 3
        )`
      })
      .from(posts)
      .where(and(
        gte(posts.createdAt, threeDaysAgo),
        eq(posts.isRemoved, false),
        eq(posts.isHidden, false)
      ))
      .orderBy(desc(sql`(
        COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) * 2 +
        COALESCE((${posts.reactions}->>'laugh')::int, 0) * 1.5 +
        ${posts.commentCount} * 3
      )`))
      .limit(10);

    // Store in leaderboards table
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 3);

    await db.insert(leaderboards).values({
      type: 'trending_posts',
      periodStart: threeDaysAgo,
      periodEnd: periodEnd,
      data: trendingPosts,
      isActive: true
    });

    // Deactivate old trending leaderboards
    await db
      .update(leaderboards)
      .set({ isActive: false })
      .where(and(
        eq(leaderboards.type, 'trending_posts'),
        lte(leaderboards.periodEnd, now)
      ));
  }

  // Celebrity leaderboard rotation (weekly)
  private async rotateCelebrityLeaderboard() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const celebrityStats = await db
      .select({
        celebrityName: posts.celebrityName,
        postCount: count(posts.id),
        totalReactions: sql<number>`SUM(
          COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) +
          COALESCE((${posts.reactions}->>'thumbsDown')::int, 0) +
          COALESCE((${posts.reactions}->>'laugh')::int, 0) +
          COALESCE((${posts.reactions}->>'sad')::int, 0)
        )`
      })
      .from(posts)
      .where(and(
        eq(posts.communitySection, 'celebrity-tea'),
        gte(posts.createdAt, oneWeekAgo),
        eq(posts.isRemoved, false),
        eq(posts.isHidden, false)
      ))
      .groupBy(posts.celebrityName)
      .orderBy(desc(sql`SUM(
        COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) +
        COALESCE((${posts.reactions}->>'thumbsDown')::int, 0) +
        COALESCE((${posts.reactions}->>'laugh')::int, 0) +
        COALESCE((${posts.reactions}->>'sad')::int, 0)
      )`))
      .limit(5);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 7);

    await db.insert(leaderboards).values({
      type: 'celebrity_tea',
      periodStart: oneWeekAgo,
      periodEnd: periodEnd,
      data: celebrityStats,
      isActive: true
    });

    // Deactivate old celebrity leaderboards
    await db
      .update(leaderboards)
      .set({ isActive: false })
      .where(and(
        eq(leaderboards.type, 'celebrity_tea'),
        lte(leaderboards.periodEnd, now)
      ));
  }

  // Hot Topics leaderboard rotation (weekly)
  private async rotateHotTopicsLeaderboard() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const hotTopics = await db
      .select({
        id: posts.id,
        content: posts.content,
        topicTitle: posts.topicTitle,
        alias: posts.alias,
        avatarId: posts.avatarId,
        reactions: posts.reactions,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        score: sql<number>`(
          COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) * 2 +
          COALESCE((${posts.reactions}->>'laugh')::int, 0) * 1.5 +
          ${posts.commentCount} * 3
        )`
      })
      .from(posts)
      .where(and(
        eq(posts.communitySection, 'hot-topics'),
        gte(posts.createdAt, oneWeekAgo),
        eq(posts.isRemoved, false),
        eq(posts.isHidden, false)
      ))
      .orderBy(desc(sql`(
        COALESCE((${posts.reactions}->>'thumbsUp')::int, 0) * 2 +
        COALESCE((${posts.reactions}->>'laugh')::int, 0) * 1.5 +
        ${posts.commentCount} * 3
      )`))
      .limit(5);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 7);

    await db.insert(leaderboards).values({
      type: 'hot_topics',
      periodStart: oneWeekAgo,
      periodEnd: periodEnd,
      data: hotTopics,
      isActive: true
    });

    // Deactivate old hot topics leaderboards
    await db
      .update(leaderboards)
      .set({ isActive: false })
      .where(and(
        eq(leaderboards.type, 'hot_topics'),
        lte(leaderboards.periodEnd, now)
      ));
  }

  // Initialize rotation cycles if they don't exist
  async initializeRotationCycles() {
    console.log('[Auto-Rotation] Initializing rotation cycles...');
    
    const existingCycles = await db.select().from(rotationCycles);
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
        const now = new Date();
        const nextRotation = this.calculateNextRotation(now, cycleType.interval);
        
        await db.insert(rotationCycles).values({
          type: cycleType.type as any,
          rotationInterval: cycleType.interval as any,
          lastRotatedAt: now,
          nextRotationAt: nextRotation,
          isActive: true,
          metadata: {}
        });
        
        console.log(`[Auto-Rotation] Created cycle for ${cycleType.type}`);
      }
    }
  }

  // Seed initial prompts and themes
  async seedInitialContent() {
    console.log('[Auto-Rotation] Seeding initial content...');
    
    // Check if we already have content
    const existingPrompts = await db.select().from(contentPrompts).limit(1);
    const existingThemes = await db.select().from(weeklyThemes).limit(1);
    
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
      await db.insert(contentPrompts).values({
        type: 'daily_spill',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1
      });
    }

    // Insert debate prompts
    for (const prompt of debatePrompts) {
      await db.insert(contentPrompts).values({
        type: 'daily_debate',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1
      });
    }

    // Insert tea experiment prompts
    for (const prompt of teaExperiments) {
      await db.insert(contentPrompts).values({
        type: 'tea_experiment',
        content: prompt,
        priority: Math.floor(Math.random() * 5) + 1
      });
    }

    console.log('[Auto-Rotation] Seeded initial prompts');
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
      await db.insert(weeklyThemes).values({
        name: theme.name,
        description: theme.description
      });
    }

    console.log('[Auto-Rotation] Seeded initial themes');
  }

  // Get current active content
  async getCurrentContent() {
    const cycles = await db
      .select()
      .from(rotationCycles)
      .where(eq(rotationCycles.isActive, true));

    const result: Record<string, any> = {};

    for (const cycle of cycles) {
      if (cycle.currentContentId) {
        if (cycle.type === 'weekly_theme') {
          const theme = await db
            .select()
            .from(weeklyThemes)
            .where(eq(weeklyThemes.id, cycle.currentContentId))
            .limit(1);
          
          if (theme.length > 0) {
            result.weeklyTheme = theme[0];
          }
        } else {
          const prompt = await db
            .select()
            .from(contentPrompts)
            .where(eq(contentPrompts.id, cycle.currentContentId))
            .limit(1);
          
          if (prompt.length > 0) {
            result[cycle.type] = prompt[0];
          }
        }
      }
    }

    // Get active leaderboards
    const activeLeaderboards = await db
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.isActive, true));

    result.leaderboards = activeLeaderboards;

    return result;
  }
}

export const autoRotationService = new AutoRotationService();