import { Socket } from 'socket.io';

/**
 * Socket.io Event Definitions and Types
 * Defines all socket events and their payload types for type-safe communication
 * Based on Requirement 28: Socket.io Event Specifications
 */

// ============================================
// Event Names (Constants)
// ============================================

export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Chat events (Requirement 28.1)
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
  AGENT_CONNECT: 'agent:connect',
  AGENT_ACCEPT_CHAT: 'agent:acceptChat',
  AGENT_SEND_MESSAGE: 'agent:sendMessage',
  AGENT_CLOSE_CHAT: 'agent:closeChat',
  AGENT_NEW_CHAT_IN_QUEUE: 'agent:newChatInQueue',
  AGENT_CHAT_ASSIGNED: 'agent:chatAssigned',
  AGENT_JOINED: 'agent:joined',
  
  // Agent Dashboard events (Task 9)
  AGENT_DASHBOARD_CONNECT: 'agent:dashboardConnect',
  AGENT_STATUS_UPDATE: 'agent:statusUpdate',
  AGENT_STATUS_BROADCAST: 'agent:statusBroadcast',
  AGENT_JOIN_POOL: 'agent:joinPool',
  AGENT_LEAVE_POOL: 'agent:leavePool',
  AGENT_POOL_UPDATE: 'agent:poolUpdate',
  AGENT_DISCONNECT: 'agent:disconnect',
  AGENT_RECONNECT: 'agent:reconnect',
  AGENT_HEARTBEAT: 'agent:heartbeat',
  AGENT_WORKLOAD_UPDATE: 'agent:workloadUpdate',
  AGENT_CAPACITY_UPDATE: 'agent:capacityUpdate',
  
  // Ticket Management events (Task 10)
  TICKET_CREATED: 'ticket:created',
  TICKET_ASSIGNED: 'ticket:assigned',
  TICKET_UNASSIGNED: 'ticket:unassigned',
  TICKET_RESOLVED: 'ticket:resolved',
  TICKET_CANCELLED: 'ticket:cancelled',
  TICKET_PRIORITY_CHANGED: 'ticket:priorityChanged',
  TICKET_ESCALATED: 'ticket:escalated',
  TICKET_TRANSFERRED: 'ticket:transferred',
  TICKET_QUEUE_UPDATE: 'ticket:queueUpdate',
  TICKET_SLA_WARNING: 'ticket:slaWarning',
  TICKET_SLA_BREACH: 'ticket:slaBreach',
  
  // Handoff events
  CHAT_REQUEST_AGENT: 'chat:requestAgent',
  HANDOFF_QUEUED: 'handoff:queued',
  HANDOFF_RESOLVED: 'handoff:resolved',
  
  // Feedback events (Task 22)
  FEEDBACK_REQUEST: 'feedback:request',
  
  // Rate limit events
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const;

// ============================================
// Socket Data Interface
// ============================================

/**
 * Extended Socket with user data
 * Attached after authentication
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;
  email?: string;
  sessionId?: string;
  language?: 'en' | 'te' | 'hi';
  // Agent-specific properties (Task 9)
  role?: 'user' | 'agent' | 'supervisor' | 'admin';
  agentId?: string;
  department?: string;
  skills?: string[];
  maxConcurrentChats?: number;
  currentChats?: number;
  agentStatus?: 'available' | 'busy' | 'away' | 'offline';
  lastHeartbeat?: Date;
}

// ============================================
// Payload Types
// ============================================

/**
 * Chat Connect Payload
 * Sent when client connects to chatbot
 */
export interface ChatConnectPayload {
  userId: string;
  sessionId: string;
  language?: 'en' | 'te' | 'hi';
}

/**
 * Chat Message Payload
 * User sends message to chatbot
 */
export interface ChatMessagePayload {
  message: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  language?: string;
}

/**
 * Chat Response Payload
 * Bot sends response to user
 */
export interface ChatResponsePayload {
  message: string;
  model: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
}

/**
 * Chat Typing Payload
 * Show typing indicator
 */
export interface ChatTypingPayload {
  isTyping: boolean;
  sender: 'bot' | 'agent' | 'user';
}

/**
 * Chat Stream Payload
 * Stream AI response word-by-word
 */
export interface ChatStreamPayload {
  chunk: string;
  isComplete: boolean;
}

