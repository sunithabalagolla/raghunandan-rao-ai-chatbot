import { Request, Response } from 'express';
import HandoffTicket from '../shared/models/HandoffTicket.model';
import User from '../shared/models/User.model';
import { Types } from 'mongoose';
import ticketManager from '../services/ticketManager.service';

/**
 * Agent Controller
 * Handles HTTP requests for agent operations
 */

/**
 * Get all pending tickets (for agents)
 */
export const getPendingTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🎫 GET PENDING TICKETS - Agent request received');
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      console.log('❌ No userId in request');
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      console.log('❌ User not found or invalid role:', user?.role);
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    console.log('🔍 Searching for tickets with status: waiting');
    const tickets = await HandoffTicket.find({ status: 'waiting' })
      .populate('userId', 'firstName lastName email')
      .populate('conversationId')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    console.log(`📋 Found ${tickets.length} waiting tickets`);
    
    // Also check all tickets for debugging
    const allTickets = await HandoffTicket.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`🔍 Recent tickets (for debugging):`);
    allTickets.forEach((ticket, i) => {
      console.log(`   ${i + 1}. ${ticket._id} - Status: ${ticket.status} - Priority: ${ticket.priorityLevel} - Created: ${ticket.createdAt}`);
    });

    res.status(200).json({
      success: true,
      data: { tickets, total: tickets.length },
    });

  } catch (error) {
    console.error('Error fetching pending tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending tickets',
    });
  }
};

/**
 * Get agent's assigned tickets
 */
export const getAssignedTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = (req as any).user?.userId;
    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const tickets = await HandoffTicket.find({
      assignedAgentId: new Types.ObjectId(agentId),
      status: 'assigned',
    })
      .populate('userId', 'firstName lastName email')
      .populate('conversationId')
      .sort({ assignedAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { tickets, total: tickets.length },
    });

  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned tickets',
    });
  }
};

/**
 * Accept a ticket from the queue
 */
export const acceptTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = (req as any).user?.userId;
    const { id: ticketId } = req.params;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    await ticketManager.assignTicket(ticketId, agentId, 'manual');

    const ticket = await HandoffTicket.findById(ticketId)
      .populate('userId', 'firstName lastName email')
      .populate('conversationId')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Ticket accepted successfully',
      data: { ticket },
    });

  } catch (error: any) {
    console.error('Error accepting ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept ticket',
    });
  }
};

/**
 * Resolve a ticket
 */
export const resolveTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = (req as any).user?.userId;
    const { id: ticketId } = req.params;
    const { resolutionNotes } = req.body;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    await ticketManager.resolveTicket(ticketId, agentId, resolutionNotes);

    res.status(200).json({
      success: true,
      message: 'Ticket resolved successfully',
    });

  } catch (error: any) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resolve ticket',
    });
  }
};

/**
 * Update agent status
 */
export const updateAgentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = (req as any).user?.userId;
    const { status } = req.body;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const validStatuses = ['available', 'busy', 'away', 'offline'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      });
      return;
    }

    await User.findByIdAndUpdate(agentId, { agentStatus: status });

    res.status(200).json({
      success: true,
      message: 'Agent status updated successfully',
      data: { status },
    });

  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent status',
    });
  }
};

/**
 * Get agent statistics
 */
export const getAgentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = (req as any).user?.userId;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayTickets = await HandoffTicket.find({
      assignedAgentId: new Types.ObjectId(agentId),
      assignedAt: { $gte: startOfDay },
    });

    const resolvedToday = todayTickets.filter(ticket => ticket.status === 'resolved');
    const activeTickets = await HandoffTicket.find({
      assignedAgentId: new Types.ObjectId(agentId),
      status: 'assigned',
    });

    const stats = {
      today: {
        ticketsAssigned: todayTickets.length,
        ticketsResolved: resolvedToday.length,
        averageResponseTime: 0,
        activeTickets: activeTickets.length,
      },
      overall: {
        totalTicketsHandled: todayTickets.length,
        resolutionRate: todayTickets.length > 0 ? (resolvedToday.length / todayTickets.length) * 100 : 0,
        averageRating: 4.2,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent statistics',
    });
  }
};

/**
 * Get agent profile
 */
export const getAgentProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(agentId);

    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        agentStatus: user.agentStatus,
        agentProfile: user.agentProfile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent profile',
    });
  }
};

/**
 * Update agent profile
 */
export const updateAgentProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No update data provided',
      });
      return;
    }

    const user = await User.findById(agentId);

    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      agentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found after update',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Agent profile updated successfully',
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        agentStatus: updatedUser.agentStatus,
        agentProfile: updatedUser.agentProfile,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent profile',
    });
  }
};

