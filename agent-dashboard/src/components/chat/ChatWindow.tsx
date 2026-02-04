import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { CustomerInfo } from './CustomerInfo';
import { SLATimer } from '../sla/SLATimer';
import { apiService } from '../../services/api';
import { slaService } from '../../services/slaService';
import agentSocketService from '../../services/socketService';

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

interface Message {
  id: string;
  content: string;
  sender: 'agent' | 'customer' | 'ai';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
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

interface ChatWindowProps {
  session: ChatSession;
  onMessageReceived: (message: string) => void;
  onClose: () => void;
  pendingTemplateInsert?: any;
  onTemplateInserted?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  session, 
  onMessageReceived, 
  onClose,
  pendingTemplateInsert,
  onTemplateInserted
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [ticketHistory, setTicketHistory] = useState<TicketHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversation history when component mounts
  useEffect(() => {
    loadTicketHistory();
    
    // Connect to socket and join ticket room
    if (!agentSocketService.isConnected()) {
      agentSocketService.connect();
    }
    
    // Join the ticket room for real-time communication
    agentSocketService.joinTicketRoom(session.ticketId);
    
    // Set up real-time message listeners
    const unsubscribeCustomerMessage = agentSocketService.onCustomerMessage((data) => {
      if (data.ticketId === session.ticketId) {
        const newMessage: Message = {
          id: `customer-${Date.now()}`,
          content: data.message,
          sender: 'customer',
          timestamp: new Date(data.timestamp),
          type: 'text'
        };
        
        // Check for duplicate messages before adding
        setMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg.content === newMessage.content && 
            msg.sender === newMessage.sender &&
            Math.abs(new Date(msg.timestamp).getTime() - newMessage.timestamp.getTime()) < 5000 // Within 5 seconds
          );
          
          if (isDuplicate) {
            console.log('🚫 Duplicate customer message detected, skipping');
            return prev;
          }
          
          return [...prev, newMessage];
        });
        
        onMessageReceived(data.message);
      }
    });
    
