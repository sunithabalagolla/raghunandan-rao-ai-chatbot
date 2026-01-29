export interface IBlacklistedToken {
  _id: string;
  token: string;
  userId: string;
  blacklistedAt: Date;
  expiresAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  authProvider: 'email' | 'google' | 'facebook' | 'admin';
  role?: 'user' | 'agent' | 'supervisor' | 'admin';
  permissions?: string[];
  iat?: number;
  exp?: number;
  department?: 'Legal' | 'RTI' | 'Emergency';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}
