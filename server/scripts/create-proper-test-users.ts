import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import * as passwordService from '../src/auth/services/password.service';
import config from '../src/shared/config/env.config';

/**
 * Create proper test users with correct roles
 */
async function createProperTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Hash password for both users
    const passwordHash = await passwordService.hashPassword('password@123');

    // 1. Create Agent User
    const agentUser = {
      email: 'agent@test.com',
      firstName: 'Test',
      lastName: 'Agent',
      phoneNumber: '+1234567890',
      passwordHash,
      authProvider: 'email' as const,
      role: 'agent' as const,
      agentStatus: 'available' as const,
      preferredLanguage: 'en' as const,
      agentProfile: {
        department: 'Legal' as const,
        skills: ['General Support', 'Technical Issues'],
        languages: ['en', 'hi'],
        maxConcurrentChats: 5,
        activeChats: 0,
        status: 'available' as const,
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
    };

    // 2. Create Supervisor User  
    const supervisorUser = {
      email: 'supervisor@test.com',
      firstName: 'Test',
      lastName: 'Supervisor',
      phoneNumber: '+1234567891',
      passwordHash,
      authProvider: 'email' as const,
      role: 'supervisor' as const,
      agentStatus: 'available' as const,
      preferredLanguage: 'en' as const,
      agentProfile: {
        department: 'Legal' as const,
        skills: ['Team Management', 'Performance Analysis'],
        languages: ['en', 'hi'],
        maxConcurrentChats: 10,
        activeChats: 0,
        status: 'available' as const,
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
    };

    // Delete existing test users if they exist
    await User.deleteMany({ 
      email: { $in: ['agent@test.com', 'supervisor@test.com'] } 
    });
    console.log('🗑️ Deleted existing test users');

    // Create new users
    const createdAgent = await User.create(agentUser);
    const createdSupervisor = await User.create(supervisorUser);

    console.log('✅ Created test users:');
    console.log('👤 Agent User:');
    console.log('   Email:', createdAgent.email);
    console.log('   Role:', createdAgent.role);
    console.log('   ID:', createdAgent._id);
    
    console.log('👤 Supervisor User:');
    console.log('   Email:', createdSupervisor.email);
    console.log('   Role:', createdSupervisor.role);
    console.log('   ID:', createdSupervisor._id);

    console.log('\n🔑 Login Credentials:');
    console.log('Agent Login: agent@test.com / password@123');
    console.log('Supervisor Login: supervisor@test.com / password@123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createProperTestUsers();