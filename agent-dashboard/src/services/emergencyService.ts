import { apiService as api } from './api';

export interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  department: string;
}

export interface EmergencyTicket {
  _id: string;
  priority: number;
  department: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  slaStatus: {
    status: 'safe' | 'warning' | 'critical' | 'exceeded';
    timeRemaining: number;
    percentage: number;
  };
}

export interface SLAStatus {
  ticketId: string;
  priority: number;
  slaTarget: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
  timeRemaining: number;
  percentage: number;
}

class EmergencyService {
  /**
   * Get emergency contact information
   */
  async getEmergencyContacts(): Promise<Record<string, EmergencyContact>> {
    const response = await api.get('/emergency/contacts');
    return response.data.data;
  }

  /**
   * Get all emergency tickets requiring immediate attention
   */
  async getEmergencyTickets(): Promise<EmergencyTicket[]> {
    const response = await api.get('/emergency/tickets');
    return response.data.data;
  }

  /**
   * Manually escalate a ticket to emergency priority
   */
  async escalateTicket(ticketId: string, reason: string, newPriority: number = 5): Promise<void> {
    await api.post(`/emergency/escalate/${ticketId}`, {
      reason,
      newPriority
    });
  }

  /**
   * Analyze message content for emergency keywords
   */
  async analyzeMessage(ticketId: string, message: string): Promise<{
    escalated: boolean;
    newPriority?: number;
    reason?: string;
  }> {
    const response = await api.post(`/emergency/analyze/${ticketId}`, {
      message
    });
    return response.data.data;
  }

  /**
   * Get SLA status for a specific ticket
   */
  async getSLAStatus(ticketId: string): Promise<SLAStatus> {
    const response = await api.get(`/emergency/sla/${ticketId}`);
    return response.data.data;
  }

  /**
   * Track emergency response time
   */
  async trackResponse(ticketId: string): Promise<void> {
    await api.post(`/emergency/response/${ticketId}`);
  }

  /**
   * Get priority level styling
   */
  getPriorityStyle(priority: number): {
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  } {
    switch (priority) {
      case 5:
        return {
          color: 'text-red-800',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-500',
          label: 'EMERGENCY'
        };
      case 4:
        return {
          color: 'text-orange-800',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-500',
          label: 'HIGH'
        };
      case 3:
        return {
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-500',
          label: 'MEDIUM'
        };
      case 2:
        return {
          color: 'text-blue-800',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-500',
          label: 'NORMAL'
        };
      case 1:
      default:
        return {
          color: 'text-gray-800',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-500',
          label: 'LOW'
        };
    }
  }

  /**
   * Get SLA status styling
   */
  getSLAStatusStyle(status: string): {
    color: string;
    bgColor: string;
    icon: string;
  } {
    switch (status) {
      case 'exceeded':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: '🚨'
        };
      case 'critical':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: '⚠️'
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: '⏰'
        };
      case 'safe':
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: '✅'
        };
    }
  }

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return 'OVERDUE';
    
    if (minutes < 60) {
      return `${Math.floor(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.floor(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Play emergency alert sound
   */
  playEmergencyAlert(): void {
    try {
      const audio = new Audio('/sounds/notification-urgent.mp3');
      audio.volume = 0.8;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play emergency alert sound:', error);
    }
  }

  /**
   * Show browser notification for emergency
   */
  showEmergencyNotification(ticket: EmergencyTicket): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Emergency Ticket Alert', {
        body: `Priority ${ticket.priority} ticket from ${ticket.customerInfo.name} in ${ticket.department}`,
        icon: '/icons/notification-urgent.png',
        tag: `emergency-${ticket._id}`,
        requireInteraction: true
      });
    }
  }
}

export const emergencyService = new EmergencyService();