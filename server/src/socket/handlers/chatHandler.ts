import { Server as SocketIOServer } from 'socket.io';
import { Types } from 'mongoose';
import {
  SOCKET_EVENTS,
  AuthenticatedSocket,
  ChatConnectPayload,
  ChatMessagePayload,
  ChatTypingPayload,  
  ChatDisconnectPayload,
  ChatResponsePayload,
  ChatErrorPayload,
  RequestAgentPayload,
  validatePayload,
} from '../events';
import queueService, { QueueMessage } from '../../services/queue.service';
import rateLimitService from '../../services/rateLimit.service';
import redisService from '../../services/redis.service';
import aiManager from '../../core/services/aiManager.service';

/**
 * Session and Context Management (Inlined)
 * Temporary solution to bypass TypeScript module resolution issue
 */

interface Message {
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface SessionData {
  userId: string;
  sessionId: string;
  language: string;
  messages: Message[];
  metadata: any;
  createdAt: Date;
  lastActivity: Date;
}

// Session Management Functions
function getSessionKey(userId: string, sessionId: string): string {
  return `session:${userId}:${sessionId}`;
}

async function createSession(userId: string, sessionId: string, language: string = 'en'): Promise<SessionData> {
  const sessionData: SessionData = {
    userId,
    sessionId,
    language,
    messages: [],
    metadata: {},
    createdAt: new Date(),
    lastActivity: new Date()
  };

  const key = getSessionKey(userId, sessionId);
  await redisService.set(key, JSON.stringify(sessionData), 1800);
  return sessionData;
}

async function getSession(userId: string, sessionId: string): Promise<SessionData | null> {
  const key = getSessionKey(userId, sessionId);
  const jsonString = await redisService.get(key);
  if (!jsonString) return null;
  return JSON.parse(jsonString);
}

async function updateSession(userId: string, sessionId: string, data: Partial<SessionData>): Promise<SessionData> {
  const existingSession = await getSession(userId, sessionId);
  if (!existingSession) throw new Error('Session not found');

  const updatedSession: SessionData = {
    ...existingSession,
    ...data,
    lastActivity: new Date()
  };

  const key = getSessionKey(userId, sessionId);
  await redisService.set(key, JSON.stringify(updatedSession), 1800);
  return updatedSession;
}

async function extendSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await getSession(userId, sessionId);
  if (!session) return false;

  const key = getSessionKey(userId, sessionId);
  await redisService.expire(key, 1800);
  return true;
}

// Context Management Functions
// Implements Requirements 17.2, 17.4, 17.5, 33.1, 33.9

const MAX_MESSAGES = 10; // Store last 10 messages (Requirement 17.2, 33.1)
const MAX_TOKENS = 2000; // Limit context to 2000 tokens (Requirement 33.9)
const AVG_TOKENS_PER_CHAR = 0.25; // Rough estimate: 1 token ≈ 4 characters

/**
 * Estimate token count for text
 * Uses rough approximation: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length * AVG_TOKENS_PER_CHAR);
}

/**
 * Add message to conversation context
 * Automatically maintains last 10 messages (Requirement 17.2, 33.1)
 */
async function addMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'bot' | 'system',
  content: string,
  metadata?: any
): Promise<void> {
  const session = await getSession(userId, sessionId);
  if (!session) throw new Error('Session not found');

  const newMessage: Message = {
    role,
    content,
    timestamp: new Date(),
    metadata
  };

  session.messages.push(newMessage);
  
  // Keep only last 10 messages (Requirement 17.2, 33.1)
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
    console.log(`📝 Context trimmed to last ${MAX_MESSAGES} messages`);
  }

  await updateSession(userId, sessionId, {
    messages: session.messages
  });
}

/**
 * Get conversation context (last 10 messages)
 * Returns messages in chronological order (Requirement 17.2)
 */
async function getContext(userId: string, sessionId: string): Promise<Message[]> {
  const session = await getSession(userId, sessionId);
  return session ? session.messages : [];
}

/**
 * Get context with token limit
 * Prioritizes recent messages and limits to 2000 tokens (Requirement 33.9, 33.10)
 */
