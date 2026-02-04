import SupportTicket, { ISupportTicket } from '../shared/models/SupportTicket.model';
import User from '../shared/models/User.model';
import Conversation from '../shared/models/Conversation.model';
import { Types } from 'mongoose';

/**
 * Ticket Service
 * Handles creation and management of support tickets
 */

interface TicketData {
  userId: string;
  sessionId?: string;
  issueCategory: string;
  issueDescription: string;
  location: {
    district: string;
    assembly: string;
    mandal: string;
    village: string;
  };
  applicationStatus: {
    hasApplied: boolean;
    applicationId?: string;
  };
  issueDetails?: {
    duration: string;
    peopleAffected: string;
    severity: string;
  };
  contactInfo?: {
    mobile?: string;
    email?: string;
  };
  conversationHistory: any[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface TicketResponse {
  ticketId: string;
  referenceNumber: string;
  priority: string;
  expectedResponseTime: string;
  trackingUrl: string;
  departmentContact: {
    name: string;
    phone: string;
  };
}

class TicketService {
  /**
   * Generate ticket reference number
   */
  private generateTicketId(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'drinking water': 'WATER',
      'irrigation': 'IRRI',
      'crop loss': 'CROP',
      'road repair': 'ROAD',
      'electricity': 'ELEC',
      'healthcare': 'HLTH',
      'employment': 'EMPL',
      'pension': 'PENS',
      'housing': 'HOUS',
      'land': 'LAND',
      'dharani': 'LAND',
      'transport': 'TRAN',
      'drainage': 'DRNG',
      'education': 'EDUC',
      'stray cattle': 'CATL'
    };

    const prefix = categoryMap[category.toLowerCase()] || 'MISC';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    
    return `${prefix}-${year}-${randomNum}`;
  }

  /**
   * Get department contact based on issue category
   */
  private getDepartmentContact(category: string): { name: string; phone: string } {
    const departmentMap: { [key: string]: { name: string; phone: string } } = {
      'drinking water': { name: 'Water Supply Department', phone: '+91-08452-221100' },
      'irrigation': { name: 'Irrigation Department', phone: '+91-08452-221155' },
      'crop loss': { name: 'Agriculture Department', phone: '+91-08452-221200' },
      'road repair': { name: 'Roads & Buildings Department', phone: '+91-08452-221300' },
      'electricity': { name: 'Electricity Department (TSSPDCL)', phone: '+91-08452-221400' },
      'healthcare': { name: 'Health Department', phone: '+91-08452-221500' },
      'employment': { name: 'Employment Exchange', phone: '+91-08452-221600' },
      'pension': { name: 'Social Welfare Department', phone: '+91-08452-221700' },
      'housing': { name: 'Housing Department', phone: '+91-08452-221800' },
      'land': { name: 'Revenue Department', phone: '+91-08452-221900' },
      'dharani': { name: 'Revenue Department', phone: '+91-08452-221900' },
      'transport': { name: 'Transport Department', phone: '+91-08452-222000' },
      'drainage': { name: 'Municipal Department', phone: '+91-08452-222100' },
      'education': { name: 'Education Department', phone: '+91-08452-222200' },
      'stray cattle': { name: 'Animal Husbandry Department', phone: '+91-08452-222300' }
    };

    return departmentMap[category.toLowerCase()] || { name: 'MP Office', phone: '+91-08452-220000' };
  }

  /**
   * Get expected response time based on priority
   */
  private getResponseTime(priority: string): string {
    const timeMap: { [key: string]: string } = {
      'URGENT': '24-48 hours',
      'HIGH': '48-72 hours',
      'MEDIUM': '3-5 working days',
      'LOW': '5-7 working days'
    };

    return timeMap[priority] || '5-7 working days';
  }

  /**
   * Determine priority based on issue category, description, and details
   */
  private determinePriority(category: string, description: string, issueDetails?: { duration: string; peopleAffected: string; severity: string }): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const urgentKeywords = ['dying', 'emergency', 'urgent', 'critical', 'no water', 'no electricity', 'hospital', 'medical', 'severe'];
    const highKeywords = ['month', 'weeks', 'damaged', 'broken', 'not working', 'many families', 'entire village'];
    
    const lowerDescription = description.toLowerCase();
    const lowerCategory = category.toLowerCase();

    // Check for urgent keywords in description
    if (urgentKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'URGENT';
    }

    // Analyze issue details if available
    if (issueDetails) {
      const duration = issueDetails.duration.toLowerCase();
      const peopleAffected = issueDetails.peopleAffected.toLowerCase();
      
      // URGENT: Critical issues affecting many people for extended time
      if ((duration.includes('week') || duration.includes('month')) && 
          (peopleAffected.includes('village') || peopleAffected.includes('many') || peopleAffected.includes('100'))) {
        return 'URGENT';
      }
      
      // HIGH: Issues affecting multiple families or lasting more than a week
      if (peopleAffected.includes('families') || peopleAffected.includes('people') || 
          duration.includes('week') || duration.includes('month')) {
        return 'HIGH';
      }
    }

    // Healthcare and drinking water are generally high priority
    if (lowerCategory.includes('healthcare') || lowerCategory.includes('drinking water')) {
      return 'HIGH';
    }

    // Check for high priority keywords
    if (highKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'HIGH';
    }

    // Crop loss, irrigation, electricity are medium priority
    if (['crop loss', 'irrigation', 'electricity'].some(cat => lowerCategory.includes(cat))) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Create a support ticket
   */
  async createTicket(ticketData: TicketData): Promise<TicketResponse> {
    try {
      console.log(`🎫 Creating ticket for user: ${ticketData.userId}`);

      // Find or create user
      let user;
      if (Types.ObjectId.isValid(ticketData.userId)) {
        user = await User.findById(ticketData.userId);
      }

      if (!user) {
        // Create anonymous user
        user = await User.create({
          email: `anonymous_${Date.now()}@temp.com`,
          firstName: 'Anonymous',
          lastName: 'User',
          authProvider: 'email',
          role: 'user'
        });
        console.log(`👤 Created anonymous user: ${user._id}`);
      }

      // Determine priority with enhanced logic
      const priority = ticketData.priority || this.determinePriority(
        ticketData.issueCategory, 
        ticketData.issueDescription, 
        ticketData.issueDetails
      );

      // Generate ticket ID
      const ticketId = this.generateTicketId(ticketData.issueCategory);

      // Create conversation record
      const conversation = await Conversation.create({
        userId: user._id,
        title: `${ticketData.issueCategory} - ${ticketData.location.village}`,
        messages: ticketData.conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : msg.role,
          content: msg.content,
          timestamp: new Date()
        })),
        status: 'active'
      });

