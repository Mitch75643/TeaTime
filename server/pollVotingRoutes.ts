import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { wsManager } from "./websocket";

const pollVoteSchema = z.object({
  postId: z.string(),
  option: z.enum(['optionA', 'optionB'])
});

const debateVoteSchema = z.object({
  postId: z.string(),
  vote: z.enum(['up', 'down'])
});

export function addPollVotingRoutes(app: Express) {
  // Poll voting endpoint
  app.post("/api/polls/vote", async (req, res) => {
    try {
      const { postId, option } = pollVoteSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      // Check if user has already voted
      const hasVoted = await storage.hasUserVotedInPoll(postId, sessionId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted in this poll" });
      }
      
      // Record the vote
      await storage.addPollVote(postId, sessionId, option);
      
      // Broadcast poll vote update via WebSocket
      if (wsManager) {
        wsManager.broadcast({
          type: 'poll_vote',
          postId,
          data: { option, sessionId }
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Poll voting error:", error);
      res.status(500).json({ message: "Failed to submit poll vote" });
    }
  });

  // Debate voting endpoint
  app.post("/api/debates/vote", async (req, res) => {
    try {
      const { postId, vote } = debateVoteSchema.parse(req.body);
      const sessionId = req.session.id!;
      
      // Check if user has already voted
      const hasVoted = await storage.hasUserVotedInDebate(postId, sessionId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted in this debate" });
      }
      
      // Record the vote
      await storage.addDebateVote(postId, sessionId, vote);
      
      // Broadcast debate vote update via WebSocket
      if (wsManager) {
        wsManager.broadcast({
          type: 'debate_vote',
          postId,
          data: { vote, sessionId }
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Debate voting error:", error);
      res.status(500).json({ message: "Failed to submit debate vote" });
    }
  });

  // Get poll results
  app.get("/api/polls/:postId/results", async (req, res) => {
    try {
      const postId = req.params.postId;
      const post = await storage.getPost(postId);
      
      if (!post || post.postType !== 'poll') {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.json({
        postId,
        pollOptions: post.pollOptions,
        pollVotes: post.pollVotes || { optionA: 0, optionB: 0 },
        totalVotes: ((post.pollVotes?.optionA || 0) + (post.pollVotes?.optionB || 0))
      });
    } catch (error) {
      console.error("Failed to get poll results:", error);
      res.status(500).json({ message: "Failed to get poll results" });
    }
  });

  // Get debate results
  app.get("/api/debates/:postId/results", async (req, res) => {
    try {
      const postId = req.params.postId;
      const post = await storage.getPost(postId);
      
      if (!post || post.postType !== 'debate') {
        return res.status(404).json({ message: "Debate not found" });
      }
      
      res.json({
        postId,
        debateVotes: post.debateVotes || { up: 0, down: 0 },
        totalVotes: ((post.debateVotes?.up || 0) + (post.debateVotes?.down || 0))
      });
    } catch (error) {
      console.error("Failed to get debate results:", error);
      res.status(500).json({ message: "Failed to get debate results" });
    }
  });

  // Check if user has voted in poll
  app.get("/api/polls/:postId/has-voted", async (req, res) => {
    try {
      const postId = req.params.postId;
      const sessionId = req.session.id!;
      
      const hasVoted = await storage.hasUserVotedInPoll(postId, sessionId);
      res.json({ hasVoted });
    } catch (error) {
      console.error("Failed to check poll vote status:", error);
      res.status(500).json({ message: "Failed to check vote status" });
    }
  });

  // Check if user has voted in debate
  app.get("/api/debates/:postId/has-voted", async (req, res) => {
    try {
      const postId = req.params.postId;
      const sessionId = req.session.id!;
      
      const hasVoted = await storage.hasUserVotedInDebate(postId, sessionId);
      const userVote = await storage.getUserDebateVote(postId, sessionId);
      
      res.json({ hasVoted, vote: userVote });
    } catch (error) {
      console.error("Failed to check debate vote status:", error);
      res.status(500).json({ message: "Failed to check vote status" });
    }
  });
}