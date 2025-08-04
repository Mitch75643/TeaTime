import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  alias: varchar("alias").notNull(),
  avatarId: varchar("avatar_id").default("happy-face"),
  tags: text("tags").array().default([]),
  reactions: jsonb("reactions").default({
    thumbsUp: 0,
    thumbsDown: 0,
    laugh: 0,
    sad: 0
  }),
  commentCount: integer("comment_count").default(0),
  isDrama: boolean("is_drama").default(false),
  sessionId: varchar("session_id"),
  postContext: varchar("post_context").default("home"),
  communitySection: varchar("community_section"),
  reportCount: integer("report_count").default(0),
  isRemoved: boolean("is_removed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  // Section-specific fields
  postType: varchar("post_type").default("standard"), // standard, poll, debate
  celebrityName: varchar("celebrity_name"), // for Celebrity Tea
  storyType: varchar("story_type"), // for Story Time
  topicTitle: varchar("topic_title"), // for Hot Topics
  pollOptions: jsonb("poll_options"), // for Tea Experiments {optionA: string, optionB: string}
  pollVotes: jsonb("poll_votes").default({optionA: 0, optionB: 0}), // for Tea Experiments
  debateVotes: jsonb("debate_votes").default({up: 0, down: 0}), // for Daily Debate
  allowComments: boolean("allow_comments").default(true), // false for Daily Debate
  // AI Moderation fields
  moderationStatus: varchar("moderation_status").default("pending"), // pending, approved, flagged, hidden
  moderationLevel: integer("moderation_level").default(0), // 0=clean, 1=watch, 2=concerning, 3=critical
  moderationCategories: text("moderation_categories").array().default([]), // flagged categories
  supportMessageShown: boolean("support_message_shown").default(false), // track if user saw mental health resources
  isHidden: boolean("is_hidden").default(false), // hide from public view if flagged as critical
  // Post Stats tracking
  viewCount: integer("view_count").default(0), // total unique views
  lastViewedAt: timestamp("last_viewed_at"), // when last viewed
  viewSessions: text("view_sessions").array().default([]), // track unique sessions that viewed (for privacy-safe counting)
});