/**
 * Chat Error Payload
 * Error occurred during chat
 */
export interface ChatErrorPayload {
  errorMessage: string;
  errorCode: string;
  timestamp?: Date;
}

/**
 * Status Update Payload
 * Real-time status change (RTI, case, petition)
 */
export interface StatusUpdatePayload {
  type: 'rti' | 'case' | 'petition' | 'application';
  id: string;
  newStatus: string;
  message: string;
  timestamp?: Date;
}

/**
 * Notification Push Payload
 * Push notification to user
 */
export interface NotificationPushPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp?: Date;
}

/**
 * Chat Disconnect Payload
 * Client disconnects from chatbot
 */
export interface ChatDisconnectPayload {
  userId: string;
  sessionId: string;
  timestamp?: Date;
}

/**
 * Agent Connect Payload
 * Agent connects and marks as available
 */
export interface AgentConnectPayload {
  agentId: string;
  status: 'available' | 'busy' | 'away';
}

/**
 * Agent Dashboard Connect Payload
 * Agent connects to dashboard interface
 */
export interface AgentDashboardConnectPayload {
  agentId: string;
  department?: string;
  skills?: string[];
  maxConcurrentChats?: number;
}

/**
 * Agent Status Update Payload
 * Agent updates their availability status
 */
export interface AgentStatusUpdatePayload {
  agentId: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  reason?: string;
  timestamp?: Date;
}

/**
 * Agent Status Broadcast Payload
 * Broadcast agent status changes to other agents/supervisors
 */
export interface AgentStatusBroadcastPayload {
  agentId: string;
  agentName?: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  department?: string;
  timestamp: Date;
}

/**
 * Agent Join Pool Payload
 * Agent joins availability pool
 */
export interface AgentJoinPoolPayload {
  agentId: string;
  department: string;
  skills: string[];
  languages: string[];
}

/**
 * Agent Leave Pool Payload
 * Agent leaves availability pool
 */
export interface AgentLeavePoolPayload {
  agentId: string;
  reason?: string;
}

/**
 * Agent Pool Update Payload
 * Update agent pool membership
 */
export interface AgentPoolUpdatePayload {
  poolType: 'available' | 'busy' | 'department';
  agentId: string;
  action: 'join' | 'leave';
  metadata?: any;
}

/**
 * Agent Disconnect Payload
 * Agent disconnects with grace period
 */
export interface AgentDisconnectPayload {
  agentId: string;
  gracePeriod?: number; // seconds
  reason?: string;
}

/**
 * Agent Reconnect Payload
 * Agent reconnects and restores state
 */
export interface AgentReconnectPayload {
  agentId: string;
  lastDisconnect?: Date;
  restoreState?: boolean;
}

/**
 * Agent Heartbeat Payload
 * Keep-alive for connection monitoring
 */
export interface AgentHeartbeatPayload {
  agentId: string;
  timestamp: Date;
  activeChats?: number;
}

/**
 * Agent Workload Update Payload
 * Update agent's current workload
 */
export interface AgentWorkloadUpdatePayload {
  agentId: string;
  activeChats: number;
  maxChats: number;
  queuedTickets?: number;
}

/**
 * Agent Capacity Update Payload
 * Update agent's capacity status
 */
export interface AgentCapacityUpdatePayload {
  agentId: string;
  capacity: 'full' | 'available' | 'limited';
  availableSlots: number;
  maxSlots: number;
}

// ============================================
// Ticket Management Payload Types (Task 10)
// ============================================

/**
 * Ticket Created Payload
 * New ticket created and added to queue
 */
export interface TicketCreatedPayload {
  ticketId: string;
  userId: string;
  conversationId: string;
  priority: number;
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  reason: string;
  department?: string;
  language?: string;
  estimatedWaitTime: number;
  queuePosition: number;
  createdAt: Date;
}

/**
 * Ticket Assigned Payload
 * Ticket assigned to an agent
 */
export interface TicketAssignedPayload {
  ticketId: string;
  agentId: string;
  agentName?: string;
  userId: string;
  assignmentMethod: 'manual' | 'auto' | 'emergency';
  assignedAt: Date;
  slaDeadline: Date;
}

/**
 * Ticket Unassigned Payload
 * Ticket unassigned from agent (returned to queue)
 */
