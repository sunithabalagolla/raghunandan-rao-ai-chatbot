import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller';
import { authenticate } from '../auth/middleware/auth.middleware';

const router = Router();

/**
 * Conversation Routes
 * All conversation management endpoints (protected)
 */

// All routes require authentication
router.use(authenticate);

// Get all conversations for user
router.get('/', conversationController.getUserConversations);

// Create new conversation
router.post('/', conversationController.createConversation);

// Search conversations
router.get('/search', conversationController.searchConversations);

// Get single conversation by ID
router.get('/:id', conversationController.getConversationById);

// Update conversation title
router.put('/:id/title', conversationController.updateConversationTitle);

// Archive conversation
router.patch('/:id/archive', conversationController.archiveConversation);

// Delete conversation
router.delete('/:id', conversationController.deleteConversation);

export default router;