/**
 * Get ticket conversation history
 */
export const getTicketHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { id: ticketId } = req.params;

    console.log(`🔍 HISTORY DEBUG: Agent ${agentId} requesting history for ticket ${ticketId}`);

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const ticket = await HandoffTicket.findById(ticketId)
      .populate('userId', 'firstName lastName email phoneNumber')
      .lean();

    if (!ticket) {
      console.log(`❌ HISTORY DEBUG: Ticket ${ticketId} not found`);
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    console.log(`🔍 HISTORY DEBUG: Found ticket ${ticketId}`);
    console.log(`🔍 HISTORY DEBUG: Conversation context length: ${ticket.conversationContext?.length || 0}`);
    console.log(`🔍 HISTORY DEBUG: Conversation context:`, JSON.stringify(ticket.conversationContext, null, 2));

    const conversationHistory = ticket.conversationContext || [];
    
    // Count messages by role for debugging
    const messageCounts = conversationHistory.reduce((acc: any, msg: any) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`🔍 HISTORY DEBUG: Message counts by role:`, messageCounts);

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          id: ticket._id,
          subject: ticket.reason,
          priority: ticket.priority,
          priorityLevel: ticket.priorityLevel || 'Medium',
          status: ticket.status,
          createdAt: ticket.createdAt,
          assignedAt: ticket.assignedAt,
          reason: ticket.reason,
        },
        customer: {
          id: ticket.userId._id,
          name: `${(ticket.userId as any).firstName} ${(ticket.userId as any).lastName}`,
          email: (ticket.userId as any).email,
          phone: (ticket.userId as any).phoneNumber,
        },
        conversationHistory: conversationHistory,
        slaInfo: {
          responseTimeRemaining: 3600000, // 1 hour in ms - should be calculated
          resolutionTimeRemaining: 14400000, // 4 hours in ms - should be calculated  
          isResponseOverdue: false,
          isResolutionOverdue: false,
          responseDeadline: new Date(Date.now() + 3600000).toISOString(),
          resolutionDeadline: new Date(Date.now() + 14400000).toISOString(),
        },
        pagination: {
          total: conversationHistory.length,
          skip: 0,
          limit: 50,
          hasMore: false,
        },
      },
    });

    console.log(`✅ HISTORY DEBUG: Returned ${conversationHistory.length} messages to agent`);

  } catch (error) {
    console.error('❌ HISTORY DEBUG: Error fetching ticket history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket history',
    });
  }
};

/**
 * Transfer a ticket to another agent
 */
export const transferTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { id: ticketId } = req.params;
    const { toAgentId, reason } = req.body;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!toAgentId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Target agent ID and reason are required',
      });
      return;
    }

    await ticketManager.transferTicket(ticketId, agentId, toAgentId, reason);

    res.status(200).json({
      success: true,
      message: 'Ticket transferred successfully',
    });

  } catch (error: any) {
    console.error('Error transferring ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to transfer ticket',
    });
  }
};

/**
 * Escalate a ticket
 */
export const escalateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { id: ticketId } = req.params;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    await HandoffTicket.findByIdAndUpdate(ticketId, {
      $set: {
        priority: Math.max(ticket.priority, 4),
        priorityLevel: 'Emergency',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Ticket escalated successfully',
    });

  } catch (error) {
    console.error('Error escalating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate ticket',
    });
  }
};

/**
 * Get ticket queue statistics
 */
export const getQueueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const [totalWaiting, totalAssigned] = await Promise.all([
      HandoffTicket.countDocuments({ status: 'waiting' }),
      HandoffTicket.countDocuments({ status: 'assigned' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalWaiting,
        totalAssigned,
        averageWaitTime: 0,
        queueByPriority: {
          emergency: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue statistics',
    });
  }
};

/**
 * Get SLA compliance metrics
 */
export const getSLACompliance = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets: 0,
        onTimeResponses: 0,
        overdueResponses: 0,
        complianceRate: 100,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        escalatedTickets: 0,
      },
    });

  } catch (error) {
    console.error('Error fetching SLA compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SLA compliance data',
    });
  }
};

/**
 * Get agent performance metrics
 */
export const getAgentPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        daily: {
          chatsHandled: 0,
          averageResponseTime: 0,
          resolutionRate: 0,
          activeTime: 0,
          customerSatisfaction: 0,
        },
        session: {
          activeTime: 0,
          chatsHandled: 0,
          currentChats: 0,
        },
        historical: [],
        teamAverages: {
          chatsHandled: 0,
          averageResponseTime: 0,
          resolutionRate: 0,
          customerSatisfaction: 0,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance data',
    });
  }
};

