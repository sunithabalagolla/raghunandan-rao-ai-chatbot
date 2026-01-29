import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

const convertAgentToSupervisor = async (): Promise<void> => {
  try {
    console.log('🔍 Finding agent user...');
    
    // Find the agent user
    const agent = await User.findOne({ email: 'agent@test.com' });
    if (!agent) {
      console.log('❌ Agent user not found');
      return;
    }

    console.log('✅ Found agent:', agent.firstName, agent.lastName);
    console.log('📋 Current role:', agent.role);

    // Update role to supervisor
    await User.findByIdAndUpdate(agent._id, {
      $set: {
        role: 'supervisor'
      }
    });

    console.log('✅ Agent converted to supervisor successfully!');
    console.log('   Email: agent@test.com');
    console.log('   Password: password123');
    console.log('   New Role: supervisor');

  } catch (error) {
    console.error('❌ Error converting agent to supervisor:', error);
  }
};

const main = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    await convertAgentToSupervisor();

  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

main();