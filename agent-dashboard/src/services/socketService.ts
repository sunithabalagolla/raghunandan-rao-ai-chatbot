import { io, Socket } from 'socket.io-client';
import { apiService } from './api';

/**
 * Socket.io Service for Agent Dashboard
 * Handles real-time communication between agents and customers
 */

export interface AgentSocketService {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  
  // Agent-specific methods
  joinTicketRoom: (ticketId: string) => void;
  leaveTicketRoom: (ticketId: string) => void;
  sendMessageToCustomer: (ticketId: string, message: string) => void;
  sendTypingIndicator: (ticketId: string, isTyping: boolean) => void;
  acceptTicket: (ticketId: string) => void;
  
  // Event listeners
  onCustomerMessage: (callback: (data: any) => void) => () => void;
  onCustomerTyping: (callback: (data: any) => void) => () => void;
  onTicketUpdate: (callback: (data: any) => void) => () => void;
  onTicketAccepted: (callback: (data: any) => void) => () => void;
  onConnectionChange: (callback: (connected: boolean) => void) => () => void;
}

class SocketService implements AgentSocketService {
  private socket: Socket | null = null;
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
  private customerMessageCallbacks: Set<(data: any) => void> = new Set();
  private customerTypingCallbacks: Set<(data: any) => void> = new Set();
  private ticketUpdateCallbacks: Set<(data: any) => void> = new Set();
  private ticketAcceptedCallbacks: Set<(data: any) => void> = new Set();
  private newTicketCallbacks: Set<(data: any) => void> = new Set();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = apiService.getAuthToken();
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    console.log('🔧 Setting up event listeners'); // Debug log to track multiple calls

    // Remove all existing listeners before adding new ones
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('customer:message');
    this.socket.off('customer:typing');
    this.socket.off('ticket:update');
    this.socket.off('chat:response');
    this.socket.off('ticket:accepted');
    this.socket.off('agent:new-ticket');
    this.socket.off('error');

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Agent socket connected');
      
      // Emit agent:connect to join agent rooms
      this.socket?.emit('agent:connect');
      
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('� Agent socket disconnected:', reason);
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔌 Agent socket connection error:', error);
      this.notifyConnectionChange(false);
    });

    // Customer message events
    this.socket.on('customer:message', (data: any) => {
      console.log('📨 Customer message received:', data);
      this.customerMessageCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in customer message callback:', err);
        }
      });
    });

    // Customer typing events
    this.socket.on('customer:typing', (data: any) => {
      this.customerTypingCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in customer typing callback:', err);
        }
      });
    });

    // Ticket update events
    this.socket.on('ticket:update', (data: any) => {
      console.log('🎫 Ticket update received:', data);
      this.ticketUpdateCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in ticket update callback:', err);
        }
      });
    });

    // Chat response events (for when agent sends messages)
    this.socket.on('chat:response', (data: any) => {
      console.log('📤 Agent message confirmed:', data);
    });

    // Ticket acceptance confirmation
    this.socket.on('ticket:accepted', (data: any) => {
      console.log('🎫 Ticket accepted confirmation:', data);
      this.ticketAcceptedCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in ticket accepted callback:', err);
        }
      });
    });

    // New ticket notifications
    this.socket.on('agent:new-ticket', (data: any) => {
      console.log('🆕 New ticket notification received:', data);
      this.newTicketCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in new ticket callback:', err);
        }
      });
    });

    // Error events
    this.socket.on('error', (error: any) => {
      console.error('🔌 Socket error:', error?.message || error);
      // Don't throw errors, just log them
    });
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionChange(false);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Agent-specific methods
  joinTicketRoom(ticketId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join ticket room');
      return;
    }

    console.log(`🎫 Agent joining ticket room: ${ticketId}`);
    this.socket.emit('agent:join_ticket', { ticketId });
  }

  leaveTicketRoom(ticketId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`🎫 Agent leaving ticket room: ${ticketId}`);
    this.socket.emit('agent:leave_ticket', { ticketId });
  }

  sendMessageToCustomer(ticketId: string, message: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    console.log(`📤 Agent sending message to ticket ${ticketId}:`, message);
    this.socket.emit('agent:message', {
      ticketId,
      message,
      timestamp: new Date(),
    });
  }

  acceptTicket(ticketId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot accept ticket');
      return;
    }

    console.log(`🎫 Agent accepting ticket via WebSocket: ${ticketId}`);
    this.socket.emit('agent:accept-ticket', { ticketId });
  }

  sendTypingIndicator(ticketId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('agent:typing', {
      ticketId,
      isTyping,
      timestamp: new Date(),
    });
  }

  // Event listeners
  onCustomerMessage(callback: (data: any) => void): () => void {
    this.customerMessageCallbacks.add(callback);
    return () => {
      this.customerMessageCallbacks.delete(callback);
    };
  }

  onCustomerTyping(callback: (data: any) => void): () => void {
    this.customerTypingCallbacks.add(callback);
    return () => {
      this.customerTypingCallbacks.delete(callback);
    };
  }

  onTicketUpdate(callback: (data: any) => void): () => void {
    this.ticketUpdateCallbacks.add(callback);
    return () => {
      this.ticketUpdateCallbacks.delete(callback);
    };
  }

  onTicketAccepted(callback: (data: any) => void): () => void {
    this.ticketAcceptedCallbacks.add(callback);
    return () => {
      this.ticketAcceptedCallbacks.delete(callback);
    };
  }

  onNewTicket(callback: (data: any) => void): () => void {
    this.newTicketCallbacks.add(callback);
    return () => {
      this.newTicketCallbacks.delete(callback);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }
}

// Export singleton instance
export const agentSocketService = new SocketService();
export default agentSocketService;