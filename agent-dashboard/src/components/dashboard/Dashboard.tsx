import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from './DashboardLayout';
import { TicketQueue } from '../tickets/TicketQueue';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { SLADashboard } from '../sla/SLADashboard';
import { AgentStats } from '../performance/AgentStats';
import { FeedbackDisplay } from '../feedback/FeedbackDisplay';
import EmergencyDashboard from '../emergency/EmergencyDashboard';
import SupervisorDashboard from '../supervisor/SupervisorDashboard';
import Settings from '../settings/Settings';
import { notificationService } from '../../services/notificationService';
import agentSocketService from '../../services/socketService';

// Create a context for template integration
interface TemplateContextType {
  activeTicketId: string | null;
  insertTemplate: any | null;
  setInsertTemplate: (template: any) => void;
}

export const TemplateContext = React.createContext<TemplateContextType>({
  activeTicketId: null,
  insertTemplate: null,
  setInsertTemplate: () => {}
});

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'queue' | 'chat' | 'templates' | 'sla' | 'performance' | 'feedback' | 'emergency' | 'team' | 'settings'>('overview');
  const [acceptedTicket, setAcceptedTicket] = useState<any>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [insertTemplate, setInsertTemplate] = useState<any>(null);
  const chatWorkspaceRef = useRef<any>(null);

  // Connect to socket service when dashboard loads
  useEffect(() => {
    if (user && ['agent', 'supervisor', 'admin'].includes(user.role)) {
      console.log('🔌 Connecting agent to socket service...');
      agentSocketService.connect();
      
      // Set up global ticket acceptance listener
      const handleTicketAccepted = (data: any) => {
        console.log('🎯 DEBUG: Global ticket accepted event received:', data);
        console.log('🎯 DEBUG: Ticket data:', data.ticket);
        
        if (data.ticket) {
          const ticket = data.ticket;
          const customerName = ticket.userId ? 
            `${ticket.userId.firstName || 'Anonymous'} ${ticket.userId.lastName || 'User'}` : 
            'Anonymous User';
          const subject = ticket.reason || 'Support Request';

          console.log('🎯 DEBUG: Customer name:', customerName);
          console.log('🎯 DEBUG: Subject:', subject);

          // Update accepted ticket state with full ticket data
          setAcceptedTicket({
            id: ticket._id,
            customerName,
            subject,
            ...ticket
          });

          // Set active ticket ID for template integration
          setActiveTicketId(ticket._id);

          console.log('✅ Ticket data set in state');
        }
      };

      // Set up global listener
      const unsubscribe = agentSocketService.onTicketAccepted(handleTicketAccepted);
      
      // Set up new ticket notification listener
      const unsubscribeNewTicket = agentSocketService.onNewTicket((data: any) => {
        console.log('🆕 New ticket notification:', data);
        if (data.ticket) {
          const ticket = data.ticket;
          // Show notification for new ticket in queue
          notificationService.showTicketNotification('new', {
            id: ticket._id,
            subject: ticket.reason || 'New support request',
            priority: ticket.priorityLevel?.toLowerCase() || 'medium'
          });
        }
      });
      
      return () => {
        console.log('🔌 Disconnecting agent from socket service...');
        unsubscribe();
        unsubscribeNewTicket();
        agentSocketService.disconnect();
      };
    }
  }, [user?.id]);

  const handleNavigate = (view: string) => {
    const validViews = ['overview', 'queue', 'chat', 'templates', 'sla', 'performance', 'feedback', 'emergency', 'team', 'settings'];
    if (validViews.includes(view)) {
      // Allow free navigation - chat sessions are maintained in ChatWorkspace
      // Agents can navigate away and return to active chats as needed
      setActiveView(view as typeof activeView);
    }
  };

  const handleTicketAccept = async (ticketId: string) => {
    try {
      console.log('🎫 Ticket accepted, switching to chat view:', ticketId);
      
      // Set active ticket for template integration
      setActiveTicketId(ticketId);
      
      // Switch to chat view
      setActiveView('chat');
      
      // The actual ticket acceptance is handled by the socket service
      // The global listener will update the acceptedTicket state
    } catch (error) {
      console.error('Error handling ticket acceptance:', error);
    }
  };

  const handleTemplateInsert = (template: any) => {
    if (!activeTicketId) {
      notificationService.showNotification({
        title: 'No Active Chat',
        body: 'Please open a chat first to use templates',
        priority: 'normal',
        sound: false
      });
      return;
    }

    setInsertTemplate(template);
    
    // Navigate to chat view if not already there
    if (activeView !== 'chat') {
      setActiveView('chat');
    }
  };

  const templateContextValue: TemplateContextType = {
    activeTicketId,
    insertTemplate,
    setInsertTemplate
  };

  const renderContent = () => {
    switch (activeView) {
      case 'queue':
        return <TicketQueue onTicketAccept={handleTicketAccept} />;
      case 'chat':
        return (
          <ChatWorkspace 
            ref={chatWorkspaceRef}
            acceptedTicket={acceptedTicket}
            insertTemplate={insertTemplate}
            onTemplateInserted={() => setInsertTemplate(null)}
          />
        );
      case 'templates':
        return (
          <TemplateLibrary 
            onTemplateSelect={handleTemplateInsert}
            activeTicketId={activeTicketId}
          />
        );
      case 'sla':
        return <SLADashboard />;
      case 'performance':
        return <AgentStats />;
      case 'feedback':
        return <FeedbackDisplay />;
      case 'emergency':
        return <EmergencyDashboard />;
      case 'team':
        return user?.role === 'supervisor' || user?.role === 'admin' ? 
          <SupervisorDashboard /> : 
          <div className="p-8 text-center text-gray-500">Access denied. Supervisor role required.</div>;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agent Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleNavigate('queue')}
                    className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    View Ticket Queue
                  </button>
                  <button 
                    onClick={() => handleNavigate('chat')}
                    className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    Active Chats
                  </button>
                  <button 
                    onClick={() => handleNavigate('templates')}
                    className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    Template Library
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Today's Stats</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div>Tickets Handled: 0</div>
                  <div>Average Response Time: 0m</div>
                  <div>Customer Satisfaction: N/A</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Chat System: Online</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Templates: Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Notifications: Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <TemplateContext.Provider value={templateContextValue}>
      <DashboardLayout 
        activeView={activeView} 
        onNavigate={handleNavigate}
      >
        {renderContent()}
      </DashboardLayout>
    </TemplateContext.Provider>
  );
};