/**
 * Submit customer feedback for a resolved ticket
 * Task 22: Customer Feedback System
 */
export const submitCustomerFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: ticketId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
      return;
    }

    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    if (ticket.status !== 'resolved') {
      res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for resolved tickets',
      });
      return;
    }

    if (ticket.userFeedback) {
      res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this ticket',
      });
      return;
    }

    await HandoffTicket.findByIdAndUpdate(ticketId, {
      $set: {
        userFeedback: {
          rating,
          comment: comment || '',
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        ticketId,
        rating,
        comment: comment || '',
      },
    });

  } catch (error) {
    console.error('Error submitting customer feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
};

/**
 * Get feedback statistics for an agent
 * Task 22: Customer Feedback System
 */
export const getAgentFeedbackStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { timeRange = 'month' } = req.query;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || !agent.role || !['agent', 'supervisor', 'admin'].includes(agent.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const ticketsWithFeedback = await HandoffTicket.find({
      assignedAgentId: new Types.ObjectId(agentId),
      status: 'resolved',
      resolvedAt: { $gte: startDate },
      'userFeedback.rating': { $exists: true },
    }).select('userFeedback resolvedAt priority');

    const totalFeedbacks = ticketsWithFeedback.length;
    const ratings = ticketsWithFeedback.map(ticket => ticket.userFeedback!.rating);
    const averageRating = totalFeedbacks > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / totalFeedbacks 
      : 0;

    const ratingDistribution = {
      1: ratings.filter(r => r === 1).length,
      2: ratings.filter(r => r === 2).length,
      3: ratings.filter(r => r === 3).length,
      4: ratings.filter(r => r === 4).length,
      5: ratings.filter(r => r === 5).length,
    };

    const recentFeedback = ticketsWithFeedback
      .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
      .slice(0, 10)
      .map(ticket => ({
        ticketId: ticket._id,
        rating: ticket.userFeedback!.rating,
        comment: ticket.userFeedback!.comment,
        resolvedAt: ticket.resolvedAt,
        priority: ticket.priority,
      }));

    const teamTicketsWithFeedback = await HandoffTicket.find({
      status: 'resolved',
      resolvedAt: { $gte: startDate },
      'userFeedback.rating': { $exists: true },
      assignedAgentId: { $exists: true },
    }).select('userFeedback assignedAgentId');

    const teamRatings = teamTicketsWithFeedback.map(ticket => ticket.userFeedback!.rating);
    const teamAverageRating = teamRatings.length > 0 
      ? teamRatings.reduce((sum, rating) => sum + rating, 0) / teamRatings.length 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        recentFeedback,
        teamAverageRating: Math.round(teamAverageRating * 10) / 10,
        timeRange,
        dateRange: {
          start: startDate,
          end: now,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching agent feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
    });
  }
};


/**
 * Template Management Functions
 */

/**
 * One-time template seeding endpoint (can remove after use)
 */
