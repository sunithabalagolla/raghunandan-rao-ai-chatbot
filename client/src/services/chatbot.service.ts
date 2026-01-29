/**
 * Chatbot API Service
 * Handles communication with AI chatbot backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SendMessageRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
  sessionId?: string;
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    message: string;
    model: string;
    timestamp: string;
  };
  message?: string;
  error?: string;
}

interface ChatbotStatusResponse {
  success: boolean;
  data?: {
    aiServiceAvailable: boolean;
    knowledgeBaseCategories: string[];
    status: string;
  };
}

class ChatbotService {
  /**
   * Send message to AI chatbot
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userId?: string,
    sessionId?: string
  ): Promise<SendMessageResponse> {
    try {
      // Generate session ID if not provided
      const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-6), // Last 3 exchanges
          userId: currentUserId,
          sessionId: currentSessionId,
        } as SendMessageRequest),
      });

      const data: SendMessageResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Chatbot API error:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to chatbot service',
      };
    }
  }

  /**
   * Get chatbot status
   */
  async getStatus(): Promise<ChatbotStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/status`);
      const data: ChatbotStatusResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to get chatbot status');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Status check error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/chatbot/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to search knowledge base');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Knowledge search error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export default new ChatbotService();
