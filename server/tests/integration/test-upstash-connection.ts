/**
 * Simple Upstash Redis Connection Test
 */

import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testUpstashConnection() {
  console.log('🔄 Testing Upstash Redis Connection...\n');
  
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('📍 Redis URL:', redisUrl.replace(/:[^:]*@/, ':****@')); // Hide password
  
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true, // Don't connect immediately
    });
    
    // Try to connect
    await client.connect();
    
    console.log('✅ Connected to Upstash Redis!');
    
    // Test ping
    const pong = await client.ping();
    console.log('✅ Ping successful:', pong);
    
    // Test set/get
    await client.set('test-key', 'Hello Upstash!');
    console.log('✅ Set test key');
    
    const value = await client.get('test-key');
    console.log('✅ Get test key:', value);
    
    // Clean up
    await client.del('test-key');
    console.log('✅ Deleted test key');
    
    await client.quit();
    console.log('✅ Disconnected');
    
    console.log('\n🎉 All tests passed!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testUpstashConnection();
