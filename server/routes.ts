import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { insertPostSchema, insertCommentSchema, reactionSchema, dramaVoteSchema, reportSchema } from "@shared/schema";

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

  // Community topic posts - all posts for a specific topic
  app.get("/api/posts/:topicId/:sortBy/all", async (req, res) => {
    try {
      const { topicId, sortBy } = req.params;
      const { postContext = 'community', section, storyCategory } = req.query;
      
      const posts = await storage.getPosts(
        undefined, // category
        sortBy as 'trending' | 'new',
        undefined, // tags
        undefined, // userSessionId - not filtering by user
        postContext as string,
        topicId, // section
        storyCategory as string // storyCategory
      );
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  // User topic posts - only posts by current user for a specific topic
  app.get("/api/posts/:topicId/:sortBy/user", async (req, res) => {
    try {
      const { topicId, sortBy } = req.params;
      const { postContext = 'community', section, storyCategory } = req.query;
      const sessionId = req.session.id!;
      
      const posts = await storage.getPosts(
        undefined, // category
        sortBy as 'trending' | 'new',
        undefined, // tags
        sessionId, // userSessionId - filter by current user
        postContext as string,
        topicId, // section
        storyCategory as string // storyCategory
      );
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
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
      
      // Get user's avatar from request body or session  
      const avatarId = req.body.avatarId || req.session.avatarId || 'happy-face';
      
      const postData = {
        ...validatedData,
        avatarId
      };
      
      const post = await storage.createPost(postData, alias, sessionId);
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

      const sessionId = req.session.id!;
      const alias = generateAlias();
      const comment = await storage.createComment(validatedData, alias);
      
      // Create notification for post owner or parent comment owner
      try {
        if (validatedData.parentCommentId) {
          // Reply to comment - notify the comment owner
          const comments = await storage.getComments(validatedData.postId);
          const parent = comments.find(c => c.id === validatedData.parentCommentId);
          if (parent && parent.sessionId && parent.sessionId !== sessionId) {
            await storage.createNotification({
              recipientSessionId: parent.sessionId,
              type: 'comment_reply',
              message: `${alias} replied to your comment`,
              postId: validatedData.postId,
              commentId: comment.id,
              triggerAlias: alias,
            });
          }
        } else {
          // Reply to post - notify the post owner
          const post = await storage.getPost(validatedData.postId);
          if (post && post.sessionId && post.sessionId !== sessionId) {
            await storage.createNotification({
              recipientSessionId: post.sessionId,
              type: 'post_reply',
              message: `${alias} commented on your post`,
              postId: validatedData.postId,
              commentId: comment.id,
              triggerAlias: alias,
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the comment creation if notification fails
      }
      
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

  // Toggle reaction with "one emoji per post/comment" logic
  app.post("/api/reactions", async (req, res) => {
    try {
      const { type, postId, commentId, remove } = req.body;
      const sessionId = req.session.id!;
      
      if (commentId) {
        // Handle comment reactions
        const currentReaction = await storage.getUserReactionForComment(commentId, sessionId);
        
        if (remove || currentReaction === type) {
          // Remove current reaction (toggle off)
          await storage.removeAllUserReactionsForComment(commentId, sessionId);
        } else {
          // Remove any existing reaction first, then add new one
          if (currentReaction) {
            await storage.removeAllUserReactionsForComment(commentId, sessionId);
          }
          
          // Add new reaction
          await storage.addReaction({ type, commentId }, sessionId);
        }
      } else if (postId) {
        // Handle post reactions
        const currentReaction = await storage.getUserReactionForPost(postId, sessionId);
        
        if (remove || currentReaction === type) {
          // Remove current reaction (toggle off)
          await storage.removeAllUserReactionsForPost(postId, sessionId);
        } else {
          // Remove any existing reaction first, then add new one
          if (currentReaction) {
            await storage.removeAllUserReactionsForPost(postId, sessionId);
          }
          
          // Add new reaction
          await storage.addReaction({ type, postId }, sessionId);
        }
      } else {
        throw new Error("Either postId or commentId must be provided");
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

  // Report post
  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = reportSchema.parse(req.body);
      const reporterSessionId = req.session.id;
      
      const result = await storage.reportPost(reportData.postId, reporterSessionId, reportData.reason);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ 
        success: true, 
        message: result.postRemoved ? "Post has been removed due to multiple reports" : "Report submitted successfully",
        postRemoved: result.postRemoved,
        userFlagged: result.userFlagged
      });
    } catch (error) {
      console.error("Error reporting post:", error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const notifications = await storage.getNotifications(sessionId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const count = await storage.getUnreadNotificationCount(sessionId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      await storage.markNotificationAsRead(req.params.id, sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      await storage.markAllNotificationsAsRead(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
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
