import { Request, Response } from 'express';
import * as emergencyService from '../services/emergency.service';

/**
 * Emergency Controller
 * Handles emergency and priority-related API endpoints
 */

/**
 * GET /api/emergency/contacts
 * Get emergency contact information
 */
export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const contacts = emergencyService.getEmergencyContacts();
    
    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error: any) {
    console.error('Error fetching emergency contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts'
    });
  }
};

/**
 * GET /api/emergency/tickets
 * Get all emergency tickets requiring immediate attention
 */
export const getEmergencyTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await emergencyService.getEmergencyTickets();
    
    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error: any) {
    console.error('Error fetching emergency tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency tickets'
    });
  }
};

/**
 * POST /api/emergency/escalate/:ticketId
 * Manually escalate a ticket to emergency priority
 */
export const escalateTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { reason, newPriority = 5 } = req.body;
    const agentId = (req as any).user?.userId;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Update ticket priority
    const HandoffTicket = require('../shared/models/HandoffTicket.model');
    const ticket = await HandoffTicket.findByIdAndUpdate(ticketId, {
      priority: newPriority,
      escalatedAt: new Date(),
      escalationReason: reason || 'Manual escalation by agent',
      escalatedBy: agentId
    }, { new: true });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Send emergency alert
    emergencyService.sendEmergencyAlert(ticket);

    res.status(200).json({
      success: true,
      message: 'Ticket escalated successfully',
      data: {
        ticketId,
        newPriority,
        escalatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error escalating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to escalate ticket'
    });
  }
};

/**
 * POST /api/emergency/analyze/:ticketId
 * Analyze message content for emergency keywords and auto-escalate if needed
 */
export const analyzeMessage = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and message are required'
      });
    }

    const result = await emergencyService.analyzeAndEscalateTicket(ticketId, message);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error analyzing message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze message'
    });
  }
};

/**
 * GET /api/emergency/sla/:ticketId
 * Get SLA status for a specific ticket
 */
export const getSLAStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const HandoffTicket = require('../shared/models/HandoffTicket.model');
    const ticket = await HandoffTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const slaStatus = emergencyService.checkSLAStatus(ticket);
    const slaTarget = emergencyService.getSLATarget(ticket.priority);

    res.status(200).json({
      success: true,
      data: {
        ticketId,
        priority: ticket.priority,
        slaTarget,
        ...slaStatus
      }
    });
  } catch (error: any) {
    console.error('Error getting SLA status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get SLA status'
    });
  }
};

/**
 * POST /api/emergency/response/:ticketId
 * Track emergency response time when agent responds to emergency ticket
 */
export const trackResponse = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const agentId = (req as any).user?.userId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    await emergencyService.trackEmergencyResponse(ticketId, agentId);

    res.status(200).json({
      success: true,
      message: 'Emergency response tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking emergency response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track emergency response'
    });
  }
};