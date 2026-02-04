import { Server as SocketIOServer } from 'socket.io';
import HandoffTicket from '../shared/models/HandoffTicket.model';
import User from '../shared/models/User.model';
import {
  SOCKET_EVENTS,
  TicketCreatedPayload,
  TicketAssignedPayload,
  TicketResolvedPayload,
  TicketEscalatedPayload,
  TicketTransferredPayload,
  TicketQueueUpdatePayload,
  TicketSLAWarningPayload,
  TicketSLABreachPayload,
} from '../socket/events';
import { AgentRoomHelpers } from '../socket/handlers/agentHandler';

/**
 * Ticket Manager Service
 * Handles real-time ticket operations and notifications
 * Implements Requirements 2.2, 2.3, 10.3 (Task 10)
 */

class TicketManagerService {
  private io: SocketIOServer | null = null;
  private slaTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize the service with Socket.IO instance
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    console.log('🎫 Ticket Manager Service initialized');
  }

  /**
   * Create a new ticket and broadcast to agents
   * Requirement 2.2, 2.3
   */
  async createTicket(ticketData: {
    userId: string;
    conversationId: string;
    reason: string;
    priority?: number;
    department?: string;
    language?: string;
    conversationContext?: any[];
  }): Promise<any> {
    try {
      // Calculate priority level and SLA deadlines
      const priority = ticketData.priority || 3;
      const priorityLevel = this.getPriorityLevel(priority);
      const slaDeadlines = this.calculateSLADeadlines(priorityLevel);

      // Create the ticket
      const ticketDoc = {
        userId: ticketData.userId,
        conversationId: ticketData.conversationId,
        reason: ticketData.reason,
        priority,
        priorityLevel,
        status: 'waiting' as const,
        conversationContext: ticketData.conversationContext || [],
        slaData: {
          responseDeadline: slaDeadlines.response,
          resolutionDeadline: slaDeadlines.resolution,
          escalationLevel: 0,
          isOverdue: false,
        },
        autoAssignmentData: {
          departmentScore: 0,
          languageScore: 0,
          workloadScore: 0,
          totalScore: 0,
          assignmentMethod: 'manual' as const,
        },
      };

      const ticket = await HandoffTicket.create(ticketDoc);
      if (!ticket) {
        throw new Error('Failed to create ticket');
      }

      // Calculate queue position
      const queuePosition = await this.getQueuePosition(ticket._id.toString());
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(queuePosition, priorityLevel);

      // Create broadcast payload
      const ticketCreatedPayload: TicketCreatedPayload = {
        ticketId: ticket._id.toString(),
        userId: ticketData.userId,
        conversationId: ticketData.conversationId,
        priority,
        priorityLevel,
        reason: ticketData.reason,
        department: ticketData.department,
        language: ticketData.language,
        estimatedWaitTime,
        queuePosition,
        createdAt: ticket.createdAt,
      };

      // Broadcast to all agents
      this.broadcastToAgents(SOCKET_EVENTS.TICKET_CREATED, ticketCreatedPayload);

      // Broadcast to department-specific agents if department is specified
      if (ticketData.department) {
        this.broadcastToDepartment(ticketData.department, SOCKET_EVENTS.TICKET_CREATED, ticketCreatedPayload);
      }

      // Set up SLA monitoring
      this.setupSLAMonitoring(ticket);

      // Update queue statistics
      await this.broadcastQueueUpdate();

      console.log(`🎫 Ticket created: ${ticket._id} (${priorityLevel} priority)`);
      return ticket;

    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to an agent
   * Requirement 2.2, 2.3
   */
  async assignTicket(ticketId: string, agentId: string, assignmentMethod: 'manual' | 'auto' | 'emergency' = 'manual'): Promise<void> {
    try {
      console.log(`🎫 Attempting to assign ticket ${ticketId} to agent ${agentId}`);
      
      const ticket = await HandoffTicket.findById(ticketId);
      console.log(`🔍 Ticket found:`, ticket ? {
        id: ticket._id,
        status: ticket.status,
        assignedAgentId: ticket.assignedAgentId,
        createdAt: ticket.createdAt
      } : 'NOT FOUND');
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      if (ticket.status !== 'waiting') {
        throw new Error(`Ticket not available for assignment - current status: ${ticket.status}`);
      }

      const agent = await User.findById(agentId);
      console.log(`🔍 Agent found:`, agent ? {
        id: agent._id,
        email: agent.email,
        role: agent.role
      } : 'NOT FOUND');
      
      if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
        throw new Error('Invalid agent for assignment');
      }

      // Update ticket
      const assignedAt = new Date();
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        status: 'assigned',
        assignedAgentId: agentId,
        assignedAt,
        $push: {
          assignmentHistory: {
            agentId,
            assignedAt,
          },
        },
        'autoAssignmentData.assignmentMethod': assignmentMethod,
      });

      // Create broadcast payload
      const ticketAssignedPayload: TicketAssignedPayload = {
        ticketId,
        agentId,
        agentName: `${agent.firstName} ${agent.lastName}`,
        userId: ticket.userId.toString(),
        assignmentMethod,
        assignedAt,
        slaDeadline: (ticket as any).slaData?.resolutionDeadline || new Date(),
      };

      // Broadcast to all agents (remove from their queues)
      this.broadcastToAgents(SOCKET_EVENTS.TICKET_ASSIGNED, ticketAssignedPayload);

      // Notify the specific agent
      this.notifyAgent(agentId, SOCKET_EVENTS.TICKET_ASSIGNED, ticketAssignedPayload);

      // Notify supervisors
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_ASSIGNED, ticketAssignedPayload);

      // Update queue statistics
      await this.broadcastQueueUpdate();

      console.log(`🎫 Ticket assigned: ${ticketId} → Agent ${agentId} (${assignmentMethod})`);

    } catch (error) {
      console.error('❌ Error assigning ticket:', error);
      throw error;
    }
  }

  /**
   * Resolve a ticket and send feedback request
   * Requirement 2.2, 2.3, 15.1 (Task 22)
   */
  async resolveTicket(ticketId: string, agentId: string, resolutionNotes?: string): Promise<void> {
    try {
      const ticket = await HandoffTicket.findById(ticketId)
        .populate('userId', 'firstName lastName email');
      if (!ticket || ticket.status !== 'assigned' || ticket.assignedAgentId?.toString() !== agentId) {
        throw new Error('Ticket not available for resolution by this agent');
      }

      const resolvedAt = new Date();
      const resolutionTime = resolvedAt.getTime() - ticket.assignedAt!.getTime();

      // Update ticket
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        status: 'resolved',
        resolvedAt,
        resolutionNotes,
      });

      // Clear SLA timer
      this.clearSLATimer(ticketId);

      // Send automatic feedback request to customer
      await this.sendFeedbackRequest(ticketId, ticket.userId as any);

      // Create broadcast payload
      const ticketResolvedPayload: TicketResolvedPayload = {
        ticketId,
        agentId,
        userId: ticket.userId.toString(),
        resolutionNotes,
        resolvedAt,
        resolutionTime,
        feedbackRequested: true,
      };

      // Broadcast to all agents
      this.broadcastToAgents(SOCKET_EVENTS.TICKET_RESOLVED, ticketResolvedPayload);

      // Notify supervisors
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_RESOLVED, ticketResolvedPayload);

      // Update queue statistics
      await this.broadcastQueueUpdate();

      console.log(`🎫 Ticket resolved: ${ticketId} by Agent ${agentId} (${resolutionTime}ms)`);
      console.log(`📧 Feedback request sent for ticket: ${ticketId}`);

    } catch (error) {
      console.error('❌ Error resolving ticket:', error);
      throw error;
    }
  }

  /**
   * Transfer ticket between agents
   * Requirement 2.2, 2.3
   */
  async transferTicket(ticketId: string, fromAgentId: string, toAgentId: string, reason: string): Promise<void> {
    try {
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.status !== 'assigned' || ticket.assignedAgentId?.toString() !== fromAgentId) {
        throw new Error('Ticket not available for transfer');
      }

      const toAgent = await User.findById(toAgentId);
      if (!toAgent || !toAgent.role || toAgent.role !== 'agent') {
        throw new Error('Invalid target agent for transfer');
      }

      const transferredAt = new Date();

      // Update assignment history
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        assignedAgentId: toAgentId,
        assignedAt: transferredAt,
        $push: {
          assignmentHistory: {
            agentId: toAgentId,
            assignedAt: transferredAt,
          },
        },
        $set: {
          'assignmentHistory.$[elem].unassignedAt': transferredAt,
          'assignmentHistory.$[elem].reason': reason,
        },
      }, {
        arrayFilters: [{ 'elem.agentId': fromAgentId, 'elem.unassignedAt': { $exists: false } }],
      });

      // Create broadcast payload
      const ticketTransferredPayload: TicketTransferredPayload = {
        ticketId,
        fromAgentId,
        toAgentId,
        userId: ticket.userId.toString(),
        reason,
        transferredAt,
        contextPreserved: true,
      };

      // Notify both agents
      this.notifyAgent(fromAgentId, SOCKET_EVENTS.TICKET_TRANSFERRED, ticketTransferredPayload);
      this.notifyAgent(toAgentId, SOCKET_EVENTS.TICKET_TRANSFERRED, ticketTransferredPayload);

      // Notify supervisors
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_TRANSFERRED, ticketTransferredPayload);

      console.log(`🎫 Ticket transferred: ${ticketId} from ${fromAgentId} to ${toAgentId}`);

    } catch (error) {
      console.error('❌ Error transferring ticket:', error);
      throw error;
    }
  }

  /**
   * Escalate ticket to supervisor
   * Requirement 10.3
   */
  async escalateTicket(ticketId: string, reason: string, escalatedBy?: string): Promise<void> {
    try {
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const escalationLevel = ((ticket as any).slaData?.escalationLevel || 0) + 1;
      const escalatedAt = new Date();

      // Update ticket
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        'slaData.escalationLevel': escalationLevel,
        priorityLevel: escalationLevel >= 2 ? 'Emergency' : 'High',
      });

      // Create broadcast payload
      const ticketEscalatedPayload: TicketEscalatedPayload = {
        ticketId,
        userId: ticket.userId.toString(),
        escalationLevel,
        reason,
        escalatedBy,
        escalatedAt,
        supervisorNotified: true,
      };

      // Notify supervisors (high priority)
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_ESCALATED, ticketEscalatedPayload);

      // Notify all agents about priority change
      this.broadcastToAgents(SOCKET_EVENTS.TICKET_ESCALATED, ticketEscalatedPayload);

      console.log(`🚨 Ticket escalated: ${ticketId} (Level ${escalationLevel}) - ${reason}`);

    } catch (error) {
      console.error('❌ Error escalating ticket:', error);
      throw error;
    }
  }

  /**
   * Broadcast queue statistics to all agents
   */
  async broadcastQueueUpdate(): Promise<void> {
    try {
      const queueStats = await this.getQueueStatistics();
      this.broadcastToAgents(SOCKET_EVENTS.TICKET_QUEUE_UPDATE, queueStats);
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_QUEUE_UPDATE, queueStats);
    } catch (error) {
      console.error('❌ Error broadcasting queue update:', error);
    }
  }

  /**
   * Get current queue statistics
   */
  private async getQueueStatistics(): Promise<TicketQueueUpdatePayload> {
    const [totalTickets, waitingTickets, assignedTickets, priorityStats] = await Promise.all([
      HandoffTicket.countDocuments({ status: { $in: ['waiting', 'assigned'] } }),
      HandoffTicket.countDocuments({ status: 'waiting' }),
      HandoffTicket.countDocuments({ status: 'assigned' }),
      HandoffTicket.aggregate([
        { $match: { status: 'waiting' } },
        { $group: { _id: '$priorityLevel', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate average wait time
    const waitingTicketsWithTime = await HandoffTicket.find({ status: 'waiting' }).select('createdAt');
    const now = new Date();
    const waitTimes = waitingTicketsWithTime.map(ticket => now.getTime() - ticket.createdAt.getTime());
    const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    // Format priority stats
    const queueByPriority = {
      emergency: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    priorityStats.forEach((stat: any) => {
      const level = stat._id.toLowerCase();
      if (level in queueByPriority) {
        queueByPriority[level as keyof typeof queueByPriority] = stat.count;
      }
    });

    return {
      totalTickets,
      waitingTickets,
      assignedTickets,
      averageWaitTime,
      longestWaitTime,
      queueByPriority,
    };
  }

  /**
   * Setup SLA monitoring for a ticket
   */
  private setupSLAMonitoring(ticket: any): void {
    const ticketId = ticket._id.toString();
    
    // Clear existing timer if any
    this.clearSLATimer(ticketId);

    // Set warning timer (80% of deadline)
    const responseDeadline = ticket.slaData.responseDeadline.getTime();
    const now = Date.now();
    const timeToWarning = (responseDeadline - now) * 0.8;

    if (timeToWarning > 0) {
      const warningTimer = setTimeout(() => {
        this.handleSLAWarning(ticketId, 'response');
      }, timeToWarning);

      this.slaTimers.set(`${ticketId}_warning`, warningTimer);
    }

    // Set breach timer
    const timeToBreach = responseDeadline - now;
    if (timeToBreach > 0) {
      const breachTimer = setTimeout(() => {
        this.handleSLABreach(ticketId, 'response');
      }, timeToBreach);

      this.slaTimers.set(`${ticketId}_breach`, breachTimer);
    }
  }

  /**
   * Handle SLA warning
   */
  private async handleSLAWarning(ticketId: string, warningType: 'response' | 'resolution'): Promise<void> {
    try {
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.status === 'resolved') return;

      const deadline = warningType === 'response' 
        ? (ticket as any).slaData?.responseDeadline 
        : (ticket as any).slaData?.resolutionDeadline;
      
      const timeRemaining = deadline.getTime() - Date.now();
      
      const warningPayload: TicketSLAWarningPayload = {
        ticketId,
        agentId: ticket.assignedAgentId?.toString(),
        userId: ticket.userId.toString(),
        warningType,
        deadline,
        timeRemaining,
        warningLevel: timeRemaining < 300000 ? 'red' : timeRemaining < 600000 ? 'orange' : 'yellow', // 5min, 10min
      };

      // Notify assigned agent
      if (ticket.assignedAgentId) {
        this.notifyAgent(ticket.assignedAgentId.toString(), SOCKET_EVENTS.TICKET_SLA_WARNING, warningPayload);
      }

      // Notify supervisors
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_SLA_WARNING, warningPayload);

      console.log(`⚠️  SLA Warning: ${ticketId} - ${warningType} deadline in ${Math.round(timeRemaining / 1000)}s`);

    } catch (error) {
      console.error('❌ Error handling SLA warning:', error);
    }
  }

  /**
   * Handle SLA breach
   */
  private async handleSLABreach(ticketId: string, breachType: 'response' | 'resolution'): Promise<void> {
    try {
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.status === 'resolved') return;

      const deadline = breachType === 'response' 
        ? (ticket as any).slaData?.responseDeadline 
        : (ticket as any).slaData?.resolutionDeadline;
      
      const breachTime = Date.now() - deadline.getTime();

      // Mark as overdue
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        'slaData.isOverdue': true,
      });

      const breachPayload: TicketSLABreachPayload = {
        ticketId,
        agentId: ticket.assignedAgentId?.toString(),
        userId: ticket.userId.toString(),
        breachType,
        deadline,
        breachTime,
        escalationTriggered: true,
        supervisorNotified: true,
      };

      // Notify assigned agent
      if (ticket.assignedAgentId) {
        this.notifyAgent(ticket.assignedAgentId.toString(), SOCKET_EVENTS.TICKET_SLA_BREACH, breachPayload);
      }

      // Notify supervisors (high priority)
      this.broadcastToSupervisors(SOCKET_EVENTS.TICKET_SLA_BREACH, breachPayload);

      // Auto-escalate if not already escalated
      if (((ticket as any).slaData?.escalationLevel || 0) === 0) {
        await this.escalateTicket(ticketId, `SLA ${breachType} deadline exceeded`, 'system');
      }

      console.log(`🚨 SLA Breach: ${ticketId} - ${breachType} overdue by ${Math.round(breachTime / 1000)}s`);

    } catch (error) {
      console.error('❌ Error handling SLA breach:', error);
    }
  }

  /**
   * Clear SLA timer for a ticket
   */
  private clearSLATimer(ticketId: string): void {
    const warningTimer = this.slaTimers.get(`${ticketId}_warning`);
    const breachTimer = this.slaTimers.get(`${ticketId}_breach`);

    if (warningTimer) {
      clearTimeout(warningTimer);
      this.slaTimers.delete(`${ticketId}_warning`);
    }

    if (breachTimer) {
      clearTimeout(breachTimer);
      this.slaTimers.delete(`${ticketId}_breach`);
    }
  }

  /**
   * Helper methods for broadcasting
   */
  private broadcastToAgents(event: string, data: any): void {
    if (!this.io) return;
    AgentRoomHelpers.emitToAllAgents(this.io, event, data);
  }

  private broadcastToSupervisors(event: string, data: any): void {
    if (!this.io) return;
    AgentRoomHelpers.emitToSupervisors(this.io, event, data);
  }

  private broadcastToDepartment(department: string, event: string, data: any): void {
    if (!this.io) return;
    AgentRoomHelpers.emitToDepartment(this.io, department, event, data);
  }

  private notifyAgent(agentId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`agent:${agentId}`).emit(event, data);
  }

  /**
   * Utility methods
   */
  private getPriorityLevel(priority: number): 'Low' | 'Medium' | 'High' | 'Emergency' {
    if (priority >= 5) return 'Emergency';
    if (priority >= 4) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  }

  private calculateSLADeadlines(priorityLevel: 'Low' | 'Medium' | 'High' | 'Emergency'): { response: Date; resolution: Date } {
    const now = new Date();
    const responseMinutes = {
      'Emergency': 2,
      'High': 5,
      'Medium': 15,
      'Low': 30,
    }[priorityLevel];

    const resolutionMinutes = {
      'Emergency': 15,
      'High': 60,
      'Medium': 240,
      'Low': 480,
    }[priorityLevel];

    return {
      response: new Date(now.getTime() + responseMinutes * 60000),
      resolution: new Date(now.getTime() + resolutionMinutes * 60000),
    };
  }

  private async getQueuePosition(ticketId: string): Promise<number> {
    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) return 0;

    const position = await HandoffTicket.countDocuments({
      status: 'waiting',
      $or: [
        { priority: { $gt: ticket.priority } },
        { priority: ticket.priority, createdAt: { $lt: ticket.createdAt } },
      ],
    });

    return position + 1;
  }

  private async calculateEstimatedWaitTime(queuePosition: number, priorityLevel: string): Promise<number> {
    // Simple estimation: 5 minutes per position for normal tickets, 2 minutes for high priority
    const baseTime = priorityLevel === 'Emergency' || priorityLevel === 'High' ? 2 : 5;
    return queuePosition * baseTime * 60000; // milliseconds
  }

  /**
   * Send automatic feedback request to customer after ticket resolution
   * Task 22: Customer Feedback System - Requirement 15.1
   */
  private async sendFeedbackRequest(ticketId: string, user: any): Promise<void> {
    try {
      // Generate feedback URL
      const feedbackUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/feedback/${ticketId}`;
      
      // Log feedback request (in production, this would send an email)
      console.log(`📧 Sending feedback request to ${user.email} for ticket ${ticketId}`);
      console.log(`🔗 Feedback URL: ${feedbackUrl}`);
      
      // In a real implementation, this would integrate with an email service
      // Example:
      // await emailService.sendFeedbackRequest({
      //   to: user.email,
      //   customerName: `${user.firstName} ${user.lastName}`,
      //   ticketId,
      //   feedbackUrl,
      // });

      // For now, we'll emit a socket event to notify the customer (if connected)
      if (this.io) {
        this.io.to(`user_${user._id}`).emit(SOCKET_EVENTS.FEEDBACK_REQUEST, {
          ticketId,
          feedbackUrl,
          message: 'Please rate your support experience',
        });
      }

    } catch (error) {
      console.error('❌ Error sending feedback request:', error);
      // Don't throw error - feedback request failure shouldn't prevent ticket resolution
    }
  }
}

// Export singleton instance
export default new TicketManagerService();