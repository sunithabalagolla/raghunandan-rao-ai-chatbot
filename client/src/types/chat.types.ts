/**
 * Chat Types
 * TypeScript interfaces for chat functionality
 */

export interface Message {
  _id: string;
  role: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface HandoffTicket {
  _id: string;
  userId: string;
  conversationId: string;
  status: 'waiting' | 'assigned' | 'resolved' | 'cancelled';
  priority: number;
  reason: string;
  conversationContext: Message[];
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
}

export interface AIResponse {
  content: string;
  confidence: number;
  shouldHandoff: boolean;
}

export interface QueueStatus {
  ticketId: string;
  status: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  createdAt: Date;
}

export interface ChatState {
  currentConversationId: string | null;
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  handoffStatus: 'none' | 'requested' | 'assigned' | 'resolved';
  queuePosition: number | null;
  agentName: string | null;
}
