import { Request, Response } from 'express';
import aiService from '../services/ai.service';
import ragService from '../services/rag.service';
import HandoffTicket from '../../shared/models/HandoffTicket.model';
import Conversation from '../../shared/models/Conversation.model';
import User from '../../shared/models/User.model';

/**
 * Chatbot Controller
 * Handles AI chatbot interactions
 */

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userId?: string;
  sessionId?: string;
}

/**
 * Check if user is requesting human assistance
 */
const isHandoffRequest = (message: string): boolean => {
  const handoffKeywords = [
    'human', 'agent', 'person', 'representative', 'support',
    'help me', 'speak to', 'talk to', 'connect me', 'transfer',
    'escalate', 'supervisor', 'manager', 'real person',
    'not satisfied', 'complaint', 'urgent', 'emergency'
  ];
  
  const lowerMessage = message.toLowerCase();
  return handoffKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Create handoff ticket for human assistance
 */
const createHandoffTicket = async (
  userId: string,
  message: string,
  conversationHistory: any[]
): Promise<string> => {
  try {
    // Find or create user
    let user = await User.findById(userId);
    if (!user) {
      // Create anonymous user for this session
      user = await User.create({
        email: `anonymous_${Date.now()}@temp.com`,
        firstName: 'Anonymous',
        lastName: 'User',
        authProvider: 'email',
        role: 'user'
      });
    }

    // Create conversation record
    const conversation = await Conversation.create({
      userId: user._id,
      title: 'Customer Support Request',
      messages: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        timestamp: new Date()
      })),
      status: 'active'
    });

    // Create handoff ticket
    const ticket = await HandoffTicket.create({
      userId: user._id,
      conversationId: conversation._id,
      reason: `User requested human assistance: ${message}`,
      priority: 2,
      priorityLevel: 'Medium',
      status: 'waiting',
      conversationContext: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        timestamp: new Date()
      })),
      slaData: {
        responseDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        resolutionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        escalationLevel: 0,
        isOverdue: false
      },
      autoAssignmentData: {
        departmentScore: 0,
        languageScore: 0,
        workloadScore: 0,
        totalScore: 0,
        assignmentMethod: 'manual'
      }
    });

    console.log('✅ Handoff ticket created:', ticket._id);
    return ticket._id.toString();
  } catch (error) {
    console.error('❌ Error creating handoff ticket:', error);
    throw error;
  }
};

/**
 * Send message to AI chatbot
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory = [], userId, sessionId }: ChatRequest = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
      return;
    }

    if (message.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Message is too long (max 1000 characters)',
      });
      return;
    }

    // Check if user is requesting human assistance
    if (isHandoffRequest(message)) {
      try {
        const ticketId = await createHandoffTicket(
          userId || `session_${sessionId || Date.now()}`,
          message,
          conversationHistory
        );

        res.status(200).json({
          success: true,
          data: {
            message: "I understand you'd like to speak with a human agent. I've created a support ticket for you and connected you with our support team. An agent will be with you shortly.",
            model: 'handoff-system',
            timestamp: new Date(),
            handoffRequested: true,
            ticketId: ticketId
          },
        });
        return;
      } catch (error) {
        console.error('❌ Handoff creation failed:', error);
        // Continue with AI response as fallback
      }
    }

    // Check if AI service is available
    if (!aiService.isAvailable()) {
      res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    // Retrieve relevant context using RAG
    const context = ragService.retrieveContext(message);

    // Generate AI response
    const response = await aiService.generateResponse(
      message.trim(),
      context,
      conversationHistory
    );

    res.status(200).json({
      success: true,
      data: {
        message: response.message,
        model: response.model,
        timestamp: response.timestamp,
        handoffRequested: false
      },
    });
  } catch (error: any) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get chatbot health status
 */
export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const isAvailable = aiService.isAvailable();
    const categories = ragService.getCategories();

    res.status(200).json({
      success: true,
      data: {
        aiServiceAvailable: isAvailable,
        knowledgeBaseCategories: categories,
        status: isAvailable ? 'online' : 'offline',
      },
    });
  } catch (error: any) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check chatbot status',
      error: error.message,
    });
  }
};

/**
 * Search knowledge base
 */
export const searchKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Query parameter is required',
      });
      return;
    }

    const results = ragService.search(query);

    res.status(200).json({
      success: true,
      data: {
        query,
        results,
        count: results.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Knowledge search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search knowledge base',
      error: error.message,
    });
  }
};
