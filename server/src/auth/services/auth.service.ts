import * as userRepository from '../../repositories/user.repository';
import * as tokenService from './token.service';
import * as passwordService from './password.service';
import * as validationService from '../../services/validation.service';
import * as emailService from '../../services/email.service';

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

/**
 * Login with email and password
 */
export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<{
  accessToken: string;
  refreshToken?: string;
  user: any;
}> => {
  try {
    // Validate email
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error('Invalid email or password');
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check auth provider
    if (user.authProvider !== 'email') {
      throw new Error(
        'This email is registered with Google. Please continue with Google to login.'
      );
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await passwordService.comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await userRepository.updateLastLogin(user._id.toString());

    // Generate tokens with role
    const accessToken = tokenService.generateAccessToken(
      user._id.toString(),
      user.email,
      user.authProvider,
      user.role,
      undefined
    );
    
    const refreshToken = rememberMe 
      ? tokenService.generateRefreshToken({
          _id: user._id.toString(),
          email: user.email,
        })
      : undefined;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        role: user.role,
        lastLoginAt: new Date(),
      },
    };

  } catch (error: any) {
    console.error('Error in loginWithEmail:', error);
    throw error;
  }
};

/**
 * Register with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phoneNumber?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  try {
    // Validate inputs
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.errors.join(', '));
    }

    // Basic password validation (since validatePassword doesn't exist)
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const firstNameValidation = validationService.validateName(firstName, 'First name');
    if (!firstNameValidation.isValid) {
      throw new Error(firstNameValidation.errors.join(', '));
    }

    const lastNameValidation = validationService.validateName(lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      throw new Error(lastNameValidation.errors.join(', '));
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(password);

    // Create user
    const user = await userRepository.createUser({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phoneNumber,
      passwordHash,
      authProvider: 'email',
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      user._id.toString(),
      user.email,
      user.authProvider,
      user.role,
      undefined
    );
    const refreshToken = tokenService.generateRefreshToken({
      _id: user._id.toString(),
      email: user.email,
    });

    // Send welcome email in background
    emailService.sendWelcomeEmail(user.email, user.firstName).catch((err: any) => {
      console.error('❌ Failed to send welcome email to', user.email, ':', err.message);
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    };
  } catch (error: any) {
    console.error('Error in registerWithEmail:', error);
    throw error;
  }
};