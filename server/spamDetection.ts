import { storage } from './storage';

interface SpamMetrics {
  sessionId: string;
  deviceFingerprint?: string;
  postCount: number;
  lastPostTime: Date;
  recentPosts: Array<{
    content: string;
    timestamp: Date;
    category: string;
    page: string;
  }>;
  warnings: number;
  engagementScore: number; // Based on likes, comments received
  isWhitelisted: boolean;
  violations: Array<{
    type: 'frequency' | 'similarity' | 'keyword_spam' | 'link_spam';
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// In-memory spam tracking (in production, use Redis or database)
const spamMetrics = new Map<string, SpamMetrics>();

// Configuration
const SPAM_CONFIG = {
  POST_LIMIT: 4, // posts per time window
  TIME_WINDOW_MINUTES: 5, // 5-minute cooldown window after 4 posts
  SIMILARITY_THRESHOLD: 0.8, // 80% similarity triggers warning
  MIN_ENGAGEMENT_FOR_WHITELIST: 10, // likes + comments to be whitelisted
  VIOLATION_COOLDOWN_MINUTES: 5,
  MAX_WARNINGS: 3
};

// Admin session identifiers that bypass spam detection
const ADMIN_SESSIONS = new Set([
  process.env.ADMIN_SESSION_1,
  process.env.ADMIN_SESSION_2, 
  process.env.ADMIN_SESSION_3
].filter(Boolean)); // Remove any undefined values

// Check if a session belongs to an admin
function isAdminSession(sessionId: string): boolean {
  return ADMIN_SESSIONS.has(sessionId) || 
         sessionId.startsWith('admin_') || 
         (process.env.NODE_ENV === 'development' && sessionId === 'dev_admin') ||
         sessionId.includes('admin_test_'); // For testing panel
}

// Calculate text similarity using Levenshtein distance
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const a = normalize(text1);
  const b = normalize(text2);
  
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return 1 - (matrix[b.length][a.length] / maxLength);
}

// Extract potential spam indicators
function extractSpamIndicators(content: string): { links: string[], keywords: string[] } {
  const links = content.match(/https?:\/\/[^\s]+/g) || [];
  
  // Common spam keywords/patterns
  const spamPatterns = [
    /click here/gi,
    /buy now/gi,
    /limited time/gi,
    /act fast/gi,
    /guaranteed/gi,
    /make money/gi,
    /work from home/gi,
    /lose weight/gi,
    /free gift/gi,
    /winner/gi,
    /congratulations/gi
  ];
  
  const keywords = spamPatterns
    .filter(pattern => pattern.test(content))
    .map(pattern => pattern.source);
  
  return { links, keywords };
}

// Get or create spam metrics for a session
function getSpamMetrics(sessionId: string, deviceFingerprint?: string): SpamMetrics {
  if (!spamMetrics.has(sessionId)) {
    spamMetrics.set(sessionId, {
      sessionId,
      deviceFingerprint,
      postCount: 0,
      lastPostTime: new Date(),
      recentPosts: [],
      warnings: 0,
      engagementScore: 0,
      isWhitelisted: false,
      violations: []
    });
  }
  return spamMetrics.get(sessionId)!;
}

// Update engagement score based on post interactions
export async function updateEngagementScore(sessionId: string, postId: string) {
  const metrics = getSpamMetrics(sessionId);
  
  try {
    // Get post stats to calculate engagement
    const posts = await storage.getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post) {
      // Get engagement metrics (reactions, comments)
      const reactions = post.reactions || {};
      const totalReactions = Object.values(reactions).reduce((sum: number, count) => sum + (count || 0), 0);
      const comments = await storage.getComments(postId);
      const commentCount = comments.length;
      
      metrics.engagementScore += totalReactions + commentCount;
      
      // Whitelist users with high engagement
      if (metrics.engagementScore >= SPAM_CONFIG.MIN_ENGAGEMENT_FOR_WHITELIST) {
        metrics.isWhitelisted = true;
      }
    }
  } catch (error) {
    console.error('Error updating engagement score:', error);
  }
}