async function getContextWithTokenLimit(userId: string, sessionId: string): Promise<Message[]> {
  const allMessages = await getContext(userId, sessionId);
  
  if (allMessages.length === 0) {
    return [];
  }

  // Start from most recent and work backwards (Requirement 33.10)
  const limitedMessages: Message[] = [];
  let totalTokens = 0;

  for (let i = allMessages.length - 1; i >= 0; i--) {
    const message = allMessages[i];
    const estimatedTokens = estimateTokens(message.content);

    // Check if adding this message would exceed token limit
    if (totalTokens + estimatedTokens > MAX_TOKENS) {
      console.log(`⚠️  Token limit reached: ${totalTokens} tokens (max: ${MAX_TOKENS})`);
      break;
    }

    limitedMessages.unshift(message); // Add to beginning to maintain chronological order
    totalTokens += estimatedTokens;
  }

  console.log(`📚 Context retrieved: ${limitedMessages.length} messages (~${totalTokens} tokens)`);
  return limitedMessages;
}

/**
 * Clear conversation context
 * Used when user explicitly starts a new topic (Requirement 17.5, 33.7)
 */
async function clearContext(userId: string, sessionId: string): Promise<void> {
  await updateSession(userId, sessionId, {
    messages: []
  });
  console.log(`🗑️  Context cleared for session: ${sessionId}`);
}

/**
 * Check if context should be cleared based on topic change
 * Detects explicit topic change keywords (Requirement 33.7)
 */
function shouldClearContext(message: string): boolean {
  const clearKeywords = [
    'new topic',
    'change topic',
    'start over',
    'reset',
    'clear chat',
    'new conversation',
    'forget that',
    'never mind'
  ];

  const messageLower = message.toLowerCase();
  return clearKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return new Types.ObjectId().toString();
}

/**
 * Chat Socket Event Handlers
 * Handles real-time chat events between user and AI
 * Implements Requirements 0.1-0.10, 28.1, 29.2-29.3, 30.1-30.5
 */

console.log('🔧 Chat handlers loaded with handoff detection');

