import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: 'post_reaction' | 'drama_vote' | 'comment_added' | 'post_view' | 'poll_vote' | 'debate_vote' | 'new_post' | 'posts_available' | 'username_updated' | 'profile_updated';
  postId?: string;
  data: any;
  section?: string;
  postContext?: string;
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

    const logPostId = message.postId || 'global';
    console.log(`[WebSocket] Broadcasted ${message.type} for ${logPostId} to ${sent} clients (${failed} failed)`);
  }

  // Broadcast new post notification without showing the post immediately
  broadcastNewPostAvailable(section?: string, postContext?: string, count: number = 1) {
    this.broadcast({
      type: 'posts_available',
      data: {
        count,
        section,
        postContext,
        timestamp: Date.now()
      },
      section,
      postContext
    });
  }

  // Broadcast profile updates across devices
  broadcastProfileUpdate(sessionId: string, updateData: any) {
    this.broadcast({
      type: 'profile_updated',
      data: {
        sessionId,
        ...updateData,
        timestamp: Date.now()
      }
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