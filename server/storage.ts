import { type Post, type InsertPost, type Comment, type InsertComment, type Reaction, type DramaVote, type ReactionInput, type DramaVoteInput } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Posts
  createPost(post: InsertPost, alias: string, sessionId?: string): Promise<Post>;
  getPosts(category?: string, sortBy?: 'trending' | 'new', tags?: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePostReactions(postId: string, reactions: Record<string, number>): Promise<void>;
  updatePostCommentCount(postId: string, count: number): Promise<void>;
  deletePost(postId: string, sessionId?: string): Promise<void>;
  
  // Comments
  createComment(comment: InsertComment, alias: string): Promise<Comment>;
  getComments(postId: string): Promise<Comment[]>;
  updateCommentReactions(commentId: string, reactions: Record<string, number>): Promise<void>;
  
  // Reactions
  addReaction(reaction: ReactionInput, sessionId: string): Promise<void>;
  removeReaction(reaction: ReactionInput, sessionId: string): Promise<void>;
  hasUserReacted(postId: string | undefined, commentId: string | undefined, type: string, sessionId: string): Promise<boolean>;
  
  // Drama Votes
  addDramaVote(vote: DramaVoteInput, sessionId: string): Promise<void>;
  getDramaVotes(postId: string): Promise<Record<string, number>>;
  hasUserVoted(postId: string, sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;
  private reactions: Map<string, Reaction>;
  private dramaVotes: Map<string, DramaVote>;

  constructor() {
    this.posts = new Map();
    this.comments = new Map();
    this.reactions = new Map();
    this.dramaVotes = new Map();
  }

  async createPost(insertPost: InsertPost, alias: string, sessionId?: string): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      alias,
      reactions: { fire: 0, cry: 0, eyes: 0, clown: 0 },
      commentCount: 0,
      isDrama: insertPost.category === 'drama',
      createdAt: new Date(),
      sessionId: sessionId || 'anonymous',
    };
    this.posts.set(id, post);
    return post;
  }

  async getPosts(category?: string, sortBy: 'trending' | 'new' = 'new', tags?: string): Promise<Post[]> {
    let posts = Array.from(this.posts.values());
    
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }
    
    if (tags) {
      posts = posts.filter(post => 
        post.tags && post.tags.some(tag => tag === tags)
      );
    }
    
    if (sortBy === 'trending') {
      posts.sort((a, b) => {
        const aScore = (a.reactions?.fire || 0) * 3 + (a.reactions?.eyes || 0) * 2 + (a.reactions?.cry || 0) + (a.reactions?.clown || 0) + a.commentCount * 2;
        const bScore = (b.reactions?.fire || 0) * 3 + (b.reactions?.eyes || 0) * 2 + (b.reactions?.cry || 0) + (b.reactions?.clown || 0) + b.commentCount * 2;
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }

  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async updatePostReactions(postId: string, reactions: Record<string, number>): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.reactions = reactions;
      this.posts.set(postId, post);
    }
  }

  async updatePostCommentCount(postId: string, count: number): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.commentCount = count;
      this.posts.set(postId, post);
    }
  }

  async createComment(insertComment: InsertComment, alias: string): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      alias,
      reactions: { fire: 0, cry: 0, eyes: 0, clown: 0 },
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    
    // Update post comment count
    const postComments = Array.from(this.comments.values()).filter(c => c.postId === insertComment.postId);
    await this.updatePostCommentCount(insertComment.postId, postComments.length);
    
    return comment;
  }

  async getComments(postId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async updateCommentReactions(commentId: string, reactions: Record<string, number>): Promise<void> {
    const comment = this.comments.get(commentId);
    if (comment) {
      comment.reactions = reactions;
      this.comments.set(commentId, comment);
    }
  }

  async addReaction(reaction: ReactionInput, sessionId: string): Promise<void> {
    const id = randomUUID();
    const newReaction: Reaction = {
      id,
      postId: reaction.postId || null,
      commentId: reaction.commentId || null,
      type: reaction.type,
      sessionId,
      createdAt: new Date(),
    };
    this.reactions.set(id, newReaction);

    // Update reaction counts
    if (reaction.postId) {
      await this.updateReactionCounts('post', reaction.postId);
    } else if (reaction.commentId) {
      await this.updateReactionCounts('comment', reaction.commentId);
    }
  }

  async removeReaction(reaction: ReactionInput, sessionId: string): Promise<void> {
    const existingReaction = Array.from(this.reactions.values()).find(r => 
      r.sessionId === sessionId && 
      r.type === reaction.type &&
      r.postId === reaction.postId &&
      r.commentId === reaction.commentId
    );
    
    if (existingReaction) {
      this.reactions.delete(existingReaction.id);
      
      // Update reaction counts
      if (reaction.postId) {
        await this.updateReactionCounts('post', reaction.postId);
      } else if (reaction.commentId) {
        await this.updateReactionCounts('comment', reaction.commentId);
      }
    }
  }

  private async updateReactionCounts(type: 'post' | 'comment', id: string): Promise<void> {
    const reactions = Array.from(this.reactions.values()).filter(r => 
      type === 'post' ? r.postId === id : r.commentId === id
    );
    
    const counts = {
      fire: reactions.filter(r => r.type === 'fire').length,
      cry: reactions.filter(r => r.type === 'cry').length,
      eyes: reactions.filter(r => r.type === 'eyes').length,
      clown: reactions.filter(r => r.type === 'clown').length,
    };

    if (type === 'post') {
      await this.updatePostReactions(id, counts);
    } else {
      await this.updateCommentReactions(id, counts);
    }
  }

  async hasUserReacted(postId: string | undefined, commentId: string | undefined, type: string, sessionId: string): Promise<boolean> {
    return Array.from(this.reactions.values()).some(r => 
      r.sessionId === sessionId && 
      r.type === type &&
      r.postId === postId &&
      r.commentId === commentId
    );
  }

  async addDramaVote(vote: DramaVoteInput, sessionId: string): Promise<void> {
    // Remove existing vote from this session for this post
    const existingVote = Array.from(this.dramaVotes.values()).find(v => 
      v.postId === vote.postId && v.sessionId === sessionId
    );
    if (existingVote) {
      this.dramaVotes.delete(existingVote.id);
    }

    const id = randomUUID();
    const newVote: DramaVote = {
      id,
      postId: vote.postId,
      voteType: vote.voteType,
      sessionId,
      createdAt: new Date(),
    };
    this.dramaVotes.set(id, newVote);
  }

  async getDramaVotes(postId: string): Promise<Record<string, number>> {
    const votes = Array.from(this.dramaVotes.values()).filter(v => v.postId === postId);
    
    return {
      wrong: votes.filter(v => v.voteType === 'wrong').length,
      valid: votes.filter(v => v.voteType === 'valid').length,
      both_wild: votes.filter(v => v.voteType === 'both_wild').length,
      iconic: votes.filter(v => v.voteType === 'iconic').length,
    };
  }

  async hasUserVoted(postId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.dramaVotes.values()).some(v => 
      v.postId === postId && v.sessionId === sessionId
    );
  }

  async deletePost(postId: string, sessionId?: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Check if the session owns this post (for user posts only)
    if (sessionId && post.sessionId !== sessionId) {
      throw new Error("Not authorized to delete this post");
    }
    
    this.posts.delete(postId);
    // Also delete related comments and reactions
    const commentsToDelete = Array.from(this.comments.values()).filter(c => c.postId === postId);
    commentsToDelete.forEach(comment => this.comments.delete(comment.id));
    
    const reactionsToDelete = Array.from(this.reactions.values()).filter(r => r.postId === postId);
    reactionsToDelete.forEach(reaction => this.reactions.delete(reaction.id));
    
    const votesToDelete = Array.from(this.dramaVotes.values()).filter(v => v.postId === postId);
    votesToDelete.forEach(vote => this.dramaVotes.delete(vote.id));
  }
}

export const storage = new MemStorage();
