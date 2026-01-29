/**
 * Agent Dashboard Types
 * TypeScript interfaces for agent-specific functionality
 */

export interface CannedResponse {
  _id: string;
  title: string;
  content: string;
  category: 'Greeting' | 'Legal' | 'RTI' | 'Emergency' | 'Closing' | 'General';
  language: 'en' | 'te' | 'hi';
  isShared: boolean;
  createdBy: string;
  createdByName?: string;
  usageCount: number;
  lastUsedAt?: Date;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCannedResponseData {
  title: string;
  content: string;
  category: 'Greeting' | 'Legal' | 'RTI' | 'Emergency' | 'Closing' | 'General';
  language: 'en' | 'te' | 'hi';
  isShared: boolean;
  tags: string[];
}

export interface AgentSession {
  _id: string;
  agentId: string;
  agentName?: string;
  sessionStart: Date;
  sessionEnd?: Date;
  status: 'active' | 'break' | 'ended';
  totalChatsHandled: number;
  totalResponseTime: number;
  averageResponseTime: number;
  customerSatisfactionRatings: number[];
  averageRating: number;
  ticketsResolved: number;
  ticketsTransferred: number;
  breakDuration: number;
  activeDuration: number;
  peakConcurrentChats: number;
  slaViolations: number;
  emergencyTicketsHandled: number;
  templatesUsed: number;
  sessionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPerformanceMetrics {
  totalSessions: number;
  totalChatsHandled: number;
  averageResponseTime: number;
  averageRating: number;
  totalTicketsResolved: number;
  totalTicketsTransferred: number;
  totalActiveDuration: number;
  totalBreakDuration: number;
  slaCompliance: number;
  emergencyTicketsHandled: number;
  templatesUsed: number;
  peakConcurrentChats: number;
}

export interface AgentDashboardStats {
  currentSession?: AgentSession;
  todayStats: AgentPerformanceMetrics;
  weekStats: AgentPerformanceMetrics;
  monthStats: AgentPerformanceMetrics;
  recentSessions: AgentSession[];
}

export interface TemplateSearchFilters {
  category?: 'Greeting' | 'Legal' | 'RTI' | 'Emergency' | 'Closing' | 'General';
  language?: 'en' | 'te' | 'hi';
  isShared?: boolean;
  tags?: string[];
  searchText?: string;
}

export interface TemplateUsageStats {
  templateId: string;
  title: string;
  usageCount: number;
  lastUsedAt?: Date;
  category: string;
  language: string;
}