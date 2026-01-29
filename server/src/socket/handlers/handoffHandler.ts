import { Types } from 'mongoose';
import HandoffTicket from '../../shared/models/HandoffTicket.model';
import Conversation from '../../shared/models/Conversation.model';
import User from '../../shared/models/User.model';

/**
 * Handoff Socket Event Handlers
 * Handles agent handoff requests and agent-user communication
 */

export function registerHandoffHandlers(io: any, socket: any) {
  /**
   * User requests handoff to human agent
   */
  socket.on('user:request-handoff', async (data: { conversationId: string; reason: string }) => {
    try {
      const { conversationId, reason } = data;
      const userId = socket.userId;

      // Get conversation for context
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Get last 10 messages for context
      const context = conversation.messages.slice(-10);

      // Create handoff ticket
      const ticket = await HandoffTicket.create({
        userId,
        conversationId,
        reason: reason || 'User requested human assistance',
        conversationContext: context,
        status: 'waiting',
        priority: 1,
      });

      // Join ticket room
      socket.join(`ticket:${ticket._id}`);

      // Notify all available agents
      io.to('agents').emit('agent:new-ticket', {
        ticket: {
          _id: ticket._id,
          userId: ticket.userId,
          conversationId: ticket.conversationId,
          reason: ticket.reason,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
          conversationContext: context,
        },
      });

      // Calculate queue position
      const queuePosition = await HandoffTicket.countDocuments({
        status: 'waiting',
        createdAt: { $lt: ticket.createdAt },
      });

      // Send confirmation to user
      socket.emit('handoff:queued', {
        ticketId: ticket._id,
        position: queuePosition + 1,
        estimatedWaitMinutes: (queuePosition + 1) * 5, // Rough estimate
      });

      console.log(`Handoff requested: User ${userId} - Ticket ${ticket._id}`);
    } catch (error: any) {
      console.error('Handoff request error:', error);
      socket.emit('error', { message: 'Failed to request handoff', error: error.message });
    }
  });

  /**
   * Agent connects and marks as available
   */
  socket.on('agent:connect', async () => {
    try {
      const userId = socket.userId;

      // Update agent status
      await User.findByIdAndUpdate(userId, {
        agentStatus: 'available',
      });

      // Join agents room
      socket.join('agents');

      // Get pending tickets
      const pendingTickets = await HandoffTicket.find({ status: 'waiting' })
        .sort({ priority: -1, createdAt: 1 })
        .limit(20)
        .populate('userId', 'email firstName lastName');

      socket.emit('agent:connected', {
        pendingTickets,
      });

      console.log(`Agent connected: ${userId}`);
    } catch (error: any) {
      console.error('Agent connect error:', error);
      socket.emit('error', { message: 'Failed to connect as agent', error: error.message });
    }
  });

  /**
   * Agent accepts a ticket
   */
  socket.on('agent:accept-ticket', async (data: { ticketId: string }) => {
    try {
      const { ticketId } = data;
      const agentId = socket.userId;

      // Find and update ticket
      const ticket = await HandoffTicket.findOneAndUpdate(
        { _id: ticketId, status: 'waiting' },
        {
          status: 'assigned',
          assignedAgentId: agentId,
          assignedAt: new Date(),
        },
        { new: true }
      );

      if (!ticket) {
        socket.emit('error', { message: 'Ticket not available or already assigned' });
        return;
      }

      // Update agent status
      await User.findByIdAndUpdate(agentId, {
        agentStatus: 'busy',
      });

      // Join ticket room
      socket.join(`ticket:${ticketId}`);

      // Notify user that agent joined
      io.to(`user:${ticket.userId}`).emit('agent:joined', {
        ticketId: ticket._id,
        agentId,
        message: 'A support agent has joined the conversation',
      });

      // Confirm to agent
      socket.emit('ticket:accepted', {
        ticket,
      });

      console.log(`Ticket ${ticketId} accepted by agent ${agentId}`);
    } catch (error: any) {
      console.error('Accept ticket error:', error);
      socket.emit('error', { message: 'Failed to accept ticket', error: error.message });
    }
  });

  /**
   * Agent sends message to user
   */
  socket.on('agent:message', async (data: { ticketId: string; content: string }) => {
    try {
      const { ticketId, content } = data;
      const agentId = socket.userId;

      // Get ticket
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.assignedAgentId?.toString() !== agentId) {
        socket.emit('error', { message: 'Unauthorized or ticket not found' });
        return;
      }

      // Add message to conversation
      const conversation = await Conversation.findById(ticket.conversationId);
      if (conversation) {
        const agentMessage = {
          _id: new Types.ObjectId().toString(),
          role: 'agent' as const,
          content,
          timestamp: new Date(),
          agentId,
        };

        conversation.messages.push(agentMessage as any);
        await conversation.save();

        // Send to user
        io.to(`user:${ticket.userId}`).emit('agent:message', {
          ticketId,
          message: agentMessage,
        });

        // Confirm to agent
        socket.emit('message:sent', {
          ticketId,
          message: agentMessage,
        });
      }
    } catch (error: any) {
      console.error('Agent message error:', error);
      socket.emit('error', { message: 'Failed to send message', error: error.message });
    }
  });

  /**
   * Agent resolves ticket
   */
  socket.on('agent:resolve', async (data: { ticketId: string; notes: string }) => {
    try {
      const { ticketId, notes } = data;
      const agentId = socket.userId;

      // Update ticket
      const ticket = await HandoffTicket.findOneAndUpdate(
        { _id: ticketId, assignedAgentId: agentId },
        {
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNotes: notes,
        },
        { new: true }
      );

      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found or unauthorized' });
        return;
      }

      // Update agent status
      await User.findByIdAndUpdate(agentId, {
        agentStatus: 'available',
      });

      // Notify user
      io.to(`user:${ticket.userId}`).emit('handoff:resolved', {
        ticketId,
        message: 'Your conversation with the agent has ended. You can continue chatting with the AI.',
      });

      // Confirm to agent
      socket.emit('ticket:resolved', {
        ticketId,
      });

      // Leave ticket room
      socket.leave(`ticket:${ticketId}`);

      console.log(`Ticket ${ticketId} resolved by agent ${agentId}`);
    } catch (error: any) {
      console.error('Resolve ticket error:', error);
      socket.emit('error', { message: 'Failed to resolve ticket', error: error.message });
    }
  });
}
