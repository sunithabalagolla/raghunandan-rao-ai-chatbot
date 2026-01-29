import { createServer } from 'http';
import createApp from './app';
import config from './shared/config/env.config';
import { connectDatabase } from './shared/config/database';
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/errorHandler.middleware';
import { initializeSocketServer, setIO } from './socket/socketServer';
import { registerChatHandlers } from './socket/handlers/chatHandler';
import { registerHandoffHandlers } from './socket/handlers/handoffHandler';
import { registerAgentHandlers } from './socket/handlers/agentHandler';
import redisService from './services/redis.service';
import ticketManager from './services/ticketManager.service';

/**
 * Server Entry Point
 * Initializes database, Redis, starts Express server with Socket.io, and handles process events
 */

// Handle uncaught exceptions (must be at the top)
process.on('uncaughtException', handleUncaughtException);

// Start server
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting PPC Authentication & Chatbot Server...\n');

    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    try {
      await redisService.connect();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️  Redis connection failed - running without Redis features');
      console.warn('   Queue management and rate limiting will be degraded');
    }

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocketServer(httpServer);
    setIO(io);

    // Initialize ticket manager service
    ticketManager.initialize(io);

    // Register socket event handlers for each connection
    io.on('connection', (socket: any) => {
      console.log('🔧 Registering chat handlers for new connection');
      registerChatHandlers(io, socket);
      registerHandoffHandlers(io, socket);
      registerAgentHandlers(io, socket);
    });

    console.log('✅ Socket.io initialized with chat, handoff, and agent handlers');
    console.log('✅ Ticket Manager service initialized');

    // Start listening
    const server = httpServer.listen(config.port, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 Server running on: http://localhost:${config.port}`);
      console.log(`🏥 Health check: http://localhost:${config.port}/health`);
      console.log(`🔐 Auth API: http://localhost:${config.port}/api/auth`);
      console.log(`👤 Admin API: http://localhost:${config.port}/api/admin`);
      console.log(`💬 Socket.io: Real-time chat enabled`);
      console.log(`🔴 Redis: ${redisService.isReady() ? 'Connected' : 'Disconnected'}`);
      console.log('\n📝 Server is ready to accept requests\n');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      handleUnhandledRejection(reason, promise);
      // Gracefully shutdown
      server.close(() => {
        console.log('🛑 Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM signal received');
      console.log('🛑 Closing server gracefully...');

      server.close(async () => {
        console.log('✅ Server closed');
        
        // Close Redis connection
        try {
          await redisService.disconnect();
          console.log('✅ Redis connection closed');
        } catch (error) {
          console.error('⚠️  Error closing Redis:', error);
        }
        
        console.log('🔌 Closing database connection...');

        // Close database connection
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('✅ Database connection closed');
          console.log('👋 Process terminated gracefully');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('\n⚠️  SIGINT signal received (Ctrl+C)');
      console.log('🛑 Closing server gracefully...');

      server.close(async () => {
        console.log('✅ Server closed');
        
        // Close Redis connection
        try {
          await redisService.disconnect();
          console.log('✅ Redis connection closed');
        } catch (error) {
          console.error('⚠️  Error closing Redis:', error);
        }
        
        console.log('🔌 Closing database connection...');

        // Close database connection
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('✅ Database connection closed');
          console.log('👋 Process terminated gracefully');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
