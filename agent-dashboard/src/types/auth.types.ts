export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'supervisor' | 'admin';
  agentProfile?: {
    department: string;
    skills: string[];
    maxConcurrentChats: number;
    languages: string[];
    status: 'available' | 'busy' | 'away' | 'offline';
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: Omit<AuthUser, 'role'> & { role?: 'agent' | 'supervisor' | 'admin' }; // Make role optional in API response
  accessToken: string;
  refreshToken?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}