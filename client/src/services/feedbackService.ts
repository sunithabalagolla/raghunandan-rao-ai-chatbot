import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface FeedbackSubmission {
  rating: number;
  comment: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: {
    ticketId: string;
    rating: number;
    comment: string;
  };
}

class FeedbackService {
  /**
   * Submit customer feedback for a resolved ticket
   */
  async submitFeedback(ticketId: string, feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    try {
      const response = await axios.post(
        `${API_BASE}/agent/tickets/${ticketId}/feedback`,
        feedback,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: error.message || 'Failed to submit feedback',
      };
    }
  }

  /**
   * Generate feedback request URL for customers
   */
  generateFeedbackUrl(ticketId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/feedback/${ticketId}`;
  }

  /**
   * Send feedback request notification (would integrate with email service)
   */
  async sendFeedbackRequest(ticketId: string, customerEmail: string): Promise<boolean> {
    try {
      // This would typically integrate with an email service
      // For now, we'll just log the request
      console.log(`Feedback request sent to ${customerEmail} for ticket ${ticketId}`);
      
      const feedbackUrl = this.generateFeedbackUrl(ticketId);
      console.log(`Feedback URL: ${feedbackUrl}`);
      
      // In a real implementation, this would send an email with the feedback URL
      // await emailService.sendFeedbackRequest(customerEmail, feedbackUrl, ticketId);
      
      return true;
    } catch (error) {
      console.error('Error sending feedback request:', error);
      return false;
    }
  }
}

export const feedbackService = new FeedbackService();