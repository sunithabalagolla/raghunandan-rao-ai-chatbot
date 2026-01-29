import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  ApiResponse,
  RegisterEmailData,
  VerifyOTPData,
  ResetPasswordData,
  ChangePasswordData,
  User,

} from '../types/auth.types';

/**
 * Authentication Service
 * Handles all API calls to the backend authentication endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_AUTH_URL = `${API_BASE_URL}/api/auth`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 10 seconds
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
    throw new Error(message);
  }
  throw new Error('An unexpected error occurred');
};

class AuthService {
  /**
   * Register with email (Step 1: Send OTP)
   */
  static async registerEmail(data: RegisterEmailData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/register/email', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Verify OTP and complete registration (Step 2)
   */
  static async verifyOTP(data: VerifyOTPData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/register/verify-otp', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/otp/resend', { email });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Validate OTP
   */
  static async validateOTP(email: string, otp: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/otp/validate', { email, otp });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }




  /**
   * Login with email and password
   */
  static async loginEmail(
    email: string,
    password: string,
    rememberMe?: boolean
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/login/email', {
        email,
        password,
        rememberMe,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Login/Register with Google
   */
  static async loginWithGoogle(googleToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/register/google', {
        googleToken,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Login/Register with Facebook
   */
  static async loginWithFacebook(facebookToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/register/facebook', {
        facebookToken,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Request password reset (Step 1: Send OTP)
   */
  static async requestPasswordReset(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/password/reset-request', {
        email,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Complete password reset (Step 2: Verify OTP and set new password)
   */
  static async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/password/reset-complete', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Change password (requires authentication)
   */
  static async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/password/change', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/me');
      return response.data.user;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      // Logout should always succeed on client side
      console.error('Logout error:', error);
    }
  }
}

export default AuthService;
