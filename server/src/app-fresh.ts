import express, { Application, Router } from 'express';
import cors from 'cors';
import config from './shared/config/env.config';
import authRoutes from './auth/routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import conversationRoutes from './routes/conversation.routes';
import handoffRoutes from './routes/handoff.routes';
import chatbotRoutes from './core/routes/chatbot.routes';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

const createApp = (): Application => {
  const app = express();

  // CORS
  app.use(cors({
    origin: config.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(rateLimitMiddleware);

  // Request logging
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`📨 ${req.method} ${req.url}`);
      next();
    });
  }

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: '🔥 COMPLETELY NEW MESSAGE - TEMPLATES WORKING! 🔥',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // OBVIOUS TEST ROUTE
  app.get('/test-obvious', (_req, res) => {
    res.status(200).json({
      success: true,
      message: '🎯 THIS ROUTE SHOULD DEFINITELY WORK!',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/handoff', handoffRoutes);

  // FRESH AGENT ROUTER
  const agentRouter = Router();
  console.log('🚀 CREATING FRESH AGENT ROUTES - NEW CODE CONFIRMED');

  const User = require('./shared/models/User.model').default;
  const HandoffTicket = require('./shared/models/HandoffTicket.model').default;
  const mongoose = require('mongoose');

  const CannedResponse = require('./shared/models/CannedResponse.model').default;
  // TEST ENDPOINT
  agentRouter.get('/test-fresh', async (_req: any, res: any) => {
    res.json({
      success: true,
      message: '🎉 FRESH CODE IS RUNNING! All Task 7 endpoints available',
      version: '2.0-FRESH',
      timestamp: new Date().toISOString()
    });
  });

  // SIMPLE TEST ROUTE FOR DEBUGGING
  agentRouter.get('/test-simple', async (_req: any, res: any) => {
    console.log('🧪 SIMPLE TEST ROUTE HIT!');
    res.json({
      success: true,
      message: 'Simple test route works!',
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/agent/tickets/:id/resolve - FRESH VERSION
  agentRouter.post('/tickets/:id/resolve', async (req: any, res: any) => {
    console.log('🎫 FRESH RESOLVE ROUTE HIT - ID:', req.params.id);
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No authorization token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      const tokenService = require('./auth/services/token.service');
      const payload = await tokenService.validateAndCheckToken(token);

      if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      const user = await User.findById(payload.userId);
      if (!user || !['agent', 'supervisor', 'admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Agent role required.' });
      }

      const ticketId = req.params.id;
      if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      }

      const { resolutionNotes } = req.body;

      const updatedTicket = await HandoffTicket.findOneAndUpdate(
        {
          _id: ticketId,
          assignedAgentId: payload.userId,
          status: 'assigned'
        },
        {
          $set: {
            status: 'resolved',
            resolvedAt: new Date(),
            resolutionNotes: resolutionNotes || 'Ticket resolved by agent - FRESH VERSION'
          }
        },
        { new: true }
      );

      if (!updatedTicket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found, not assigned to you, or already resolved'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Ticket resolved successfully - FRESH VERSION',
        data: { ticket: updatedTicket }
      });
    } catch (error) {
      console.error('Error in resolve ticket route:', error);
      res.status(500).json({ success: false, message: 'Failed to resolve ticket' });
    }
  });

  // GET /api/agent/templates - Get all templates (ADDED RIGHT AFTER WORKING ROUTE)
  agentRouter.get('/templates', async (req: any, res: any) => {
    console.log('📋 TEMPLATES ROUTE HIT - ADDED AFTER WORKING ROUTE!');
    try {
      // Auth check
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No authorization token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      const tokenService = require('./auth/services/token.service');
      const payload = await tokenService.validateAndCheckToken(token);

      if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      const user = await User.findById(payload.userId);
      if (!user || !['agent', 'supervisor', 'admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Agent role required.' });
      }

      // Get templates (both personal and shared) 
      const templates = await CannedResponse.find({
        $or: [
          { createdBy: payload.userId }, // Personal templates
          { isShared: true }             // Shared templates
        ]
      }).sort({ usageCount: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          templates: templates,
          totalCount: templates.length
        }
      });
    } catch (error) {
      console.error('Error in templates route:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch templates' });
    }
  });



  console.log('✅ FRESH AGENT ROUTES CREATED');
  app.use('/api/agent', agentRouter);
  console.log('✅ FRESH AGENT ROUTES MOUNTED');

  app.use('/api/chatbot', chatbotRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;