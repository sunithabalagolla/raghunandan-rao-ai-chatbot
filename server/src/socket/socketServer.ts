import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../shared/config/env.config';
import { AuthenticatedSocket } from './events';

/**
 * Socket.io Server Configuration
 * Handles real-time communication for chat and agent handoff
 * Implements Requirements 0.1, 0.2, 0.9, 29.7
 */

/**
 * Initialize Socket.io server with CORS and authentication
 * Requirement 0.1, 0.2
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3002', 
    'http://localhost:5173',
    'http://localhost:5174', // Client app port
    'file://' // Allow file:// protocol for testing
  ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    transports: ['websocket', 'polling'], // WebSocket with HTTP long-polling fallback
  });

  console.log('🔧 Socket.io server configured');
  console.log(`   CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Transports: WebSocket, HTTP Long-Polling`);

  // Authentication middleware (Requirement 0.9)
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    
    console.log(`✅ User connected: ${authSocket.userId || 'anonymous (pending)'} (${authSocket.email || 'no email'})`);
    console.log(`   Socket ID: ${authSocket.id}`);
    console.log(`   Transport: ${socket.conn.transport.name}`);

    // Join user's personal room (only if userId is set from JWT auth)
    if (authSocket.userId) {
      authSocket.join(`user:${authSocket.userId}`);
    }

    // Handle disconnection (Requirement 0.3, 0.10)
    authSocket.on('disconnect', (reason: string) => {
      console.log(`❌ User disconnected: ${authSocket.userId}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Socket ID: ${authSocket.id}`);
    });

    // Handle errors
    authSocket.on('error', (error: Error) => {
      console.error(`Socket error for user ${authSocket.userId}:`, error.message);
    });

    // Handle connection errors
    authSocket.on('connect_error', (error: Error) => {
      console.error(`Connection error for user ${authSocket.userId}:`, error.message);
    });
  });

  return io;
}

/**
 * Socket Authentication Middleware
 * Verifies JWT token and attaches user info to socket
 * Allows anonymous connections for chatbot widget
 * Requirement 0.1, 0.9
 */
function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    // Get token from handshake
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.authorization?.split(' ')[1] ||
      socket.handshake.query.token as string;

    if (!token) {
      // Allow anonymous connections for chatbot widget
      // Don't assign userId here - let the chat:connect event set it from client
      console.log('🔓 Anonymous socket connection allowed');
      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = ''; // Will be set by chat:connect
      authSocket.email = undefined;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as { 
      userId: string; 
      email?: string;
      role?: string;
    };
    
    // Attach user info to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = decoded.userId;
    authSocket.email = decoded.email;
    authSocket.role = decoded.role as any; // Set role from JWT

    console.log(`🔐 Socket authenticated: ${decoded.userId} (${decoded.role || 'user'})`);
    
    next();

  } catch (error: any) {
    console.error('❌ Socket authentication error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid authentication token'));
    } else {
      return next(new Error('Authentication failed'));
    }
  }
}

/**
 * Get Socket.io instance (singleton pattern)
 */
let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized. Call initializeSocketServer first.');
  }
  return ioInstance;
}

export function setIO(io: SocketIOServer): void {
  ioInstance = io;
  console.log('✅ Socket.io instance set globally');
}

/**
 * Emit event to specific user
 * Helper function to send events to user's room
 */
export function emitToUser(userId: string, event: string, data: any): void {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to user ${userId}`);
}

/**
 * Emit event to specific session
 * Helper function to send events to session room
 */
export function emitToSession(sessionId: string, event: string, data: any): void {
  const io = getIO();
  io.to(`session:${sessionId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to session ${sessionId}`);
}

/**
 * Broadcast event to all connected clients
 */
export function broadcastEvent(event: string, data: any): void {
  const io = getIO();
  io.emit(event, data);
  console.log(`📢 Broadcasted ${event} to all clients`);
}

/**
 * Get connected socket count
 */
export function getConnectedSocketCount(): number {
  const io = getIO();
  return io.sockets.sockets.size;
}

/**
 * Get socket by user ID
 */
export function getSocketByUserId(userId: string): AuthenticatedSocket | null {
  const io = getIO();
  
  for (const [, socket] of io.sockets.sockets) {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.userId === userId) {
      return authSocket;
    }
  }
  
  return null;
}

/**
 * Get socket by agent ID
 */
export function getSocketByAgentId(agentId: string): AuthenticatedSocket | null {
  const io = getIO();
  
  for (const [, socket] of io.sockets.sockets) {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.agentId === agentId) {
      return authSocket;
    }
  }
  
  return null;
}

/**
 * Emit event to agent room
 * Helper function to send events to agent rooms
 */
export function emitToAgentRoom(room: string, event: string, data: any): void {
  const io = getIO();
  io.to(room).emit(event, data);
  console.log(`📤 Emitted ${event} to agent room ${room}`);
}

/**
 * Get agent room statistics
 */
export function getAgentRoomStats(): { [room: string]: number } {
  const io = getIO();
  const rooms = ['agents:all', 'agents:available', 'agents:busy', 'agents:away', 'agents:offline'];
  const stats: { [room: string]: number } = {};
  
  rooms.forEach(room => {
    stats[room] = io.sockets.adapter.rooms.get(room)?.size || 0;
  });
  
  return stats;
}
