import React from 'react';

interface Ticket {
  id: string;
  customerName: string;
  subject: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  language: string;
  waitTime: number;
  lastMessage: string;
  timestamp: Date;
  status: 'pending' | 'assigned' | 'resolved';
}

interface TicketCardProps {
  ticket: Ticket;
  onAccept: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onAccept }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'technical':
        return '🔧';
      case 'billing':
        return '💳';
      case 'general':
        return '💬';
      default:
        return '📋';
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case 'en':
        return '🇺🇸';
      case 'es':
        return '🇪🇸';
      case 'fr':
        return '🇫🇷';
      case 'de':
        return '🇩🇪';
      default:
        return '🌐';
    }
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes > 30) return 'text-red-600';
    if (minutes > 15) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-all duration-200 ${
      ticket.priority === 'emergency' ? 'border-red-300 shadow-red-100' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getDepartmentIcon(ticket.department)}</span>
              <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500">Customer:</span>
              <span className="text-sm font-medium text-gray-900">{ticket.customerName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">{getLanguageFlag(ticket.language)}</span>
              <span className="text-sm text-gray-500">{ticket.language.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500">Wait:</span>
              <span className={`text-sm font-medium ${getWaitTimeColor(ticket.waitTime)}`}>
                {formatWaitTime(ticket.waitTime)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">{ticket.lastMessage}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {ticket.timestamp.toLocaleTimeString()}
            </span>
            <button
              onClick={onAccept}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                ticket.priority === 'emergency'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } hover:shadow-md transform hover:-translate-y-0.5`}
            >
              Accept Ticket
            </button>
          </div>
        </div>

        {ticket.priority === 'emergency' && (
          <div className="ml-4">
            <div className="bg-red-100 p-2 rounded-full">
              <span className="text-red-600 text-xl animate-pulse">🚨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};