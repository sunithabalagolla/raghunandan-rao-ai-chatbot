import sessionService from '../core/services/session.service';
import type { Message } from './session.types';

/**
 * Context Service
 * Manages conversation context tracking for AI responses
 * Implements Requirements 17.2, 17.4, 17.5, 33.1, 33.9
 */
export class ContextService {
  private readonly MAX_MESSAGES = 10; // Store last 10 messages (Requirement 17.2, 33.1)
  private readonly MAX_TOKENS = 2000; // Limit context to 2000 tokens (Requirement 33.9)
  private readonly AVG_TOKENS_PER_CHAR = 0.25; // Rough estimate: 1 token ≈ 4 characters

  /**
   * Add message to conversation context
   * Automatically maintains last 10 messages (Requirement 17.2, 33.1)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @param role - Message role (user, bot, system)
   * @param content - Message content
   * @param metadata - Optional metadata
   */
  async addMessage(
    userId: string,
    sessionId: string,
    role: 'user' | 'bot' | 'system',
    content: string,
    metadata?: any
  ): Promise<void> {
    try {
      const session = await sessionService.getSession(userId, sessionId);
      
      if (!session) {
        console.warn(`⚠️  Session not found when adding message: ${sessionId}`);
        return;
      }

      const newMessage: Message = {
        role,
        content,
        timestamp: new Date(),
        metadata
      };

      // Add message to history
      session.messages.push(newMessage);

      // Keep only last 10 messages (Requirement 17.2, 33.1)
      if (session.messages.length > this.MAX_MESSAGES) {
        session.messages = session.messages.slice(-this.MAX_MESSAGES);
        console.log(`📝 Context trimmed to last ${this.MAX_MESSAGES} messages`);
      }

      // Update session with new messages
      await sessionService.updateSession(userId, sessionId, {
        messages: session.messages
      });

      console.log(`💾 Message added to context: ${role} (${content.length} chars)`);
    } catch (error) {
      console.error('Error adding message to context:', error);
      throw error;
    }
  }

  /**
   * Get conversation context (last 10 messages)
   * Returns messages in chronological order (Requirement 17.2)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Array of messages
   */
  async getContext(userId: string, sessionId: string): Promise<Message[]> {
    try {
      const session = await sessionService.getSession(userId, sessionId);
      
      if (!session) {
        console.log(`⚠️  No session found for context: ${sessionId}`);
        return [];
      }

      return session.messages || [];
    } catch (error) {
      console.error('Error getting context:', error);
      return [];
    }
  }

  /**
   * Get context with token limit
   * Prioritizes recent messages and limits to 2000 tokens (Requirement 33.9, 33.10)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Array of messages within token limit
   */
  async getContextWithTokenLimit(userId: string, sessionId: string): Promise<Message[]> {
    try {
      const allMessages = await this.getContext(userId, sessionId);
      
      if (allMessages.length === 0) {
        return [];
      }

      // Start from most recent and work backwards (Requirement 33.10)
      const limitedMessages: Message[] = [];
      let totalTokens = 0;

      for (let i = allMessages.length - 1; i >= 0; i--) {
        const message = allMessages[i];
        const estimatedTokens = this.estimateTokens(message.content);

        // Check if adding this message would exceed token limit
        if (totalTokens + estimatedTokens > this.MAX_TOKENS) {
          console.log(`⚠️  Token limit reached: ${totalTokens} tokens (max: ${this.MAX_TOKENS})`);
          break;
        }

        limitedMessages.unshift(message); // Add to beginning to maintain chronological order
        totalTokens += estimatedTokens;
      }

      console.log(`📚 Context retrieved: ${limitedMessages.length} messages (~${totalTokens} tokens)`);
      return limitedMessages;
    } catch (error) {
      console.error('Error getting context with token limit:', error);
      return [];
    }
  }

  /**
   * Clear conversation context
   * Used when user explicitly starts a new topic (Requirement 17.5, 33.7)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   */
  async clearContext(userId: string, sessionId: string): Promise<void> {
    try {
      await sessionService.updateSession(userId, sessionId, {
        messages: []
      });

      console.log(`🗑️  Context cleared for session: ${sessionId}`);
    } catch (error) {
      console.error('Error clearing context:', error);
      throw error;
    }
  }

  /**
   * Get context summary for category switching
   * Maintains context across category switches (Requirement 17.4, 33.8)
   * Returns a condensed version of recent context
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Context summary string
   */
  async getContextSummary(userId: string, sessionId: string): Promise<string> {
    try {
      const messages = await this.getContextWithTokenLimit(userId, sessionId);
      
      if (messages.length === 0) {
        return '';
      }

      // Get last 5 messages for summary
      const recentMessages = messages.slice(-5);
      
      const summary = recentMessages
        .map(msg => {
          const roleLabel = msg.role === 'user' ? 'User' : msg.role === 'bot' ? 'Assistant' : 'System';
          return `${roleLabel}: ${msg.content}`;
        })
        .join('\n');

      return summary;
    } catch (error) {
      console.error('Error getting context summary:', error);
      return '';
    }
  }

  /**
   * Update session language
   * Maintains context when language changes (Requirement 33.8)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @param language - New language code
   */
  async updateLanguage(userId: string, sessionId: string, language: string): Promise<void> {
    try {
      await sessionService.updateSession(userId, sessionId, {
        language
      });

      console.log(`🌐 Language updated for session ${sessionId}: ${language}`);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }

  /**
   * Get conversation metadata
   * Returns useful information about the conversation state
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Metadata object
   */
  async getConversationMetadata(userId: string, sessionId: string): Promise<{
    messageCount: number;
    estimatedTokens: number;
    language: string;
    lastActivity: Date | null;
  }> {
    try {
      const session = await sessionService.getSession(userId, sessionId);
      
      if (!session) {
        return {
          messageCount: 0,
          estimatedTokens: 0,
          language: 'en',
          lastActivity: null
        };
      }

      const messages = session.messages || [];
      const totalContent = messages.map((m: Message) => m.content).join(' ');
      const estimatedTokens = this.estimateTokens(totalContent);

      return {
        messageCount: messages.length,
        estimatedTokens,
        language: session.language,
        lastActivity: session.lastActivity
      };
    } catch (error) {
      console.error('Error getting conversation metadata:', error);
      return {
        messageCount: 0,
        estimatedTokens: 0,
        language: 'en',
        lastActivity: null
      };
    }
  }

  /**
   * Estimate token count for text
   * Uses rough approximation: 1 token ≈ 4 characters
   * 
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length * this.AVG_TOKENS_PER_CHAR);
  }

  /**
   * Check if context should be cleared based on topic change
   * Detects explicit topic change keywords (Requirement 33.7)
   * 
   * @param message - User message
   * @returns True if context should be cleared
   */
  shouldClearContext(message: string): boolean {
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
}

export const contextService = new ContextService();
export default contextService;
