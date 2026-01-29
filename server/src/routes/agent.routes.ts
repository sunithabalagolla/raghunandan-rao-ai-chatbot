import { Router } from 'express';
import * as agentController from '../controllers/agent.controller';
import { requireAgent } from '../auth/middleware/auth.middleware';

const router = Router();

console.log('🚨🚨🚨 AGENT ROUTES LOADED - USING CLEAN CONTROLLER WITH FEEDBACK! 🚨🚨🚨');

/**
 * Agent Routes
 * All agent-specific endpoints (protected, agent role required)
 * Using fresh controller to avoid caching issues
 */

// Get agent profile
router.get('/profile', requireAgent, agentController.getAgentProfile);

// Update agent profile
router.put('/profile', requireAgent, agentController.updateAgentProfile);

// Get agent statistics
router.get('/stats', requireAgent, agentController.getAgentStats);

// Ticket management endpoints (Task 10)
router.get('/tickets/pending', requireAgent, agentController.getPendingTickets);
router.get('/tickets/assigned', requireAgent, agentController.getAssignedTickets);
router.get('/tickets/:id/history', requireAgent, agentController.getTicketHistory);
router.post('/tickets/:id/accept', requireAgent, agentController.acceptTicket);
router.post('/tickets/:id/resolve', requireAgent, agentController.resolveTicket);
router.post('/tickets/:id/transfer', requireAgent, agentController.transferTicket);
router.post('/tickets/:id/escalate', requireAgent, agentController.escalateTicket);
router.get('/tickets/queue-stats', requireAgent, agentController.getQueueStats);

// SLA management endpoints (Task 19)
router.get('/sla/compliance', requireAgent, agentController.getSLACompliance);

// Performance dashboard endpoints (Task 21)
router.get('/performance', requireAgent, agentController.getAgentPerformance);

// Customer feedback endpoints (Task 22) - THESE ARE THE KEY ONES!
router.post('/tickets/:id/feedback', agentController.submitCustomerFeedback); // Public endpoint for customers
router.get('/feedback/stats', requireAgent, agentController.getAgentFeedbackStats);

// Agent status update
router.put('/status', requireAgent, agentController.updateAgentStatus);

console.log('🔍 AGENT ROUTES REGISTERED - Fresh controller with feedback functions');

export default router;