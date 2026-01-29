export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  passwordHash?: string;
  authProvider: 'email' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Chatbot-specific fields
  preferredLanguage?: 'en' | 'te' | 'hi';
  role?: 'user' | 'agent' | 'supervisor' | 'admin';
  agentStatus?: 'available' | 'busy' | 'offline';
  agentProfile?: {
    department?: 'Legal' | 'RTI' | 'Emergency';
    skills?: string[];
    maxConcurrentChats?: number;
    performanceMetrics?: {
      totalChatsHandled: number;
      avgResponseTime: number;
      avgRating: number;
    }; 
    preferences?: {
      browserNotifications: boolean;
      soundAlerts: boolean;
    }

  };

}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  passwordHash?: string;
  authProvider: 'email' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
}
