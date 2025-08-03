import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  alias: varchar("alias").notNull(),
  tags: text("tags").array().default([]),
  reactions: jsonb("reactions").default({
    fire: 0,
    cry: 0,
    eyes: 0,
    clown: 0
  }),
  commentCount: integer("comment_count").default(0),
  isDrama: boolean("is_drama").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  alias: varchar("alias").notNull(),
  reactions: jsonb("reactions").default({
    fire: 0,
    cry: 0,
    eyes: 0,
    clown: 0
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  type: varchar("type").notNull(), // fire, cry, eyes, clown
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

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  category: true,
  tags: true,
}).extend({
  content: z.string().min(1).max(500),
  category: z.enum(["college", "work", "relationships", "family", "money", "politics", "drama"]),
  tags: z.array(z.string()).optional().default([]),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
}).extend({
  content: z.string().min(1).max(300),
  postId: z.string(),
});

export const reactionSchema = z.object({
  type: z.enum(["fire", "cry", "eyes", "clown"]),
  postId: z.string().optional(),
  commentId: z.string().optional(),
});

export const dramaVoteSchema = z.object({
  postId: z.string(),
  voteType: z.enum(["wrong", "valid", "both_wild", "iconic"]),
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect & { sessionId?: string };
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type DramaVote = typeof dramaVotes.$inferSelect;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type DramaVoteInput = z.infer<typeof dramaVoteSchema>;