export function registerChatHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  /**
   * Handle chat:connect event
   * User connects to chatbot and creates/joins session
   * Requirement 0.1, 0.9
   */
  socket.on(SOCKET_EVENTS.CHAT_CONNECT, async (data: ChatConnectPayload) => {
    try {
      if (!validatePayload<ChatConnectPayload>(data, ['userId', 'sessionId'])) {
        socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid chat:connect payload',
        } as ChatErrorPayload);
        return;
      }

      const { userId, sessionId, language = 'en' } = data;

      // Store session data in socket
      socket.sessionId = sessionId;
      socket.language = language;
      
      // IMPORTANT: Set the userId from client payload for anonymous users
      // This ensures the socket joins the correct room that matches client's userId
      if (!socket.userId || socket.userId === '') {
        socket.userId = userId;
        console.log(`📝 Set anonymous userId from client: ${userId}`);
      }

      // Join session room
      socket.join(`session:${sessionId}`);
      socket.join(`user:${socket.userId}`);
      
      console.log(`📍 Socket joined rooms: session:${sessionId}, user:${socket.userId}`);

      // Create or get session using inlined session functions
      if (redisService.isReady()) {
        try {
          // Check if session exists
          const existingSession = await getSession(userId, sessionId);
          
          if (!existingSession) {
            // Create new session
            await createSession(userId, sessionId, language);
            console.log(`✅ New session created: ${sessionId}`);
          } else {
            // Extend existing session
            await extendSession(userId, sessionId);
            console.log(`✅ Existing session extended: ${sessionId}`);
          }
        } catch (sessionError) {
          console.error('Session creation error:', sessionError);
        }
      }

      console.log(`✅ Chat connected: User ${userId}, Session ${sessionId}, Language ${language}`);

      // Connection successful - no need to send a message, the client handles the welcome screen

    } catch (error: any) {
      console.error('Chat connect error:', error);
      socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
        errorCode: 'CONNECT_ERROR',
        errorMessage: 'Failed to connect to chat',
      } as ChatErrorPayload);
    }
  });

  /**
   * Handle chat:message event
   * User sends message to chatbot
   * Requirements 0.4, 29.2, 29.3, 30.1-30.5
   */
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (data: ChatMessagePayload) => {
    try {
      console.log(`📨 CHAT MESSAGE RECEIVED:`, data);
      
      if (!validatePayload<ChatMessagePayload>(data, ['message', 'userId'])) {
        console.log(`❌ Invalid payload:`, data);
        socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid message payload',
        } as ChatErrorPayload);
        return;
      }

      const { message, userId, sessionId, language } = data;
      console.log(`📝 Processing message: "${message}" from user: ${userId}`);

      // Validate message
      if (!message || message.trim().length === 0) {
        socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
          errorCode: 'EMPTY_MESSAGE',
          errorMessage: 'Message cannot be empty',
        } as ChatErrorPayload);
        return;
      }

      if (message.length > 5000) {
        socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
          errorCode: 'MESSAGE_TOO_LONG',
          errorMessage: 'Message too long (max 5000 characters)',
        } as ChatErrorPayload);
        return;
      }

      // Check rate limit (Requirement 30.1-30.5)
      if (redisService.isReady()) {
        const rateLimitResult = await rateLimitService.checkRateLimit(userId);
        
        if (!rateLimitResult.allowed) {
          // Log violation (Requirement 30.8)
          await rateLimitService.logViolation(userId, 'minute');
          
          socket.emit(SOCKET_EVENTS.RATE_LIMIT_EXCEEDED, {
            errorCode: 'rate_limit_exceeded',
            errorMessage: 'Please wait a moment before sending more messages',
            retryAfter: rateLimitResult.retryAfter || 60,
            limit: {
              minute: 10,
              hour: 100,
            },
          });
          return;
        }
      }

      // Create queue message (Requirement 29.2)
      const queueMessage: QueueMessage = {
        id: generateId(),
        userId,
        sessionId: sessionId || socket.sessionId || generateId(),
        message: message.trim(),
        timestamp: new Date(),
        language: language || socket.language || 'en',
        metadata: {
          socketId: socket.id,
        },
      };

      // Add to queue (Requirement 29.3 - FIFO)
      if (redisService.isReady()) {
        try {
          await queueService.enqueue(queueMessage);
          console.log(`📨 Message queued: ${queueMessage.id}`);
          
          // Emit typing indicator (Requirement 0.6)
          socket.emit(SOCKET_EVENTS.CHAT_TYPING, {
            isTyping: true,
            sender: 'bot',
          } as ChatTypingPayload);

          // Process queue immediately (in production, this would be a background worker)
          processMessageQueue(io);
          
        } catch (queueError: any) {
          console.error('Queue error:', queueError);
          // Fall back to direct processing
          await processMessageDirectly(io, socket, queueMessage);
        }
      } else {
        // Redis not available, process directly
        await processMessageDirectly(io, socket, queueMessage);
      }

    } catch (error: any) {
      console.error('Chat message error:', error);
      socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
        errorCode: 'MESSAGE_ERROR',
        errorMessage: 'Failed to process message',
      } as ChatErrorPayload);
    }
  });

  /**
   * Handle chat:typing event
   * User is typing
   * Requirement 0.6
   */
  socket.on(SOCKET_EVENTS.CHAT_TYPING, (data: ChatTypingPayload) => {
    try {
      const { isTyping } = data;
      
      // Broadcast to agents monitoring this session
      if (socket.sessionId) {
        io.to(`session:${socket.sessionId}`).emit(SOCKET_EVENTS.CHAT_TYPING, {
          isTyping,
          sender: 'user',
        } as ChatTypingPayload);
      }
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  });

  /**
   * Handle chat:requestAgent event
   * User requests human agent handoff
   * Requirement 44.2
   */
  socket.on(SOCKET_EVENTS.CHAT_REQUEST_AGENT, async (data: RequestAgentPayload) => {
    try {
      if (!validatePayload<RequestAgentPayload>(data, ['userId', 'sessionId', 'reason'])) {
        socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid request agent payload',
        } as ChatErrorPayload);
        return;
      }

      const { userId, reason } = data;

      console.log(`🤝 Agent handoff requested: User ${userId}, Reason: ${reason}`);

      // This will be handled by handoffHandler
      // Emit event to trigger handoff process
      socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
        message: 'Connecting you to a human agent...',
        model: 'system',
        timestamp: new Date(),
      } as ChatResponsePayload);

    } catch (error: any) {
      console.error('Request agent error:', error);
      socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
        errorCode: 'HANDOFF_ERROR',
        errorMessage: 'Failed to request agent',
      } as ChatErrorPayload);
    }
  });

  /**
   * Handle chat:disconnect event
   * User disconnects from chat
   * Requirement 0.10
   */
  socket.on(SOCKET_EVENTS.CHAT_DISCONNECT, async (data: ChatDisconnectPayload) => {
    try {
      const { userId, sessionId } = data;

      // Leave rooms
      socket.leave(`session:${sessionId}`);
      socket.leave(`user:${userId}`);

      // Clear session from Redis (optional - TTL will handle it)
      if (redisService.isReady() && sessionId) {
        const sessionKey = `session:${sessionId}`;
        await redisService.delete(sessionKey);
      }

      console.log(`👋 Chat disconnected: User ${userId}, Session ${sessionId}`);

    } catch (error) {
      console.error('Chat disconnect error:', error);
    }
  });

  /**
   * Handle socket disconnect event
   * Automatic cleanup on connection loss
   * Requirement 0.3, 0.10
   */
  socket.on(SOCKET_EVENTS.DISCONNECT, async (reason: string) => {
    try {
      console.log(`🔌 Socket disconnected: ${socket.userId} - Reason: ${reason}`);

      // Clean up session if exists
      if (socket.sessionId && redisService.isReady()) {
        const sessionKey = `session:${socket.sessionId}`;
        await redisService.delete(sessionKey);
      }

    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });
}

