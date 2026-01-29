import { Request, Response, NextFunction } from 'express';
import * as tokenService from '../services/token.service';

/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user data to request
 */

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        authProvider: string;
        role?: string;
        permissions?: string[];
        department?: 'Legal' | 'RTI' | 'Emergency';
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and attaches user data to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
      return;
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization header format',
      });
      return;
    }

    // Validate token and check if blacklisted
    const payload = await tokenService.validateAndCheckToken(token);
    
    console.log('🔍 AUTH MIDDLEWARE DEBUG - payload:', JSON.stringify(payload, null, 2));

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user data to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      authProvider: payload.authProvider,
      role:payload.role,
      department:payload.department
    };
    
    console.log('🔍 AUTH MIDDLEWARE DEBUG - req.user:', JSON.stringify(req.user, null, 2));

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    console.error('Error in authentication middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional Authentication Middleware
 * Validates JWT token if present, but doesn't require it
 * Useful for endpoints that work differently for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // If no token, just continue without attaching user
    if (!authHeader) {
      return next();
    }

    // Extract token
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    // Validate token and check if blacklisted
    const payload = await tokenService.validateAndCheckToken(token);

    if (payload) {
      // Attach user data to request if token is valid
      req.user = {
        userId: payload.userId,
        email: payload.email,
        authProvider: payload.authProvider,
        role: payload.role,
        permissions: payload.permissions,
        department: payload.department,
      };
    }

    // Continue regardless of token validity
    return next();
  } catch (error: any) {
    console.error('Error in optional authentication middleware:', error);
    // Continue even if there's an error
    return next();
  }
};

/**
 * Role-Based Authentication Middleware
 * Requires user to have agent, supervisor, or admin role
 */
export const requireAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate the user
    await new Promise<void>((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has agent role or higher
    const userRole = req.user?.role;
    const allowedRoles = ['agent', 'supervisor', 'admin'];

    console.log('🔍 REQUIRE AGENT MIDDLEWARE - User role:', userRole);
    console.log('🔍 REQUIRE AGENT MIDDLEWARE - Allowed roles:', allowedRoles);
    console.log('🔍 REQUIRE AGENT MIDDLEWARE - Role check result:', userRole && allowedRoles.includes(userRole));

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('❌ REQUIRE AGENT MIDDLEWARE - Access denied for role:', userRole);
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    console.log('✅ REQUIRE AGENT MIDDLEWARE - Access granted for role:', userRole);

    // User has proper role, continue
    next();
  } catch (error: any) {
    console.error('Error in requireAgent middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Role-Based Authentication Middleware
 * Requires user to have supervisor or admin role
 */
export const requireSupervisor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔍 REQUIRE SUPERVISOR MIDDLEWARE - Starting');
    console.log('🔍 REQUIRE SUPERVISOR MIDDLEWARE - Headers:', req.headers.authorization);
    
    // First authenticate the user
    await new Promise<void>((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔍 REQUIRE SUPERVISOR MIDDLEWARE - After authenticate, req.user:', JSON.stringify(req.user, null, 2));

    // Check if user has supervisor role or higher
    const userRole = req.user?.role;
    const allowedRoles = ['supervisor', 'admin'];

    console.log('🔍 REQUIRE SUPERVISOR MIDDLEWARE - User role:', userRole);
    console.log('🔍 REQUIRE SUPERVISOR MIDDLEWARE - Allowed roles:', allowedRoles);

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('❌ REQUIRE SUPERVISOR MIDDLEWARE - Access denied');
      res.status(403).json({
        success: false,
        message: 'Access denied. Supervisor role required.',
      });
      return;
    }

    console.log('✅ REQUIRE SUPERVISOR MIDDLEWARE - Access granted');
    // User has proper role, continue
    next();
  } catch (error: any) {
    console.error('Error in requireSupervisor middleware:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Generic Role-Based Authentication Middleware
 * Requires user to have specific role
 */
export const requireRole = (requiredRole: 'user' | 'agent' | 'supervisor' | 'admin') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First authenticate the user
      await new Promise<void>((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Check if user has required role
      const userRole = req.user?.role;

      if (userRole !== requiredRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. ${requiredRole} role required.`,
        });
        return;
      }

      // User has proper role, continue
      next();
    } catch (error: any) {
      console.error(`Error in requireRole(${requiredRole}) middleware:`, error);
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  };
};