export const seedTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    // FORCE DELETE ALL EXISTING TEMPLATES AND RE-SEED
    console.log('🗑️ Deleting all existing templates...');
    await CannedResponse.deleteMany({});
    
    console.log('🌱 Creating fresh templates with isShared: true...');
    
    // Sample templates array
    const templates = [
      {
        title: 'Greeting - Welcome',
        content: 'Hello {{customerName}}! Thank you for contacting us. I\'m {{agentName}} and I\'m here to help you today. How can I assist you?',
        category: 'Greeting',
        language: 'en',
        tags: ['welcome', 'intro'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'Technical - Password Reset',
        content: 'I can help you reset your password. Please check your email for password reset instructions. The link will expire in 24 hours.',
        category: 'General',
        language: 'en',
        tags: ['password', 'reset'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'Closing - Resolved',
        content: 'I\'m glad I could help resolve your issue today! Is there anything else I can assist you with? If not, I\'ll close this ticket.',
        category: 'Closing',
        language: 'en',
        tags: ['resolved', 'thanks'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'Escalation - To Supervisor',
        content: 'I understand your concern. Let me escalate this to my supervisor for further assistance. They will contact you within 24 hours.',
        category: 'Emergency',
        language: 'en',
        tags: ['supervisor', 'escalate'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'General - Need More Info',
        content: 'To better assist you, could you please provide more details about your issue? Any additional information would be helpful.',
        category: 'General',
        language: 'en',
        tags: ['info', 'details'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'Billing - Account Verification',
        content: 'For security purposes, I\'ll need to verify your account. Could you please provide your account number or the email address associated with your account?',
        category: 'General',
        language: 'en',
        tags: ['billing', 'verification', 'security'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      },
      {
        title: 'Hold - Investigating',
        content: 'Thank you for your patience, {{customerName}}. I\'m currently looking into this for you. Please give me a moment to review your account and find the best solution.',
        category: 'General',
        language: 'en',
        tags: ['hold', 'patience', 'investigation'],
        isShared: true,
        isActive: true,
        usageCount: 0,
        createdBy: req.user?.userId || new Types.ObjectId()
      }
    ];
    
    // Insert templates
    const created = await CannedResponse.insertMany(templates);
    
    console.log(`✅ Seeded ${created.length} templates successfully`);
    
    res.json({
      success: true,
      message: `Templates seeded successfully! Created ${created.length} templates.`,
      count: created.length,
      templates: created.map((t: any) => ({ id: t._id, title: t.title, category: t.category }))
    });
    
  } catch (error) {
    console.error('❌ Template seeding error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to seed templates',
      error: (error as Error).message 
    });
  }
};

/**
 * Get all templates for the agent
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    console.log('📋 GET TEMPLATES - Agent request received for:', agentId);

    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    // Debug: Check all templates in database
    const allTemplates = await CannedResponse.find({});
    console.log(`🔍 DEBUG: Total templates in database: ${allTemplates.length}`);
    allTemplates.forEach((template: any, index: number) => {
      console.log(`🔍 Template ${index + 1}:`, {
        id: template._id,
        title: template.title,
        createdBy: template.createdBy,
        isShared: template.isShared,
        isActive: template.isActive
      });
    });
    
    // Get templates (both personal and shared)
    const templates = await CannedResponse.find({
      isActive: true,
      $or: [
        { createdBy: agentId }, // Personal templates
        { isShared: true }      // Shared templates
      ]
    }).sort({ usageCount: -1, createdAt: -1 });

    console.log(`🔍 DEBUG: Query for agentId: ${agentId}`);
    console.log(`🔍 DEBUG: Templates matching query: ${templates.length}`);

    console.log(`✅ Found ${templates.length} templates for agent`);

    res.json({
      success: true,
      data: {
        templates: templates,
        totalCount: templates.length
      }
    });
  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch templates' 
    });
  }
};

/**
 * Create a new template
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { title, content, category, language, tags, isShared } = req.body;

    if (!title || !content || !category) {
      res.status(400).json({
        success: false,
        message: 'Title, content, and category are required',
      });
      return;
    }

    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    const template = await CannedResponse.create({
      title,
      content,
      category,
      language: language || 'en',
      tags: tags || [],
      isShared: isShared || false,
      createdBy: agentId,
      isActive: true,
      usageCount: 0
    });

    console.log(`✅ Created template: ${template.title}`);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error in createTemplate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create template' 
    });
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const templateId = req.params.id;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    // Find template and verify ownership
    const template = await CannedResponse.findOne({
      _id: templateId,
      createdBy: agentId,
      isActive: true
    });

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found or access denied',
      });
      return;
    }

    const { title, content, category, language, tags, isShared } = req.body;
    
    const updatedTemplate = await CannedResponse.findByIdAndUpdate(
      templateId,
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(language && { language }),
        ...(tags && { tags }),
        ...(isShared !== undefined && { isShared })
      },
      { new: true }
    );

    console.log(`✅ Updated template: ${updatedTemplate?.title}`);

    res.json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update template' 
    });
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const templateId = req.params.id;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    // Find template and verify ownership
    const template = await CannedResponse.findOne({
      _id: templateId,
      createdBy: agentId,
      isActive: true
    });

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found or access denied',
      });
      return;
    }

    // Soft delete by setting isActive to false
    await CannedResponse.findByIdAndUpdate(templateId, { isActive: false });

    console.log(`✅ Deleted template: ${template.title}`);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete template' 
    });
  }
};

/**
 * Update template usage statistics
 */
export const updateTemplateUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const templateId = req.params.id;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const CannedResponse = require('../shared/models/CannedResponse.model').default;
    
    // Update usage count and last used date
    const template = await CannedResponse.findByIdAndUpdate(
      templateId,
      {
        $inc: { usageCount: 1 },
        lastUsedAt: new Date()
      },
      { new: true }
    );

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    console.log(`✅ Updated usage for template: ${template.title} (count: ${template.usageCount})`);

    res.json({
      success: true,
      data: {
        templateId: template._id,
        usageCount: template.usageCount,
        lastUsedAt: template.lastUsedAt
      }
    });
  } catch (error) {
    console.error('Error in updateTemplateUsage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update template usage' 
    });
  }
};

