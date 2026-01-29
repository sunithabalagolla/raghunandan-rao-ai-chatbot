import { Request, Response } from 'express';
import HandoffTicket from '../shared/models/HandoffTicket.model';
import conversationService from '../services/conversation.service';
import { Types } from 'mongoose';
import { getIO } from '../socket/socketServer';

/**
 * Handoff Controller
 * Handles HTTP requests for handoff ticket management
 */

/**
 * Request handoff to human agent
 */
export const requestHandoff = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId, reason, priority } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!conversationId) {
      res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
      return;
    }

    // Check if there's already a pending ticket for this conversation
    const existingTicket = await HandoffTicket.findOne({
      conversationId: new Types.ObjectId(conversationId),
      status: { $in: ['waiting', 'assigned'] },
    });

    if (existingTicket) {
      res.status(400).json({
        success: false,
        message: 'Handoff request already exists for this conversation',
        data: existingTicket,
      });
      return;
    }

    // Get conversation context
    const context = await conversationService.getConversationContext(conversationId, 10);

    // Create handoff ticket
    const ticket = await HandoffTicket.create({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId),
      status: 'waiting',
      priority: priority || 3,
      reason: reason || 'User requested human agent',
      conversationContext: context,
    });

    // Calculate queue position
    const queuePosition = await HandoffTicket.countDocuments({
      status: 'waiting',
      createdAt: { $lt: ticket.createdAt },
    });

    // Notify agents via Socket.io
    const io = getIO();
    io.to('agents').emit('handoff:new-ticket', {
      ticketId: ticket._id,
      userId,
      reason: ticket.reason,
      priority: ticket.priority,
      queuePosition: queuePosition + 1,
    });

    res.status(201).json({
      success: true,
      message: 'Handoff request created successfully',
      data: {
        ticket,
        queuePosition: queuePosition + 1,
      },
    });
  } catch (error) {
    console.error('Error requesting handoff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create handoff request',
    });
  }
};

/**
 * Get queue status for user
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Find user's pending ticket
    const query: any = {
      userId: new Types.ObjectId(userId),
      status: 'waiting',
    };

    if (conversationId) {
      query.conversationId = new Types.ObjectId(conversationId as string);
    }

    const ticket = await HandoffTicket.findOne(query).sort({ createdAt: -1 });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'No pending handoff request found',
      });
      return;
    }

    // Calculate queue position
    const queuePosition = await HandoffTicket.countDocuments({
      status: 'waiting',
      createdAt: { $lt: ticket.createdAt },
    });

    // Estimate wait time (5 minutes per ticket ahead)
    const estimatedWaitMinutes = (queuePosition + 1) * 5;

    res.status(200).json({
      success: true,
      data: {
        ticketId: ticket._id,
        status: ticket.status,
        queuePosition: queuePosition + 1,
        estimatedWaitMinutes,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue status',
    });
  }
};

/**
 * Cancel handoff request
 */
export const cancelHandoff = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const ticket = await HandoffTicket.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        status: { $in: ['waiting', 'assigned'] },
      },
      {
        $set: {
          status: 'cancelled',
          resolvedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Handoff ticket not found or already resolved',
      });
      return;
    }

    // Notify agent if ticket was assigned
    if (ticket.assignedAgentId) {
      const io = getIO();
      io.to(`agent:${ticket.assignedAgentId}`).emit('handoff:cancelled', {
        ticketId: ticket._id,
        userId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Handoff request cancelled successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error cancelling handoff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel handoff request',
    });
  }
};

/**
 * Get user's handoff history
 */
export const getHandoffHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const tickets = await HandoffTicket.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Error fetching handoff history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handoff history',
    });
  }
};
