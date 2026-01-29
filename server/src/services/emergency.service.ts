import HandoffTicket from '../shared/models/HandoffTicket.model';

/**
 * Emergency Service
 * Handles emergency ticket detection, escalation, and priority management
 */

// Emergency keywords that trigger auto-escalation
const EMERGENCY_KEYWORDS = [
  'emergency', 'urgent', 'critical', 'immediate', 'asap',
  'help me', 'crisis', 'serious', 'important', 'priority',
  'accident', 'injury', 'danger', 'threat', 'security',
  'fraud', 'scam', 'hack', 'breach', 'stolen',
  'medical', 'hospital', 'ambulance', 'police', 'fire'
];

// Emergency contact information
const EMERGENCY_CONTACTS = {
  supervisor: {
    name: 'Emergency Supervisor',
    phone: '+91-9876543210',
    email: 'supervisor@ppc.gov.in',
    department: 'Emergency Response'
  },
  legal: {
    name: 'Legal Emergency',
    phone: '+91-9876543211',
    email: 'legal-emergency@ppc.gov.in',
    department: 'Legal'
  },
  rti: {
    name: 'RTI Emergency',
    phone: '+91-9876543212',
    email: 'rti-emergency@ppc.gov.in',
    department: 'RTI'
  },
  technical: {
    name: 'Technical Support',
    phone: '+91-9876543213',
    email: 'tech-support@ppc.gov.in',
    department: 'Technical'
  }
};

// Priority levels and their SLA targets (in minutes)
const PRIORITY_SLA_TARGETS: Record<number, number> = {
  1: 30, // Low priority - 30 minutes
  2: 20, // Normal priority - 20 minutes
  3: 10, // Medium priority - 10 minutes
  4: 5,  // High priority - 5 minutes
  5: 2   // Emergency priority - 2 minutes
};

/**
 * Detect emergency keywords in message content
 */
export const detectEmergencyKeywords = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Auto-escalate ticket priority based on content analysis
 */
export const analyzeAndEscalateTicket = async (ticketId: string, message: string): Promise<{
  escalated: boolean;
  newPriority?: number;
  reason?: string;
}> => {
  try {
    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check for emergency keywords
    const hasEmergencyKeywords = detectEmergencyKeywords(message);
    
    if (hasEmergencyKeywords && ticket.priority < 4) {
      // Escalate to high priority (4) or emergency (5) based on current priority
      const newPriority = ticket.priority <= 2 ? 4 : 5;
      
      await HandoffTicket.findByIdAndUpdate(ticketId, {
        priority: newPriority,
        escalatedAt: new Date(),
        escalationReason: 'Emergency keywords detected in message'
      });

      // Broadcast emergency alert to all agents
      // Note: Socket.io integration would be added here
      console.log(`🚨 Emergency alert would be broadcast for ticket ${ticketId}`);

      console.log(`🚨 Emergency escalation: Ticket ${ticketId} escalated to priority ${newPriority}`);

      return {
        escalated: true,
        newPriority,
        reason: 'Emergency keywords detected'
      };
    }

    return { escalated: false };
  } catch (error) {
    console.error('Error analyzing ticket for escalation:', error);
    throw error;
  }
};

/**
 * Get emergency contact information
 */
export const getEmergencyContacts = () => {
  return EMERGENCY_CONTACTS;
};

/**
 * Get SLA target for priority level
 */
export const getSLATarget = (priority: number): number => {
  return PRIORITY_SLA_TARGETS[priority] || PRIORITY_SLA_TARGETS[2]; // Default to normal priority
};

/**
 * Check if ticket is approaching SLA deadline
 */
export const checkSLAStatus = (ticket: any): {
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
  timeRemaining: number;
  percentage: number;
} => {
  const slaTarget = getSLATarget(ticket.priority);
  const createdAt = new Date(ticket.createdAt);
  const now = new Date();
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const timeRemaining = slaTarget - elapsedMinutes;
  const percentage = (elapsedMinutes / slaTarget) * 100;

  let status: 'safe' | 'warning' | 'critical' | 'exceeded';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 80) {
    status = 'critical';
  } else if (percentage >= 60) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  return {
    status,
    timeRemaining: Math.max(0, timeRemaining),
    percentage: Math.min(100, percentage)
  };
};

/**
 * Get emergency tickets that need immediate attention
 */
export const getEmergencyTickets = async (): Promise<any[]> => {
  try {
    const emergencyTickets = await HandoffTicket.find({
      priority: { $gte: 4 }, // High and Emergency priority
      status: { $in: ['pending', 'assigned'] }
    }).sort({ priority: -1, createdAt: 1 });

    return emergencyTickets.map(ticket => ({
      ...ticket.toObject(),
      slaStatus: checkSLAStatus(ticket)
    }));
  } catch (error) {
    console.error('Error fetching emergency tickets:', error);
    throw error;
  }
};

/**
 * Track emergency response time
 */
export const trackEmergencyResponse = async (ticketId: string, agentId: string): Promise<void> => {
  try {
    const ticket = await HandoffTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.priority >= 4) { // High or Emergency priority
      const responseTime = new Date().getTime() - new Date(ticket.createdAt).getTime();
      const responseTimeMinutes = responseTime / (1000 * 60);

      await HandoffTicket.findByIdAndUpdate(ticketId, {
        emergencyResponseTime: responseTimeMinutes,
        emergencyRespondedAt: new Date(),
        emergencyRespondedBy: agentId
      });

      console.log(`⚡ Emergency response tracked: ${responseTimeMinutes.toFixed(2)} minutes for ticket ${ticketId}`);
    }
  } catch (error) {
    console.error('Error tracking emergency response:', error);
    throw error;
  }
};

/**
 * Send emergency alert to all available agents
 */
export const sendEmergencyAlert = (ticketData: any): void => {
  const alertData = {
    type: 'emergency',
    ticketId: ticketData._id,
    priority: ticketData.priority,
    department: ticketData.department,
    customerInfo: ticketData.customerInfo,
    message: 'Emergency ticket requires immediate attention',
    timestamp: new Date(),
    slaTarget: getSLATarget(ticketData.priority)
  };

  // Note: Socket.io integration would be added here
  console.log(`🚨 Emergency alert would be sent for ticket ${ticketData._id}`, alertData);
};