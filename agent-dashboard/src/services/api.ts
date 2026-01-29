import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { LoginCredentials, AuthResponse, PasswordResetRequest } from '../types/auth.types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login/email', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // Generic HTTP methods
  async get(url: string, config?: any): Promise<any> {
    return await this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any): Promise<any> {
    return await this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any): Promise<any> {
    return await this.api.put(url, data, config);
  }

  async delete(url: string, config?: any): Promise<any> {
    return await this.api.delete(url, config);
  }

  // Agent-specific endpoints
  async getAgentProfile(): Promise<any> {
    const response = await this.api.get('/agent/profile');
    return response.data;
  }

  async updateAgentStatus(status: string): Promise<any> {
    const response = await this.api.put('/agent/status', { status });
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const apiService = new ApiService();
export default apiService;