import React from 'react';
import { LanguageBadge } from '../language/LanguageBadge';
import type { SupportedLanguage } from '../../services/languageService';
import { SLATimer } from '../sla/SLATimer';

interface ChatSession {
  id: string;
  ticketId: string;
  customerName: string;
  subject: string;
  isActive: boolean;
  hasUnread: boolean;
  lastMessage?: string;
  timestamp: Date;
}

interface TicketHistory {
  ticket: {
    id: string;
    subject: string;
    priority: number;
    priorityLevel: string;
    status: string;
    createdAt: string;
    assignedAt?: string;
    reason: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    language?: SupportedLanguage;
  };
  conversationHistory: Array<{
    role: 'user' | 'ai' | 'agent';
    content: string;
    timestamp: string;
  }>;
  slaInfo: {
    responseTimeRemaining: number;
    resolutionTimeRemaining: number;
    isResponseOverdue: boolean;
    isResolutionOverdue: boolean;
    responseDeadline: string;
    resolutionDeadline: string;
  };
  pagination: {
    total: number;
    skip: number;
    limit: number;
    hasMore: boolean;
  };
}

interface CustomerInfoProps {
  session: ChatSession;
  ticketHistory?: TicketHistory | null;
  onClose: () => void;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ session, ticketHistory, onClose }) => {
  // Use real data from ticket history if available, otherwise fallback to mock data
  const customerData = ticketHistory ? {
    name: ticketHistory.customer.name,
    email: ticketHistory.customer.email,
    phone: ticketHistory.customer.phone || 'Not provided',
    accountType: 'Standard', // Could be enhanced with real account data
    joinDate: '2023-06-15', // Could be enhanced with real join date
    totalTickets: 8, // Could be calculated from real data
    resolvedTickets: 7, // Could be calculated from real data
    avgResponseTime: '2.5 hours', // Could be calculated from real data
    satisfaction: 4.8, // Could be calculated from real data
    preferredLanguage: 'English', // Could be from user profile
    timezone: 'EST (UTC-5)', // Could be from user profile
    lastActivity: '2 hours ago' // Could be calculated from real data
  } : {
    name: session.customerName,
    email: 'customer@example.com',
    phone: '+1 (555) 123-4567',
    accountType: 'Premium',
    joinDate: '2023-06-15',
    totalTickets: 8,
    resolvedTickets: 7,
    avgResponseTime: '2.5 hours',
    satisfaction: 4.8,
    preferredLanguage: 'English',
    timezone: 'EST (UTC-5)',
    lastActivity: '2 hours ago'
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customer Info</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Customer Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {customerData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{customerData.name}</h4>
              <p className="text-sm text-gray-500">{customerData.accountType} Customer</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">{customerData.email}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-600">{customerData.phone}</span>
            </div>

            {/* Language Badge */}
            {ticketHistory?.customer.language && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <LanguageBadge 
                  language={ticketHistory.customer.language} 
                  size="sm"
                  className="flex-shrink-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* SLA Information */}
        {ticketHistory && (
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">SLA Status</h5>
            <SLATimer
              slaInfo={ticketHistory.slaInfo}
              priority={ticketHistory.ticket.priorityLevel}
              ticketId={ticketHistory.ticket.id}
              compact={false}
            />
          </div>
        )}

        {/* Account Stats */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Account Statistics</h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{customerData.totalTickets}</div>
              <div className="text-xs text-gray-500">Total Tickets</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-green-600">{customerData.resolvedTickets}</div>
              <div className="text-xs text-gray-500">Resolved</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">{customerData.avgResponseTime}</div>
              <div className="text-xs text-gray-500">Avg Response</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-yellow-600">{customerData.satisfaction}★</div>
              <div className="text-xs text-gray-500">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Conversation Stats */}
        {ticketHistory && (
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Conversation Stats</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Messages</span>
                <span className="text-sm text-gray-900">{ticketHistory.pagination.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">AI Messages</span>
                <span className="text-sm text-gray-900">
                  {ticketHistory.conversationHistory.filter(msg => msg.role === 'ai').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customer Messages</span>
                <span className="text-sm text-gray-900">
                  {ticketHistory.conversationHistory.filter(msg => msg.role === 'user').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Preferences</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Language</span>
              <span className="text-sm text-gray-900">{customerData.preferredLanguage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Timezone</span>
              <span className="text-sm text-gray-900">{customerData.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm text-gray-900">{customerData.joinDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Activity</span>
              <span className="text-sm text-gray-900">{customerData.lastActivity}</span>
            </div>
          </div>
        </div>

        {/* Current Ticket */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Current Ticket</h5>
          <div className={`p-3 rounded-lg ${
            ticketHistory?.ticket.priorityLevel === 'Emergency' ? 'bg-red-50 border border-red-200' :
            ticketHistory?.ticket.priorityLevel === 'High' ? 'bg-orange-50 border border-orange-200' :
            ticketHistory?.ticket.priorityLevel === 'Medium' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="text-sm font-medium text-gray-900 mb-1">#{session.ticketId}</div>
            <div className="text-sm text-gray-700">{session.subject}</div>
            {ticketHistory && (
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  ticketHistory.ticket.priorityLevel === 'Emergency' ? 'bg-red-100 text-red-800' :
                  ticketHistory.ticket.priorityLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                  ticketHistory.ticket.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticketHistory.ticket.priorityLevel}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(ticketHistory.ticket.createdAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h5>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              📧 Send Email
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              📞 Schedule Call
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              📋 View History
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              🔄 Transfer Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};