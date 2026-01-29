import mongoose from 'mongoose';
import config from './env.config';

let retryCount = 0;

/**
 * Connect to MongoDB with retry logic
 */
const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4
    };

    console.log(`🔄 Connecting to MongoDB... (Attempt ${retryCount + 1}/${config.dbMaxRetries})`);

    await mongoose.connect(config.mongodbUri, options);

    // Reset retry count on successful connection
    retryCount = 0;

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      retryCount = 0; // Reset retry count on reconnection
    });

  } catch (error) {
    retryCount++;

    console.error(`❌ MongoDB connection failed (Attempt ${retryCount}/${config.dbMaxRetries}):`, error);

    // Check if max retries reached
    if (retryCount >= config.dbMaxRetries) {
      console.error('');
      console.error('💥 FATAL ERROR: Maximum database connection retries reached!');
      console.error('Please check:');
      console.error('  1. MongoDB is running');
      console.error('  2. MONGODB_URI in .env is correct');
      console.error('  3. Network connectivity');
      console.error('  4. Database credentials (if using authentication)');
      console.error('');
      console.error('Exiting application...');
      process.exit(1); // Exit with error code
    }

    // Retry connection with exponential backoff
    const retryDelay = Math.min(5000 * retryCount, 30000); // Max 30 seconds
    console.log(`⏳ Retrying connection in ${retryDelay / 1000} seconds...`);
    
    setTimeout(connectDatabase, retryDelay);
  }
};

/**
 * Disconnect from MongoDB gracefully
 */
const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * Check if database is connected
 */
const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export { connectDatabase, disconnectDatabase, isDatabaseConnected };
