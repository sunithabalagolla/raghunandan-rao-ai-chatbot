import mongoose from 'mongoose';
import config from '../src/shared/config/env.config';
import User from '../src/shared/models/User.model';

/**
 * Initialize Agent Profile
 * Properly initialize the agentProfile object for our test agent
 */

async function initializeAgentProfile() {
  try {
    console.log('🔧 Initializing Agent Profile...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    const agentId = '69706139ce2238752fd047d5';

    // Initialize the agent profile with default values
    console.log('📝 Initializing agentProfile object...');
    const updateResult = await User.findByIdAndUpdate(agentId, {
      $set: {
        agentStatus: 'available',
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
    }, { new: true, upsert: false });

    if (updateResult) {
      console.log('✅ Agent profile initialized successfully!');
      console.log('📋 Agent Profile:', JSON.stringify(updateResult.agentProfile, null, 2));
      console.log('📊 Agent Status:', updateResult.agentStatus);
    } else {
      console.log('❌ Failed to initialize agent profile');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

initializeAgentProfile();