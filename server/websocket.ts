import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: 'post_reaction' | 'drama_vote' | 'comment_added' | 'post_view' | 'poll_vote' | 'debate_vote' | 'new_post' | 'post_updated' | 'reactions_updated' | 'comments_updated';
  postId: string;
  data: any;
  page?: string;
  sessionId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        this.clients.delete(ws);
      });

      // Send a ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.on('close', () => clearInterval(pingInterval));
    });

    console.log('[WebSocket] Server initialized on /ws path');
  }

  // Broadcast a message to all connected clients
  broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    let sent = 0;
    let failed = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sent++;
        } catch (error) {
          console.error('[WebSocket] Error sending message:', error);
          failed++;
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
        failed++;
      }
    });

    console.log(`[WebSocket] Broadcasted ${message.type} for post ${message.postId} to ${sent} clients (${failed} failed)`);
  }

  // Broadcast new post notification
  broadcastNewPost(post: any, page: string, sessionId: string) {
    this.broadcast({
      type: 'new_post',
      postId: post.id,
      data: { post, page },
      page,
      sessionId
    });
  }

  // Broadcast post update (reactions, comments, etc.)
  broadcastPostUpdate(postId: string, updatedPost: any, updateType: string) {
    this.broadcast({
      type: 'post_updated',
      postId,
      data: { post: updatedPost, type: updateType }
    });
  }

  // Broadcast specific reaction updates
  broadcastReactionUpdate(postId: string, reactions: any[]) {
    this.broadcast({
      type: 'reactions_updated',
      postId,
      data: { postId, reactions }
    });
  }

  // Broadcast specific comment updates
  broadcastCommentUpdate(postId: string, comments: any[]) {
    this.broadcast({
      type: 'comments_updated',
      postId,
      data: { postId, comments }
    });
  }

  // Get current client count
  getClientCount(): number {
    return this.clients.size;
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: Server): WebSocketManager {
  wsManager = new WebSocketManager(server);
  return wsManager;
}