export const userFlags = pgTable("user_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  flagCount: integer("flag_count").default(0),
  isBanned: boolean("is_banned").default(false),
  lastFlaggedAt: timestamp("last_flagged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  reporterSessionId: varchar("reporter_session_id").notNull(),
  reason: varchar("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  parentCommentId: varchar("parent_comment_id"),
  content: text("content").notNull(),
  alias: varchar("alias").notNull(),
  avatarId: varchar("avatar_id").default("happy-face"),
  sessionId: varchar("session_id").notNull(), // Track which session created this comment
  reactions: jsonb("reactions").default({
    thumbsUp: 0,
    thumbsDown: 0,
    laugh: 0,
    sad: 0
  }),
  // AI Moderation fields for comments
  moderationStatus: varchar("moderation_status").default("pending"), // pending, approved, flagged, hidden
  moderationLevel: integer("moderation_level").default(0), // 0=clean, 1=watch, 2=concerning, 3=critical
  moderationCategories: text("moderation_categories").array().default([]), // flagged categories
  supportMessageShown: boolean("support_message_shown").default(false), // track if user saw mental health resources
  isHidden: boolean("is_hidden").default(false), // hide from public view if flagged as critical
  createdAt: timestamp("created_at").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  type: varchar("type").notNull(), // thumbsUp, thumbsDown, laugh, sad
  sessionId: varchar("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dramaVotes = pgTable("drama_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  voteType: varchar("vote_type").notNull(), // wrong, valid, both_wild, iconic
  sessionId: varchar("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientSessionId: varchar("recipient_session_id").notNull(),
  type: varchar("type").notNull(), // 'post_reply' | 'comment_reply'
  message: text("message").notNull(),
  postId: varchar("post_id"),
  commentId: varchar("comment_id"),
  triggerAlias: varchar("trigger_alias").notNull(), // Who triggered the notification
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Anonymous User System
export const anonymousUsers = pgTable("anonymous_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anonId: varchar("anon_id").notNull().unique(), // anon_XYZ123 format
  sessionId: varchar("session_id").notNull(),
  deviceFingerprint: varchar("device_fingerprint"), // Optional device identification
  alias: varchar("alias").notNull(), // Generated fun username
  avatarId: varchar("avatar_id").default("happy-face"),
  
  // Account upgrade fields (for cross-device sync)
  isUpgraded: boolean("is_upgraded").default(false),
  passphraseHash: varchar("passphrase_hash"), // For passphrase login
  email: varchar("email"), // Optional email for simple login
  emailVerified: boolean("email_verified").default(false),
  
  // Biometric authentication fields
  biometricEnabled: boolean("biometric_enabled").default(false),
  secureTokenHash: varchar("secure_token_hash"), // For storing encrypted device tokens
  biometricDevices: jsonb("biometric_devices").default([]), // List of authorized devices
  
  // User preferences and stats
  preferences: jsonb("preferences").default({}), // Theme, notifications, etc.
  postCount: integer("post_count").default(0),
  totalReactions: integer("total_reactions").default(0),
  
  // Privacy and security
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Account status
  isBanned: boolean("is_banned").default(false),
  banReason: varchar("ban_reason"),
});

// Device sessions for cross-device sync
export const deviceSessions = pgTable("device_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anonUserId: varchar("anon_user_id").notNull().references(() => anonymousUsers.id),
  sessionId: varchar("session_id").notNull(),
  deviceFingerprint: varchar("device_fingerprint"),
  deviceName: varchar("device_name"), // "Chrome on Windows", "Safari on iPhone", etc.
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bannedDevices = pgTable("banned_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceFingerprint: varchar("device_fingerprint").notNull().unique(),
  bannedBy: varchar("banned_by"), // admin identifier
  banReason: text("ban_reason"),
  isTemporary: boolean("is_temporary").default(false),
  expiresAt: timestamp("expires_at"), // null for permanent bans
  createdAt: timestamp("created_at").defaultNow(),
  deviceMetadata: jsonb("device_metadata").default({}), // store device info for debugging
});

// Auto-rotation system tables
export const contentPrompts = pgTable("content_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "daily_spill", "daily_debate", "tea_experiment"
  content: text("content").notNull(),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  priority: integer("priority").default(1), // Higher priority shown first
  tags: text("tags").array().default([]), // Optional categorization
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyThemes = pgTable("weekly_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Friendship Week", "Embarrassing Moments Week"
  description: text("description"),
  isActive: boolean("is_active").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rotationCycles = pgTable("rotation_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "daily_prompt", "weekly_theme", "trending_feed", "celebrity_leaderboard", "hot_topics_leaderboard", "daily_debate", "tea_experiment"
  currentContentId: varchar("current_content_id"), // References contentPrompts.id or weeklyThemes.id
  lastRotatedAt: timestamp("last_rotated_at").defaultNow(),
  nextRotationAt: timestamp("next_rotation_at").notNull(),
  rotationInterval: varchar("rotation_interval").notNull(), // "24h", "72h", "7d"
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}), // Store cycle-specific data
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboards = pgTable("leaderboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "trending_posts", "celebrity_tea", "hot_topics", "weekly_debates"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  data: jsonb("data").notNull(), // Store leaderboard entries as JSON
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  isActive: boolean("is_active").default(true),
  notificationTypes: text("notification_types").array().default(["daily_prompt", "daily_debate"]), // What notifications user wants
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

// Push notification log for tracking
export const pushNotificationLog = pgTable("push_notification_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => pushSubscriptions.id),
  notificationType: varchar("notification_type").notNull(), // "daily_prompt", "daily_debate"
  promptContent: text("prompt_content").notNull(),
  status: varchar("status").notNull(), // "sent", "failed", "expired"
  failureReason: text("failure_reason"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  category: true,
  tags: true,
  postContext: true,
  avatarId: true,
  communitySection: true,
  postType: true,
  celebrityName: true,
  storyType: true,
  topicTitle: true,
  pollOptions: true,
  allowComments: true,
}).extend({
  content: z.string().min(1).max(500),
  category: z.enum(["school", "work", "relationships", "family", "money", "hot-takes", "drama", "gossip", "story", "debate", "poll", "daily", "other"]),
  tags: z.array(z.string()).optional().default([]),
  postContext: z.string().optional().default("home"),
  avatarId: z.string().optional(),
  communitySection: z.string().optional(),
  postType: z.enum(["standard", "poll", "debate"]).optional().default("standard"),
  celebrityName: z.string().optional(),
  storyType: z.enum(["horror", "funny", "weird", "romantic", "embarrassing"]).optional(),
  topicTitle: z.string().optional(),
  pollOptions: z.object({
    optionA: z.string(),
    optionB: z.string()
  }).optional(),
  allowComments: z.boolean().optional().default(true),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  parentCommentId: true,
  content: true,
}).extend({
  content: z.string().min(1).max(300),
  postId: z.string(),
  parentCommentId: z.string().optional(),
});

export const reactionSchema = z.object({
  type: z.enum(["thumbsUp", "thumbsDown", "laugh", "sad"]),
  postId: z.string().optional(),
  commentId: z.string().optional(),
  previousType: z.enum(["thumbsUp", "thumbsDown", "laugh", "sad"]).optional(),
  remove: z.boolean().optional(),
});

export const dramaVoteSchema = z.object({
  postId: z.string(),
  voteType: z.enum(["wrong", "valid", "both_wild", "iconic"]),
});

export const reportSchema = z.object({
  postId: z.string(),
  reason: z.enum(["spam", "harassment", "inappropriate", "misinformation", "other"]),
});

// Auto-rotation schemas
export const insertContentPromptSchema = createInsertSchema(contentPrompts).pick({
  type: true,
  content: true,
  priority: true,
  tags: true,
}).extend({
  type: z.enum(["daily_spill", "daily_debate", "tea_experiment"]),
  content: z.string().min(10).max(500),
  priority: z.number().min(1).max(10).optional().default(1),
  tags: z.array(z.string()).optional().default([]),
});

export const insertWeeklyThemeSchema = createInsertSchema(weeklyThemes).pick({
  name: true,
  description: true,
}).extend({
  name: z.string().min(5).max(100),
  description: z.string().min(10).max(300).optional(),
});

export const insertRotationCycleSchema = createInsertSchema(rotationCycles).pick({
  type: true,
  rotationInterval: true,
  metadata: true,
}).extend({
  type: z.enum(["daily_prompt", "weekly_theme", "trending_feed", "celebrity_leaderboard", "hot_topics_leaderboard", "daily_debate", "tea_experiment"]),
  rotationInterval: z.enum(["24h", "72h", "7d"]),
  metadata: z.record(z.any()).optional().default({}),
});

// Auto-rotation types
export type ContentPrompt = typeof contentPrompts.$inferSelect;
export type InsertContentPrompt = z.infer<typeof insertContentPromptSchema>;
export type WeeklyTheme = typeof weeklyThemes.$inferSelect;
export type InsertWeeklyTheme = z.infer<typeof insertWeeklyThemeSchema>;
export type RotationCycle = typeof rotationCycles.$inferSelect;
export type InsertRotationCycle = z.infer<typeof insertRotationCycleSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;

export const notificationSchema = z.object({
  recipientSessionId: z.string(),
  type: z.enum(['post_reply', 'comment_reply']),
  message: z.string(),
  postId: z.string().optional(),
  commentId: z.string().optional(),
  triggerAlias: z.string(),
});

// Anonymous User schemas
export const createAnonymousUserSchema = z.object({
  deviceFingerprint: z.string().optional(),
  alias: z.string().optional(),
  avatarId: z.string().optional(),
});

export const upgradeAccountSchema = z.object({
  upgradeType: z.enum(['passphrase', 'email']),
  passphrase: z.string().min(8).max(100).optional(),
  email: z.string().email().optional(),
}).refine((data) => {
  if (data.upgradeType === 'passphrase') return !!data.passphrase;
  if (data.upgradeType === 'email') return !!data.email;
  return false;
}, {
  message: "Must provide passphrase for passphrase login or email for email login"
});

export const loginSchema = z.object({
  loginType: z.enum(['passphrase', 'email']),
  passphrase: z.string().optional(),
  email: z.string().email().optional(),
}).refine((data) => {
  if (data.loginType === 'passphrase') return !!data.passphrase;
  if (data.loginType === 'email') return !!data.email;
  return false;
}, {
  message: "Must provide credentials for selected login type"
});

// Moderation Response schema
export const moderationResponseSchema = z.object({
  flagged: z.boolean(),
  severityLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  categories: z.array(z.string()),
  action: z.enum(['allow', 'hide', 'review']),
  supportMessage: z.string().optional(),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    phone: z.string().optional()
  })).optional()
});

export type ModerationResponse = z.infer<typeof moderationResponseSchema>;

// Device Ban schemas
export const banDeviceSchema = z.object({
  deviceFingerprint: z.string(),
  banReason: z.string(),
  isTemporary: z.boolean().default(false),
  expiresAt: z.date().optional(),
  deviceMetadata: z.object({}).optional().default({}),
});

export const checkBanSchema = z.object({
  deviceFingerprint: z.string(),
});

export type BanDevice = z.infer<typeof banDeviceSchema>;
export type CheckBan = z.infer<typeof checkBanSchema>;

// Push notification schemas
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
  notificationTypes: z.array(z.enum(["daily_prompt", "daily_debate"])).optional().default(["daily_prompt", "daily_debate"]),
});

export const updatePushPreferencesSchema = z.object({
  notificationTypes: z.array(z.enum(["daily_prompt", "daily_debate"])),
});

// All types consolidated
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect & { 
  sessionId?: string;
  postContext?: string;
  communitySection?: string;
};
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type DramaVote = typeof dramaVotes.$inferSelect;
export type UserFlag = typeof userFlags.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type User = typeof anonymousUsers.$inferSelect;
export type InsertUser = typeof anonymousUsers.$inferInsert;
export type AnonymousUser = typeof anonymousUsers.$inferSelect;
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type BannedDevice = typeof bannedDevices.$inferSelect;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type DramaVoteInput = z.infer<typeof dramaVoteSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type CreateAnonymousUserInput = z.infer<typeof createAnonymousUserSchema>;
export type UpgradeAccountInput = z.infer<typeof upgradeAccountSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type UpdatePushPreferences = z.infer<typeof updatePushPreferencesSchema>;
export type PushNotificationLog = typeof pushNotificationLog.$inferSelect;
