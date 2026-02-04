import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthContextType, LoginCredentials } from '../types/auth.types';
import { apiService } from '../services/api';
import agentSocketService from '../services/socketService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Initialize socket connection if user is already authenticated
          agentSocketService.connect();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔵 Starting login process...', credentials.email);
      const response = await apiService.login(credentials);
      console.log('🔵 API response received:', response);

      if (response.success) {
        // Handle the actual API response format (user and accessToken are at root level)
        const { user: userData, accessToken } = response;
        console.log('🔵 User data:', userData);
        console.log('🔵 Access token received:', !!accessToken);

        // TEMPORARY FIX: If role is missing, default to 'agent' since we know this is the agent dashboard
        const userWithRole = {
          ...userData,
          role: userData.role || 'agent' // Default to 'agent' if role is missing
        };

        console.log('🔵 User data with role:', userWithRole);

        // Validate user role
        if (!['agent', 'supervisor', 'admin'].includes(userWithRole.role)) {
          throw new Error('Access denied. Agent role required.');
        }

        // Store auth data
        setUser(userWithRole);
        setToken(accessToken);
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('authUser', JSON.stringify(userWithRole));
        apiService.setAuthToken(accessToken);
        
        // Initialize socket connection for real-time communication
        agentSocketService.connect();
        
        console.log('✅ Login successful, user authenticated');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      // Disconnect socket
      agentSocketService.disconnect();
      
      // Call logout API (fire and forget)
      apiService.logout().catch(console.warn);

      // Clear local state
      setUser(null);
      setToken(null);
      apiService.removeAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<AuthUser>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};