/**
 * Process message queue
 * Background worker to process queued messages
 * Requirement 29.3 - FIFO processing
 */
async function processMessageQueue(io: SocketIOServer): Promise<void> {
  try {
    if (!redisService.isReady()) return;

    const message = await queueService.dequeue();
    
    if (!message) return;

    console.log(`⚙️  Processing queued message: ${message.id}`);

    // Get socket by ID
    const socket = io.sockets.sockets.get(message.metadata?.socketId);
    
    if (socket) {
      await processMessageDirectly(io, socket as AuthenticatedSocket, message);
    } else {
      console.warn(`⚠️  Socket not found for message ${message.id}`);
    }

  } catch (error) {
    console.error('Queue processing error:', error);
  }
}

/**
 * Check if user is requesting human assistance
 */
const isHandoffRequest = (message: string): boolean => {
  const handoffKeywords = [
    'human', 'agent', 'person', 'representative', 'support',
    'help me', 'speak to', 'talk to', 'connect me', 'transfer',
    'escalate', 'supervisor', 'manager', 'real person',
    'not satisfied', 'complaint', 'urgent', 'emergency'
  ];
  
  const lowerMessage = message.toLowerCase();
  return handoffKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Create handoff ticket for human assistance
 */
const createHandoffTicket = async (
  userId: string,
  message: string,
  conversationHistory: any[]
): Promise<string> => {
  try {
    const User = require('../../shared/models/User.model').default;
    const Conversation = require('../../shared/models/Conversation.model').default;
    const HandoffTicket = require('../../shared/models/HandoffTicket.model').default;

    // Find or create user
    let user = await User.findById(userId);
    if (!user) {
      // Create anonymous user for this session
      user = await User.create({
        email: `anonymous_${Date.now()}@temp.com`,
        firstName: 'Anonymous',
        lastName: 'User',
        authProvider: 'email',
        role: 'user'
      });
    }

    // Create conversation record
    const conversation = await Conversation.create({
      userId: user._id,
      title: 'Customer Support Request',
      messages: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        timestamp: new Date()
      })),
      status: 'active'
    });

    // Create handoff ticket
    const ticket = await HandoffTicket.create({
      userId: user._id,
      conversationId: conversation._id,
      reason: `User requested human assistance: ${message}`,
      priority: 2,
      priorityLevel: 'Medium',
      status: 'waiting',
      conversationContext: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        timestamp: new Date()
      })),
      slaData: {
        responseDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        resolutionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        escalationLevel: 0,
        isOverdue: false
      },
      autoAssignmentData: {
        departmentScore: 0,
        languageScore: 0,
        workloadScore: 0,
        totalScore: 0,
        assignmentMethod: 'manual'
      }
    });

    console.log('✅ Handoff ticket created via Socket:', ticket._id);
    return ticket._id.toString();
  } catch (error) {
    console.error('❌ Error creating handoff ticket via Socket:', error);
    throw error;
  }
};

/**
 * Process message directly (without queue)
 * Used when Redis is unavailable or for immediate processing
 * Implements Requirements 17.3, 33.2, 33.3, 33.4, 33.7, 33.9
 */