/**
 * Settings Management Functions
 * PHASE 2: API ENDPOINTS
 */

/**
 * Get agent settings
 * GET /api/agent/settings
 */
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(agentId);
    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    // Extract settings from agentProfile.preferences
    const settings = {
      notifications: {
        browserNotifications: user.agentProfile?.preferences?.browserNotifications ?? true,
        soundAlerts: user.agentProfile?.preferences?.soundAlerts ?? true,
        soundVolume: user.agentProfile?.preferences?.soundVolume ?? 70,
      },
      work: {
        autoRefreshInterval: user.agentProfile?.preferences?.autoRefreshInterval ?? '1m',
        maxConcurrentChats: user.agentProfile?.maxConcurrentChats ?? 5,
      },
      display: {
        theme: user.agentProfile?.preferences?.theme ?? 'light',
      },
    };

    console.log(`✅ Retrieved settings for agent: ${agentId}`);

    res.status(200).json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('Error fetching agent settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
    });
  }
};

/**
 * Update agent settings
 * PUT /api/agent/settings
 */
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { notifications, work, display } = req.body;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(agentId);
    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    // Build update object
    const updateData: any = {};

    // Notification settings
    if (notifications) {
      if (notifications.browserNotifications !== undefined) {
        updateData['agentProfile.preferences.browserNotifications'] = notifications.browserNotifications;
      }
      if (notifications.soundAlerts !== undefined) {
        updateData['agentProfile.preferences.soundAlerts'] = notifications.soundAlerts;
      }
      if (notifications.soundVolume !== undefined) {
        if (notifications.soundVolume < 0 || notifications.soundVolume > 100) {
          res.status(400).json({
            success: false,
            message: 'Sound volume must be between 0 and 100',
          });
          return;
        }
        updateData['agentProfile.preferences.soundVolume'] = notifications.soundVolume;
      }
    }

    // Work settings
    if (work) {
      if (work.autoRefreshInterval !== undefined) {
        const validIntervals = ['30s', '1m', '2m', '5m'];
        if (!validIntervals.includes(work.autoRefreshInterval)) {
          res.status(400).json({
            success: false,
            message: 'Invalid auto-refresh interval. Must be one of: ' + validIntervals.join(', '),
          });
          return;
        }
        updateData['agentProfile.preferences.autoRefreshInterval'] = work.autoRefreshInterval;
      }
      if (work.maxConcurrentChats !== undefined) {
        if (work.maxConcurrentChats < 1 || work.maxConcurrentChats > 10) {
          res.status(400).json({
            success: false,
            message: 'Max concurrent chats must be between 1 and 10',
          });
          return;
        }
        updateData['agentProfile.maxConcurrentChats'] = work.maxConcurrentChats;
      }
    }

    // Display settings
    if (display) {
      if (display.theme !== undefined) {
        const validThemes = ['light', 'dark'];
        if (!validThemes.includes(display.theme)) {
          res.status(400).json({
            success: false,
            message: 'Invalid theme. Must be one of: ' + validThemes.join(', '),
          });
          return;
        }
        updateData['agentProfile.preferences.theme'] = display.theme;
      }
    }

    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      agentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found after update',
      });
      return;
    }

    // Return updated settings
    const settings = {
      notifications: {
        browserNotifications: updatedUser.agentProfile?.preferences?.browserNotifications ?? true,
        soundAlerts: updatedUser.agentProfile?.preferences?.soundAlerts ?? true,
        soundVolume: updatedUser.agentProfile?.preferences?.soundVolume ?? 70,
      },
      work: {
        autoRefreshInterval: updatedUser.agentProfile?.preferences?.autoRefreshInterval ?? '1m',
        maxConcurrentChats: updatedUser.agentProfile?.maxConcurrentChats ?? 5,
      },
      display: {
        theme: updatedUser.agentProfile?.preferences?.theme ?? 'light',
      },
    };

    console.log(`✅ Updated settings for agent: ${agentId}`);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });

  } catch (error) {
    console.error('Error updating agent settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
};

/**
 * Change agent password
 * POST /api/agent/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!agentId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Get user with password hash
    const user = await User.findById(agentId).select('+passwordHash');
    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(agentId, {
      passwordHash: newPasswordHash,
    });

    console.log(`✅ Password changed for agent: ${agentId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Error changing agent password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};