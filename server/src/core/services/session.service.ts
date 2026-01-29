import redisService from "../../services/redis.service";
import type { Message, SessionData } from "../../services/session.types";

export type { Message, SessionData };

/**
 * Session Service
 * Manages user chat sessions in Redis with 30-minute TTL
 * Implements Requirements 17.1, 17.2, 33.5
 */
export class SessionService {
  private readonly SESSION_TTL = 1800; // 30 minutes in seconds (Requirement 17.1, 33.5)

  /**
   * Generate Redis key for session
   * Format: session:{userId}:{sessionId}
   */
  private getSessionKey(userId: string, sessionId: string): string {
    return `session:${userId}:${sessionId}`;
  }

  /**
   * Create new session in Redis
   * Stores session data with user ID, session ID, language, and empty message history
   * TTL: 30 minutes (Requirement 17.1, 33.5)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @param language - User's preferred language (default: 'en')
   * @returns Created session data
   */
  async createSession(userId: string, sessionId: string, language: string = 'en'): Promise<SessionData> {
    const sessionData: SessionData = {
      userId,
      sessionId,
      language,
      messages: [],
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    };

    const key = this.getSessionKey(userId, sessionId);
    await redisService.set(key, JSON.stringify(sessionData), this.SESSION_TTL);
    
    console.log(`✅ Session created: ${sessionId} (TTL: ${this.SESSION_TTL}s)`);
    return sessionData;
  }

  /**
   * Get session from Redis
   * Returns null if session doesn't exist or has expired
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Session data or null
   */
  async getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    const key = this.getSessionKey(userId, sessionId);
    const jsonString = await redisService.get(key);
    
    if (!jsonString) {
      console.log(`⚠️  Session not found: ${sessionId}`);
      return null;
    }
    
    const session = JSON.parse(jsonString);
    
    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt);
    session.lastActivity = new Date(session.lastActivity);
    session.messages = session.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    return session;
  }

  /**
   * Update session context in Redis
   * Automatically extends TTL to 30 minutes on update (Requirement 17.1)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @param data - Partial session data to update
   * @returns Updated session data
   */
  async updateSession(userId: string, sessionId: string, data: Partial<SessionData>): Promise<SessionData> {
    const existingSession = await this.getSession(userId, sessionId);
    if (!existingSession) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updatedSession: SessionData = {
      ...existingSession,
      ...data,
      lastActivity: new Date()
    };

    const key = this.getSessionKey(userId, sessionId);
    await redisService.set(key, JSON.stringify(updatedSession), this.SESSION_TTL);
    
    console.log(`✅ Session updated: ${sessionId}`);
    return updatedSession;
  }

  /**
   * Delete session from Redis
   * Used when user explicitly ends session or on disconnect
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const key = this.getSessionKey(userId, sessionId);
    await redisService.delete(key);
    console.log(`✅ Session deleted: ${sessionId}`);
  }

  /**
   * Extend session TTL to 30 minutes
   * Called on user activity to keep session alive (Requirement 17.1)
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns True if session was extended, false if session doesn't exist
   */
  async extendSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      console.log(`⚠️  Cannot extend non-existent session: ${sessionId}`);
      return false;
    }

    const key = this.getSessionKey(userId, sessionId);
    await redisService.expire(key, this.SESSION_TTL);
    
    console.log(`⏰ Session TTL extended: ${sessionId} (${this.SESSION_TTL}s)`);
    return true;
  }

  /**
   * Get session TTL (time to live) in seconds
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns Remaining TTL in seconds, or -1 if session doesn't exist
   */
  async getSessionTTL(userId: string, sessionId: string): Promise<number> {
    const key = this.getSessionKey(userId, sessionId);
    return await redisService.ttl(key);
  }

  /**
   * Check if session exists
   * 
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @returns True if session exists, false otherwise
   */
  async sessionExists(userId: string, sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(userId, sessionId);
    return await redisService.exists(key);
  }
}

export const sessionService = new SessionService();
export default sessionService;
