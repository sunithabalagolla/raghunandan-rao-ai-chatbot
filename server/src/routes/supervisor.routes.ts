import { Router, Request, Response, NextFunction } from 'express';
import * as supervisorController from '../controllers/supervisor.controller';
import { authenticate } from '../auth/middleware/auth.middleware';

// Inline supervisor middleware to avoid import issues
const requireSupervisor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 INLINE SUPERVISOR MIDDLEWARE - Starting');
    console.log('🔍 INLINE SUPERVISOR MIDDLEWARE - Headers:', req.headers.authorization);
    
    // First authenticate the user
    await new Promise<void>((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔍 INLINE SUPERVISOR MIDDLEWARE - After authenticate, req.user:', JSON.stringify(req.user, null, 2));

    // Check if user has supervisor role or higher
    const userRole = req.user?.role;
    const allowedRoles = ['supervisor', 'admin'];

    console.log('🔍 INLINE SUPERVISOR MIDDLEWARE - User role:', userRole);
    console.log('🔍 INLINE SUPERVISOR MIDDLEWARE - Allowed roles:', allowedRoles);

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('❌ INLINE SUPERVISOR MIDDLEWARE - Access denied');
      res.status(403).json({
        success: false,
        message: 'Access denied. Supervisor role required.',
      });
      return;
    }

    console.log('✅ INLINE SUPERVISOR MIDDLEWARE - Access granted');
    // User has proper role, continue
    next();
  } catch (error: any) {
    console.error('Error in inline supervisor middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

const router = Router();

/**
 * Supervisor Routes
 * Task 23: Supervisor Dashboard and Team Management
 * All endpoints require supervisor role
 */

// Test route for debugging
router.get('/test', (_req, res) => {
  console.log('🔍 SUPERVISOR TEST ROUTE - Headers:', _req.headers.authorization);
  console.log('🔍 SUPERVISOR TEST ROUTE - User:', _req.user);
  res.json({ success: true, message: 'Supervisor routes working' });
});

// Simple working test route
router.get('/working', (_req, res) => {
  res.json({ success: true, message: 'Supervisor routes are working!', timestamp: new Date().toISOString() });
});

// Team overview and statistics
router.get('/team/overview', requireSupervisor, supervisorController.getTeamOverview);

// Agent performance metrics
router.get('/team/performance', requireSupervisor, supervisorController.getAgentPerformance);

// Workload distribution
router.get('/team/workload', requireSupervisor, supervisorController.getWorkloadDistribution);

// Ticket management
router.put('/tickets/:ticketId/reassign', requireSupervisor, supervisorController.reassignTicket);

// Agent management
router.put('/agents/:agentId/status', requireSupervisor, supervisorController.updateAgentStatus);

export default router;