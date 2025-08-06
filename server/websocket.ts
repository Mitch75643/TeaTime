import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: 'post_reaction' | 'drama_vote' | 'comment_added' | 'post_view' | 'poll_vote' | 'debate_vote';
  postId: string;
  data: any;
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
    
    // Make WebSocket server available globally for broadcasting notifications
    global.wss = this.wss;
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