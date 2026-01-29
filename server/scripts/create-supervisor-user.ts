import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../src/shared/config/env.config';
import User from '../src/shared/models/User.model';

async function createSupervisorUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Check if supervisor already exists
    const existingSupervisor = await User.findOne({ email: 'supervisor@test.com' });
    if (existingSupervisor) {
      console.log('✅ Supervisor user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create supervisor user
    const supervisorUser = new User({
      email: 'supervisor@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Supervisor',
      role: 'supervisor',
      isEmailVerified: true,
      agentProfile: {
        status: 'available',
        skills: ['management', 'oversight'],
        departments: ['all'],
        languages: ['en'],
        maxConcurrentChats: 10,
        preferences: {
          notifications: {
            sound: true,
            desktop: true,
            email: true
          }
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
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createSupervisorUser();