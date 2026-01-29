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
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.role || !['agent', 'supervisor', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.',
      });
      return;
    }

    const tickets = await HandoffTicket.find({ status: 'waiting' })
      .populate('userId', 'firstName lastName email')
      .populate('conversationId')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

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
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          id: ticket._id,
          subject: ticket.reason,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
        customer: {
          id: ticket.userId._id,
          name: `${(ticket.userId as any).firstName} ${(ticket.userId as any).lastName}`,
          email: (ticket.userId as any).email,
        },
        conversationHistory: ticket.conversationContext || [],
      },
    });

  } catch (error) {
    console.error('Error fetching ticket history:', error);
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

