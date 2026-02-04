import React from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'agent' | 'customer' | 'ai';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAgent = message.sender === 'agent';
  const isAI = message.sender === 'ai';
  // const _isCustomer = message.sender === 'customer';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderLabel = () => {
    if (isAgent) return 'Agent';
    if (isAI) return 'AI Assistant';
    return 'Customer';
  };

  const getBubbleStyles = () => {
    if (isAgent) {
      return 'bg-blue-600 text-white';
    } else if (isAI) {
      return 'bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    } else {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white';
    }
  };

  const getAlignment = () => {
    return isAgent ? 'justify-end' : 'justify-start';
  };

  return (
    <div className={`flex ${getAlignment()}`}>
      <div className={`max-w-xs lg:max-w-md ${isAgent ? 'order-2' : 'order-1'}`}>
        {/* Sender label for AI messages */}
        {isAI && (
          <div className={`text-xs text-purple-600 dark:text-purple-400 mb-1 ${isAgent ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{getSenderLabel()}</span>
            </div>
          </div>
        )}
        
        <div className={`px-4 py-2 rounded-lg ${getBubbleStyles()}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isAgent ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
          {!isAI && (
            <span className="ml-1 text-gray-400 dark:text-gray-500">• {getSenderLabel()}</span>
          )}
        </div>
      </div>
    </div>
  );
};