import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

const createTestAgent = async (): Promise<void> => {
  try {
    console.log('🔍 Checking for existing test agent...');
    
    // Check if agent already exists
    const existingAgent = await User.findOne({ email: 'agent@test.com' });
    if (existingAgent) {
      console.log('✅ Test agent user already exists');
      console.log('   Email: agent@test.com');
      console.log('   Password: password123');
      console.log('   Role:', existingAgent.role);
      return;
    }

    console.log('🔧 Creating test agent user...');
    
    // Create agent user (password will be hashed by the model pre-save hook)
    const agentUser = new User({
      email: 'agent@test.com',
      passwordHash: 'password123', // Will be hashed by pre-save hook
      firstName: 'Test',
      lastName: 'Agent',
      authProvider: 'email',
      role: 'agent',
      agentStatus: 'available',
      agentProfile: {
        department: 'Customer Support',
        skills: ['Customer Support', 'Problem Solving', 'Communication'],
        maxConcurrentChats: 5,
        performanceMetrics: {
          totalChatsHandled: 0,
          avgResponseTime: 0,
          avgRating: 0,
        },
        preferences: {
          browserNotifications: true,
          soundAlerts: true,
        }
      }
    });

    await agentUser.save();
    console.log('✅ Test agent user created successfully!');
    console.log('   Email: agent@test.com');
    console.log('   Password: password123');
    console.log('   Role: agent');

  } catch (error) {
    console.error('❌ Error creating test agent user:', error);
  }
};

const main = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    await createTestAgent();

  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

main();