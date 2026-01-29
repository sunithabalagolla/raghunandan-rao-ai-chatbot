import mongoose from 'mongoose';
import config from '../src/shared/config/env.config';

/**
 * Fix Agent Profile
 * Manually add the agentProfile field to the user document
 */

async function fixAgentProfile() {
  try {
    console.log('🔧 Fixing Agent Profile...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    const agentId = '69706139ce2238752fd047d5';

    // Use direct MongoDB update to add the agentProfile field
    console.log('📝 Adding agentProfile field to user document...');
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection not available');
    }
    
    const collection = mongoose.connection.db.collection('users');
    const updateResult = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(agentId) },
      {
        $set: {
          agentProfile: {
            department: 'RTI',
            skills: ['technical', 'billing'],
            maxConcurrentChats: 3,
            performanceMetrics: {
              totalChatsHandled: 0,
              avgResponseTime: 0,
              avgRating: 0,
            },
            preferences: {
              browserNotifications: true,
              soundAlerts: true,
            },
          }
        }
      }
    );

    console.log('Update result:', updateResult);

    // Verify the update
    console.log('\n📋 Verifying update...');
    const updatedUser = await collection.findOne({ _id: new mongoose.Types.ObjectId(agentId) });
    console.log('Updated user agentProfile:', JSON.stringify(updatedUser?.agentProfile, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixAgentProfile();