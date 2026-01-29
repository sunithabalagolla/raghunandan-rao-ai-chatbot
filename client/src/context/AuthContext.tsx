import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, RegisterEmailData } from '../types/auth.types';
import AuthService from '../services/authService';
import * as storage from '../utils/storage';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount - DISABLED FOR PUBLIC CHATBOT
  useEffect(() => {
    // Skip authentication check - chatbot is public
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.loginEmail(email, password, rememberMe);

      // Store tokens and user data
      storage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        storage.setRefreshToken(response.refreshToken);
      }
      storage.setUser(response.user);

      setUser(response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.loginWithGoogle(googleToken);

      // Store tokens and user data
      storage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        storage.setRefreshToken(response.refreshToken);
      }
      storage.setUser(response.user);

      setUser(response.user);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFacebook = async (facebookToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.loginWithFacebook(facebookToken);

      // Store tokens and user data
      storage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        storage.setRefreshToken(response.refreshToken);
      }
      storage.setUser(response.user);

      setUser(response.user);
    } catch (err: any) {
      setError(err.message || 'Facebook login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterEmailData) => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.registerEmail(data);
      // Note: Registration is multi-step, so we don't set user here
      // User will be set after OTP verification
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      storage.clearAuthData();
      setUser(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const setAuthUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginWithGoogle,
    loginWithFacebook,
    register,
    logout,
    clearError,
    setAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
