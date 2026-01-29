import redisService from './redis.service';

/**
 * Message Queue Item
 */
export interface QueueMessage {
  id: string;
  userId: string;
  sessionId: string;
  message: string;
  timestamp: Date;
  language?: string;
  metadata?: Record<string, any>;
}

/**
 * Queue Service
 * Implements FIFO queue using Redis lists for message processing
 * Handles concurrent AI request processing with queue size limits
 */
class QueueService {
  private readonly queueKey = 'chat:queue';
  private readonly maxQueueSize = 1000; // Requirement 29.10

  /**
   * Enqueue a message to the queue
   * @param message - Message to add to queue
   * @returns Queue position (1-based index)
   */
  async enqueue(message: QueueMessage): Promise<number> {
    try {
      // Check queue size before adding
      const currentSize = await this.getQueueSize();
      
      if (currentSize >= this.maxQueueSize) {
        throw new Error(`Queue is full. Maximum size: ${this.maxQueueSize}`);
      }

      const client = redisService.getClient();
      const messageJson = JSON.stringify(message);
      
      // RPUSH adds to the end of the list (FIFO)
      const queueLength = await client.rpush(this.queueKey, messageJson);
      
      console.log(`✅ Message enqueued: ${message.id} (position: ${queueLength})`);
      
      return queueLength;
    } catch (error) {
      console.error('❌ Error enqueueing message:', error);
      throw error;
    }
  }

  /**
   * Dequeue a message from the queue (FIFO)
   * @returns Message or null if queue is empty
   */
  async dequeue(): Promise<QueueMessage | null> {
    try {
      const client = redisService.getClient();
      
      // LPOP removes from the beginning of the list (FIFO)
      const messageJson = await client.lpop(this.queueKey);
      
      if (!messageJson) {
        return null;
      }

      const message = JSON.parse(messageJson) as QueueMessage;
      
      console.log(`✅ Message dequeued: ${message.id}`);
      
      return message;
    } catch (error) {
      console.error('❌ Error dequeuing message:', error);
      throw error;
    }
  }

  /**
   * Peek at the next message without removing it
   * @returns Message or null if queue is empty
   */
  async peek(): Promise<QueueMessage | null> {
    try {
      const client = redisService.getClient();
      
      // LINDEX 0 gets the first element without removing it
      const messageJson = await client.lindex(this.queueKey, 0);
      
      if (!messageJson) {
        return null;
      }

      return JSON.parse(messageJson) as QueueMessage;
    } catch (error) {
      console.error('❌ Error peeking at queue:', error);
      throw error;
    }
  }

  /**
   * Get current queue size
   * @returns Number of messages in queue
   */
  async getQueueSize(): Promise<number> {
    try {
      const client = redisService.getClient();
      return await client.llen(this.queueKey);
    } catch (error) {
      console.error('❌ Error getting queue size:', error);
      throw error;
    }
  }

  /**
   * Check if queue is empty
   */
  async isEmpty(): Promise<boolean> {
    const size = await this.getQueueSize();
    return size === 0;
  }

  /**
   * Check if queue is full
   */
  async isFull(): Promise<boolean> {
    const size = await this.getQueueSize();
    return size >= this.maxQueueSize;
  }

  /**
   * Get all messages in queue (without removing them)
   * @param start - Start index (default: 0)
   * @param end - End index (default: -1 for all)
   * @returns Array of messages
   */
  async getAll(start: number = 0, end: number = -1): Promise<QueueMessage[]> {
    try {
      const client = redisService.getClient();
      
      // LRANGE gets elements from start to end
      const messagesJson = await client.lrange(this.queueKey, start, end);
      
      return messagesJson.map(json => JSON.parse(json) as QueueMessage);
    } catch (error) {
      console.error('❌ Error getting all messages:', error);
      throw error;
    }
  }

  /**
   * Clear all messages from queue
   * @returns Number of messages removed
   */
  async clear(): Promise<number> {
    try {
      const size = await this.getQueueSize();
      
      if (size === 0) {
        return 0;
      }

      const client = redisService.getClient();
      await client.del(this.queueKey);
      
      console.log(`✅ Queue cleared: ${size} messages removed`);
      
      return size;
    } catch (error) {
      console.error('❌ Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Remove a specific message from queue by ID
   * @param messageId - ID of message to remove
   * @returns True if message was removed, false if not found
   */
  async removeById(messageId: string): Promise<boolean> {
    try {
      const client = redisService.getClient();
      
      // Get all messages
      const messages = await this.getAll();
      
      // Find the message
      const messageToRemove = messages.find(m => m.id === messageId);
      
      if (!messageToRemove) {
        return false;
      }

      // Remove the message (LREM removes count occurrences of value)
      const messageJson = JSON.stringify(messageToRemove);
      const removed = await client.lrem(this.queueKey, 1, messageJson);
      
      if (removed > 0) {
        console.log(`✅ Message removed from queue: ${messageId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error removing message by ID:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    size: number;
    maxSize: number;
    isEmpty: boolean;
    isFull: boolean;
    utilizationPercent: number;
  }> {
    const size = await this.getQueueSize();
    const isEmpty = size === 0;
    const isFull = size >= this.maxQueueSize;
    const utilizationPercent = (size / this.maxQueueSize) * 100;

    return {
      size,
      maxSize: this.maxQueueSize,
      isEmpty,
      isFull,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    };
  }

  /**
   * Process messages in queue with a handler function
   * @param handler - Function to process each message
   * @param batchSize - Number of messages to process at once (default: 1)
   */
  async processQueue(
    handler: (message: QueueMessage) => Promise<void>,
    batchSize: number = 1
  ): Promise<number> {
    let processedCount = 0;

    try {
      while (processedCount < batchSize) {
        const message = await this.dequeue();
        
        if (!message) {
          break; // Queue is empty
        }

        try {
          await handler(message);
          processedCount++;
        } catch (error) {
          console.error(`❌ Error processing message ${message.id}:`, error);
          // Re-enqueue failed message at the end
          await this.enqueue(message);
          throw error;
        }
      }

      return processedCount;
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
export default queueService;
