import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';
import bcrypt from 'bcrypt';

const setUserPassword = async (email: string, password: string): Promise<void> => {
  try {
    console.log(`🔍 Setting password for user: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update the user's password (need to use direct update since passwordHash has select: false)
    const updateResult = await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash } }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.error('❌ Failed to update user password');
      return;
    }
    
    console.log('✅ Password set successfully!');
    console.log('Email:', user.email);
    console.log('Update result:', updateResult);
    
    // Verify the password by finding the user with password included
    const userWithPassword = await User.findById(user._id).select('+passwordHash');
    
    if (!userWithPassword?.passwordHash) {
      console.error('❌ Password hash is still missing after update');
      return;
    }
    
    console.log('Has Password Hash:', !!userWithPassword.passwordHash);
    
    // Test the password
    const isValid = await bcrypt.compare(password, userWithPassword.passwordHash);
    console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error setting password:', error);
  }
};

const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Set User Password Script...\n');
    
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');
    
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('❌ Please provide email and password as arguments');
      console.log('Usage: npm run set-password agent@test.com password123');
      process.exit(1);
    }
    
    await setUserPassword(email, password);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('👋 Script completed');
    process.exit(0);
  }
};

main();