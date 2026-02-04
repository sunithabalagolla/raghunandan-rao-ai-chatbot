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
import HandoffTicket from '../../shared/models/HandoffTicket.model';
import Conversation from '../../shared/models/Conversation.model';
import ticketService from '../../services/ticket.service';

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
  // Location collection state
  isCollectingLocation?: boolean;
  locationLevel?: 'district' | 'assembly' | 'mandal' | 'village';
  selectedLocation?: {
    district?: { id: string; name: string };
    assembly?: { id: string; name: string };
    mandal?: { id: string; name: string };
    village?: string;
  };
  issueCategory?: string;
  // Application status tracking
  applicationStatusAsked?: boolean;
  hasApplied?: boolean | null;
  applicationId?: string;
  waitingForApplicationId?: boolean;
  conversationStep?: 'issue' | 'application' | 'applicationId' | 'location' | 'details' | 'contact' | 'verification';
  // Issue details tracking
  issueDetailsCollected?: boolean;
  issueDetails?: {
    description: string;
    duration: string;
    peopleAffected: string;
    severity: string;
  };
  // Contact information tracking
  contactInfoCollected?: boolean;
  contactInfo?: {
    mobile?: string;
    email?: string;
  };
  // Verification tracking
  informationVerified?: boolean;
  // Ticket tracking
  ticketCreated?: boolean;
  ticketId?: string;
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
  console.log(`🔌 CHAT HANDLER REGISTERED for socket: ${socket.id}`);
  
  /**
   * Handle chat:connect event
   * User connects to chatbot and creates/joins session
   * Requirement 0.1, 0.9
   */
  socket.on(SOCKET_EVENTS.CHAT_CONNECT, async (data: ChatConnectPayload) => {
    console.log(`📞 CHAT CONNECT EVENT RECEIVED:`, data);
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
          console.log(`🔄 Processing queue immediately...`);
          processMessageQueue(io);
          
        } catch (queueError: any) {
          console.error('Queue error:', queueError);
          // Fall back to direct processing
          console.log(`🔄 Falling back to direct processing...`);
          await processMessageDirectly(io, socket, queueMessage);
        }
      } else {
        // Redis not available, process directly
        console.log(`🔄 Redis not available, processing directly...`);
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
  socket.on(SOCKET_EVENTS.CHAT_TYPING, async (data: ChatTypingPayload) => {
    try {
      const { isTyping } = data;
      const userId = socket.userId || 'anonymous';
      
      // Check if there's an active handoff ticket for this user
      try {
        const HandoffTicket = require('../../shared/models/HandoffTicket.model').default;
        const { Types } = require('mongoose');
        
        // Only check for tickets if userId is a valid ObjectId
        if (Types.ObjectId.isValid(userId)) {
          const activeTicket = await HandoffTicket.findOne({
            userId: userId,
            status: 'assigned'
          }).populate('assignedAgentId');

          if (activeTicket && activeTicket.assignedAgentId) {
            // Forward typing indicator to assigned agent
            io.to(`agent:${activeTicket.assignedAgentId._id}`).emit('customer:typing', {
              ticketId: activeTicket._id.toString(),
              isTyping: isTyping,
              userId: userId,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Error forwarding typing indicator to agent:', error);
      }
      
      // Broadcast to agents monitoring this session (existing functionality)
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
 * Only trigger on very explicit handoff requests
 */
const isHandoffRequest = (message: string): boolean => {
  const explicitHandoffPhrases = [
    // Existing general phrases
    'speak to a human',
    'talk to a human', 
    'connect me to a human',
    'transfer to human',
    'escalate to human',
    'escalate',  // Added: single word
    'human agent',
    'real person',
    'live agent',
    'speak with agent',
    'talk to agent',
    'connect me to agent',
    'transfer to agent',
    'escalate to agent',
    'i want to chat with a human',
    'i want to chat with human',  // Added: without "a"
    'i need to speak with a human',
    'i need to speak with human',  // Added: without "a"
    'can i talk to a human',
    'can i talk to human',  // Added: without "a"
    'get me a human',
    'get me human',  // Added: without "a"
    'i want to speak with the agent',
    'i want to chat with the agent',
    'escalate the problem',
    'escalate the prblm',
    'connect me to human',  // Added: without "a"
    'talk to human',  // Added: without "a"
    'speak to human',  // Added: without "a"
    'chat with human',  // Added: without "a"
    'human support',
    'human help',
    'live support',
    'live help',
    
    // MRR constituency-specific phrases
    'talk to mp office',
    'contact raghunandan rao',
    'speak to raghunandan rao',
    'connect me to raghunandan rao',
    'escalate to mla',
    'escalate to mp',
    'need political help',
    'speak to representative',
    'talk to representative',
    'connect me to representative',
    'contact mp office',
    'speak to mp office',
    'connect me to mp office',
    'transfer to mp office',
    'escalate to mp office',
    'i want to talk to mp',
    'i need to speak to mp',
    'can i talk to mp',
    'get me mp office',
    'mp office help',
    'political representative',
    'constituency office',
    'medak mp office'
  ];
  
  const lowerMessage = message.toLowerCase().trim();
  console.log(`🔍 Checking handoff for: "${lowerMessage}"`);
  
  const isMatch = explicitHandoffPhrases.some(phrase => {
    const matches = lowerMessage.includes(phrase);
    if (matches) {
      console.log(`✅ Handoff phrase matched: "${phrase}"`);
    }
    return matches;
  });
  
  console.log(`🔍 Final handoff result: ${isMatch}`);
  return isMatch;
};

/**
 * Create handoff ticket for human assistance
 */
const createHandoffTicket = async (
  userId: string,
  message: string,
  conversationHistory: any[],
  sessionId?: string
): Promise<string> => {
  try {
    console.log(`🎫 Starting ticket creation for userId: ${userId}`);
    
    // Import models with better error handling - try both compiled and source
    let User, Conversation, HandoffTicket, Types;
    try {
      // Try compiled version first (when running with npm run dev)
      User = require('../../shared/models/User.model').default;
      Conversation = require('../../shared/models/Conversation.model').default;
      HandoffTicket = require('../../shared/models/HandoffTicket.model').default;
      Types = require('mongoose').Types;
      console.log(`✅ Models imported successfully`);
    } catch (importError: any) {
      console.error('❌ Error importing models:', importError);
      console.error('❌ Import error details:', {
        message: importError.message,
        code: importError.code
      });
      throw new Error(`Failed to import database models: ${importError.message}`);
    }

    let user;
    
    // Check if userId is a valid ObjectId
    if (Types.ObjectId.isValid(userId)) {
      try {
        user = await User.findById(userId);
        console.log(`🔍 Searched for existing user: ${user ? 'found' : 'not found'}`);
      } catch (findError) {
        console.error('❌ Error finding user:', findError);
      }
    }
    
    if (!user) {
      try {
        // Create anonymous user for this session
        user = await User.create({
          email: `anonymous_${Date.now()}@temp.com`,
          firstName: 'Anonymous',
          lastName: 'User',
          authProvider: 'email',
          role: 'user'
        });
        console.log(`👤 Created anonymous user: ${user._id} for session userId: ${userId}`);
      } catch (createUserError: any) {
        console.error('❌ Error creating anonymous user:', createUserError);
        throw new Error(`Failed to create user for ticket: ${createUserError.message}`);
      }
    }

    // Get location data from session if available
    let locationData = null;
    if (sessionId && redisService.isReady()) {
      try {
        const session = await getSession(userId, sessionId);
        if (session?.selectedLocation) {
          locationData = {
            district: session.selectedLocation.district?.name || '',
            assembly: session.selectedLocation.assembly?.name || '',
            mandal: session.selectedLocation.mandal?.name || '',
            village: session.selectedLocation.village || ''
          };
          console.log(`📍 Location data retrieved from session:`, locationData);
        }
      } catch (locationError) {
        console.error('❌ Error retrieving location from session:', locationError);
      }
    }

    // Create conversation record
    let conversation;
    try {
      conversation = await Conversation.create({
        userId: user._id,
        title: 'Customer Support Request',
        messages: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : msg.role,
          content: msg.content,
          timestamp: new Date()
        })),
        status: 'active'
      });
      console.log(`💬 Created conversation: ${conversation._id}`);
    } catch (createConversationError: any) {
      console.error('❌ Error creating conversation:', createConversationError);
      throw new Error(`Failed to create conversation record: ${createConversationError.message}`);
    }

    // Create handoff ticket with location data
    let ticket;
    try {
      const ticketData: any = {
        userId: user._id,
        sessionUserId: userId, // Store the original session userId for message routing
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
      };

      // Add location data if available
      if (locationData) {
        ticketData.location = locationData;
        console.log(`📍 Adding location data to ticket:`, locationData);
      }

      ticket = await HandoffTicket.create(ticketData);
      console.log('✅ Handoff ticket created via Socket:', ticket._id);
      console.log('🔍 Ticket created with sessionUserId:', userId, 'and userId:', user._id);
      
      // Notify all available agents about new ticket
      const _io = require('../../socket/socketServer').getIO();
      if (_io) {
        _io.to('agents').emit('agent:new-ticket', {
          ticket: {
            _id: ticket._id,
            userId: ticket.userId,
            sessionUserId: ticket.sessionUserId,
            conversationId: ticket.conversationId,
            reason: ticket.reason,
            status: ticket.status,
            priority: ticket.priority,
            priorityLevel: ticket.priorityLevel,
            location: ticket.location,
            createdAt: ticket.createdAt,
          },
        });
        console.log('📢 Notified agents about new ticket:', ticket._id);
      }
    } catch (createTicketError: any) {
      console.error('❌ Error creating handoff ticket:', createTicketError);
      console.error('❌ Ticket creation error details:', {
        message: createTicketError.message,
        code: createTicketError.code,
        name: createTicketError.name
      });
      throw new Error(`Failed to create support ticket: ${createTicketError.message}`);
    }

    return ticket._id.toString();
  } catch (error: any) {
    console.error('❌ CRITICAL: Handoff ticket creation failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
      messageLength: message.length,
      historyLength: conversationHistory.length
    });
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

    console.log(`🔍 PROCESSING MESSAGE: "${message}" for user: ${userId}`);
    console.log(`🔍 DEBUG: socket.userId = ${socket.userId}, queueMessage.userId = ${queueMessage.userId}`);
    console.log(`🔍 DEBUG: Final userId being used = ${userId}`);

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

    // Check if there's already an active handoff ticket for this user
    try {
      const HandoffTicket = require('../../shared/models/HandoffTicket.model').default;
      const User = require('../../shared/models/User.model').default;
      const { Types } = require('mongoose');
      
      let existingTicket = null;
      
      console.log(`🔍 Looking for active ticket with userId: ${userId}`);
      
      // Use $or query to check both userId (ObjectId) and sessionUserId (string)
      existingTicket = await HandoffTicket.findOne({
        $or: [
          { userId: Types.ObjectId.isValid(userId) ? userId : null },
          { sessionUserId: userId }
        ],
        status: { $in: ['waiting', 'assigned'] }
      }).populate('userId');
      
      console.log(`🔍 Ticket lookup result: ${existingTicket ? 'FOUND' : 'NOT FOUND'}`);
      if (existingTicket) {
        console.log(`🔍 Found ticket: ${existingTicket._id} (status: ${existingTicket.status}, sessionUserId: ${existingTicket.sessionUserId})`);
      }

      if (existingTicket) {
        console.log(`🎫 User ${userId} has active ticket: ${existingTicket._id} (status: ${existingTicket.status})`);
        
        // If ticket is assigned, forward message to agent
        if (existingTicket.status === 'assigned' && existingTicket.assignedAgentId) {
          console.log(`📨 Forwarding customer message to agent ${existingTicket.assignedAgentId} for ticket: ${existingTicket._id}`);
          
          // CRITICAL FIX: Save customer message to HandoffTicket conversationContext
          const customerMessage = {
            role: 'user' as const,
            content: message,
            timestamp: new Date(),
            userId: userId,
          };

          await HandoffTicket.findByIdAndUpdate(existingTicket._id, {
            $push: {
              conversationContext: customerMessage
            }
          });

          // Also save to Conversation for completeness
          const conversation = await Conversation.findById(existingTicket.conversationId);
          if (conversation) {
            const conversationMessage = {
              _id: new Types.ObjectId().toString(),
              role: 'user' as const,
              content: message,
              timestamp: new Date(),
              userId: userId,
            };
            conversation.messages.push(conversationMessage as any);
            await conversation.save();
          }
          
          _io.to(`agent:${existingTicket.assignedAgentId}`).emit('customer:message', {
            ticketId: existingTicket._id.toString(),
            message: message,
            userId: userId,
            timestamp: new Date(),
            customerName: existingTicket.userId?.firstName || 'Customer'
          });

          // Also emit to ticket room as backup
          _io.to(`ticket:${existingTicket._id}`).emit('customer:message', {
            ticketId: existingTicket._id.toString(),
            message: message,
            userId: userId,
            timestamp: new Date(),
            customerName: existingTicket.userId?.firstName || 'Customer'
          });

          // Save message to context but don't send AI response
          if (redisService.isReady()) {
            try {
              await addMessage(userId, sessionId, 'user', message);
              console.log(`💾 Customer message saved to context`);
            } catch (saveError) {
              console.error('Error saving customer message:', saveError);
            }
          }
          
          console.log(`✅ Customer message SAVED TO DATABASE and forwarded to agent`);
          return; // Don't send AI response
        }
        
        // If ticket is waiting, just acknowledge
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: "Your request for human assistance is still being processed. An agent will be with you shortly.",
          model: 'system',
          timestamp: new Date(),
        } as ChatResponsePayload);
        
        return; // Don't process further
      }
    } catch (error) {
      console.error('Error checking existing tickets:', error);
      // Continue with normal processing if ticket check fails
    }

    // Check if user is requesting human assistance FIRST - before AI processing
    console.log(`🔍 Checking handoff request for message: "${message}"`);
    const isHandoff = isHandoffRequest(message);
    console.log(`🔍 Handoff detection result: ${isHandoff}`);
    
    if (isHandoff) {
      console.log(`🤝 HANDOFF DETECTED! Creating ticket for message: "${message}"`);
      try {
        const ticketId = await createHandoffTicket(
          userId,
          message,
          conversationHistory,
          sessionId
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

        // CRITICAL: Ensure customer socket joins ALL necessary rooms
        const HandoffTicket = require('../../shared/models/HandoffTicket.model').default;
        const createdTicket = await HandoffTicket.findById(ticketId);
        if (createdTicket) {
          const dbUserId = createdTicket.userId.toString();
          socket.join(`user:${dbUserId}`);
          socket.join(`ticket:${ticketId}`);
          console.log(`🔗 Customer socket joined rooms: user:${dbUserId}, ticket:${ticketId}`);
        }

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

        // CRITICAL: Return here to prevent AI response
        return;
      } catch (error) {
        console.error('❌ Handoff creation failed:', error);
        
        // Stop typing indicator first
        socket.emit(SOCKET_EVENTS.CHAT_TYPING, {
          isTyping: false,
          sender: 'bot',
        } as ChatTypingPayload);
        
        // Send error response and return (don't continue to AI)
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: "I'm having trouble connecting you to an agent right now. Please try again in a moment.",
          model: 'system',
          timestamp: new Date(),
        } as ChatResponsePayload);
        
        // Save user message to context even if handoff failed
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
            await addMessage(userId, sessionId, 'bot', "I'm having trouble connecting you to an agent right now. Please try again in a moment.");
            console.log(`💾 Failed handoff messages saved to context`);
          } catch (saveError) {
            console.error('Error saving failed handoff messages:', saveError);
          }
        }
        
        // CRITICAL: Return here to prevent AI response after handoff failure
        return;
      }
    }

    // ONLY reach here if NO handoff was detected AND no assigned ticket found
    console.log(`🤖 DEBUG: About to process AI response`);
    console.log(`🤖 DEBUG: No assigned ticket found for userId: ${userId}`);
    console.log(`🤖 DEBUG: No handoff detected, proceeding with AI response...`);

    // Check for location collection state and handle location responses
    let session = null;
    if (redisService.isReady()) {
      try {
        session = await getSession(userId, sessionId);
      } catch (error) {
        console.error('Error getting session for location check:', error);
      }
    }

    // Handle location selection responses
    if (session?.isCollectingLocation) {
      console.log(`📍 Location collection in progress. Current level: ${session.locationLevel}`);
      
      try {
        const updatedLocation = { ...session.selectedLocation };
        let nextLevel: 'district' | 'assembly' | 'mandal' | 'village' | null = null;
        let responseMessage = '';

        // Parse location selection based on current level
        switch (session.locationLevel) {
          case 'district':
            // Map district names to IDs
            const districtMap: { [key: string]: { id: string; name: string } } = {
              'siddipet district': { id: 'siddipet', name: 'Siddipet District' },
              'siddipet': { id: 'siddipet', name: 'Siddipet District' },
              'medak district': { id: 'medak', name: 'Medak District' },
              'medak': { id: 'medak', name: 'Medak District' },
              'sangareddy district': { id: 'sangareddy', name: 'Sangareddy District' },
              'sangareddy': { id: 'sangareddy', name: 'Sangareddy District' }
            };
            
            const selectedDistrict = districtMap[message.toLowerCase()];
            if (selectedDistrict) {
              updatedLocation.district = selectedDistrict;
              nextLevel = 'assembly';
              
              // Generate assembly options based on district
              const assemblyOptions: { [key: string]: string[] } = {
                'siddipet': ['• Dubbak Assembly', '• Gajwel Assembly'],
                'medak': ['• Chegunta Assembly', '• Medak Assembly', '• Narsapur Assembly'],
                'sangareddy': ['• Sangareddy Assembly', '• Patancheru Assembly']
              };
              
              const options = assemblyOptions[selectedDistrict.id] || [];
              responseMessage = `Which assembly constituency in ${selectedDistrict.name.replace(' District', '')}?\n${options.join('\n')}`;
            }
            break;

          case 'assembly':
            // Map assembly names to IDs
            const assemblyMap: { [key: string]: { id: string; name: string } } = {
              'dubbak assembly': { id: 'dubbak', name: 'Dubbak Assembly' },
              'dubbak': { id: 'dubbak', name: 'Dubbak Assembly' },
              'gajwel assembly': { id: 'gajwel', name: 'Gajwel Assembly' },
              'gajwel': { id: 'gajwel', name: 'Gajwel Assembly' },
              'chegunta assembly': { id: 'chegunta', name: 'Chegunta Assembly' },
              'chegunta': { id: 'chegunta', name: 'Chegunta Assembly' },
              'medak assembly': { id: 'medak', name: 'Medak Assembly' },
              'narsapur assembly': { id: 'narsapur', name: 'Narsapur Assembly' },
              'narsapur': { id: 'narsapur', name: 'Narsapur Assembly' },
              'sangareddy assembly': { id: 'sangareddy', name: 'Sangareddy Assembly' },
              'patancheru assembly': { id: 'patancheru', name: 'Patancheru Assembly' },
              'patancheru': { id: 'patancheru', name: 'Patancheru Assembly' }
            };
            
            const selectedAssembly = assemblyMap[message.toLowerCase()];
            if (selectedAssembly) {
              updatedLocation.assembly = selectedAssembly;
              nextLevel = 'mandal';
              responseMessage = `Which mandal/area in ${selectedAssembly.name.replace(' Assembly', '')}? Please select from the dropdown menu that will appear.`;
            }
            break;

          case 'mandal':
            // For mandal, we'll accept any text as mandal name
            updatedLocation.mandal = { id: message.toLowerCase().replace(/\s+/g, '-'), name: message };
            nextLevel = 'village';
            responseMessage = `Which village in ${message}? Please select from the dropdown menu that will appear.`;
            break;

          case 'village':
            // Complete location collection
            updatedLocation.village = message;
            
            // Update session to complete location collection
            await updateSession(userId, sessionId, {
              isCollectingLocation: false,
              selectedLocation: updatedLocation
            });

            responseMessage = `Thank you! I have your complete location: ${message}, ${updatedLocation.mandal?.name}, ${updatedLocation.assembly?.name}, ${updatedLocation.district?.name}.\n\nNow, please tell me more details about your ${session.issueCategory || 'issue'} so I can help you better.`;
            
            // Save location completion messages
            if (redisService.isReady()) {
              try {
                await addMessage(userId, sessionId, 'user', message);
                await addMessage(userId, sessionId, 'bot', responseMessage);
              } catch (saveError) {
                console.error('Error saving location completion messages:', saveError);
              }
            }

            // Send response and return
            socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
              message: responseMessage,
              model: 'location-system',
              timestamp: new Date(),
            } as ChatResponsePayload);

            return;
        }

        // Update session with new location data and level
        if (nextLevel) {
          await updateSession(userId, sessionId, {
            selectedLocation: updatedLocation,
            locationLevel: nextLevel
          });

          // Save messages
          if (redisService.isReady()) {
            try {
              await addMessage(userId, sessionId, 'user', message);
              await addMessage(userId, sessionId, 'bot', responseMessage);
            } catch (saveError) {
              console.error('Error saving location messages:', saveError);
            }
          }

          // Send response
          socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
            message: responseMessage,
            model: 'location-system',
            timestamp: new Date(),
          } as ChatResponsePayload);

          return;
        }
      } catch (locationError) {
        console.error('Error processing location selection:', locationError);
        // Fall through to AI processing if location handling fails
      }
    }

    // Check if user just selected an issue category and start application status check
    // CRITICAL: Application status check happens BEFORE location collection
    const issueKeywords = [
      'no water', 'water problem', 'drinking water', 'water supply', 'water shortage',
      'irrigation', 'crop loss', 'farming issue', 'agriculture',
      'road repair', 'road problem', 'bad roads', 'road condition',
      'electricity', 'power cut', 'no power', 'electrical issue', 'power problem',
      'healthcare', 'health issue', 'medical', 'hospital', 'doctor',
      'employment', 'job', 'work', 'unemployment',
      'pension', 'pension problem', 'pension issue',
      'housing', 'house', 'shelter', 'accommodation',
      'land issue', 'dharani', 'land problem', 'property',
      'transport', 'bus', 'travel', 'transportation',
      'drainage', 'sewage', 'waste water', 'drain problem',
      'education', 'school', 'college', 'study',
      'stray cattle', 'cattle problem', 'animal issue'
    ];

    const messageLower = message.toLowerCase();
    const containsIssueKeyword = issueKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Handle application status responses
    if (session?.waitingForApplicationId) {
      console.log(`📋 User provided response while waiting for application ID: ${message}`);
      
      // Check if user is actually saying they haven't applied (correction)
      const messageLower = message.toLowerCase().trim();
      
      // Enhanced negative detection - catch all variations of "I haven't applied"
      const isNegativeResponse = messageLower === 'no' ||
                                 messageLower.includes("haven't applied") ||
                                 messageLower.includes("didn't apply") ||
                                 messageLower.includes("i haven't applied") ||
                                 messageLower.includes("i havend applied") ||
                                 messageLower.includes("haven't") ||
                                 messageLower.includes("didn't") ||
                                 messageLower.includes("not applied") ||
                                 messageLower.includes("no application") ||
                                 messageLower.includes("never applied") ||
                                 messageLower.startsWith("no,") ||
                                 messageLower.startsWith("no ") ||
                                 (messageLower.includes('no') && messageLower.includes('applied'));
      
      if (isNegativeResponse) {
        console.log(`📋 User corrected - they haven't actually applied`);
        
        // Update session to reflect they haven't applied
        if (redisService.isReady()) {
          try {
            await updateSession(userId, sessionId, {
              hasApplied: false,
              waitingForApplicationId: false,
              conversationStep: 'application'
            });
          } catch (updateError) {
            console.error('Error updating corrected application status:', updateError);
          }
        }

        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // Suggest applying first
        const applyResponse = `I understand you haven't applied yet.\n\nTo help you better, please first submit your application on our official website:\n\n🔗 https://raghunandanrao.in/apply\n\nAfter submitting, you'll receive an Application ID. You can return here with that ID to track your issue.\n\nWhat would you like to do?\n• 🌐 Apply on website first\n• ➡️ Continue without Application ID`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: applyResponse,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', applyResponse);
          } catch (saveError) {
            console.error('Error saving corrected apply response:', saveError);
          }
        }

        return;
      }
      
      // Validate application ID format (should be alphanumeric, reasonable length)
      const trimmedMessage = message.trim();
      if (trimmedMessage.length < 3 || trimmedMessage.length > 20) {
        console.log(`📋 Invalid application ID format: ${trimmedMessage}`);
        
        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // Ask for valid application ID
        const validationResponse = `Please provide a valid Application ID or Reference Number. It should be in format like "APP12345" or "REF001".\n\nIf you haven't actually applied yet, please type "I haven't applied".`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: validationResponse,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', validationResponse);
          } catch (saveError) {
            console.error('Error saving validation response:', saveError);
          }
        }

        return;
      }
      
      console.log(`📋 Valid application ID provided: ${trimmedMessage}`);
      
      // Save application ID
      if (redisService.isReady()) {
        try {
          await updateSession(userId, sessionId, {
            applicationId: trimmedMessage,
            waitingForApplicationId: false,
            conversationStep: 'location'
          });
        } catch (updateError) {
          console.error('Error saving application ID:', updateError);
        }
      }

      // Save user message
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'user', message);
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
        }
      }

      // Confirm application ID and ask for location
      const confirmResponse = `Thank you. Application ID ${trimmedMessage} recorded.\n\nNow, which district are you from?\n• Siddipet District\n• Medak District\n• Sangareddy District`;
      
      socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
        message: confirmResponse,
        model: 'application-system',
        timestamp: new Date(),
      } as ChatResponsePayload);

      // Save bot response and start location collection
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'bot', confirmResponse);
          await updateSession(userId, sessionId, {
            isCollectingLocation: true,
            locationLevel: 'district'
          });
        } catch (saveError) {
          console.error('Error saving confirmation response:', saveError);
        }
      }

      return;
    }

    // Handle application status responses (Yes/No)
    if (session?.conversationStep === 'application') {
      // More specific detection - check for negative responses first
      const isNo = messageLower.includes('no') || 
                   messageLower.includes("haven't") || 
                   messageLower.includes("didn't") || 
                   messageLower.includes('❌') ||
                   messageLower.includes("haven't applied") ||
                   messageLower.includes("didn't apply") ||
                   messageLower.includes("not applied");
      
      const isYes = !isNo && (messageLower.includes('yes') || 
                              messageLower.includes('✅') ||
                              (messageLower.includes('applied') && !messageLower.includes("haven't") && !messageLower.includes("didn't")));
      
      if (isYes) {
        console.log(`📋 User has already applied - asking for Application ID`);
        
        // Update session - CRITICAL: Set waitingForApplicationId to true ONLY when user says YES
        if (redisService.isReady()) {
          try {
            await updateSession(userId, sessionId, {
              hasApplied: true,
              waitingForApplicationId: true,
              conversationStep: 'applicationId',
              applicationStatusAsked: true
            });
          } catch (updateError) {
            console.error('Error updating application status:', updateError);
          }
        }

        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // Ask for application ID
        const idRequest = `Great! Please provide your Application ID or Reference Number.\n\nIt should look like "APP12345" or "REF001". If you don't have one or haven't actually applied, please type "I haven't applied".`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: idRequest,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', idRequest);
          } catch (saveError) {
            console.error('Error saving ID request:', saveError);
          }
        }

        return;
      } else if (isNo) {
        console.log(`📋 User hasn't applied yet - directing to website`);
        
        // Update session - CRITICAL: Set waitingForApplicationId to FALSE when user says NO
        if (redisService.isReady()) {
          try {
            await updateSession(userId, sessionId, {
              hasApplied: false,
              waitingForApplicationId: false, // CRITICAL: Set to false
              conversationStep: 'application',
              applicationStatusAsked: true
            });
          } catch (updateError) {
            console.error('Error updating application status:', updateError);
          }
        }

        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // Suggest applying first - CORRECT RESPONSE for "No, I haven't applied"
        const applyResponse = `Please visit https://raghunandanrao.in/apply to submit your application first.\n\nOnce you submit, you'll receive an Application ID. Come back here with your Application ID and I'll help you track your issue!\n\nWhat would you like to do?\n• 🌐 Apply on Website\n• ➡️ Continue Without Application ID`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: applyResponse,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', applyResponse);
          } catch (saveError) {
            console.error('Error saving apply response:', saveError);
          }
        }

        return;
      }
    }

    // Handle continue options after user said they haven't applied
    if (session?.hasApplied === false && session?.conversationStep === 'application') {
      const wantsToApply = messageLower.includes('apply') || messageLower.includes('website') || messageLower.includes('🌐');
      const wantsToContinue = messageLower.includes('continue') || messageLower.includes('without') || messageLower.includes('➡️');
      
      if (wantsToApply) {
        console.log(`📋 User wants to apply on website first`);
        
        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // End conversation politely
        const endResponse = `Redirecting you to application page. Come back after applying!\n\nThank you for using MRR Constituency Assistant. 🙏`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: endResponse,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', endResponse);
          } catch (saveError) {
            console.error('Error saving end response:', saveError);
          }
        }

        return;
      } else if (wantsToContinue) {
        console.log(`📋 User wants to continue without application ID`);
        
        // Update session to start location collection
        if (redisService.isReady()) {
          try {
            await updateSession(userId, sessionId, {
              conversationStep: 'location',
              isCollectingLocation: true,
              locationLevel: 'district'
            });
          } catch (updateError) {
            console.error('Error updating to location step:', updateError);
          }
        }

        // Save user message
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'user', message);
          } catch (saveError) {
            console.error('Error saving user message:', saveError);
          }
        }

        // Ask for location
        const locationResponse = `Okay, I'll proceed without Application ID. Which district are you from?\n• Siddipet District\n• Medak District\n• Sangareddy District`;
        
        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message: locationResponse,
          model: 'application-system',
          timestamp: new Date(),
        } as ChatResponsePayload);

        // Save bot response
        if (redisService.isReady()) {
          try {
            await addMessage(userId, sessionId, 'bot', locationResponse);
          } catch (saveError) {
            console.error('Error saving location response:', saveError);
          }
        }

        return;
      }
    }

    // CRITICAL: Check if user just selected an issue category and start APPLICATION STATUS CHECK (not location)
    // BUT ONLY if they haven't already been through the application status flow
    if (containsIssueKeyword && !session?.applicationStatusAsked && !session?.isCollectingLocation && !session?.selectedLocation?.district) {
      console.log(`📋 Issue keyword detected: ${message}`);
      console.log(`📋 Starting APPLICATION STATUS CHECK (before location)`);
      
      // Start application status check
      if (redisService.isReady()) {
        try {
          await updateSession(userId, sessionId, {
            applicationStatusAsked: true,
            conversationStep: 'application',
            issueCategory: message
          });
        } catch (updateError) {
          console.error('Error starting application status check:', updateError);
        }
      }

      // Save user message
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'user', message);
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
        }
      }

      // Ask for application status FIRST
      const applicationStatusResponse = `I can help with that.\n\nHave you already submitted an application for this issue on our website (https://raghunandanrao.in/apply)?\n\nPlease select:\n• ✅ Yes, I have applied\n• ❌ No, I haven't applied yet`;
      
      socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
        message: applicationStatusResponse,
        model: 'application-system',
        timestamp: new Date(),
      } as ChatResponsePayload);

      // Save bot response
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'bot', applicationStatusResponse);
        } catch (saveError) {
          console.error('Error saving application status response:', saveError);
        }
      }

      return;
    }

    // Check for conversation ending phrases
    const conversationEnders = ['thanks', 'thank you', 'thanks k', 'ok thanks', 'good', 'okay', 'bye', 'goodbye', "that's all", 'nothing else'];
    const isConversationEnder = conversationEnders.some(phrase => 
      message.toLowerCase().trim().includes(phrase.toLowerCase())
    );

    if (isConversationEnder) {
      console.log(`👋 User ending conversation`);
      
      // Save user message
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'user', message);
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
        }
      }

      // Check if we should create a ticket before ending
      if (session?.selectedLocation?.district && session?.selectedLocation?.village && 
          session?.applicationStatusAsked && session?.issueCategory && !session?.ticketCreated) {
        
        console.log(`🎫 Creating ticket before conversation ends`);
        
        try {
          // Get the last user message that contains issue details (not the "thanks")
          const issueMessage = conversationHistory
            .filter(msg => msg.role === 'user')
            .reverse()
            .find(msg => msg.content.length > 20 && 
                        !conversationEnders.some(phrase => msg.content.toLowerCase().includes(phrase.toLowerCase())));
          
          if (issueMessage) {
            const ticketResponse = await ticketService.createTicket({
              userId,
              sessionId,
              issueCategory: session.issueCategory,
              issueDescription: issueMessage.content,
              location: {
                district: session.selectedLocation.district.name,
                assembly: session.selectedLocation.assembly?.name || '',
                mandal: session.selectedLocation.mandal?.name || '',
                village: session.selectedLocation.village || ''
              },
              applicationStatus: {
                hasApplied: session.hasApplied || false,
                applicationId: session.applicationId
              },
              issueDetails: session.issueDetails,
              contactInfo: session.contactInfo,
              conversationHistory,
              priority: 'MEDIUM'
            });

            // Update session with ticket info
            if (redisService.isReady()) {
              try {
                await updateSession(userId, sessionId, {
                  ticketCreated: true,
                  ticketId: ticketResponse.ticketId
                });
              } catch (updateError) {
                console.error('Error updating session with ticket info:', updateError);
              }
            }

            const endResponse = `You're welcome! Your complaint #${ticketResponse.ticketId} has been created and is being processed. You'll receive SMS updates. Stay in touch! 🙏`;
            
            socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
              message: endResponse,
              model: 'conversation-end',
              timestamp: new Date(),
            } as ChatResponsePayload);

            // Save bot response
            if (redisService.isReady()) {
              try {
                await addMessage(userId, sessionId, 'bot', endResponse);
              } catch (saveError) {
                console.error('Error saving end response:', saveError);
              }
            }

            return; // End conversation
          }
        } catch (ticketError) {
          console.error('Error creating ticket on conversation end:', ticketError);
        }
      }

      // Default ending response (no ticket created)
      const endResponse = session?.ticketId 
        ? `You're welcome! Your complaint #${session.ticketId} is being processed. You'll receive SMS updates. Stay in touch! 🙏`
        : `You're welcome! Feel free to reach out if you need any other assistance with constituency issues. 🙏`;
      
      socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
        message: endResponse,
        model: 'conversation-end',
        timestamp: new Date(),
      } as ChatResponsePayload);

      // Save bot response
      if (redisService.isReady()) {
        try {
          await addMessage(userId, sessionId, 'bot', endResponse);
        } catch (saveError) {
          console.error('Error saving end response:', saveError);
        }
      }

      return; // End conversation
    }
    if (session?.selectedLocation?.district && session?.selectedLocation?.village && session?.applicationStatusAsked) {
      console.log(`📍 User has complete location and application status, processing issue details with AI`);
      console.log(`📍 Session state: applicationStatusAsked=${session.applicationStatusAsked}, hasApplied=${session.hasApplied}, location=${session.selectedLocation.district.name}`);
      
      // Check if this is a detailed issue description (not just "thanks" or short responses)
      const isDetailedIssue = message.length > 20 && 
                             !message.toLowerCase().includes('thanks') &&
                             !message.toLowerCase().includes('thank you') &&
                             !message.toLowerCase().includes('ok') &&
                             !message.toLowerCase().includes('okay') &&
                             session.issueCategory &&
                             !session.ticketCreated;

      if (isDetailedIssue && session.issueCategory) {
        console.log(`🎫 Creating ticket for detailed issue: ${message}`);
        
        try {
          // Create ticket with detailed information
          const ticketResponse = await ticketService.createTicket({
            userId,
            sessionId,
            issueCategory: session.issueCategory,
            issueDescription: message,
            location: {
              district: session.selectedLocation.district.name,
              assembly: session.selectedLocation.assembly?.name || '',
              mandal: session.selectedLocation.mandal?.name || '',
              village: session.selectedLocation.village || ''
            },
            applicationStatus: {
              hasApplied: session.hasApplied || false,
              applicationId: session.applicationId
            },
            issueDetails: session.issueDetails,
            contactInfo: session.contactInfo,
            conversationHistory,
            priority: 'HIGH' // Will be auto-determined by service
          });

          // Mark ticket as created in session
          if (redisService.isReady()) {
            try {
              await updateSession(userId, sessionId, {
                ticketCreated: true,
                ticketId: ticketResponse.ticketId
              });
            } catch (updateError) {
              console.error('Error updating session with ticket info:', updateError);
            }
          }

          // Save user message
          if (redisService.isReady()) {
            try {
              await addMessage(userId, sessionId, 'user', message);
            } catch (saveError) {
              console.error('Error saving user message:', saveError);
            }
          }

          // Create professional ticket response
          const isUrgent = ticketResponse.priority === 'URGENT' || ticketResponse.priority === 'HIGH';
          
          const ticketResponseMessage = `I understand this is ${isUrgent ? 'urgent' : 'important'} - ${session.issueCategory.toLowerCase()} in ${session.selectedLocation.village}, ${session.selectedLocation.mandal?.name}, ${session.selectedLocation.assembly?.name}, ${session.selectedLocation.district?.name}.

I'm creating a ${ticketResponse.priority} PRIORITY complaint ticket for you right now.

📋 **Ticket Details:**
- Ticket ID: ${ticketResponse.ticketId}
- Issue: ${session.issueCategory} - ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}
- Location: ${session.selectedLocation.village}, ${session.selectedLocation.mandal?.name}, ${session.selectedLocation.assembly?.name}, ${session.selectedLocation.district?.name}
- Priority: ${ticketResponse.priority}
- Status: ESCALATED to ${ticketResponse.departmentContact.name} & MP Office

✅ **What I've Done:**
1. Created official complaint ticket
2. Notified ${ticketResponse.departmentContact.name}
3. Escalated to MP's office for immediate action

📞 **Immediate Actions You Can Take:**
- Call ${ticketResponse.departmentContact.name}: ${ticketResponse.departmentContact.phone}
- Reference your Ticket ID: ${ticketResponse.ticketId}
- Visit District Collector office with this ticket number

📱 **Track Your Complaint:**
You can track status at: ${ticketResponse.trackingUrl}

⏰ **Expected Response Time:** ${ticketResponse.expectedResponseTime}

Is there anything else urgent I should add to your complaint?`;

          socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
            message: ticketResponseMessage,
            model: 'ticket-system',
            timestamp: new Date(),
          } as ChatResponsePayload);

          // Save bot response
          if (redisService.isReady()) {
            try {
              await addMessage(userId, sessionId, 'bot', ticketResponseMessage);
            } catch (saveError) {
              console.error('Error saving ticket response:', saveError);
            }
          }

          return; // Don't continue to AI processing
        } catch (ticketError) {
          console.error('❌ Error creating ticket:', ticketError);
          // Continue to AI processing if ticket creation fails
        }
      }
      
      // Continue to AI processing below with enhanced context - don't return here
    }

    // Get AI response with conversation history and location context (Requirement 17.3, 33.2, 33.3, 33.4)
    let locationContext = '';
    let conversationStateContext = '';
    
    if (session?.selectedLocation?.district) {
      locationContext = `\n\nUser Location: ${session.selectedLocation.village || 'Unknown'}, ${session.selectedLocation.mandal?.name || 'Unknown'}, ${session.selectedLocation.assembly?.name || 'Unknown'}, ${session.selectedLocation.district?.name || 'Unknown'}`;
    }

    // Add conversation state context to prevent repetitive questions
    if (session) {
      const stateInfo = [];
      if (session.applicationStatusAsked) {
        stateInfo.push(`✅ APPLICATION STATUS COMPLETED: ${session.hasApplied ? 'User has applied' : 'User has not applied'}`);
        if (session.applicationId) {
          stateInfo.push(`✅ APPLICATION ID PROVIDED: ${session.applicationId}`);
        }
      }
      if (session.selectedLocation?.district && session.selectedLocation?.village) {
        stateInfo.push(`✅ LOCATION COMPLETED: ${session.selectedLocation.village}, ${session.selectedLocation.mandal?.name}, ${session.selectedLocation.assembly?.name}, ${session.selectedLocation.district?.name}`);
      }
      if (session.issueDetailsCollected && session.issueDetails) {
        stateInfo.push(`✅ ISSUE DETAILS COMPLETED: ${session.issueDetails.description} (Duration: ${session.issueDetails.duration}, Affected: ${session.issueDetails.peopleAffected})`);
      }
      if (session.contactInfoCollected && session.contactInfo) {
        stateInfo.push(`✅ CONTACT INFO COMPLETED: Mobile: ${session.contactInfo.mobile}${session.contactInfo.email ? `, Email: ${session.contactInfo.email}` : ''}`);
      }
      if (session.informationVerified) {
        stateInfo.push(`✅ INFORMATION VERIFIED: User confirmed all details are correct`);
      }
      if (session.issueCategory) {
        stateInfo.push(`✅ ISSUE REPORTED: ${session.issueCategory}`);
      }
      
      if (stateInfo.length > 0) {
        conversationStateContext = `\n\n🚨 CONVERSATION STATE - DO NOT REPEAT THESE COMPLETED STEPS:\n${stateInfo.join('\n')}\n\n⚠️ CONTINUE FROM WHERE YOU LEFT OFF - DO NOT ASK FOR INFORMATION ALREADY COLLECTED!`;
      }
    }

    const aiResponse = await aiManager.generateResponse({
      userMessage: message,
      conversationHistory,
      language: language || 'en',
      context: locationContext + conversationStateContext,
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

    // Check if handoff needed (Requirement 44.1) - REMOVED
    // This was causing contradictory responses after AI already responded
    // Handoff detection is now handled earlier in the process

  } catch (error: any) {
    console.error('AI processing error:', error);
    
    socket.emit(SOCKET_EVENTS.CHAT_ERROR, {
      errorCode: 'AI_ERROR',
      errorMessage: 'I\'m having trouble responding right now. Please try again or talk to a human agent.',
    } as ChatErrorPayload);
  }
}

export { processMessageQueue };
