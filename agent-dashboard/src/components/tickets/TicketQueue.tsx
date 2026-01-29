import React, { useState, useEffect } from 'react';
import { TicketCard } from './TicketCard';
import { TicketFilters } from './TicketFilters';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Ticket {
  id: string;
  customerName: string;
  subject: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  priorityLevel: string;
  language: string;
  waitTime: number;
  lastMessage: string;
  timestamp: Date;
  status: 'pending' | 'assigned' | 'resolved';
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reason: string;
  createdAt: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

interface TicketQueueProps {
  onTicketAccept: (ticketId: string) => void;
}

export const TicketQueue: React.FC<TicketQueueProps> = ({ onTicketAccept }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    department: 'all',
    priority: 'all',
    language: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  // Fetch tickets from API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.get('/agent/tickets/pending', {
        params: {
          limit: 50,
          department: filters.department !== 'all' ? filters.department : undefined,
          priority: filters.priority !== 'all' ? filters.priority : undefined,
          language: filters.language !== 'all' ? filters.language : undefined,
        }
      });

      if (response.data.success) {
        const apiTickets = response.data.data.tickets.map((ticket: any) => ({
          id: ticket._id,
          customerName: `${ticket.userId?.firstName || 'Unknown'} ${ticket.userId?.lastName || 'User'}`,
          subject: ticket.reason || 'No subject',
          department: 'general', // Default since not in API response
          priority: (ticket.priorityLevel || 'medium').toLowerCase(),
          priorityLevel: ticket.priorityLevel || 'Medium',
          language: 'en', // Default since not in API response
          waitTime: Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60)),
          lastMessage: ticket.reason || 'No message',
          timestamp: new Date(ticket.createdAt),
          status: 'pending',
          userId: ticket.userId || {},
          reason: ticket.reason || 'No reason',
          createdAt: ticket.createdAt,
          queuePosition: ticket.queuePosition,
          estimatedWaitTime: ticket.estimatedWaitTime
        }));
        
        setTickets(apiTickets);
      } else {
        setError('Failed to fetch tickets');
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Refetch when filters change
  useEffect(() => {
    if (user && !loading) {
      fetchTickets();
    }
  }, [filters]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, filters]);

  // Filter tickets locally (in addition to API filtering)
  useEffect(() => {
    let filtered = tickets;

    // Sort by priority and wait time
    filtered.sort((a, b) => {
      const priorityOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return b.waitTime - a.waitTime;
    });

    setFilteredTickets(filtered);
  }, [tickets]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      const response = await apiService.post(`/agent/tickets/${ticketId}/accept`);
      
      if (response.data.success) {
        // Remove ticket from local state
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
        onTicketAccept(ticketId);
        
        // Show success message
        console.log('Ticket accepted successfully');
      } else {
        setError('Failed to accept ticket');
      }
    } catch (err: any) {
      console.error('Error accepting ticket:', err);
      setError(err.response?.data?.message || 'Failed to accept ticket');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Error loading tickets</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchTickets}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ticket Queue</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredTickets.length} tickets
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
          <button
            onClick={fetchTickets}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <TicketFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets in queue</h3>
            <p className="text-gray-500">All tickets have been handled or no tickets match your filters.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onAccept={() => handleAcceptTicket(ticket.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};