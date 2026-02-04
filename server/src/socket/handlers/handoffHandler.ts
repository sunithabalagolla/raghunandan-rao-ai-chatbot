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

      // Join agents room and agent-specific room
      socket.join('agents');
      socket.join(`agent:${userId}`);

      // Get pending tickets
      const pendingTickets = await HandoffTicket.find({ status: 'waiting' })
        .sort({ priority: -1, createdAt: 1 })
        .limit(20)
        .populate('userId', 'email firstName lastName');

      socket.emit('agent:connected', {
        pendingTickets,
      });

      console.log(`Agent connected: ${userId} - joined rooms: agents, agent:${userId}`);
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

      // Find and update ticket with populated user data
      const ticket = await HandoffTicket.findOneAndUpdate(
        { _id: ticketId, status: 'waiting' },
        {
          status: 'assigned',
          assignedAgentId: agentId,
          assignedAt: new Date(),
        },
        { new: true }
      ).populate('userId', 'firstName lastName email');

      if (!ticket) {
        socket.emit('error', { message: 'Ticket not available or already assigned' });
        return;
      }

      // Update agent status
      await User.findByIdAndUpdate(agentId, {
        agentStatus: 'busy',
      });

      // Join ticket room immediately
      socket.join(`ticket:${ticketId}`);

      // Notify user that agent joined
      io.to(`user:${ticket.userId}`).emit('agent:joined', {
        ticketId: ticket._id,
        agentId,
        message: 'A support agent has joined the conversation',
      });
      
      // Also notify via ticket room
      io.to(`ticket:${ticketId}`).emit('agent:joined', {
        ticketId: ticket._id,
        agentId,
        message: 'A support agent has joined the conversation',
      });

      // Confirm to agent
      console.log('🎯 DEBUG: Sending ticket:accepted event with data:', { ticket });
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
   * Agent joins a specific ticket room for real-time communication
   */
  socket.on('agent:join_ticket', async (data: { ticketId: string }) => {
    try {
      const { ticketId } = data;
      const agentId = socket.userId;

      // Verify agent is assigned to this ticket
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.assignedAgentId?.toString() !== agentId) {
        socket.emit('error', { message: 'Unauthorized or ticket not found' });
        return;
      }

      // Join ticket room
      socket.join(`ticket:${ticketId}`);
      console.log(`Agent ${agentId} joined ticket room: ${ticketId}`);

      // Notify customer that agent is active
      io.to(`user:${ticket.userId}`).emit('agent:active', {
        ticketId,
        message: 'Agent is now active in this conversation'
      });

    } catch (error: any) {
      console.error('Agent join ticket error:', error);
      socket.emit('error', { message: 'Failed to join ticket', error: error.message });
    }
  });

  /**
   * Agent leaves a ticket room
   */
  socket.on('agent:leave_ticket', async (data: { ticketId: string }) => {
    try {
      const { ticketId } = data;
      const agentId = socket.userId;

      // Leave ticket room
      socket.leave(`ticket:${ticketId}`);
      console.log(`Agent ${agentId} left ticket room: ${ticketId}`);

    } catch (error: any) {
      console.error('Agent leave ticket error:', error);
    }
  });

  /**
   * Agent sends message to customer (updated event name)
   */
  socket.on('agent:message', async (data: { ticketId: string; message: string; timestamp?: Date }) => {
    try {
      const { ticketId, message, timestamp } = data;
      const agentId = socket.userId;

      console.log(`🔍 AGENT MESSAGE DEBUG: Agent ${agentId} sending message to ticket ${ticketId}`);
      console.log(`🔍 AGENT MESSAGE DEBUG: Message content: "${message}"`);

      // Get ticket and verify agent assignment
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.assignedAgentId?.toString() !== agentId) {
        console.log(`❌ AGENT MESSAGE DEBUG: Unauthorized - ticket found: ${!!ticket}, assigned agent: ${ticket?.assignedAgentId}, current agent: ${agentId}`);
        socket.emit('error', { message: 'Unauthorized or ticket not found' });
        return;
      }

      const messageTimestamp = timestamp || new Date();

      // CRITICAL FIX: Save message to HandoffTicket conversationContext
      const agentMessage = {
        role: 'agent' as const,
        content: message,
        timestamp: messageTimestamp,
        agentId,
      };

      console.log(`💾 AGENT MESSAGE DEBUG: Saving agent message to database:`, agentMessage);

      // Add to HandoffTicket conversationContext (this is what gets loaded by history API)
      const updateResult = await HandoffTicket.findByIdAndUpdate(ticketId, {
        $push: {
          conversationContext: agentMessage
        }
      }, { new: true });

      console.log(`💾 AGENT MESSAGE DEBUG: Database update result - success: ${!!updateResult}`);
      console.log(`💾 AGENT MESSAGE DEBUG: Updated conversationContext length: ${updateResult?.conversationContext?.length || 0}`);

      // Also save to Conversation for completeness
      const conversation = await Conversation.findById(ticket.conversationId);
      if (conversation) {
        const conversationMessage = {
          _id: new Types.ObjectId().toString(),
          role: 'agent' as const,
          content: message,
          timestamp: messageTimestamp,
          agentId,
        };

        conversation.messages.push(conversationMessage as any);
        await conversation.save();
        console.log(`💾 AGENT MESSAGE DEBUG: Also saved to Conversation model`);
      }

      // Send to customer via ticket room, but exclude the sending agent
      socket.to(`ticket:${ticketId}`).emit('chat:response', {
        message: message,
        sender: 'agent',
        timestamp: messageTimestamp,
        ticketId: ticketId
      });

      // Confirm to agent (only success confirmation, not the message content)
      socket.emit('chat:response', {
        message: 'Message sent successfully',
        timestamp: messageTimestamp,
        ticketId: ticketId,
        success: true
      });

      console.log(`✅ AGENT MESSAGE DEBUG: Agent ${agentId} sent message to ticket ${ticketId} - SAVED TO DATABASE`);
    } catch (error: any) {
      console.error('❌ AGENT MESSAGE DEBUG: Agent message error:', error);
      socket.emit('error', { message: 'Failed to send message', error: error.message });
    }
  });

  /**
   * Agent typing indicator
   */
  socket.on('agent:typing', async (data: { ticketId: string; isTyping: boolean }) => {
    try {
      const { ticketId, isTyping } = data;
      const agentId = socket.userId;

      // Get ticket and verify agent assignment
      const ticket = await HandoffTicket.findById(ticketId);
      if (!ticket || ticket.assignedAgentId?.toString() !== agentId) {
        return; // Silently ignore unauthorized typing indicators
      }

      // Send typing indicator to customer
      io.to(`user:${ticket.userId}`).emit('chat:typing', {
        isTyping,
        sender: 'agent',
        ticketId
      });

    } catch (error: any) {
      console.error('Agent typing error:', error);
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
