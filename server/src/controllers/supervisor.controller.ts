import { Request, Response } from 'express';
import User from '../shared/models/User.model';
import HandoffTicket from '../shared/models/HandoffTicket.model';

// Extend Request type to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    authProvider: string;
    role?: string;
    permissions?: string[];
    department?: 'Legal' | 'RTI' | 'Emergency';
  };
}
import { Types } from 'mongoose';

/**
 * Supervisor Controller
 * Task 23: Supervisor Dashboard and Team Management
 */

/**
 * Get team overview statistics
 */
export const getTeamOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 SUPERVISOR CONTROLLER - getTeamOverview called');
    console.log('🔍 SUPERVISOR CONTROLLER - req.user:', JSON.stringify(req.user, null, 2));
    
    const supervisorId = req.user?.userId;
    if (!supervisorId) {
      console.log('❌ SUPERVISOR CONTROLLER - No supervisorId found');
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Get all agents
    const agents = await User.find({ role: 'agent' }).select('firstName lastName email agentStatus createdAt');
    
    // Get ticket statistics
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [totalTickets, resolvedToday, pendingTickets, assignedTickets] = await Promise.all([
      HandoffTicket.countDocuments({}),
      HandoffTicket.countDocuments({ status: 'resolved', resolvedAt: { $gte: startOfDay } }),
      HandoffTicket.countDocuments({ status: 'waiting' }),
      HandoffTicket.countDocuments({ status: 'assigned' })
    ]);

    const teamStats = {
      totalAgents: agents.length,
      activeAgents: agents.filter(agent => agent.agentStatus === 'available').length,
      totalTickets,
      resolvedToday,
      pendingTickets,
      assignedTickets,
      resolutionRate: totalTickets > 0 ? (resolvedToday / totalTickets) * 100 : 0
    };

    res.status(200).json({
      success: true,
      data: { teamStats, agents }
    });
  } catch (error) {
    console.error('Error fetching team overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team overview' });
  }
};

/**
 * Get agent performance metrics
 */
export const getAgentPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { timeRange = 'week' } = req.query;
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
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const agents = await User.find({ role: 'agent' }).select('firstName lastName email');
    const agentPerformance = [];

    for (const agent of agents) {
      const tickets = await HandoffTicket.find({
        assignedAgentId: agent._id,
        assignedAt: { $gte: startDate }
      });

      const resolvedTickets = tickets.filter(t => t.status === 'resolved');
      const feedbackTickets = tickets.filter(t => t.userFeedback?.rating);
      const avgRating = feedbackTickets.length > 0 
        ? feedbackTickets.reduce((sum, t) => sum + t.userFeedback!.rating, 0) / feedbackTickets.length 
        : 0;

      agentPerformance.push({
        agentId: agent._id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        ticketsAssigned: tickets.length,
        ticketsResolved: resolvedTickets.length,
        resolutionRate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
        averageRating: Math.round(avgRating * 10) / 10,
        feedbackCount: feedbackTickets.length
      });
    }

    res.status(200).json({
      success: true,
      data: { agentPerformance, timeRange }
    });
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agent performance' });
  }
};

/**
 * Reassign ticket to different agent
 */
export const reassignTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { newAgentId, reason } = req.body;

    if (!newAgentId) {
      res.status(400).json({ success: false, message: 'New agent ID is required' });
      return;
    }

    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const newAgent = await User.findById(newAgentId);
    if (!newAgent || newAgent.role !== 'agent') {
      res.status(400).json({ success: false, message: 'Invalid agent ID' });
      return;
    }

    await HandoffTicket.findByIdAndUpdate(ticketId, {
      assignedAgentId: new Types.ObjectId(newAgentId),
      status: 'assigned',
      assignedAt: new Date(),
      reassignmentReason: reason || 'Supervisor reassignment'
    });

    res.status(200).json({
      success: true,
      message: 'Ticket reassigned successfully'
    });
  } catch (error) {
    console.error('Error reassigning ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to reassign ticket' });
  }
};

/**
 * Get workload distribution
 */
export const getWorkloadDistribution = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agents = await User.find({ role: 'agent' }).select('firstName lastName email');
    const workloadData = [];

    for (const agent of agents) {
      const [assignedCount, resolvedCount] = await Promise.all([
        HandoffTicket.countDocuments({ assignedAgentId: agent._id, status: 'assigned' }),
        HandoffTicket.countDocuments({ assignedAgentId: agent._id, status: 'resolved' })
      ]);

      workloadData.push({
        agentId: agent._id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        assignedTickets: assignedCount,
        resolvedTickets: resolvedCount,
        totalTickets: assignedCount + resolvedCount
      });
    }

    res.status(200).json({
      success: true,
      data: { workloadData }
    });
  } catch (error) {
    console.error('Error fetching workload distribution:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workload distribution' });
  }
};

/**
 * Update agent status (supervisor override)
 */
export const updateAgentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'busy', 'away', 'offline'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
      return;
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }

    await User.findByIdAndUpdate(agentId, { agentStatus: status });

    res.status(200).json({
      success: true,
      message: 'Agent status updated successfully'
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({ success: false, message: 'Failed to update agent status' });
  }
};