// Main spam detection function
export async function detectSpam(
  sessionId: string,
  content: string,
  category: string,
  page: string,
  deviceFingerprint?: string
): Promise<{
  isSpam: boolean;
  action: 'allow' | 'warn' | 'throttle' | 'block';
  message?: string;
  severity: 'low' | 'medium' | 'high';
  cooldownMinutes?: number;
}> {
  // Admin bypass - admins can post unlimited times without restrictions
  if (isAdminSession(sessionId)) {
    return { isSpam: false, action: 'allow', severity: 'low' };
  }
  
  const metrics = getSpamMetrics(sessionId, deviceFingerprint);
  const now = new Date();
  const timeWindow = new Date(now.getTime() - SPAM_CONFIG.TIME_WINDOW_MINUTES * 60 * 1000);
  
  // Clean old posts outside time window
  metrics.recentPosts = metrics.recentPosts.filter(post => post.timestamp > timeWindow);
  
  // Whitelisted users get relaxed limits
  if (metrics.isWhitelisted) {
    metrics.recentPosts.push({ content, timestamp: now, category, page });
    return { isSpam: false, action: 'allow', severity: 'low' };
  }
  
  // Check frequency limit - allow 4 posts before cooldown
  const recentPostCount = metrics.recentPosts.length;
  
  // Debug logging for troubleshooting
  console.log(`[Spam Detection] Session: ${sessionId.slice(0, 8)}... | Recent posts: ${recentPostCount}/${SPAM_CONFIG.POST_LIMIT} | Time window: ${SPAM_CONFIG.TIME_WINDOW_MINUTES}min`);
  
  // Block on the 5th post (when recentPostCount is 4, meaning 4 previous posts exist)
  if (recentPostCount >= SPAM_CONFIG.POST_LIMIT) {
    metrics.violations.push({
      type: 'frequency',
      timestamp: now,
      severity: 'medium'
    });
    
    console.log(`[Spam Detection] BLOCKED: User ${sessionId.slice(0, 8)}... hit ${SPAM_CONFIG.POST_LIMIT}-post limit`);
    
    return {
      isSpam: true,
      action: 'throttle',
      message: "You've shared 4 posts recently! Take a 5-minute break to let others join the conversation.",
      severity: 'medium',
      cooldownMinutes: SPAM_CONFIG.VIOLATION_COOLDOWN_MINUTES
    };
  }
  
  // Check content similarity
  for (const recentPost of metrics.recentPosts) {
    const similarity = calculateSimilarity(content, recentPost.content);
    if (similarity >= SPAM_CONFIG.SIMILARITY_THRESHOLD) {
      metrics.violations.push({
        type: 'similarity',
        timestamp: now,
        severity: 'high'
      });
      
      metrics.warnings++;
      
      return {
        isSpam: true,
        action: metrics.warnings >= SPAM_CONFIG.MAX_WARNINGS ? 'block' : 'warn',
        message: "⚠️ Posting the same thing repeatedly could limit your account visibility.",
        severity: 'high'
      };
    }
  }
  
  // Check spam indicators
  const { links, keywords } = extractSpamIndicators(content);
  
  // Multiple links in short timeframe
  const recentLinks = metrics.recentPosts.flatMap(post => extractSpamIndicators(post.content).links);
  if (links.length > 0 && recentLinks.some(link => links.includes(link))) {
    metrics.violations.push({
      type: 'link_spam',
      timestamp: now,
      severity: 'high'
    });
    
    return {
      isSpam: true,
      action: 'warn',
      message: "⚠️ Multiple posts with the same links may be flagged for review.",
      severity: 'high'
    };
  }
  
  // Keyword spam detection
  if (keywords.length >= 2) {
    metrics.violations.push({
      type: 'keyword_spam',
      timestamp: now,
      severity: 'medium'
    });
    
    return {
      isSpam: true,
      action: 'warn',
      message: "⚠️ Your post contains patterns that might be flagged as spam.",
      severity: 'medium'
    };
  }
  
  // Add to recent posts if not spam (important for counting)
  metrics.recentPosts.push({ content, timestamp: now, category, page });
  metrics.lastPostTime = now;
  metrics.postCount++;
  
  return { isSpam: false, action: 'allow', severity: 'low' };
}

// Check if user is currently in cooldown
export function isInCooldown(sessionId: string): { inCooldown: boolean; remainingMinutes?: number } {
  // Admin bypass - admins never have cooldowns
  if (isAdminSession(sessionId)) {
    return { inCooldown: false };
  }
  
  const metrics = spamMetrics.get(sessionId);
  if (!metrics || metrics.violations.length === 0) {
    return { inCooldown: false };
  }
  
  const lastViolation = metrics.violations[metrics.violations.length - 1];
  const cooldownEnd = new Date(lastViolation.timestamp.getTime() + SPAM_CONFIG.VIOLATION_COOLDOWN_MINUTES * 60 * 1000);
  const now = new Date();
  
  if (now < cooldownEnd) {
    const remainingMinutes = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (60 * 1000));
    return { inCooldown: true, remainingMinutes };
  }
  
  return { inCooldown: false };
}

// Get spam statistics for admin dashboard
export function getSpamStatistics(): {
  totalUsers: number;
  whitelistedUsers: number;
  recentViolations: number;
  topViolators: Array<{ sessionId: string; violationCount: number }>;
} {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentViolations = Array.from(spamMetrics.values())
    .flatMap(metrics => metrics.violations)
    .filter(violation => violation.timestamp > last24Hours)
    .length;
  
  const whitelistedUsers = Array.from(spamMetrics.values())
    .filter(metrics => metrics.isWhitelisted)
    .length;
  
  const topViolators = Array.from(spamMetrics.values())
    .map(metrics => ({
      sessionId: metrics.sessionId,
      violationCount: metrics.violations.length
    }))
    .filter(user => user.violationCount > 0)
    .sort((a, b) => b.violationCount - a.violationCount)
    .slice(0, 10);
  
  return {
    totalUsers: spamMetrics.size,
    whitelistedUsers,
    recentViolations,
    topViolators
  };
}

// Reset user spam metrics (admin function)
export function resetUserSpamMetrics(sessionId: string): boolean {
  return spamMetrics.delete(sessionId);
}

// Clean up old metrics (run periodically)
export function cleanupOldMetrics() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
  
  for (const [sessionId, metrics] of Array.from(spamMetrics.entries())) {
    if (metrics.lastPostTime < cutoff && !metrics.isWhitelisted) {
      spamMetrics.delete(sessionId);
    }
  }
}

// Initialize cleanup timer
setInterval(cleanupOldMetrics, 60 * 60 * 1000); // Run every hour