import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './auth/routes/auth.routes';

const createApp = (): Application => {
  const app = express();

  // CORS
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);

  // Health check - UPDATED
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: '🎯 BRAND NEW TEST APP IS WORKING! 🎯',
      timestamp: new Date().toISOString(),
    });
  });

  // FORCE LOAD CHECK - PUT route right after health check
  console.log('🚨 FORCE LOADING PUT ROUTE - THIS SHOULD APPEAR IN LOGS!');
  
  app.put('/api/agent/templates/:id', async (req: any, res: any) => {
    console.log('🎯 PUT ROUTE HIT - FORCE LOADED VERSION!');
    res.json({ success: true, message: 'PUT route is working!', timestamp: new Date().toISOString() });
  });

  // Debug route to list all registered routes
  app.get('/debug/routes', (_req, res) => {
    const routes: any[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      }
    });
    res.json({ routes });
  });

  // Simple test PUT route
  app.put('/test-put', (_req, res) => {
    console.log('🧪 TEST PUT ROUTE HIT!');
    res.json({ success: true, message: 'PUT route works!' });
  });

  console.log('🔧 All routes registered in app-test.ts');

  // Templates route with authentication
  app.get('/api/agent/templates', async (req: any, res: any) => {
    console.log('📋 TEMPLATES ROUTE HIT WITH AUTH!');
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

      const User = require('./shared/models/User.model').default;
      const user = await User.findById(payload.userId);
      if (!user || !['agent', 'supervisor', 'admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Agent role required.' });
      }

      // Get templates (both personal and shared) 
      const CannedResponse = require('./shared/models/CannedResponse.model').default;
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

  // POST /api/agent/templates - Create new template
  app.post('/api/agent/templates', async (req: any, res: any) => {
    console.log('📝 CREATE TEMPLATE ROUTE HIT!');
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

      const User = require('./shared/models/User.model').default;
      const user = await User.findById(payload.userId);
      if (!user || !['agent', 'supervisor', 'admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Agent role required.' });
      }

      // Validate required fields
      const { title, content, category, language, isShared, tags } = req.body;

      if (!title || !content || !category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, content, and category are required'
        });
      }

      // Validate category
      const validCategories = ['Greeting', 'Legal', 'RTI', 'Emergency', 'Closing', 'General'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      // Validate language
      const validLanguages = ['en', 'te', 'hi'];
      if (language && !validLanguages.includes(language)) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Must be one of: ${validLanguages.join(', ')}`
        });
      }

      // Create new template
      const CannedResponse = require('./shared/models/CannedResponse.model').default;
      const newTemplate = new CannedResponse({
        title: title.trim(),
        content: content.trim(),
        category,
        language: language || 'en',
        isShared: isShared || false,
        createdBy: payload.userId,
        tags: tags || [],
        usageCount: 0,
        isActive: true
      });

      const savedTemplate = await newTemplate.save();

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: {
          template: savedTemplate
        }
      });
    } catch (error: any) {
      console.error('Error creating template:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationErrors
        });
      }

      res.status(500).json({ success: false, message: 'Failed to create template' });
    }
  });

  // PUT /api/agent/templates/:id - Update template
  app.put('/api/agent/templates/:id', async (req: any, res: any) => {
    console.log('✏️ UPDATE TEMPLATE ROUTE HIT - RESTARTED!');
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

      const User = require('./shared/models/User.model').default;
      const user = await User.findById(payload.userId);
      if (!user || !['agent', 'supervisor', 'admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Agent role required.' });
      }

      //Get template ID from URL parameters
      const templateId = req.params.id;

      //validate template ID format
      const mongoose = require('mongoose');
      if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
        return res.status(400).json({ success: false, message: 'Invalid template ID' });
      }

      //Get update data from request body
      const { title, content, category, language, isShared, tags } = req.body;

      // Validate category if provided
      if (category) {
        const validCategories = ['Greeting', 'Legal', 'RTI', 'Emergency', 'Closing', 'General'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
          });
        }
      }

      // Validate language if provided
      if (language) {
        const validLanguages = ['en', 'te', 'hi'];
        if (!validLanguages.includes(language)) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid language. Must be one of: ${validLanguages.join(', ')}` 
          });
        }
      }

      // Build update object (only include provided fields)
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content.trim();
      if (category !== undefined) updateData.category = category;
      if (language !== undefined) updateData.language = language;
      if (isShared !== undefined) updateData.isShared = isShared;
      if (tags !== undefined) updateData.tags = tags;

      // Find and update the template (only if it belongs to the user)
      const CannedResponse = require('./shared/models/CannedResponse.model').default;
      const updatedTemplate = await CannedResponse.findOneAndUpdate(
        {
          _id: templateId,
          createdBy: payload.userId,
          isActive: true
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or you do not have permission to update it'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: {
          template: updatedTemplate
        }
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: validationErrors 
        });
      }

      res.status(500).json({ success: false, message: 'Failed to update template' });
    }
  });

  return app;
};

export default createApp;