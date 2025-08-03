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
  sessionId: varchar("session_id").notNull(),
  reactions: jsonb("reactions").default({
    thumbsUp: 0,
    thumbsDown: 0,
    laugh: 0,
    sad: 0
  }),
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

export const notificationSchema = z.object({
  recipientSessionId: z.string(),
  type: z.enum(['post_reply', 'comment_reply']),
  message: z.string(),
  postId: z.string().optional(),
  commentId: z.string().optional(),
  triggerAlias: z.string(),
});

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
export type ReactionInput = z.infer<typeof reactionSchema>;
export type DramaVoteInput = z.infer<typeof dramaVoteSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
