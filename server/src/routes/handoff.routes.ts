import { Router } from 'express';
import * as handoffController from '../controllers/handoff.controller';
import { authenticate } from '../auth/middleware/auth.middleware';

const router = Router();

/**
 * Handoff Routes
 * All handoff ticket management endpoints (protected)
 */

// All routes require authentication
router.use(authenticate);

// Request handoff to human agent
router.post('/request', handoffController.requestHandoff);

// Get queue status
router.get('/queue-status', handoffController.getQueueStatus);

// Get handoff history
router.get('/history', handoffController.getHandoffHistory);

// Cancel handoff request
router.post('/:id/cancel', handoffController.cancelHandoff);

export default router;