export interface TicketUnassignedPayload {
  ticketId: string;
  previousAgentId: string;
  userId: string;
  reason: string;
  returnedToQueue: boolean;
  newQueuePosition?: number;
}

/**
 * Ticket Resolved Payload
 * Ticket resolved by agent
 */
export interface TicketResolvedPayload {
  ticketId: string;
  agentId: string;
  userId: string;
  resolutionNotes?: string;
  resolvedAt: Date;
  resolutionTime: number; // milliseconds
  feedbackRequested: boolean;
}

/**
 * Ticket Cancelled Payload
 * Ticket cancelled (user left, etc.)
 */
export interface TicketCancelledPayload {
  ticketId: string;
  userId: string;
  reason: string;
  cancelledAt: Date;
}

/**
 * Ticket Priority Changed Payload
 * Ticket priority updated
 */
export interface TicketPriorityChangedPayload {
  ticketId: string;
  previousPriority: number;
  newPriority: number;
  previousPriorityLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  newPriorityLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  reason: string;
  changedBy: string; // agentId or 'system'
}

/**
 * Ticket Escalated Payload
 * Ticket escalated to supervisor
 */
export interface TicketEscalatedPayload {
  ticketId: string;
  userId: string;
  escalationLevel: number;
  reason: string;
  escalatedBy?: string; // agentId or 'system'
  escalatedAt: Date;
  supervisorNotified: boolean;
}

/**
 * Ticket Transferred Payload
 * Ticket transferred between agents
 */
export interface TicketTransferredPayload {
  ticketId: string;
  fromAgentId: string;
  toAgentId: string;
  userId: string;
  reason: string;
  transferredAt: Date;
  contextPreserved: boolean;
}

/**
 * Ticket Queue Update Payload
 * Queue statistics and updates
 */
export interface TicketQueueUpdatePayload {
  totalTickets: number;
  waitingTickets: number;
  assignedTickets: number;
  averageWaitTime: number;
  longestWaitTime: number;
  queueByPriority: {
    emergency: number;
    high: number;
    medium: number;
    low: number;
  };
  queueByDepartment?: { [department: string]: number };
}

/**
 * Ticket SLA Warning Payload
 * SLA deadline approaching
 */
export interface TicketSLAWarningPayload {
  ticketId: string;
  agentId?: string;
  userId: string;
  warningType: 'response' | 'resolution';
  deadline: Date;
  timeRemaining: number; // milliseconds
  warningLevel: 'yellow' | 'orange' | 'red';
}

/**
 * Ticket SLA Breach Payload
 * SLA deadline exceeded
 */
export interface TicketSLABreachPayload {
  ticketId: string;
  agentId?: string;
  userId: string;
  breachType: 'response' | 'resolution';
  deadline: Date;
  breachTime: number; // milliseconds overdue
  escalationTriggered: boolean;
  supervisorNotified: boolean;
}

/**
 * Agent Accept Chat Payload
 * Agent accepts a chat from queue
 */
export interface AgentAcceptChatPayload {
  agentId: string;
  chatId: string;
}

/**
 * Agent Send Message Payload
 * Agent sends message to user
 */
export interface AgentSendMessagePayload {
  agentId: string;
  chatId: string;
  message: string;
  timestamp?: Date;
}

/**
 * Agent Close Chat Payload
 * Agent closes/resolves chat
 */
export interface AgentCloseChatPayload {
  agentId: string;
  chatId: string;
  resolution: string;
  timestamp?: Date;
}

/**
 * Agent New Chat In Queue Payload
 * Notify agents of new chat in queue
 */
export interface AgentNewChatInQueuePayload {
  chatId: string;
  userId: string;
  waitTime: number;
  language: string;
  preview: string;
  priority?: number;
}

/**
 * Agent Chat Assigned Payload
 * Chat assigned to agent
 */
export interface AgentChatAssignedPayload {
  chatId: string;
  conversationHistory: Array<{
    role: 'user' | 'bot' | 'agent';
    content: string;
    timestamp: Date;
  }>;
  userInfo: {
    userId: string;
    name?: string;
    email?: string;
    language?: string;
  };
}

/**
 * Agent Joined Payload
 * Agent joined conversation
 */
export interface AgentJoinedPayload {
  agentName: string;
  agentId: string;
  message: string;
}

