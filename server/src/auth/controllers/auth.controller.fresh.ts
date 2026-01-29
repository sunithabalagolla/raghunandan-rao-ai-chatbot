import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * FRESH Auth Controller - No caching issues
 */

/**
 * POST /api/auth/login/email
 * Login with email and password
 */
export const loginWithEmail = async (req: Request, res: Response) => {
  console.log('🔥🔥🔥 FRESH CONTROLLER - LOGIN FUNCTION START');
  console.log('🔥🔥🔥 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password, rememberMe } = req.body;
    console.log('🔥🔥🔥 EXTRACTED VALUES:', { email, password: !!password, rememberMe });

    // Validate required fields
    if (!email || !password) {
      console.log('🔥🔥🔥 VALIDATION FAILED - MISSING EMAIL OR PASSWORD');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    console.log('🔥🔥🔥 ABOUT TO CALL AUTH SERVICE...');
    const result = await authService.loginWithEmail(email, password, rememberMe);
    console.log('🔥🔥🔥 AUTH SERVICE RESULT:', JSON.stringify(result, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('🔥🔥🔥 Error in fresh loginWithEmail controller:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};