import { Router } from 'express';
import { sendMessage, getStatus, searchKnowledge } from '../controllers/chatbot.controller';

/**
 * Chatbot Routes
 * Public routes for AI chatbot interactions
 */

const router = Router();

// POST /api/chatbot/message - Send message to chatbot
router.post('/message', sendMessage);

// GET /api/chatbot/status - Get chatbot status
router.get('/status', getStatus);

// GET /api/chatbot/search - Search knowledge base
router.get('/search', searchKnowledge);

export default router;