      // Build detailed ticket description
      let ticketDescription = `${ticketData.issueCategory}: ${ticketData.issueDescription}

📍 Location: ${ticketData.location.village}, ${ticketData.location.mandal}, ${ticketData.location.assembly}, ${ticketData.location.district}

🆔 Application Status: ${ticketData.applicationStatus.hasApplied ? `Applied (ID: ${ticketData.applicationStatus.applicationId})` : 'Not applied'}`;

      // Add detailed issue information if available
      if (ticketData.issueDetails) {
        ticketDescription += `

📋 Issue Details:
- Duration: ${ticketData.issueDetails.duration}
- People Affected: ${ticketData.issueDetails.peopleAffected}
- Severity: ${ticketData.issueDetails.severity}`;
      }

      // Add contact information if available
      if (ticketData.contactInfo) {
        ticketDescription += `

📞 Contact Information:`;
        if (ticketData.contactInfo.mobile) {
          ticketDescription += `
- Mobile: ${ticketData.contactInfo.mobile}`;
        }
        if (ticketData.contactInfo.email) {
          ticketDescription += `
- Email: ${ticketData.contactInfo.email}`;
        }
      }

      ticketDescription += `

🏷️ Priority: ${priority}
🎫 Reference: ${ticketId}`;

      // Create support ticket
      const ticket = await SupportTicket.create({
        userId: user._id,
        conversationId: conversation._id,
        contactEmail: ticketData.contactInfo?.email || user.email,
        issueDescription: ticketDescription,
        conversationContext: ticketData.conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : msg.role,
          content: msg.content,
          timestamp: new Date()
        })),
        status: 'open'
      });

      console.log(`✅ Ticket created: ${ticketId} (DB ID: ${ticket._id})`);

      // Get department contact
      const departmentContact = this.getDepartmentContact(ticketData.issueCategory);

      // Return ticket response
      return {
        ticketId,
        referenceNumber: ticketId,
        priority,
        expectedResponseTime: this.getResponseTime(priority),
        trackingUrl: `https://raghunandanrao.in/track/${ticketId}`,
        departmentContact
      };

    } catch (error: any) {
      console.error('❌ Error creating ticket:', error);
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  /**
   * Get ticket by reference number
   */
  async getTicketByReference(referenceNumber: string): Promise<ISupportTicket | null> {
    try {
      const ticket = await SupportTicket.findOne({
        issueDescription: { $regex: `Reference: ${referenceNumber}` }
      }).populate('userId conversationId');

      return ticket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }
}

export default new TicketService();