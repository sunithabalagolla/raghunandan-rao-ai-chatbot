/**
 * Redis Services Test Script
 * Tests Redis connection, queue service, and rate limiting service
 */

import redisService from './src/services/redis.service';
import queueService, { QueueMessage } from './src/services/queue.service';
import rateLimitService from './src/services/rateLimit.service';

async function testRedisConnection() {
  console.log('\n🧪 Testing Redis Connection...');
  try {
    await redisService.connect();
    const pong = await redisService.ping();
    console.log('✅ Redis connection successful:', pong);
    
    // Test basic operations
    await redisService.set('test:key', 'test-value', 60);
    const value = await redisService.get('test:key');
    console.log('✅ Redis SET/GET works:', value === 'test-value');
    
    await redisService.delete('test:key');
    const deleted = await redisService.get('test:key');
    console.log('✅ Redis DELETE works:', deleted === null);
    
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}

async function testQueueService() {
  console.log('\n🧪 Testing Queue Service...');
  try {
    // Clear queue first
    await queueService.clear();
    
    // Test enqueue
    const message1: QueueMessage = {
      id: 'msg-1',
      userId: 'user-123',
      sessionId: 'session-abc',
      message: 'Hello, chatbot!',
      timestamp: new Date(),
      language: 'en',
    };
    
    const message2: QueueMessage = {
      id: 'msg-2',
      userId: 'user-456',
      sessionId: 'session-def',
      message: 'How can I track my RTI?',
      timestamp: new Date(),
      language: 'en',
    };
    
    await queueService.enqueue(message1);
    await queueService.enqueue(message2);
    console.log('✅ Messages enqueued');
    
    // Test queue size
    const size = await queueService.getQueueSize();
    console.log('✅ Queue size:', size === 2);
    
    // Test peek
    const peeked = await queueService.peek();
    console.log('✅ Peek works:', peeked?.id === 'msg-1');
    
    // Test dequeue (FIFO)
    const dequeued1 = await queueService.dequeue();
    console.log('✅ Dequeue FIFO works:', dequeued1?.id === 'msg-1');
    
    const dequeued2 = await queueService.dequeue();
    console.log('✅ Second dequeue works:', dequeued2?.id === 'msg-2');
    
    // Test empty queue
    const isEmpty = await queueService.isEmpty();
    console.log('✅ Queue is empty:', isEmpty);
    
    // Test queue stats
    await queueService.enqueue(message1);
    const stats = await queueService.getStats();
    console.log('✅ Queue stats:', stats);
    
    // Clean up
    await queueService.clear();
    
    return true;
  } catch (error) {
    console.error('❌ Queue service test failed:', error);
    return false;
  }
}

async function testRateLimitService() {
  console.log('\n🧪 Testing Rate Limit Service...');
  try {
    const testUserId = 'test-user-123';
    
    // Reset rate limit first
    await rateLimitService.reset(testUserId);
    
    // Test first request (should be allowed)
    const result1 = await rateLimitService.checkRateLimit(testUserId);
    console.log('✅ First request allowed:', result1.allowed);
    console.log('   Remaining:', result1.remaining);
    
    // Test multiple requests
    for (let i = 0; i < 5; i++) {
      await rateLimitService.increment(testUserId);
    }
    
    const status = await rateLimitService.getStatus(testUserId);
    console.log('✅ Rate limit status:', status);
    
    // Test rate limit config
    const config = rateLimitService.getConfig();
    console.log('✅ Rate limit config:', config);
    
    // Test bypass functionality
    await rateLimitService.addBypass(testUserId);
    const shouldBypass = await rateLimitService.shouldBypassRateLimit(testUserId);
    console.log('✅ Bypass works:', shouldBypass);
    
    await rateLimitService.removeBypass(testUserId);
    const shouldNotBypass = await rateLimitService.shouldBypassRateLimit(testUserId);
    console.log('✅ Remove bypass works:', !shouldNotBypass);
    
    // Clean up
    await rateLimitService.reset(testUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Rate limit service test failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Redis Services Tests...\n');
  
  try {
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      console.error('\n❌ Redis connection failed. Make sure Redis is running.');
      console.error('   Start Redis: redis-server');
      process.exit(1);
    }
    
    const queueOk = await testQueueService();
    const rateLimitOk = await testRateLimitService();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log('='.repeat(50));
    console.log(`Redis Connection: ${redisOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Queue Service:    ${queueOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Rate Limiting:    ${rateLimitOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(50));
    
    if (redisOk && queueOk && rateLimitOk) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  } finally {
    // Disconnect from Redis
    await redisService.disconnect();
    console.log('\n👋 Tests completed. Redis disconnected.');
    process.exit(0);
  }
}

// Run tests
runTests();
