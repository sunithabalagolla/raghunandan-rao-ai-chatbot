import React, { useState, useEffect } from 'react';
import { emergencyService } from '../../services/emergencyService';
import type { EmergencyTicket } from '../../services/emergencyService';
import EmergencyAlert from './EmergencyAlert';
import EmergencyContacts from './EmergencyContacts';
import PriorityBadge from './PriorityBadge';
import SLATimer from './SLATimer';

const EmergencyDashboard: React.FC = () => {
  const [emergencyTickets, setEmergencyTickets] = useState<EmergencyTicket[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);

  useEffect(() => {
    loadEmergencyTickets();
    const interval = setInterval(loadEmergencyTickets, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEmergencyTickets = async () => {
    try {
      const tickets = await emergencyService.getEmergencyTickets();
      setEmergencyTickets(tickets);
      
      // Show alerts for new emergency tickets (priority 5)
      const newEmergencyTickets = tickets.filter(ticket => 
        ticket.priority === 5 && 
        !activeAlerts.some(alert => alert._id === ticket._id)
      );
      
      if (newEmergencyTickets.length > 0) {
        setActiveAlerts(prev => [...prev, ...newEmergencyTickets]);
      }
    } catch (err) {
      setError('Failed to load emergency tickets');
      console.error('Error loading emergency tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      // Track emergency response
      await emergencyService.trackResponse(ticketId);
      
      // Remove from alerts
      setActiveAlerts(prev => prev.filter(alert => alert._id !== ticketId));
      
      // Here you would typically navigate to the chat interface
      console.log('Accepting emergency ticket:', ticketId);
    } catch (error) {
      console.error('Error accepting emergency ticket:', error);
    }
  };

  const handleDismissAlert = (ticketId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert._id !== ticketId));
  };

  const handleEscalateTicket = async (ticketId: string, reason: string) => {
    try {
      await emergencyService.escalateTicket(ticketId, reason, 5);
      await loadEmergencyTickets(); // Refresh the list
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Emergency Alerts */}
      {activeAlerts.map(ticket => (
        <EmergencyAlert
          key={ticket._id}
          ticket={ticket}
          onAccept={handleAcceptTicket}
          onDismiss={handleDismissAlert}
        />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🚨</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emergency Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and respond to high-priority tickets
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowContacts(!showContacts)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          📞 Emergency Contacts
        </button>
      </div>

      {/* Emergency Contacts Modal */}
      {showContacts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Emergency Contacts</h2>
              <button
                onClick={() => setShowContacts(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <EmergencyContacts />
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="text-sm text-red-600 font-medium">Emergency Tickets</p>
              <p className="text-2xl font-bold text-red-800">
                {emergencyTickets.filter(t => t.priority === 5).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm text-orange-600 font-medium">High Priority</p>
              <p className="text-2xl font-bold text-orange-800">
                {emergencyTickets.filter(t => t.priority === 4).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-sm text-yellow-600 font-medium">SLA Critical</p>
              <p className="text-2xl font-bold text-yellow-800">
                {emergencyTickets.filter(t => t.slaStatus.status === 'critical' || t.slaStatus.status === 'exceeded').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Tickets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            High Priority Tickets
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tickets requiring immediate attention
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadEmergencyTickets}
                className="mt-2 text-red-700 hover:text-red-900 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {emergencyTickets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">✅</span>
              <p>No emergency tickets at the moment</p>
              <p className="text-sm">All tickets are within normal priority levels</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencyTickets.map(ticket => (
                <div
                  key={ticket._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <PriorityBadge 
                        priority={ticket.priority} 
                        animated={ticket.priority >= 4}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {ticket.customerInfo.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticket.department} Department
                        </p>
                      </div>
                    </div>
                    
                    <SLATimer
                      ticketId={ticket._id}
                      priority={ticket.priority}
                      createdAt={ticket.createdAt}
                      onSLAExceeded={() => console.log('SLA exceeded for ticket:', ticket._id)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
                      {ticket.customerInfo.email && (
                        <p>Email: {ticket.customerInfo.email}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptTicket(ticket._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Accept
                      </button>
                      {ticket.priority < 5 && (
                        <button
                          onClick={() => handleEscalateTicket(ticket._id, 'Manual escalation from emergency dashboard')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;