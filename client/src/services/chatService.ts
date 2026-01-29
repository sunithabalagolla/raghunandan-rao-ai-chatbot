import axios from 'axios';
import type { Conversation, HandoffTicket, QueueStatus } from '../types/chat.types';
import { getAccessToken } from '../utils/storage';

/**
 * Chat API Service
 * Handles HTTP requests for chat functionality
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Conversation API
 */
export const conversationAPI = {
  /**
   * Get all conversations
   */
  async getConversations(status?: 'active' | 'archived'): Promise<Conversation[]> {
    const params = status ? { status } : {};
    const response = await api.get('/conversations', { params });
    return response.data.data;
  },

  /**
   * Create new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    const response = await api.post('/conversations', { title });
    return response.data.data;
  },

  /**
   * Get conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get(`/conversations/${id}`);
    return response.data.data;
  },

  /**
   * Update conversation title
   */
  async updateTitle(id: string, title: string): Promise<Conversation> {
    const response = await api.put(`/conversations/${id}/title`, { title });
    return response.data.data;
  },

  /**
   * Archive conversation
   */
  async archiveConversation(id: string): Promise<Conversation> {
    const response = await api.patch(`/conversations/${id}/archive`);
    return response.data.data;
  },

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    const response = await api.get('/conversations/search', { params: { q: query } });
    return response.data.data;
  },
};

/**
 * Handoff API
 */
export const handoffAPI = {
  /**
   * Request handoff to human agent
   */
  async requestHandoff(conversationId: string, reason: string, priority?: number): Promise<HandoffTicket> {
    const response = await api.post('/handoff/request', {
      conversationId,
      reason,
      priority,
    });
    return response.data.data;
  },

  /**
   * Get queue status
   */
  async getQueueStatus(conversationId?: string): Promise<QueueStatus> {
    const params = conversationId ? { conversationId } : {};
    const response = await api.get('/handoff/queue-status', { params });
    return response.data.data;
  },

  /**
   * Cancel handoff request
   */
  async cancelHandoff(ticketId: string): Promise<HandoffTicket> {
    const response = await api.post(`/handoff/${ticketId}/cancel`);
    return response.data.data;
  },

  /**
   * Get handoff history
   */
  async getHandoffHistory(): Promise<HandoffTicket[]> {
    const response = await api.get('/handoff/history');
    return response.data.data;
  },
};

export default {
  conversation: conversationAPI,
  handoff: handoffAPI,
};
