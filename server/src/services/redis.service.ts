import Redis, { Redis as RedisClient } from 'ioredis';

/**
 * Redis Service
 * Manages Redis connection with error handling and reconnection logic
 * Provides basic Redis operations (get, set, delete)
 */
class RedisService {
  private client: RedisClient | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 3000; // 3 seconds

  /**
   * Initialize Redis client with connection management
   */
  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      console.log('🔄 Connecting to Redis...');
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
          if (times > this.maxReconnectAttempts) {
            console.error('❌ Redis: Max reconnection attempts reached');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 1000, this.reconnectDelay);
          console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${times}/${this.maxReconnectAttempts})`);
          return delay;
        },
      });

      // Connection event handlers
      this.client.on('connect', () => {
        console.log('🔗 Redis: Connection established');
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Client ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        console.log(`🔄 Redis: Reconnecting... (attempt ${this.reconnectAttempts})`);
      });

      this.client.on('end', () => {
        console.log('🛑 Redis: Connection ended');
        this.isConnected = false;
      });

      // Wait for connection to be ready
      await this.waitForConnection();
      
    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error);
      throw error;
    }
  }

  /**
   * Wait for Redis connection to be ready
   */
  private async waitForConnection(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.isConnected && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isConnected) {
      throw new Error('Redis connection timeout');
    }
  }

  /**
   * Get Redis client instance
   * Throws error if not connected
   */
  getClient(): RedisClient {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient();
      return await client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Set value in Redis with optional expiration
   * @param key - Redis key
   * @param value - Value to store
   * @param expirySeconds - Optional expiration time in seconds
   */
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    try {
      const client = this.getClient();
      
      if (expirySeconds) {
        await client.setex(key, expirySeconds, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      console.error(`Redis SET error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete key from Redis
   */
  async delete(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.del(key);
    } catch (error) {
      console.error(`Redis DELETE error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete multiple keys from Redis
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      const client = this.getClient();
      return await client.del(...keys);
    } catch (error) {
      console.error(`Redis DELETE MANY error:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Increment value by 1
   */
  async increment(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Decrement value by 1
   */
  async decrement(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.decr(key);
    } catch (error) {
      console.error(`Redis DECR error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('✅ Redis: Disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error);
      throw error;
    }
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<string> {
    try {
      const client = this.getClient();
      return await client.ping();
    } catch (error) {
      console.error('Redis PING error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;
