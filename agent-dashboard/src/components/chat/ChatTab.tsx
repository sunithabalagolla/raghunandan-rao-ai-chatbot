import React from 'react';

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

interface ChatTabProps {
  session: ChatSession;
  isActive: boolean;
  tabNumber: number;
  onSwitch: () => void;
  onClose: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ 
  session, 
  isActive, 
  tabNumber, 
  onSwitch, 
  onClose 
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      onClick={onSwitch}
      className={`
        relative flex items-center space-x-2 px-3 py-2 rounded-t-lg cursor-pointer
        transition-all duration-200 min-w-0 max-w-48
        ${isActive 
          ? 'bg-blue-50 border-t-2 border-blue-500 text-blue-700' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
      `}
    >
      {/* Tab Number */}
      <span className={`
        text-xs font-medium px-1.5 py-0.5 rounded
        ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-300 text-gray-600'}
      `}>
        {tabNumber}
      </span>

      {/* Customer Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium truncate">
            {session.customerName}
          </span>
          {session.hasUnread && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {session.subject}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={`
          p-1 rounded-full hover:bg-red-100 transition-colors
          ${isActive ? 'text-gray-500 hover:text-red-600' : 'text-gray-400 hover:text-red-600'}
        `}
        title="Close chat (Ctrl+W)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
      )}
    </div>
  );
};