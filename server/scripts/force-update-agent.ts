import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

/**
 * Force Update Agent Profile Script
 * 
 * This script forcefully updates an agent's profile regardless of current state
 * 
 * Usage: npm run force-update-agent agent@test.com
 */

const forceUpdateAgent = async (email: string): Promise<void> => {
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
    console.log(`📊 Current agent status: ${user.agentStatus}`);
    console.log(`🏢 Current department: ${user.agentProfile?.department || 'Not set'}`);
    
    console.log(`\n🔄 Force updating agent profile...`);
    
    // Force update user to agent with complete profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        role: 'agent',
        agentStatus: 'available',
        agentProfile: {
          department: 'Legal',
          skills: ['Customer Support', 'Problem Solving', 'Technical Support'],
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
    
    console.log(`\n🎉 SUCCESS! Agent profile updated:`);
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`🏷️  Role: ${updatedUser.role}`);
    console.log(`📊 Status: ${updatedUser.agentStatus}`);
    console.log(`🏢 Department: ${updatedUser.agentProfile?.department}`);
    console.log(`🛠️  Skills: ${updatedUser.agentProfile?.skills?.join(', ')}`);
    console.log(`💬 Max Chats: ${updatedUser.agentProfile?.maxConcurrentChats}`);
    console.log(`🔔 Browser Notifications: ${updatedUser.agentProfile?.preferences?.browserNotifications}`);
    console.log(`🔊 Sound Alerts: ${updatedUser.agentProfile?.preferences?.soundAlerts}`);
    
    console.log(`\n✅ Next Steps:`);
    console.log(`1. Login again to get new JWT token with 'agent' role and department`);
    console.log(`2. Use new token to test agent API endpoints`);
    console.log(`3. Test GET /api/agent/profile endpoint`);
    
  } catch (error) {
    console.error('❌ Error updating agent profile:', error);
    console.error('Full error:', error);
  }
};

const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Force Agent Profile Update Script...\n');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide email as argument');
      console.log('Usage: npm run force-update-agent agent@test.com');
      process.exit(1);
    }
    
    // Force update agent profile
    await forceUpdateAgent(email);
    
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