/**
 * Request Agent Payload
 * User requests human agent
 */
export interface RequestAgentPayload {
  userId: string;
  sessionId: string;
  reason: string;
  timestamp?: Date;
}

/**
 * Handoff Queued Payload
 * User added to agent queue
 */
export interface HandoffQueuedPayload {
  ticketId: string;
  position: number;
  estimatedWaitMinutes: number;
}

/**
 * Handoff Resolved Payload
 * Agent conversation ended
 */
export interface HandoffResolvedPayload {
  ticketId: string;
  message: string;
  timestamp?: Date;
}

/**
 * Feedback Request Payload
 * Automatic feedback request sent to customer after ticket resolution
 */
export interface FeedbackRequestPayload {
  ticketId: string;
  feedbackUrl: string;
  message: string;
}

/**
 * Rate Limit Exceeded Payload
 * User exceeded rate limit
 */
export interface RateLimitExceededPayload {
  errorCode: 'rate_limit_exceeded';
  errorMessage: string;
  retryAfter: number; // seconds
  limit: {
    minute: number;
    hour: number;
  };
}

// ============================================
// Event Handler Types
// ============================================

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (socket: AuthenticatedSocket, data: T) => Promise<void> | void;

/**
 * Event handlers map
 */
export interface EventHandlers {
  [SOCKET_EVENTS.CHAT_CONNECT]?: EventHandler<ChatConnectPayload>;
  [SOCKET_EVENTS.CHAT_MESSAGE]?: EventHandler<ChatMessagePayload>;
  [SOCKET_EVENTS.CHAT_TYPING]?: EventHandler<ChatTypingPayload>;
  [SOCKET_EVENTS.CHAT_REQUEST_AGENT]?: EventHandler<RequestAgentPayload>;
  [SOCKET_EVENTS.CHAT_DISCONNECT]?: EventHandler<ChatDisconnectPayload>;
  [SOCKET_EVENTS.AGENT_CONNECT]?: EventHandler<AgentConnectPayload>;
  [SOCKET_EVENTS.AGENT_ACCEPT_CHAT]?: EventHandler<AgentAcceptChatPayload>;
  [SOCKET_EVENTS.AGENT_SEND_MESSAGE]?: EventHandler<AgentSendMessagePayload>;
  [SOCKET_EVENTS.AGENT_CLOSE_CHAT]?: EventHandler<AgentCloseChatPayload>;
  // New agent dashboard events (Task 9)
  [SOCKET_EVENTS.AGENT_DASHBOARD_CONNECT]?: EventHandler<AgentDashboardConnectPayload>;
  [SOCKET_EVENTS.AGENT_STATUS_UPDATE]?: EventHandler<AgentStatusUpdatePayload>;
  [SOCKET_EVENTS.AGENT_JOIN_POOL]?: EventHandler<AgentJoinPoolPayload>;
  [SOCKET_EVENTS.AGENT_LEAVE_POOL]?: EventHandler<AgentLeavePoolPayload>;
  [SOCKET_EVENTS.AGENT_DISCONNECT]?: EventHandler<AgentDisconnectPayload>;
  [SOCKET_EVENTS.AGENT_RECONNECT]?: EventHandler<AgentReconnectPayload>;
  [SOCKET_EVENTS.AGENT_HEARTBEAT]?: EventHandler<AgentHeartbeatPayload>;
  [SOCKET_EVENTS.AGENT_WORKLOAD_UPDATE]?: EventHandler<AgentWorkloadUpdatePayload>;
  [SOCKET_EVENTS.AGENT_CAPACITY_UPDATE]?: EventHandler<AgentCapacityUpdatePayload>;
  // Ticket management events (Task 10) - these are broadcast events, no handlers needed
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a typed event emitter
 */
export function emitEvent<T>(
  socket: AuthenticatedSocket,
  event: string,
  data: T
): void {
  socket.emit(event, data);
}

/**
 * Create a typed event listener
 */
export function onEvent<T>(
  socket: AuthenticatedSocket,
  event: string,
  handler: (data: T) => void | Promise<void>
): void {
  socket.on(event, handler);
}

/**
 * Validate event payload
 */
export function validatePayload<T>(
  data: any,
  requiredFields: (keyof T)[]
): data is T {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => field in data);
}
