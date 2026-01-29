import redisService from './redis.service';

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until rate limit resets
}

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Rate Limiting Service
 * Implements sliding window rate limiting with Redis
 * Tracks per-user rate limits (10/minute, 100/hour)
 */
class RateLimitService {
  // Rate limit configurations (Requirements 30.2, 30.3)
  private readonly minuteLimit: RateLimitConfig = {
    maxRequests: parseInt(process.env.RATE_LIMIT_MINUTE || '10', 10),
    windowSeconds: 60,
  };

  private readonly hourLimit: RateLimitConfig = {
    maxRequests: parseInt(process.env.RATE_LIMIT_HOUR || '100', 10),
    windowSeconds: 3600,
  };

  /**
   * Generate Redis key for rate limiting
   */
  private getKey(userId: string, window: 'minute' | 'hour'): string {
    return `ratelimit:${userId}:${window}`;
  }

  /**
   * Check if user has exceeded rate limit using sliding window algorithm
   * @param userId - User ID to check
   * @returns Rate limit result
   */
  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    try {
      // Check both minute and hour limits
      const minuteResult = await this.checkWindow(userId, 'minute', this.minuteLimit);
      
      if (!minuteResult.allowed) {
        return minuteResult;
      }

      const hourResult = await this.checkWindow(userId, 'hour', this.hourLimit);
      
      return hourResult;
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: 0,
        resetTime: Math.floor(Date.now() / 1000) + 60,
      };
    }
  }

  /**
   * Check rate limit for a specific time window using sliding window algorithm
   */
  private async checkWindow(
    userId: string,
    window: 'minute' | 'hour',
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.getKey(userId, window);
    const client = redisService.getClient();
    const now = Date.now();
    const windowStart = now - (config.windowSeconds * 1000);

    try {
      // Use Redis sorted set for sliding window
      // Score is timestamp, member is unique request ID
      
      // Remove old entries outside the window
      await client.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const currentCount = await client.zcard(key);

      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        // Get the oldest request timestamp to calculate reset time
        const oldestRequests = await client.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldestRequests.length > 1 
          ? parseInt(oldestRequests[1], 10) 
          : now;
        
        const resetTime = Math.floor((oldestTimestamp + (config.windowSeconds * 1000)) / 1000);
        const retryAfter = Math.max(0, resetTime - Math.floor(now / 1000));

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }

      // Add current request to the window
      const requestId = `${now}-${Math.random()}`;
      await client.zadd(key, now, requestId);

      // Set expiration on the key (cleanup)
      await client.expire(key, config.windowSeconds);

      const remaining = config.maxRequests - currentCount - 1;
      const resetTime = Math.floor((now + (config.windowSeconds * 1000)) / 1000);

      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error(`❌ Error checking ${window} window:`, error);
      throw error;
    }
  }

  /**
   * Increment rate limit counter for a user
   * @param userId - User ID
   * @returns Rate limit result after increment
   */
  async increment(userId: string): Promise<RateLimitResult> {
    return await this.checkRateLimit(userId);
  }

  /**
   * Reset rate limit for a user (admin function)
   * @param userId - User ID to reset
   */
  async reset(userId: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const minuteKey = this.getKey(userId, 'minute');
      const hourKey = this.getKey(userId, 'hour');

      await client.del(minuteKey, hourKey);
      
      console.log(`✅ Rate limit reset for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error resetting rate limit:', error);
      throw error;
    }
  }

  /**
   * Get current rate limit status for a user
   * @param userId - User ID
   * @returns Current status for both windows
   */
  async getStatus(userId: string): Promise<{
    minute: { count: number; limit: number; remaining: number };
    hour: { count: number; limit: number; remaining: number };
  }> {
    try {
      const client = redisService.getClient();
      const now = Date.now();

      // Get minute window count
      const minuteKey = this.getKey(userId, 'minute');
      const minuteWindowStart = now - (this.minuteLimit.windowSeconds * 1000);
      await client.zremrangebyscore(minuteKey, 0, minuteWindowStart);
      const minuteCount = await client.zcard(minuteKey);

      // Get hour window count
      const hourKey = this.getKey(userId, 'hour');
      const hourWindowStart = now - (this.hourLimit.windowSeconds * 1000);
      await client.zremrangebyscore(hourKey, 0, hourWindowStart);
      const hourCount = await client.zcard(hourKey);

      return {
        minute: {
          count: minuteCount,
          limit: this.minuteLimit.maxRequests,
          remaining: Math.max(0, this.minuteLimit.maxRequests - minuteCount),
        },
        hour: {
          count: hourCount,
          limit: this.hourLimit.maxRequests,
          remaining: Math.max(0, this.hourLimit.maxRequests - hourCount),
        },
      };
    } catch (error) {
      console.error('❌ Error getting rate limit status:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently rate limited
   * @param userId - User ID
   * @returns True if rate limited, false otherwise
   */
  async isRateLimited(userId: string): Promise<boolean> {
    const result = await this.checkRateLimit(userId);
    return !result.allowed;
  }

  /**
   * Log rate limit violation for security monitoring (Requirement 30.8)
   * @param userId - User ID
   * @param window - Time window that was exceeded
   */
  async logViolation(userId: string, window: 'minute' | 'hour'): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logKey = `ratelimit:violations:${userId}`;
      const client = redisService.getClient();

      const violation = JSON.stringify({
        userId,
        window,
        timestamp,
      });

      // Store violations in a list
      await client.rpush(logKey, violation);
      
      // Keep only last 100 violations per user
      await client.ltrim(logKey, -100, -1);
      
      // Set expiration (7 days)
      await client.expire(logKey, 7 * 24 * 3600);

      console.warn(`⚠️  Rate limit violation: User ${userId} exceeded ${window} limit`);
    } catch (error) {
      console.error('❌ Error logging rate limit violation:', error);
      // Don't throw - logging failures shouldn't break rate limiting
    }
  }

  /**
   * Get rate limit violations for a user
   * @param userId - User ID
   * @returns Array of violations
   */
  async getViolations(userId: string): Promise<Array<{
    userId: string;
    window: string;
    timestamp: string;
  }>> {
    try {
      const logKey = `ratelimit:violations:${userId}`;
      const client = redisService.getClient();

      const violations = await client.lrange(logKey, 0, -1);
      
      return violations.map(v => JSON.parse(v));
    } catch (error) {
      console.error('❌ Error getting violations:', error);
      return [];
    }
  }

  /**
   * Check if user is an admin and should bypass rate limits (Requirement 30.7)
   * @param userId - User ID
   * @returns True if user should bypass rate limits
   */
  async shouldBypassRateLimit(userId: string): Promise<boolean> {
    try {
      // Check if user is in bypass list
      const bypassKey = 'ratelimit:bypass';
      const client = redisService.getClient();
      
      const isBypassed = await client.sismember(bypassKey, userId);
      
      return isBypassed === 1;
    } catch (error) {
      console.error('❌ Error checking bypass status:', error);
      return false;
    }
  }

  /**
   * Add user to rate limit bypass list (admin function)
   * @param userId - User ID to bypass
   */
  async addBypass(userId: string): Promise<void> {
    try {
      const bypassKey = 'ratelimit:bypass';
      const client = redisService.getClient();
      
      await client.sadd(bypassKey, userId);
      
      console.log(`✅ User ${userId} added to rate limit bypass list`);
    } catch (error) {
      console.error('❌ Error adding bypass:', error);
      throw error;
    }
  }

  /**
   * Remove user from rate limit bypass list
   * @param userId - User ID to remove
   */
  async removeBypass(userId: string): Promise<void> {
    try {
      const bypassKey = 'ratelimit:bypass';
      const client = redisService.getClient();
      
      await client.srem(bypassKey, userId);
      
      console.log(`✅ User ${userId} removed from rate limit bypass list`);
    } catch (error) {
      console.error('❌ Error removing bypass:', error);
      throw error;
    }
  }

  /**
   * Get rate limit configuration
   */
  getConfig(): {
    minute: RateLimitConfig;
    hour: RateLimitConfig;
  } {
    return {
      minute: this.minuteLimit,
      hour: this.hourLimit,
    };
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
export default rateLimitService;
