import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { insertPostSchema, insertCommentSchema, reactionSchema, dramaVoteSchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for tracking anonymous users
  app.use(session({
    secret: process.env.SESSION_SECRET || 'teaspill-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Ensure session ID exists
  app.use((req, res, next) => {
    if (!req.session.id) {
      req.session.id = require('crypto').randomUUID();
    }
    next();
  });

  // Get session info
  app.get("/api/session", (req, res) => {
    res.json({ sessionId: req.session.id });
  });

  // Get posts
  app.get("/api/posts", async (req, res) => {
    try {
      const { category, sortBy = 'new', tags, userOnly, postContext, section } = req.query;
      const sessionId = req.session.id!;
      
      const posts = await storage.getPosts(
        category as string,
        sortBy as 'trending' | 'new',
        tags as string,
        userOnly === 'true' ? sessionId : undefined,
        postContext as string,
        section as string
      );
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Create post
  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      
      // Content filtering
      const filteredContent = filterContent(validatedData.content);
      if (filteredContent !== validatedData.content) {
        return res.status(400).json({ message: "Content contains inappropriate language" });
      }

      const alias = generateAlias();
      const sessionId = req.session.id!;
      const postContext = req.body.postContext || 'home';
      const communitySection = req.body.communitySection;
      
      const post = await storage.createPost(validatedData, alias, sessionId, postContext, communitySection);
      res.json(post);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create post" });
      }
    }
  });

  // Get comments for a post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create comment
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.postId
      });
      
      // Content filtering
      const filteredContent = filterContent(validatedData.content);
      if (filteredContent !== validatedData.content) {
        return res.status(400).json({ message: "Content contains inappropriate language" });
      }

      const alias = generateAlias();
      const comment = await storage.createComment(validatedData, alias);
      res.json(comment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  // Delete post
  app.delete("/api/posts/:postId", async (req, res) => {
    try {
      const postId = req.params.postId;
      const sessionId = req.session.id!;
      await storage.deletePost(postId, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Toggle reaction
  app.post("/api/reactions", async (req, res) => {
    try {
      const validatedData = reactionSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      const hasReacted = await storage.hasUserReacted(
        validatedData.postId,
        validatedData.commentId,
        validatedData.type,
        sessionId
      );

      if (hasReacted) {
        await storage.removeReaction(validatedData, sessionId);
      } else {
        await storage.addReaction(validatedData, sessionId);
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to toggle reaction" });
      }
    }
  });

  // Drama voting
  app.post("/api/drama-votes", async (req, res) => {
    try {
      const validatedData = dramaVoteSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      await storage.addDramaVote(validatedData, sessionId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to vote" });
      }
    }
  });

  // Get drama votes for a post
  app.get("/api/posts/:postId/drama-votes", async (req, res) => {
    try {
      const votes = await storage.getDramaVotes(req.params.postId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  // Check if user has voted on drama post
  app.get("/api/posts/:postId/has-voted", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const hasVoted = await storage.hasUserVoted(req.params.postId, sessionId);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ message: "Failed to check vote status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateAlias(): string {
  const adjectives = [
    'Tired', 'Stressed', 'Confused', 'Drama', 'Anonymous', 'Secret', 'Mystery', 'Random',
    'Lonely', 'Frustrated', 'Worried', 'Anxious', 'Hopeful', 'Bitter', 'Salty', 'Spicy'
  ];
  
  const nouns = [
    'Student', 'Intern', 'Employee', 'Person', 'Soul', 'Human', 'Individual', 'Being',
    'Queen', 'King', 'Philosopher', 'Wanderer', 'Dreamer', 'Thinker', 'Observer'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}${noun}${number}`;
}

function filterContent(content: string): string {
  const inappropriateWords = [
    // Add inappropriate words here - basic content filtering
    'spam', 'scam', 'fake', 'bot'
  ];

  let filtered = content;
  inappropriateWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });

  return filtered;
}
