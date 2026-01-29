import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * POST /api/auth/register/email
 * Register with email and password
 */
export const registerWithEmail = async (req: Request, res: Response) => {
  try {
    console.log('🔵 Registration request received:', req.body);
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required',
      });
    }

    console.log(`🔵 Processing registration for: ${email}`);
    const result = await authService.registerWithEmail(
      email,
      password,
      firstName,
      lastName,
      phoneNumber
    );

    console.log(`✅ Registration successful for: ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Error in registerWithEmail controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * POST /api/auth/register/verify-otp
 * Verify OTP and complete registration - NOT IMPLEMENTED
 */
export const verifyOTPAndCompleteRegistration = async (
  req: Request,
  res: Response
) => {
  return res.status(501).json({
    success: false,
    message: 'OTP verification not implemented yet',
  });
};

/**
 * POST /api/auth/register/google
 * Register or login with Google - NOT IMPLEMENTED
 */
export const registerWithGoogle = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Google authentication not implemented yet',
  });
};

/**
 * POST /api/auth/otp/resend
 * Resend OTP - NOT IMPLEMENTED
 */
export const resendOTP = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'OTP resend not implemented yet',
  });
};

/**
 * POST /api/auth/otp/validate
 * Validate OTP without creating user - NOT IMPLEMENTED
 */
export const validateOTP = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'OTP validation not implemented yet',
  });
};

/**
 * POST /api/auth/login/email
 * Login with email and password
 */
export const loginWithEmail = async (req: Request, res: Response) => {
  try {
    console.log('🔍 AUTH CONTROLLER - loginWithEmail called');
    const { email, password, rememberMe } = req.body;
    console.log('🔍 AUTH CONTROLLER - Email:', email);
    console.log('🔍 AUTH CONTROLLER - Password provided:', !!password);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }
    const result = await authService.loginWithEmail(email, password, rememberMe);
    console.log('🚨🚨🚨 AUTH SERVICE RESULT:', JSON.stringify(result, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in loginWithEmail controller:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * POST /api/auth/login/google
 * Login with Google - NOT IMPLEMENTED
 */
export const loginWithGoogle = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Google login not implemented yet',
  });
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token - NOT IMPLEMENTED
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Token refresh not implemented yet',
  });
};

/**
 * POST /api/auth/password/reset-request
 * Initiate password reset - NOT IMPLEMENTED
 */
export const initiatePasswordReset = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Password reset not implemented yet',
  });
};

/**
 * POST /api/auth/password/reset-complete
 * Complete password reset with OTP - NOT IMPLEMENTED
 */
export const resetPassword = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Password reset not implemented yet',
  });
};

/**
 * POST /api/auth/password/change
 * Change password from profile - NOT IMPLEMENTED
 */
export const changePassword = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Password change not implemented yet',
  });
};

/**
 * POST /api/auth/logout
 * Logout and blacklist token - NOT IMPLEMENTED
 */
export const logout = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Logout not implemented yet',
  });
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; // From auth middleware

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user from repository
    const userRepository = require('../../repositories/user.repository');
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error: any) {
    console.error('Error in getCurrentUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

/**
 * PUT /api/auth/me
 * Update current user profile
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; // From auth middleware
    const { firstName, lastName, phoneNumber } = req.body;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Update user profile
    const userRepository = require('../repositories/user.repository');
    const user = await userRepository.updateProfile(userId, {
      firstName,
      lastName,
      phoneNumber,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('Error in updateCurrentUser controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * POST /api/auth/register/facebook
 * Register or login with Facebook - NOT IMPLEMENTED
 */
export const registerWithFacebook = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Facebook authentication not implemented yet',
  });
};

/**
 * POST /api/auth/login/facebook
 * Login with Facebook - NOT IMPLEMENTED
 */
export const loginWithFacebook = async (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Facebook login not implemented yet',
  });
};
