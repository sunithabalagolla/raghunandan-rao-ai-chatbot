import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

const createSupervisor = async (): Promise<void> => {
  try {
    console.log('🔍 Checking for existing supervisor...');
    
    // Check if supervisor already exists
    const existingSupervisor = await User.findOne({ email: 'supervisor@test.com' });
    if (existingSupervisor) {
      console.log('✅ Supervisor user already exists');
      console.log('   Email: supervisor@test.com');
      console.log('   Role:', existingSupervisor.role);
      return;
    }

    console.log('🔧 Creating supervisor user...');
    
    // Create supervisor user (password will be hashed by the model pre-save hook)
    const supervisorUser = new User({
      email: 'supervisor@test.com',
      passwordHash: 'password123', // Will be hashed by pre-save hook
      firstName: 'Test',
      lastName: 'Supervisor',
      authProvider: 'email',
      role: 'supervisor',
      agentStatus: 'available',
      agentProfile: {
        department: 'Legal',
        skills: ['management', 'oversight'],
        maxConcurrentChats: 10,
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

    await supervisorUser.save();
    console.log('✅ Supervisor user created successfully!');
    console.log('   Email: supervisor@test.com');
    console.log('   Password: password123');
    console.log('   Role: supervisor');

  } catch (error) {
    console.error('❌ Error creating supervisor user:', error);
  }
};

const main = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    await createSupervisor();

  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

main();