async function processMessageDirectly(
  _io: SocketIOServer,
  socket: AuthenticatedSocket,
  queueMessage: QueueMessage
): Promise<void> {
  try {
    const { sessionId, message, language } = queueMessage;
    // Use socket.userId to ensure we emit to the correct room
    const userId = socket.userId || queueMessage.userId;

    // Check if user wants to clear context (Requirement 33.7)
    if (redisService.isReady() && shouldClearContext(message)) {
      try {
        await clearContext(userId, sessionId);
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: 'I\'ve cleared our conversation history. How can I help you with a new topic?',
          model: 'system',
          timestamp: new Date(),
        } as ChatResponsePayload);
        return;
      } catch (clearError) {
        console.error('Error clearing context:', clearError);
      }
    }

    // Get conversation context from session with token limit (Requirement 33.9)
    let conversationHistory: any[] = [];
    
    if (redisService.isReady()) {
      try {
        // Get context messages with token limit (Requirement 33.9, 33.10)
        const contextMessages = await getContextWithTokenLimit(userId, sessionId);
        
        // Convert Message[] to ChatMessage[] format for AI service
        // Map 'bot' role to 'assistant' role
        conversationHistory = contextMessages.map((msg: Message) => ({
          role: msg.role === 'bot' ? 'assistant' : msg.role,
          content: msg.content,
        }));

        console.log(`📚 Retrieved ${conversationHistory.length} messages from context (token-limited)`);
      } catch (contextError) {
        console.error('Context retrieval error:', contextError);
      }
    }

    // Check if user is requesting human assistance
    console.log(`🔍 Checking handoff request for message: "${message}"`);
    const isHandoff = isHandoffRequest(message);
    console.log(`🔍 Handoff detection result: ${isHandoff}`);
    
    if (isHandoff) {
      console.log(`🤝 HANDOFF DETECTED! Creating ticket for message: "${message}"`);
      try {
        const ticketId = await createHandoffTicket(
          userId,
          message,
          conversationHistory
        );

        // Stop typing indicator
        socket.emit(SOCKET_EVENTS.CHAT_TYPING, {
          isTyping: false,
          sender: 'bot',
        } as ChatTypingPayload);

        // Send handoff response
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: "I understand you'd like to speak with a human agent. I've created a support ticket for you and connected you with our support team. An agent will be with you shortly.",
          model: 'handoff-system',
          timestamp: new Date(),
          handoffRequested: true,
          ticketId: ticketId
        } as ChatResponsePayload);

        // Save user message to context
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
            await addMessage(userId, sessionId, 'bot', "I understand you'd like to speak with a human agent. I've created a support ticket for you and connected you with our support team. An agent will be with you shortly.");
            console.log(`💾 Handoff messages saved to context`);
          } catch (saveError) {
            console.error('Error saving handoff messages:', saveError);
          }
        }

        return;
      } catch (error) {
        console.error('❌ Handoff creation failed:', error);
        // Continue with AI response as fallback
      }
    }

    // Get AI response with conversation history (Requirement 17.3, 33.2, 33.3, 33.4)
    const aiResponse = await aiManager.generateResponse({
      userMessage: message,
      conversationHistory,
      language: language || 'en',
    });

    // Save user message to context
    if (redisService.isReady()) {
      try {
        await addMessage(userId, sessionId, 'user', message);
        console.log(`💾 User message saved to context`);
      } catch (saveError) {
        console.error('Error saving user message:', saveError);
      }
    }

    // Stop typing indicator
    socket.emit(SOCKET_EVENTS.CHAT_TYPING, {
      isTyping: false,
      sender: 'bot',
    } as ChatTypingPayload);

    // Send AI response (Requirement 0.5)
    console.log(`📤 Emitting chat response to client: ${aiResponse.content.substring(0, 50)}...`);
    console.log(`📤 Emitting to socket: ${socket.id}, session: ${sessionId}, userId: ${userId}`);
    
    // Emit directly to the socket first (most reliable)
    socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
      message: aiResponse.content,
      model: 'gemini',
      timestamp: new Date(),
      language: language,
      confidence: aiResponse.confidence,
    } as ChatResponsePayload);
    
    console.log(`📤 Emitted directly to socket: ${socket.id}`);

    // Save bot response to context
    if (redisService.isReady()) {
      try {
        await addMessage(userId, sessionId, 'bot', aiResponse.content);
        console.log(`💾 Bot response saved to context`);
        
        // Extend session timeout after successful interaction
        await extendSession(userId, sessionId);
        console.log(`⏰ Session timeout extended`);
      } catch (saveError) {
        console.error('Error saving bot response:', saveError);
      }
    }

    // Check if handoff needed (Requirement 44.1)
    if (aiResponse.shouldHandoff) {
      socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
        message: 'I\'m having trouble with this request. Would you like to speak with a human agent?',
        model: 'system',
        timestamp: new Date(),
      } as ChatResponsePayload);
    }

  } catch (error: any) {
    console.error('AI processing error:', error);
    
    socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
      errorCode: 'AI_ERROR',
      errorMessage: 'I\'m having trouble responding right now. Please try again or talk to a human agent.',
    } as ChatErrorPayload);
  }
}

export { processMessageQueue };
