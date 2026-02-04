// CRITICAL: Import i18n FIRST - using NEW init.ts file
import '../i18n/init';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../utils/storage';

/**
 * Socket.io Client Service
 * Manages real-time WebSocket connection to backend
 * Implements Requirements 0.1, 0.2, 0.3
 */

// Event names matching server-side events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Chat events
  CHAT_CONNECT: 'chat:connect',
  CHAT_MESSAGE: 'chat:message',
  CHAT_RESPONSE: 'chat:response',
  CHAT_TYPING: 'chat:typing',
  CHAT_STREAM: 'chat:stream',
  CHAT_ERROR: 'chat:error',
  CHAT_DISCONNECT: 'chat:disconnect',
  
  // Status events
  STATUS_UPDATE: 'status:update',
  
  // Notification events
  NOTIFICATION_PUSH: 'notification:push',
  
  // Agent events
  AGENT_JOINED: 'agent:joined',
  
  // Handoff events
  CHAT_REQUEST_AGENT: 'chat:requestAgent',
  HANDOFF_QUEUED: 'handoff:queued',
  HANDOFF_RESOLVED: 'handoff:resolved',
  
  // Rate limit
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const;

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Socket Service Class
 */
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  
  // Store callbacks for chat:response events
  private chatResponseCallbacks: Set<(data: any) => void> = new Set();
  private typingCallbacks: Set<(data: any) => void> = new Set();
  
  // Store received messages for components that mount late
  public receivedMessages: any[] = [];

  /**
   * Initialize and connect socket
   * Requirement 0.1, 0.2
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getAccessToken();
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.setConnectionState('connecting');

    this.socket = io(socketUrl, {
      auth: token ? { token } : {}, // Only send token if available
      transports: ['websocket', 'polling'], // WebSocket with HTTP long-polling fallback
      reconnection: true, // Automatic reconnection (Requirement 0.3)
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Setup socket event listeners
   * Requirement 0.3
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      this.setConnectionState('disconnected');
      
      // Automatic reconnection will be handled by Socket.io
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        this.socket?.connect();
      }
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (_error: Error) => {
      this.reconnectAttempts++;
      this.setConnectionState('error');

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.setConnectionState('error');
      } else {
        this.setConnectionState('reconnecting');
      }
    });

    // Reconnection events
    this.socket.io.on('reconnect', (_attemptNumber: number) => {
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
    });

    this.socket.io.on('reconnect_attempt', (_attemptNumber: number) => {
      this.setConnectionState('reconnecting');
    });

    this.socket.io.on('reconnect_error', (_error: Error) => {
      // Silent error handling
    });

    this.socket.io.on('reconnect_failed', () => {
      this.setConnectionState('error');
    });

    // Error events
    this.socket.on('error', (_error: any) => {
      // Silent error handling
    });

    // Chat error events
    this.socket.on(SOCKET_EVENTS.CHAT_ERROR, (_data: any) => {
      // Silent error handling
    });

    // Rate limit events
    this.socket.on(SOCKET_EVENTS.RATE_LIMIT_EXCEEDED, (_data: any) => {
      // Silent handling - UI will show the message
    });

    // Handle chat:response events and call registered callbacks
    this.socket.on(SOCKET_EVENTS.CHAT_RESPONSE, (data: any) => {
      this.chatResponseCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in chat response callback:', err);
        }
      });
    });

    // Handle typing events and call registered callbacks
    this.socket.on(SOCKET_EVENTS.CHAT_TYPING, (data: any) => {
      this.typingCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in typing callback:', err);
        }
      });
    });
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Disconnect socket
   * Requirement 0.10
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState('disconnected');
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit event to server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Listen to event from server
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Listen to event once
   */
  once(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      return;
    }

    this.socket.once(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // ============================================
  // Chat Methods
  // ============================================

  /**
   * Connect to chat session
   * Requirement 0.1, 0.9
   */
  connectToChat(userId: string, sessionId: string, language: 'en' | 'te' | 'hi' = 'en'): void {
    this.emit(SOCKET_EVENTS.CHAT_CONNECT, {
      userId,
      sessionId,
      language,
    });
  }

  /**
   * Send a chat message
   * Requirement 0.4
   */
  sendMessage(userId: string, sessionId: string, message: string, language?: string): void {
    this.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      message,
      userId,
      sessionId,
      timestamp: new Date(),
      language,
    });
  }

  /**
   * Send typing indicator
   * Requirement 0.6
   */
  sendTyping(isTyping: boolean): void {
    this.emit(SOCKET_EVENTS.CHAT_TYPING, {
      isTyping,
      sender: 'user',
    });
  }

  /**
   * Request human agent
   * Requirement 44.2
   */
  requestAgent(userId: string, sessionId: string, reason: string): void {
    this.emit(SOCKET_EVENTS.CHAT_REQUEST_AGENT, {
      userId,
      sessionId,
      reason,
      timestamp: new Date(),
    });
  }

  /**
   * Disconnect from chat
   * Requirement 0.10
   */
  disconnectFromChat(userId: string, sessionId: string): void {
    this.emit(SOCKET_EVENTS.CHAT_DISCONNECT, {
      userId,
      sessionId,
      timestamp: new Date(),
    });
  }

  // ============================================
  // Event Listeners (Convenience Methods)
  // ============================================

  /**
   * Listen for chat responses
   * Requirement 0.5
   */
  onChatResponse(callback: (data: any) => void): () => void {
    this.chatResponseCallbacks.add(callback);
    
    return () => {
      this.chatResponseCallbacks.delete(callback);
    };
  }

  /**
   * Listen for typing indicators
   * Requirement 0.6
   */
  onTyping(callback: (data: any) => void): () => void {
    this.typingCallbacks.add(callback);
    return () => {
      this.typingCallbacks.delete(callback);
    };
  }

  /**
   * Listen for streaming responses
   * Requirement 0.8
   */
  onStream(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.CHAT_STREAM, callback);
    return () => this.off(SOCKET_EVENTS.CHAT_STREAM, callback);
  }

  /**
   * Listen for status updates
   * Requirement 0.7, 5.4
   */
  onStatusUpdate(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.STATUS_UPDATE, callback);
    return () => this.off(SOCKET_EVENTS.STATUS_UPDATE, callback);
  }

  /**
   * Listen for notifications
   */
  onNotification(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.NOTIFICATION_PUSH, callback);
    return () => this.off(SOCKET_EVENTS.NOTIFICATION_PUSH, callback);
  }

  /**
   * Listen for agent joined
   */
  onAgentJoined(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.AGENT_JOINED, callback);
    return () => this.off(SOCKET_EVENTS.AGENT_JOINED, callback);
  }

  /**
   * Listen for handoff queued
   * Requirement 44.6, 44.7
   */
  onHandoffQueued(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.HANDOFF_QUEUED, callback);
    return () => this.off(SOCKET_EVENTS.HANDOFF_QUEUED, callback);
  }

  /**
   * Listen for handoff resolved
   */
  onHandoffResolved(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.HANDOFF_RESOLVED, callback);
    return () => this.off(SOCKET_EVENTS.HANDOFF_RESOLVED, callback);
  }

  /**
   * Listen for chat errors
   */
  onChatError(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.CHAT_ERROR, callback);
    return () => this.off(SOCKET_EVENTS.CHAT_ERROR, callback);
  }

  /**
   * Listen for rate limit exceeded
   * Requirement 30.5
   */
  onRateLimitExceeded(callback: (data: any) => void): () => void {
    this.on(SOCKET_EVENTS.RATE_LIMIT_EXCEEDED, callback);
    return () => this.off(SOCKET_EVENTS.RATE_LIMIT_EXCEEDED, callback);
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Debug: Make socket service globally available
if (typeof window !== 'undefined') {
  (window as any).socketService = socketService;
  console.log('🔧 Socket service loaded and attached to window');
}

export default socketService;
