import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { insertPostSchema, insertCommentSchema, reactionSchema, dramaVoteSchema, reportSchema, createAnonymousUserSchema, upgradeAccountSchema, loginSchema, banDeviceSchema, checkBanSchema, pushSubscriptionSchema, updatePushPreferencesSchema, insertUserInteractionSchema, updateStoryPreferencesSchema, type ModerationResponse } from "@shared/schema";
import { comprehensiveModeration } from "./moderation";
import { checkDeviceBanMiddleware, strictBanCheckMiddleware, banSystem, startBanCleanupScheduler } from "./banMiddleware";
import { memAutoRotationService } from "./memAutoRotationService";
import { pushNotificationService } from "./pushNotificationService";
import { addTestRoute } from "./testRoute";
import { memoryStoryRecommendationEngine } from "./storyRecommendationEngine";
import { detectSpam, isInCooldown, updateEngagementScore, getSpamDetectionStats, getRecentViolations, clearSessionSpamHistory } from "./spamDetection";
import { adminAuthService } from "./adminAuth";
import { adminLoginSchema, addAdminSchema } from "../shared/admin-schema";

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

  // Apply general ban check middleware to all routes
  app.use(checkDeviceBanMiddleware);

  // Start ban cleanup scheduler
  startBanCleanupScheduler();

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
      const { postContext = 'community', section, storyCategory, hotTopicFilter } = req.query;
      
      const posts = await storage.getPosts(
        undefined, // category
        sortBy as 'trending' | 'new',
        undefined, // tags
        undefined, // userSessionId - not filtering by user
        postContext as string,
        topicId, // section
        storyCategory as string, // storyCategory
        hotTopicFilter as string // hotTopicFilter
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
      const { postContext = 'community', section, storyCategory, hotTopicFilter } = req.query;
      const sessionId = req.session.id!;
      
      const posts = await storage.getPosts(
        undefined, // category
        sortBy as 'trending' | 'new',
        undefined, // tags
        sessionId, // userSessionId - filter by current user
        postContext as string,
        topicId, // section
        storyCategory as string, // storyCategory
        hotTopicFilter as string // hotTopicFilter
      );
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Create post
  app.post("/api/posts", checkDeviceBanMiddleware, async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      // Check if user is in cooldown from previous spam violations
      const cooldownCheck = isInCooldown(sessionId);
      if (cooldownCheck.inCooldown) {
        return res.status(429).json({ 
          message: `⏱️ Please wait ${cooldownCheck.remainingMinutes} more minute${cooldownCheck.remainingMinutes !== 1 ? 's' : ''} before posting again.`,
          cooldownMinutes: cooldownCheck.remainingMinutes
        });
      }
      
      // Spam Detection
      const postContext = req.body.postContext || 'home';
      const communitySection = req.body.communitySection || '';
      const pageIdentifier = communitySection || postContext;
      
      const spamResult = await detectSpam(
        sessionId,
        validatedData.content,
        validatedData.category,
        pageIdentifier,
        req.headers['x-device-fingerprint'] as string
      );
      
      // Handle spam detection results
      if (spamResult.isSpam) {
        if (spamResult.action === 'block') {
          return res.status(403).json({ 
            message: "⛔ Your account has been temporarily restricted due to multiple violations. Please contact support if you believe this is an error.",
            isBlocked: true
          });
        } else if (spamResult.action === 'throttle') {
          return res.status(429).json({ 
            message: spamResult.message,
            isThrottled: true,
            cooldownMinutes: spamResult.cooldownMinutes
          });
        } else if (spamResult.action === 'warn') {
          // Continue with post creation but include warning
          res.locals.spamWarning = spamResult.message;
        }
      }
      
      // AI Content Moderation (with fallback for quota issues)
      let moderationResult;
      try {
        moderationResult = await comprehensiveModeration(validatedData.content);
      } catch (moderationError) {
        console.warn("Moderation service unavailable, using fallback:", moderationError.message);
        // Fallback to allow post creation without moderation
        moderationResult = {
          action: 'allow',
          severityLevel: 'low',
          categories: [],
          flagged: false
        };
      }
      
      // Content filtering
      const filteredContent = filterContent(validatedData.content);
      if (filteredContent !== validatedData.content) {
        return res.status(400).json({ message: "Content contains inappropriate language" });
      }

      // Get user's current username from their anonymous profile
      const user = await storage.getAnonymousUserBySession(sessionId);
      const alias = user?.alias || generateAlias();
      
      // Get user's avatar and color from request body or user profile
      const avatarId = req.body.avatarId || user?.avatarId || 'happy-face';
      const avatarColor = req.body.avatarColor || user?.avatarColor;
      
      const postData = {
        ...validatedData,
        avatarId,
        avatarColor,
        // Add moderation data
        moderationStatus: moderationResult.action === 'hide' ? 'hidden' : 
                         moderationResult.action === 'review' ? 'flagged' : 'approved',
        moderationLevel: moderationResult.severityLevel,
        moderationCategories: moderationResult.categories,
        isHidden: moderationResult.action === 'hide'
      };
      
      const post = await storage.createPost(postData, alias, sessionId);
      // Handle streak tracking for daily prompt submissions
      let streakResult = null;
      if (validatedData.category === 'daily' && postContext === 'daily') {
        try {
          // Get current daily prompt from auto-rotation service
          const currentRotationData = await memAutoRotationService.getCurrentContent();
          const dailyPrompt = currentRotationData?.daily_prompt || currentRotationData?.dailyPrompt;
          
          // Fallback: if no daily prompt from rotation, create a temporary one for streak tracking
          const promptToUse = dailyPrompt || {
            id: 'daily-prompt-' + new Date().toISOString().split('T')[0],
            content: 'Daily Spill Prompt',
            type: 'daily_prompt' as const
          };
          
          if (promptToUse) {
            // Record streak and submission
            const streakUpdate = await storage.createOrUpdateStreak(sessionId, promptToUse.id, promptToUse.content);
            
            // Update the submission with the actual post ID
            if (streakUpdate.newSubmission) {
              streakUpdate.newSubmission.postId = post.id;
            }
            
            streakResult = {
              streak: streakUpdate.streak,
              streakBroken: streakUpdate.streakBroken,
              message: streakUpdate.streakBroken 
                ? "😲 You missed a day. Your streak has reset."
                : streakUpdate.streak.currentStreak === 1 
                  ? "🎉 Great start! Your daily streak begins!"
                  : `🔥 Amazing! ${streakUpdate.streak.currentStreak} day streak!`
            };
          }
        } catch (streakError) {
          console.error("Failed to update streak:", streakError);
          // Don't fail the post creation if streak update fails
        }
      }
      
      // Track engagement for spam detection (async, don't wait)
      setTimeout(() => {
        updateEngagementScore(sessionId, post.id).catch(console.error);
      }, 1000);
      
      // Return post with moderation response, streak data, and spam warning for frontend handling
      const response = {
        ...post,
        moderationResponse: moderationResult.flagged ? {
          severityLevel: moderationResult.severityLevel,
          supportMessage: moderationResult.supportMessage,
          resources: moderationResult.resources
        } : undefined,
        streakResult,
        spamWarning: res.locals.spamWarning
      };
      
      res.json(response);
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
  app.post("/api/posts/:postId/comments", checkDeviceBanMiddleware, async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.postId
      });
      
      const sessionId = req.session.id!;
      
      // Check if user is in cooldown from previous spam violations
      const cooldownCheck = isInCooldown(sessionId);
      if (cooldownCheck.inCooldown) {
        return res.status(429).json({ 
          message: `⏱️ Please wait ${cooldownCheck.remainingMinutes} more minute${cooldownCheck.remainingMinutes !== 1 ? 's' : ''} before commenting again.`,
          cooldownMinutes: cooldownCheck.remainingMinutes
        });
      }
      
      // Spam Detection for comments
      const spamResult = await detectSpam(
        sessionId,
        validatedData.content,
        'comment',
        'comments',
        req.headers['x-device-fingerprint'] as string
      );
      
      // Handle spam detection results
      if (spamResult.isSpam) {
        if (spamResult.action === 'block') {
          return res.status(403).json({ 
            message: "⛔ Your account has been temporarily restricted due to multiple violations.",
            isBlocked: true
          });
        } else if (spamResult.action === 'throttle') {
          return res.status(429).json({ 
            message: spamResult.message,
            isThrottled: true,
            cooldownMinutes: spamResult.cooldownMinutes
          });
        } else if (spamResult.action === 'warn') {
          res.locals.spamWarning = spamResult.message;
        }
      }
      
      // AI Content Moderation for comments
      const moderationResult = await comprehensiveModeration(validatedData.content);
      
      // Content filtering
      const filteredContent = filterContent(validatedData.content);
      if (filteredContent !== validatedData.content) {
        return res.status(400).json({ message: "Content contains inappropriate language" });
      }

      // Get user's current username from their anonymous profile
      const user = await storage.getAnonymousUserBySession(sessionId);
      const alias = user?.alias || generateAlias();
      
      // Include user's avatar color
      const avatarColor = user?.avatarColor;
      
      // Add moderation data to comment
      const commentData = {
        ...validatedData,
        avatarColor,
        moderationStatus: moderationResult.action === 'hide' ? 'hidden' : 
                         moderationResult.action === 'review' ? 'flagged' : 'approved',
        moderationLevel: moderationResult.severityLevel,
        moderationCategories: moderationResult.categories,
        isHidden: moderationResult.action === 'hide'
      };
      
      const comment = await storage.createComment(commentData, alias, sessionId);
      
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
      
      // Return comment with moderation response and spam warning for frontend handling
      const response = {
        ...comment,
        moderationResponse: moderationResult.flagged ? {
          severityLevel: moderationResult.severityLevel,
          supportMessage: moderationResult.supportMessage,
          resources: moderationResult.resources
        } : undefined,
        spamWarning: res.locals.spamWarning
      };
      
      res.json(response);
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

  // Track post view
  app.post("/api/posts/:postId/view", async (req, res) => {
    try {
      const postId = req.params.postId;
      const sessionId = req.session.id!;
      await storage.trackPostView(postId, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track post view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Get post stats
  app.get("/api/posts/:postId/stats", async (req, res) => {
    try {
      const postId = req.params.postId;
      const stats = await storage.getPostStats(postId);
      res.json(stats);
    } catch (error) {
      console.error("Failed to get post stats:", error);
      res.status(500).json({ message: "Failed to get post stats" });
    }
  });

  // Get user's post stats (for "Your Posts" view)
  app.get("/api/user/post-stats", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const userPostStats = await storage.getUserPostStats(sessionId);
      res.json(userPostStats);
    } catch (error) {
      console.error("Failed to get user post stats:", error);
      res.status(500).json({ message: "Failed to get user post stats" });
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

  // Anonymous Authentication Routes
  // Create new anonymous user
  app.post("/api/auth/create-anon", async (req, res) => {
    try {
      const validatedData = createAnonymousUserSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      const user = await storage.createAnonymousUser(validatedData, sessionId);
      res.json(user);
    } catch (error) {
      console.error("Failed to create anonymous user:", error);
      res.status(500).json({ message: "Failed to create anonymous user" });
    }
  });

  // Sync user session (returning user)
  app.post("/api/auth/sync/:anonId", async (req, res) => {
    try {
      const { anonId } = req.params;
      const { deviceFingerprint } = req.body;
      const sessionId = req.session.id!;
      
      const user = await storage.syncUserSession(anonId, sessionId, deviceFingerprint);
      res.json(user);
    } catch (error) {
      console.error("Failed to sync user session:", error);
      res.status(404).json({ message: "User not found" });
    }
  });

  // Upgrade account for cross-device sync
  app.post("/api/auth/upgrade", async (req, res) => {
    try {
      const { anonId, ...upgradeData } = req.body;
      const validatedData = upgradeAccountSchema.parse(upgradeData);
      
      const result = await storage.upgradeAccount(anonId, validatedData);
      res.json(result);
    } catch (error) {
      console.error("Failed to upgrade account:", error);
      res.status(500).json({ success: false, error: "Failed to upgrade account" });
    }
  });

  // Login from another device
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { deviceFingerprint } = req.body;
      
      const result = await storage.loginUser({ ...validatedData, deviceFingerprint });
      
      if (result.success && result.user) {
        // Update session with the user's session ID
        req.session.id = result.user.sessionId;
      }
      
      res.json(result);
    } catch (error) {
      console.error("Failed to login:", error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  // Update user profile
  app.post("/api/auth/update-profile", async (req, res) => {
    try {
      const { anonId, alias, avatarId } = req.body;
      
      if (!anonId) {
        return res.status(400).json({ message: "Anonymous ID required" });
      }
      
      await storage.updateUserProfile(anonId, { alias, avatarId });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user avatar color
  app.post("/api/user/avatar-color", async (req, res) => {
    try {
      const { avatarColor } = req.body;
      if (!avatarColor || typeof avatarColor !== 'string') {
        return res.status(400).json({ message: "Invalid avatar color" });
      }
      
      const sessionId = req.session.id!;
      
      // Try to update by session directly, creating user if needed
      try {
        await storage.updateUserAvatarColorBySession(sessionId, avatarColor);
        res.json({ success: true, avatarColor });
      } catch (userNotFoundError) {
        // If user doesn't exist, create one automatically
        try {
          const newUser = await storage.createAnonymousUser({
            alias: `AnonUser${Math.floor(Math.random() * 1000)}`,
            avatarId: 'happy-face',
            avatarColor: avatarColor,
            deviceFingerprint: req.body.deviceFingerprint || null
          }, sessionId);
          
          res.json({ success: true, avatarColor, userCreated: true });
        } catch (createError) {
          console.error("Failed to create user for avatar color update:", createError);
          res.status(500).json({ message: "Failed to update avatar color" });
        }
      }
    } catch (error) {
      console.error("Failed to update avatar color:", error);
      res.status(500).json({ message: "Failed to update avatar color" });
    }
  });

  // Get current user info
  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const user = await storage.getAnonymousUserBySession(sessionId);
      
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Failed to get user info:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // ====== Device Ban Management Routes ======

  // Check if device is banned
  app.post("/api/bans/check", async (req, res) => {
    try {
      const { deviceFingerprint } = checkBanSchema.parse(req.body);
      const { banned, banInfo } = await banSystem.isDeviceBanned(deviceFingerprint);
      
      res.json({ 
        banned,
        banInfo: banned ? banInfo : undefined
      });
    } catch (error) {
      console.error("Ban check error:", error);
      res.status(500).json({ error: "Ban check failed" });
    }
  });

  // Ban a device (admin only)
  app.post("/api/bans/ban", async (req, res) => {
    try {
      const banData = banDeviceSchema.parse(req.body);
      const bannedBy = req.session.id || 'system'; // In real app, use admin authentication
      
      const banRecord = await banSystem.banDevice({
        ...banData,
        bannedBy,
        expiresAt: banData.expiresAt,
      });
      
      res.json(banRecord);
    } catch (error) {
      console.error("Ban device error:", error);
      res.status(500).json({ error: "Failed to ban device" });
    }
  });

  // Unban a device (admin only)
  app.post("/api/bans/unban", async (req, res) => {
    try {
      const { deviceFingerprint } = checkBanSchema.parse(req.body);
      const unbannedBy = req.session.id || 'system';
      
      const success = await banSystem.unbanDevice(deviceFingerprint, unbannedBy);
      
      if (success) {
        res.json({ success: true, message: "Device unbanned successfully" });
      } else {
        res.status(404).json({ error: "Device not found in ban list" });
      }
    } catch (error) {
      console.error("Unban device error:", error);
      res.status(500).json({ error: "Failed to unban device" });
    }
  });

  // Get all banned devices (admin only)
  app.get("/api/bans/list", async (req, res) => {
    try {
      const bannedDevices = await banSystem.getAllBannedDevices();
      res.json(bannedDevices);
    } catch (error) {
      console.error("Get banned devices error:", error);
      res.status(500).json({ error: "Failed to fetch banned devices" });
    }
  });

  // Get ban statistics (admin only)
  app.get("/api/bans/stats", async (req, res) => {
    try {
      const stats = await banSystem.getBanStats();
      res.json(stats);
    } catch (error) {
      console.error("Get ban stats error:", error);
      res.status(500).json({ error: "Failed to fetch ban statistics" });
    }
  });

  const httpServer = createServer(app);
  // Auto-rotation endpoints
  app.get("/api/rotation/current", async (req, res) => {
    try {
      const currentContent = await memAutoRotationService.getCurrentContent();
      res.json(currentContent);
    } catch (error) {
      console.error("Failed to get current rotation content:", error);
      res.status(500).json({ message: "Failed to get current rotation content" });
    }
  });

  app.get("/api/rotation/trending", async (req, res) => {
    try {
      const trendingLeaderboard = await storage.getActiveLeaderboards('trending_posts');
      res.json(trendingLeaderboard.length > 0 ? trendingLeaderboard[0] : null);
    } catch (error) {
      console.error("Failed to get trending leaderboard:", error);
      res.status(500).json({ message: "Failed to get trending leaderboard" });
    }
  });

  app.get("/api/rotation/celebrity-leaderboard", async (req, res) => {
    try {
      const celebrityLeaderboard = await storage.getActiveLeaderboards('celebrity_tea');
      res.json(celebrityLeaderboard.length > 0 ? celebrityLeaderboard[0] : null);
    } catch (error) {
      console.error("Failed to get celebrity leaderboard:", error);
      res.status(500).json({ message: "Failed to get celebrity leaderboard" });
    }
  });

  app.get("/api/rotation/hot-topics-leaderboard", async (req, res) => {
    try {
      const hotTopicsLeaderboard = await storage.getActiveLeaderboards('hot_topics');
      res.json(hotTopicsLeaderboard.length > 0 ? hotTopicsLeaderboard[0] : null);
    } catch (error) {
      console.error("Failed to get hot topics leaderboard:", error);
      res.status(500).json({ message: "Failed to get hot topics leaderboard" });
    }
  });

  // Push notification endpoints
  app.get("/api/push/vapid-key", (req, res) => {
    res.json({ publicKey: pushNotificationService.getVapidPublicKey() });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const subscriptionData = pushSubscriptionSchema.parse(req.body);
      
      await pushNotificationService.subscribe(sessionId, {
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
        }
      }, subscriptionData.notificationTypes);
      
      res.json({ success: true, message: "Successfully subscribed to push notifications" });
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      res.status(500).json({ message: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      await pushNotificationService.unsubscribe(sessionId);
      res.json({ success: true, message: "Successfully unsubscribed from push notifications" });
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      res.status(500).json({ message: "Failed to unsubscribe from push notifications" });
    }
  });

  app.put("/api/push/preferences", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const preferences = updatePushPreferencesSchema.parse(req.body);
      
      await pushNotificationService.updatePreferences(sessionId, preferences.notificationTypes);
      res.json({ success: true, message: "Notification preferences updated" });
    } catch (error) {
      console.error("Failed to update push preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  app.get("/api/push/status", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const subscriptions = await storage.getPushSubscriptions(sessionId);
      const stats = await pushNotificationService.getStats(sessionId);
      
      res.json({
        isSubscribed: subscriptions.length > 0 && subscriptions.some(sub => sub.isActive),
        notificationTypes: subscriptions.length > 0 ? subscriptions[0].notificationTypes : [],
        stats
      });
    } catch (error) {
      console.error("Failed to get push status:", error);
      res.status(500).json({ message: "Failed to get push notification status" });
    }
  });

  // Story Recommendation System Routes
  
  // Track user interaction with story
  app.post("/api/stories/track-interaction", strictBanCheckMiddleware, async (req, res) => {
    try {
      const interaction = insertUserInteractionSchema.parse(req.body);
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      await memoryStoryRecommendationEngine.trackInteraction(sessionId, interaction);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track interaction:", error);
      res.status(500).json({ message: "Failed to track interaction" });
    }
  });

  // Get personalized story recommendations
  app.get("/api/stories/recommendations", strictBanCheckMiddleware, async (req, res) => {
    try {
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const recommendations = await memoryStoryRecommendationEngine.getRecommendations(sessionId, limit);
      
      // Get the actual post data for recommendations
      const recommendedPosts = await Promise.all(
        recommendations.map(async (rec) => {
          const post = await storage.getPostById(rec.recommendedPostId);
          return {
            ...rec,
            post,
          };
        })
      );

      res.json(recommendedPosts.filter(rec => rec.post)); // Filter out any null posts
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Get trending stories
  app.get("/api/stories/trending", strictBanCheckMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trendingStories = await memoryStoryRecommendationEngine.getTrendingStories(limit);
      res.json(trendingStories);
    } catch (error) {
      console.error("Failed to get trending stories:", error);
      res.status(500).json({ message: "Failed to get trending stories" });
    }
  });

  // Get similar stories
  app.get("/api/stories/:postId/similar", strictBanCheckMiddleware, async (req, res) => {
    try {
      const { postId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const similarStories = await memoryStoryRecommendationEngine.getSimilarStories(postId, limit);
      res.json(similarStories);
    } catch (error) {
      console.error("Failed to get similar stories:", error);
      res.status(500).json({ message: "Failed to get similar stories" });
    }
  });

  // Update user story preferences
  app.put("/api/stories/preferences", strictBanCheckMiddleware, async (req, res) => {
    try {
      const preferences = updateStoryPreferencesSchema.parse(req.body);
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      await memoryStoryRecommendationEngine.updatePreferences(sessionId, preferences);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Get user story preferences
  app.get("/api/stories/preferences", strictBanCheckMiddleware, async (req, res) => {
    try {
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const preferences = memoryStoryRecommendationEngine.getUserPreferences(sessionId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Failed to get preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  // Mark recommendation as viewed
  app.post("/api/stories/recommendations/:postId/viewed", strictBanCheckMiddleware, async (req, res) => {
    try {
      const { postId } = req.params;
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      await memoryStoryRecommendationEngine.markRecommendationViewed(sessionId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark recommendation as viewed:", error);
      res.status(500).json({ message: "Failed to mark recommendation as viewed" });
    }
  });

  // Mark recommendation as interacted
  app.post("/api/stories/recommendations/:postId/interacted", strictBanCheckMiddleware, async (req, res) => {
    try {
      const { postId } = req.params;
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      await memoryStoryRecommendationEngine.markRecommendationInteracted(sessionId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark recommendation as interacted:", error);
      res.status(500).json({ message: "Failed to mark recommendation as interacted" });
    }
  });

  // Get recommendation stats
  app.get("/api/stories/stats", strictBanCheckMiddleware, async (req, res) => {
    try {
      const sessionId = req.session.id || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const stats = memoryStoryRecommendationEngine.getRecommendationStats(sessionId);
      res.json(stats);
    } catch (error) {
      console.error("Failed to get recommendation stats:", error);
      res.status(500).json({ message: "Failed to get recommendation stats" });
    }
  });

  // Daily Prompt Streak Tracking Routes
  
  // Get user's current streak
  app.get("/api/streaks/daily-prompt", async (req, res) => {
    try {
      const sessionId = req.session.id;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const streak = await storage.getUserStreak(sessionId);
      if (!streak) {
        // Return default streak for new users
        res.json({
          currentStreak: 0,
          longestStreak: 0,
          lastSubmissionDate: null,
          submissionDates: []
        });
      } else {
        res.json(streak);
      }
    } catch (error) {
      console.error("Failed to get user streak:", error);
      res.status(500).json({ message: "Failed to get user streak" });
    }
  });

  // Record daily prompt submission and update streak
  app.post("/api/streaks/daily-prompt/submit", checkDeviceBanMiddleware, async (req, res) => {
    try {
      const sessionId = req.session.id;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const { promptId, promptContent, postId } = req.body;
      if (!promptId || !promptContent) {
        return res.status(400).json({ message: "Prompt ID and content required" });
      }

      // Validate submission
      const today = new Date().toISOString().split('T')[0];
      const validation = await storage.validateDailyPromptSubmission(sessionId, promptId, today);
      
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.reason });
      }

      // Update streak and record submission
      const result = await storage.createOrUpdateStreak(sessionId, promptId, promptContent);
      
      // Update the submission with the actual post ID if provided
      if (postId && result.newSubmission) {
        result.newSubmission.postId = postId;
      }

      res.json({
        streak: result.streak,
        streakBroken: result.streakBroken,
        message: result.streakBroken 
          ? "😲 You missed a day. Your streak has reset."
          : result.streak.currentStreak === 1 
            ? "🎉 Great start! Your daily streak begins!"
            : `🔥 Amazing! ${result.streak.currentStreak} day streak!`
      });
    } catch (error) {
      console.error("Failed to update streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // Get user's daily prompt submission history
  app.get("/api/streaks/daily-prompt/submissions", async (req, res) => {
    try {
      const sessionId = req.session.id;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const { limit = 30 } = req.query;
      const submissions = await storage.getDailyPromptSubmissions(sessionId, Number(limit));
      res.json(submissions);
    } catch (error) {
      console.error("Failed to get submissions:", error);
      res.status(500).json({ message: "Failed to get submissions" });
    }
  });

  // Admin endpoints for spam monitoring (development only for now)
  if (process.env.NODE_ENV === 'development') {
    // Get spam detection statistics
    app.get("/api/admin/spam/stats", (req, res) => {
      try {
        const stats = getSpamDetectionStats();
        res.json(stats);
      } catch (error) {
        console.error("Failed to get spam stats:", error);
        res.status(500).json({ message: "Failed to get spam statistics" });
      }
    });

    // Get recent spam violations
    app.get("/api/admin/spam/violations", (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const violations = getRecentViolations(limit);
        res.json(violations);
      } catch (error) {
        console.error("Failed to get spam violations:", error);
        res.status(500).json({ message: "Failed to get spam violations" });
      }
    });

    // Clear spam history for a session (admin tool)
    app.post("/api/admin/spam/clear-session", (req, res) => {
      try {
        const { sessionId } = req.body;
        if (!sessionId) {
          return res.status(400).json({ message: "Session ID required" });
        }
        clearSessionSpamHistory(sessionId);
        res.json({ success: true, message: "Session spam history cleared" });
      } catch (error) {
        console.error("Failed to clear session spam history:", error);
        res.status(500).json({ message: "Failed to clear spam history" });
      }
    });
  }

  // Admin Authentication Routes
  
  // Root admin setup route (only for initial setup)
  app.post('/api/admin/setup-root', async (req, res) => {
    try {
      const { fingerprint, email } = req.body;
      
      if (!fingerprint || !email) {
        return res.status(400).json({ message: "Fingerprint and email required" });
      }

      // Check if any admins already exist
      const existingAdmins = await storage.getAllActiveAdmins();
      if (existingAdmins.length > 0) {
        return res.status(403).json({ message: "Root admin already exists. Use normal admin creation process." });
      }

      // Create root admin
      await storage.initializeRootAdmin(fingerprint, email, 'Root Host Device');
      
      res.json({ 
        success: true, 
        message: "Root admin created successfully",
        fingerprint: fingerprint.slice(0, 8) + '...',
        email 
      });
    } catch (error) {
      console.error("Error setting up root admin:", error);
      res.status(500).json({ message: "Failed to setup root admin" });
    }
  });
  
  // Step 1: Verify fingerprint and get admin verification prompt
  app.post("/api/admin/verify-fingerprint", async (req, res) => {
    try {
      const { fingerprint } = req.body;
      
      if (!fingerprint) {
        return res.status(400).json({ message: "Device fingerprint required" });
      }

      const isAuthorized = await adminAuthService.isAuthorizedFingerprint(fingerprint);
      
      if (isAuthorized) {
        res.json({ 
          verified: true, 
          message: "Device authorized. Please enter your admin email." 
        });
      } else {
        res.status(401).json({ 
          verified: false, 
          message: "Unauthorized device" 
        });
      }
    } catch (error) {
      console.error("Admin fingerprint verification error:", error);
      res.status(500).json({ message: "Verification error" });
    }
  });

  // Step 2: Complete admin login with email verification
  app.post("/api/admin/login", async (req, res) => {
    try {
      const loginData = adminLoginSchema.parse(req.body);
      const sessionId = req.session.id;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session required" });
      }

      const verification = await adminAuthService.verifyAdminCredentials(
        loginData.fingerprint, 
        loginData.email
      );
      
      if (!verification.valid) {
        return res.status(401).json({ 
          message: verification.errors?.join(', ') || "Invalid credentials" 
        });
      }

      // Create admin session
      const sessionCreated = await adminAuthService.createAdminSession(
        loginData.fingerprint, 
        loginData.email, 
        sessionId
      );
      
      if (sessionCreated) {
        res.json({ 
          success: true, 
          message: "Admin access granted",
          role: verification.role 
        });
      } else {
        res.status(500).json({ message: "Failed to create admin session" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login error" });
    }
  });

  // Verify current admin session status
  app.get("/api/admin/session", async (req, res) => {
    try {
      const sessionId = req.session.id;
      
      if (!sessionId) {
        return res.status(401).json({ authenticated: false });
      }

      const verification = await adminAuthService.verifyAdminSession(sessionId);
      
      if (verification.valid) {
        res.json({ 
          authenticated: true, 
          admin: verification.admin 
        });
      } else {
        res.status(401).json({ authenticated: false });
      }
    } catch (error) {
      console.error("Admin session check error:", error);
      res.status(500).json({ message: "Session check error" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const sessionId = req.session.id;
      
      if (sessionId) {
        await storage.deactivateAdminSession(sessionId);
      }
      
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Logout error" });
    }
  });

  // Root Host Only Routes (Admin Management)
  
  // Get all admins (root host only)
  app.get("/api/admin/manage/list", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const verification = await adminAuthService.verifyAdminSession(sessionId);
      
      if (!verification.valid || verification.admin?.role !== 'root_host') {
        return res.status(403).json({ message: "Root host access required" });
      }

      const result = await adminAuthService.getAdminList(
        verification.admin.email, 
        verification.admin.fingerprint
      );
      
      if (result.success) {
        res.json(result.admins);
      } else {
        res.status(403).json({ message: result.message });
      }
    } catch (error) {
      console.error("Get admin list error:", error);
      res.status(500).json({ message: "Failed to get admin list" });
    }
  });

  // Add new admin (root host only)
  app.post("/api/admin/manage/add", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const verification = await adminAuthService.verifyAdminSession(sessionId);
      
      if (!verification.valid || verification.admin?.role !== 'root_host') {
        return res.status(403).json({ message: "Root host access required" });
      }

      const adminData = addAdminSchema.parse(req.body);
      
      const result = await adminAuthService.addAdmin(
        verification.admin.email,
        verification.admin.fingerprint,
        adminData
      );
      
      res.json(result);
    } catch (error) {
      console.error("Add admin error:", error);
      res.status(500).json({ message: "Failed to add admin" });
    }
  });

  // Remove admin (root host only)
  app.post("/api/admin/manage/remove", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const verification = await adminAuthService.verifyAdminSession(sessionId);
      
      if (!verification.valid || verification.admin?.role !== 'root_host') {
        return res.status(403).json({ message: "Root host access required" });
      }

      const { targetEmail } = req.body;
      
      if (!targetEmail) {
        return res.status(400).json({ message: "Target email required" });
      }

      const result = await adminAuthService.removeAdmin(
        verification.admin.email,
        verification.admin.fingerprint,
        targetEmail
      );
      
      res.json(result);
    } catch (error) {
      console.error("Remove admin error:", error);
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });

  // Get banned users (root host only)
  app.get("/api/admin/banned-users", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const verification = await adminAuthService.verifyAdminSession(sessionId);
      
      if (!verification.valid || verification.admin?.role !== 'root_host') {
        return res.status(403).json({ message: "Root host access required" });
      }

      const bannedUsers = await storage.getAllBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error("Get banned users error:", error);
      res.status(500).json({ message: "Failed to get banned users" });
    }
  });

  // Temporary route to add specific fingerprint to admin system
  app.post("/api/admin/add-user-fingerprint", async (req, res) => {
    try {
      const userFingerprint = "5ae3b0a995c35312b63f31520ebab6db";
      const userEmail = "fertez@gmail.com";
      
      console.log('[Admin System] Adding user fingerprint to admin system...');
      
      // Add user fingerprint if it doesn't exist
      const existingFingerprint = await storage.getAdminFingerprint(userFingerprint);
      if (!existingFingerprint) {
        await storage.createAdminFingerprint({
          fingerprint: userFingerprint,
          fingerprintLabel: 'User Main Device',
          addedBy: 'system',
          isActive: true
        });
        console.log('[Admin System] User fingerprint added');
      }

      // Add user email if it doesn't exist
      const existingEmail = await storage.getAdminEmail(userEmail, userFingerprint);
      if (!existingEmail) {
        await storage.createAdminEmail({
          email: userEmail,
          fingerprint: userFingerprint,
          role: 'root_host',
          addedBy: 'system',
          isActive: true
        });
        console.log('[Admin System] User email added');
      }
      
      res.json({ 
        success: true, 
        message: "User fingerprint added to admin system successfully." 
      });
    } catch (error) {
      console.error("Add user fingerprint error:", error);
      res.status(500).json({ message: "Failed to add user fingerprint" });
    }
  });

  // Serve admin page separately at /admin route
  app.get("/admin", (req, res) => {
    const path = require('path');
    res.sendFile(path.join(__dirname, "../public/admin.html"));
  });

  // Add test routes for development
  if (process.env.NODE_ENV === 'development') {
    addTestRoute(app);
  }

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
