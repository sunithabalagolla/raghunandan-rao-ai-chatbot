import { Router } from 'express';
import * as emergencyController from '../controllers/emergency.controller';
import { authenticate } from '../auth/middleware/auth.middleware';

const router = Router();

/**
 * Emergency Routes
 * Task 24: Emergency and Priority Handling
 * All endpoints require agent authentication
 */

// Get emergency contact information
router.get('/contacts', authenticate, emergencyController.getEmergencyContacts);

// Get all emergency tickets
router.get('/tickets', authenticate, emergencyController.getEmergencyTickets);

// Manually escalate a ticket
router.post('/escalate/:ticketId', authenticate, emergencyController.escalateTicket);

// Analyze message for emergency keywords
router.post('/analyze/:ticketId', authenticate, emergencyController.analyzeMessage);

// Get SLA status for a ticket
router.get('/sla/:ticketId', authenticate, emergencyController.getSLAStatus);

// Track emergency response time
router.post('/response/:ticketId', authenticate, emergencyController.trackResponse);

export default router;