    const unsubscribeCustomerTyping = agentSocketService.onCustomerTyping((data) => {
      if (data.ticketId === session.ticketId) {
        setIsTyping(data.isTyping);
      }
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribeCustomerMessage();
      unsubscribeCustomerTyping();
      agentSocketService.leaveTicketRoom(session.ticketId);
    };
  }, [session.ticketId]);

  // Set up SLA monitoring
  useEffect(() => {
    if (ticketHistory) {
      // Check SLA status periodically
      const slaCheckInterval = setInterval(() => {
        slaService.checkSLAStatus(
          session.ticketId,
          ticketHistory.slaInfo,
          ticketHistory.ticket.priorityLevel
        );
      }, 30000); // Check every 30 seconds

      return () => clearInterval(slaCheckInterval);
    }
  }, [ticketHistory, session.ticketId]);

  // Handle SLA escalations
  useEffect(() => {
    const handleEscalation = (escalation: any) => {
      console.log('SLA Escalation triggered:', escalation);
      // Could show a toast notification or update UI
    };

    slaService.onEscalation(handleEscalation);
    
    // Cleanup is handled by the service
  }, []);

  const loadTicketHistory = async (skip = 0) => {
    try {
      if (skip === 0) {
        setLoading(true);
        setError('');
      } else {
        setLoadingMore(true);
      }

      console.log(`🔍 CHAT WINDOW DEBUG: Loading history for ticket ${session.ticketId}, skip: ${skip}`);

      const response = await apiService.get(`/agent/tickets/${session.ticketId}/history`, {
        params: { limit: 50, skip }
      });

      console.log(`🔍 CHAT WINDOW DEBUG: API response:`, response.data);

      if (response.data.success) {
        const historyData: TicketHistory = response.data.data;
        setTicketHistory(historyData);

        console.log(`🔍 CHAT WINDOW DEBUG: Conversation history length: ${historyData.conversationHistory.length}`);
        console.log(`🔍 CHAT WINDOW DEBUG: Conversation history:`, historyData.conversationHistory);

        // Convert conversation history to messages format
        const historyMessages: Message[] = historyData.conversationHistory.map((msg, index) => ({
          id: `history-${skip}-${index}`,
          content: msg.content,
          sender: msg.role === 'user' ? 'customer' : msg.role === 'ai' ? 'ai' : 'agent',
          timestamp: new Date(msg.timestamp),
          type: 'text'
        }));

        console.log(`🔍 CHAT WINDOW DEBUG: Converted to ${historyMessages.length} messages`);
        console.log(`🔍 CHAT WINDOW DEBUG: Message breakdown:`, historyMessages.reduce((acc: any, msg) => {
          acc[msg.sender] = (acc[msg.sender] || 0) + 1;
          return acc;
        }, {}));

        if (skip === 0) {
          // Initial load - set all messages
          setMessages(historyMessages);
          console.log(`🔍 CHAT WINDOW DEBUG: Set initial messages (${historyMessages.length})`);
        } else {
          // Loading more - prepend to existing messages
          setMessages(prev => {
            const combined = [...historyMessages, ...prev];
            console.log(`🔍 CHAT WINDOW DEBUG: Prepended messages, total now: ${combined.length}`);
            return combined;
          });
        }
      } else {
        console.log(`❌ CHAT WINDOW DEBUG: API returned error:`, response.data.message);
        setError('Failed to load conversation history');
      }
    } catch (err: any) {
      console.error('❌ CHAT WINDOW DEBUG: Error loading ticket history:', err);
      setError(err.response?.data?.message || 'Failed to load conversation history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!ticketHistory || loadingMore || !ticketHistory.pagination?.hasMore) return;
    
    const currentSkip = ticketHistory.pagination.skip + ticketHistory.pagination.limit;
    await loadTicketHistory(currentSkip);
  };

  // Auto-scroll to bottom when new messages arrive (but not when loading history)
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  // Handle scroll to load more history
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // If scrolled to top and there's more history, load it
    if (scrollTop === 0 && ticketHistory?.pagination.hasMore && !loadingMore) {
      loadMoreHistory();
    }
  };

  // Simulate customer typing (reduced frequency for real conversations)
  // REMOVED: This was causing ghost messages to appear
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (Math.random() < 0.05) { // 5% chance every 10 seconds
  //       setIsTyping(true);
  //       setTimeout(() => {
  //         setIsTyping(false);
  //         // Simulate receiving a message
  //         const newMessage: Message = {
  //           id: `msg-${Date.now()}`,
  //           content: 'Is there any update on my issue?',
  //           sender: 'customer',
  //           timestamp: new Date(),
  //           type: 'text'
  //         };
  //         setMessages(prev => [...prev, newMessage]);
  //         onMessageReceived(newMessage.content);
  //       }, 2000);
  //     }
  //   }, 10000);

  //   return () => clearInterval(interval);
  // }, [onMessageReceived]);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `agent-${Date.now()}`,
      content,
      sender: 'agent',
      timestamp: new Date(),
      type: 'text'
    };

    console.log(`🔍 SEND MESSAGE DEBUG: Agent sending message:`, newMessage);
    console.log(`🔍 SEND MESSAGE DEBUG: Current messages count before send: ${messages.length}`);

    // Add message to local state immediately for better UX
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log(`🔍 SEND MESSAGE DEBUG: Updated local messages count: ${updated.length}`);
      return updated;
    });
    
    // Send message via Socket.io for real-time delivery
    console.log(`🔍 SEND MESSAGE DEBUG: Sending via socket to ticket ${session.ticketId}`);
    agentSocketService.sendMessageToCustomer(session.ticketId, content);
  };

  const handleResolveTicket = async () => {
    if (confirm('Are you sure you want to resolve this ticket?')) {
      try {
        await apiService.post(`/agent/tickets/${session.ticketId}/resolve`, {
          resolutionNotes: 'Ticket resolved by agent'
        });

        // Add resolution message
        const resolutionMessage: Message = {
          id: `msg-${Date.now()}`,
          content: 'This ticket has been resolved. Thank you for contacting us!',
          sender: 'agent',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, resolutionMessage]);
        
        // Close chat after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (error: any) {
        console.error('Error resolving ticket:', error);
        alert('Failed to resolve ticket: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Conversation</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => loadTicketHistory()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {session.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {session.customerName}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session.subject}</p>
                  {ticketHistory && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticketHistory.ticket.priorityLevel === 'Emergency' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                      ticketHistory.ticket.priorityLevel === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                      ticketHistory.ticket.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {ticketHistory.ticket.priorityLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* SLA Timer */}
              {ticketHistory && ticketHistory.slaInfo && (
                <SLATimer
                  slaInfo={ticketHistory.slaInfo}
                  priority={ticketHistory.ticket.priorityLevel}
                  ticketId={session.ticketId}
                  onEscalationNeeded={(ticketId, reason) => {
                    slaService.escalateTicket(ticketId, reason);
                  }}
                  compact={true}
                />
              )}

              <button
                onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Customer Info"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleResolveTicket}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Resolve
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900"
          onScroll={handleScroll}
        >
          {/* Load More Button */}
          {ticketHistory?.pagination?.hasMore && (
            <div className="text-center">
              <button
                onClick={loadMoreHistory}
                disabled={loadingMore}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load Earlier Messages'}
              </button>
            </div>
          )}

          {/* Handoff Context Banner */}
          {ticketHistory && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Handoff Reason</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{ticketHistory.ticket.reason}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Created: {new Date(ticketHistory.ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  {session.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput 
          onSendMessage={handleSendMessage}
          customerName={ticketHistory?.customer.name || session.customerName}
          agentName="Agent" // Could be enhanced with real agent name
          ticketId={session.ticketId}
          onTyping={(isTyping) => {
            agentSocketService.sendTypingIndicator(session.ticketId, isTyping);
          }}
          pendingTemplateInsert={pendingTemplateInsert}
          onTemplateInserted={onTemplateInserted}
        />
      </div>

      {/* Customer Info Sidebar */}
      {showCustomerInfo && (
        <CustomerInfo 
          session={session}
          ticketHistory={ticketHistory}
          onClose={() => setShowCustomerInfo(false)} 
        />
      )}
    </div>
  );
};