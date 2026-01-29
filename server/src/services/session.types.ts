/**
 * Shared types for session and context services
 */

export interface Message {
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  language: string;
  messages: Message[];
  metadata: any;
  createdAt: Date;
  lastActivity: Date;
}
