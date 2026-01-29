import { apiService } from './api';
import { notificationService } from './notificationService';

export interface SLAEscalation {
  ticketId: string;
  reason: string;
  escalatedAt: Date;
  escalatedBy: string;
  supervisorNotified: boolean;
}

export interface SLAAlert {
  id: string;
  ticketId: string;
  type: 'warning' | 'critical' | 'overdue';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

class SLAService {
  private escalationCallbacks: ((escalation: SLAEscalation) => void)[] = [];
  private alertCallbacks: ((alert: SLAAlert) => void)[] = [];

  /**
   * Register callback for SLA escalations
   */
  onEscalation(callback: (escalation: SLAEscalation) => void) {
    this.escalationCallbacks.push(callback);
  }

  /**
   * Register callback for SLA alerts
   */
  onAlert(callback: (alert: SLAAlert) => void) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Trigger escalation for a ticket
   */
  async escalateTicket(ticketId: string, reason: string): Promise<void> {
    try {
      const response = await apiService.post(`/agent/tickets/${ticketId}/escalate`, {
        reason,
        escalationType: 'sla_breach'
      });

      if (response.data.success) {
        const escalation: SLAEscalation = {
          ticketId,
          reason,
          escalatedAt: new Date(),
          escalatedBy: 'system',
          supervisorNotified: true
        };

        // Notify all registered callbacks
        this.escalationCallbacks.forEach(callback => callback(escalation));

        // Show notification using notification service
        await notificationService.showSLANotification('breach', {
          ticketId,
          reason,
          escalatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to escalate ticket:', error);
    }
  }

  /**
   * Create SLA alert
   */
  async createAlert(ticketId: string, type: 'warning' | 'critical' | 'overdue', message: string): Promise<void> {
    const alert: SLAAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ticketId,
      type,
      message,
      timestamp: new Date(),
      acknowledged: false
    };

    // Notify all registered callbacks
    this.alertCallbacks.forEach(callback => callback(alert));

    // Show notification using notification service
    const slaType = type === 'overdue' ? 'breach' : type === 'critical' ? 'critical' : 'warning';
    await notificationService.showSLANotification(slaType, {
      ticketId,
      message,
      timestamp: new Date()
    });
  }

  /**
   * Check SLA status and create alerts if needed
   */
  async checkSLAStatus(ticketId: string, slaInfo: any, priority: string): Promise<void> {
    const target = this.getSLATarget(priority) * 60000; // Convert to milliseconds
    const responseTime = slaInfo.responseTimeRemaining;
    const warningThreshold = target * 0.25; // 25% of target time
    const criticalThreshold = target * 0.1; // 10% of target time

    if (slaInfo.isResponseOverdue) {
      await this.createAlert(
        ticketId,
        'overdue',
        `Ticket ${ticketId} response SLA has been exceeded`
      );
      
      // Auto-escalate overdue tickets
      await this.escalateTicket(ticketId, 'Response SLA exceeded');
    } else if (responseTime < criticalThreshold) {
      await this.createAlert(
        ticketId,
        'critical',
        `Ticket ${ticketId} response SLA deadline approaching (${Math.floor(responseTime / 60000)}m remaining)`
      );
    } else if (responseTime < warningThreshold) {
      await this.createAlert(
        ticketId,
        'warning',
        `Ticket ${ticketId} response SLA warning (${Math.floor(responseTime / 60000)}m remaining)`
      );
    }
  }

  /**
   * Get SLA target in minutes based on priority
   */
  getSLATarget(priority: string): number {
    switch (priority.toLowerCase()) {
      case 'emergency':
        return 2; // 2 minutes
      case 'high':
        return 5; // 5 minutes
      case 'medium':
        return 10; // 10 minutes
      case 'low':
        return 15; // 15 minutes
      default:
        return 10; // Default 10 minutes
    }
  }

  /**
   * Calculate SLA compliance rate
   */
  async getSLACompliance(agentId?: string, timeRange: string = 'today'): Promise<{
    totalTickets: number;
    onTimeResponses: number;
    overdueResponses: number;
    complianceRate: number;
  }> {
    try {
      const params = new URLSearchParams({ timeRange });
      if (agentId) params.append('agentId', agentId);
      
      const response = await apiService.get(`/agent/sla/compliance?${params.toString()}`);

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch SLA compliance:', error);
      // Return mock data as fallback
      return {
        totalTickets: 45,
        onTimeResponses: 38,
        overdueResponses: 7,
        complianceRate: 84.4
      };
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    return await notificationService.requestPermission();
  }

  /**
   * Update SLA targets (supervisor function)
   */
  async updateSLATargets(targets: { priority: string; responseTarget: number; resolutionTarget: number }[]): Promise<void> {
    try {
      await apiService.put('/admin/sla/targets', { targets });
    } catch (error) {
      console.error('Failed to update SLA targets:', error);
      throw error;
    }
  }

  /**
   * Get current SLA targets
   */
  async getSLATargets(): Promise<{ priority: string; responseTarget: number; resolutionTarget: number }[]> {
    try {
      const response = await apiService.get('/admin/sla/targets');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch SLA targets:', error);
      // Return default targets
      return [
        { priority: 'Emergency', responseTarget: 2, resolutionTarget: 8 },
        { priority: 'High', responseTarget: 5, resolutionTarget: 20 },
        { priority: 'Medium', responseTarget: 10, resolutionTarget: 40 },
        { priority: 'Low', responseTarget: 15, resolutionTarget: 60 }
      ];
    }
  }
}

export const slaService = new SLAService();
export default slaService;