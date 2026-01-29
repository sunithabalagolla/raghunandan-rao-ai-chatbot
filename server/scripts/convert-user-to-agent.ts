import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

/**
 * Convert User to Agent Script
 * 
 * This script converts a regular user to an agent by:
 * 1. Updating their role from 'user' to 'agent'
 * 2. Setting agentStatus to 'available'
 * 3. Adding complete agentProfile with default values
 * 
 * Usage: npm run convert-agent
 * Then enter the email when prompted
 */

const convertUserToAgent = async (email: string): Promise<void> => {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📋 Current role: ${user.role}`);
    
    // Check if already an agent
    if (user.role === 'agent' && user.agentProfile && user.agentProfile.department) {
      console.log(`ℹ️  User is already an agent with complete profile!`);
      return;
    }
    
    if (user.role === 'agent') {
      console.log(`⚠️  User is an agent but missing profile. Updating profile...`);
    }
    
    // Update user to agent
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        role: 'agent',
        agentStatus: 'available',
        agentProfile: {
          department: 'Legal', // Default department
          skills: ['Customer Support', 'Problem Solving'], // Default skills
          maxConcurrentChats: 5,
          performanceMetrics: {
            totalChatsHandled: 0,
            avgResponseTime: 0,
            avgRating: 0,
          },
          preferences: {
            browserNotifications: true,
            soundAlerts: true,
          },
        },
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error(`❌ Failed to update user`);
      return;
    }
    
    console.log(`\n🎉 SUCCESS! User converted to agent:`);
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`🏷️  Role: ${updatedUser.role}`);
    console.log(`📊 Status: ${updatedUser.agentStatus}`);
    console.log(`🏢 Department: ${updatedUser.agentProfile?.department}`);
    console.log(`🛠️  Skills: ${updatedUser.agentProfile?.skills?.join(', ')}`);
    console.log(`💬 Max Chats: ${updatedUser.agentProfile?.maxConcurrentChats}`);
    
    console.log(`\n✅ Next Steps:`);
    console.log(`1. Login again to get new JWT token with 'agent' role`);
    console.log(`2. Use new token to test agent API endpoints`);
    console.log(`3. Test GET /api/agent/profile endpoint`);
    
  } catch (error) {
    console.error('❌ Error converting user to agent:', error);
  }
};

const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting User to Agent Conversion Script...\n');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get email from command line argument or prompt
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide email as argument');
      console.log('Usage: npm run convert-agent agent@test.com');
      process.exit(1);
    }
    
    // Convert user to agent
    await convertUserToAgent(email);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('👋 Script completed');
    process.exit(0);
  }
};

// Run the script
main();