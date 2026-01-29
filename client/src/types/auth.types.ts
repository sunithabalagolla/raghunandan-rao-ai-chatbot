/**
 * Authentication Types
 * TypeScript interfaces for authentication-related data
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  authProvider: 'email' | 'google' | 'facebook';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken?: string;
  user: User;
  isNewUser?: boolean;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface RegisterEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginEmailData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}


export interface ChangePasswordData{
  currentPassword:string;
  newPassword:string,
  confirmPassword:string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  loginWithFacebook: (facebookToken: string) => Promise<void>;
  register: (data: RegisterEmailData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setAuthUser: (user: User) => void;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}
