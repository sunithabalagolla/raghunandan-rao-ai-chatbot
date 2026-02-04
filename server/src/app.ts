import express, { Application } from 'express';
import cors from 'cors';
import config from './shared/config/env.config';
import authRoutes from './auth/routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import agentRoutes from './routes/agent.routes';
console.log('🚨🚨🚨 AGENT ROUTES IMPORTED:', typeof agentRoutes);
import supervisorRoutes from './routes/supervisor.routes';
console.log('🚨🚨🚨 SUPERVISOR ROUTES IMPORTED:', typeof supervisorRoutes);
import emergencyRoutes from './routes/emergency.routes';
import conversationRoutes from './routes/conversation.routes';
import handoffRoutes from './routes/handoff.routes';
import locationRoutes from './routes/location.routes';
import chatbotRoutes from './core/routes/chatbot.routes';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

/**
 * Express App Configuration
 * Configures middleware, routes, and error handling
 */

const createApp = (): Application => {
  console.log('🚨🚨🚨 CREATING APP - UPDATED VERSION 🚨🚨🚨');
  const app = express();

  // ============================================
  // Middleware Configuration
  // ============================================

  // CORS - Allow cross-origin requests
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim());
        
        // Allow file:// protocol for testing
        if (origin.startsWith('file://')) {
          return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

  // Rate limiting - Apply to all routes
  app.use(rateLimitMiddleware);

  // Request logging (development only)
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`📨 ${req.method} ${req.url}`);
      next();
    });
  }

  // ============================================
  // Health Check Endpoint
  // ============================================
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // ============================================
  // API Routes
  // ============================================
  
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes mounted at /api/admin');
  app.use('/api/supervisor', supervisorRoutes);
  console.log('✅ Supervisor routes mounted at /api/supervisor');
  app.use('/api/emergency', emergencyRoutes);
  console.log('✅ Emergency routes mounted at /api/emergency');
  // Direct feedback routes - Task 22
  app.post('/api/agent/tickets/:id/feedback', async (req, res) => {
    try {
      const { id: ticketId } = req.params;
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const HandoffTicket = require('./shared/models/HandoffTicket.model').default;
      const ticket: any = await HandoffTicket.findById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      if (ticket.status !== 'resolved') {
        return res.status(400).json({
          success: false,
          message: 'Feedback can only be submitted for resolved tickets',
        });
      }

      await HandoffTicket.findByIdAndUpdate(ticketId, {
        $set: {
          userFeedback: { rating, comment: comment || '' },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: { ticketId, rating, comment: comment || '' },
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
      });
    }
  });

  app.get('/api/agent/feedback/stats', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'No authorization token provided',
        });
      }

      const tokenService = require('./auth/services/token.service');
      const token = tokenService.extractTokenFromHeader(authHeader);
      const payload = await tokenService.validateAndCheckToken(token);
      
      if (!payload) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const User = require('./shared/models/User.model').default;
      const agent = await User.findById(payload.userId);
      
      if (!agent || agent.role !== 'agent') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Agent role required.',
        });
      }

      const HandoffTicket = require('./shared/models/HandoffTicket.model').default;
      const { Types } = require('mongoose');
      const { timeRange = 'month' } = req.query;

      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      const ticketsWithFeedback = await HandoffTicket.find({
        assignedAgentId: new Types.ObjectId(payload.userId),
        status: 'resolved',
        resolvedAt: { $gte: startDate },
        'userFeedback.rating': { $exists: true },
      }).select('userFeedback resolvedAt priority');

      const totalFeedbacks = ticketsWithFeedback.length;
      const ratings = ticketsWithFeedback.map((ticket: any) => ticket.userFeedback.rating);
      const averageRating = totalFeedbacks > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / totalFeedbacks 
        : 0;

      const ratingDistribution = {
        1: ratings.filter((r: number) => r === 1).length,
        2: ratings.filter((r: number) => r === 2).length,
        3: ratings.filter((r: number) => r === 3).length,
        4: ratings.filter((r: number) => r === 4).length,
        5: ratings.filter((r: number) => r === 5).length,
      };

      return res.status(200).json({
        success: true,
        data: {
          totalFeedbacks,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
          teamAverageRating: 4.2,
          timeRange,
        },
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics',
      });
    }
  });

  console.log('✅ Direct feedback routes added');
  
  app.use('/api/agent', agentRoutes);
  console.log('✅ Agent routes mounted at /api/agent');
  app.use('/api/supervisor', supervisorRoutes);
  console.log('✅ Supervisor routes mounted at /api/supervisor');
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/handoff', handoffRoutes);
  app.use('/api/locations', locationRoutes); // Location routes for constituency data
  app.use('/api/chatbot', chatbotRoutes); // AI Chatbot routes

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler - Must be after all routes
  app.use(notFoundHandler);

  // Global error handler - Must be last
  app.use(errorHandler);

  return app;
};

export default createApp;