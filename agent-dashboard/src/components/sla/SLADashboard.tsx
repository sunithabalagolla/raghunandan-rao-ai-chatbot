import React, { useState, useEffect } from 'react';

interface SLAMetrics {
  totalTickets: number;
  onTimeResponses: number;
  overdueResponses: number;
  complianceRate: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  escalatedTickets: number;
}

interface SLATarget {
  priority: string;
  responseTarget: number; // minutes
  resolutionTarget: number; // minutes
}

interface SLADashboardProps {
  agentId?: string;
  timeRange?: 'today' | 'week' | 'month';
  isTeamView?: boolean;
}

export const SLADashboard: React.FC<SLADashboardProps> = ({
  agentId,
  timeRange = 'today',
  isTeamView = false
}) => {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [targets, setTargets] = useState<SLATarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Default SLA targets
  const defaultTargets: SLATarget[] = [
    { priority: 'Emergency', responseTarget: 2, resolutionTarget: 8 },
    { priority: 'High', responseTarget: 5, resolutionTarget: 20 },
    { priority: 'Medium', responseTarget: 10, resolutionTarget: 40 },
    { priority: 'Low', responseTarget: 15, resolutionTarget: 60 }
  ];

  useEffect(() => {
    setTargets(defaultTargets);
    fetchSLAMetrics();
  }, [agentId, timeRange]);

  const fetchSLAMetrics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch real SLA compliance data from API
      const response = await fetch('/api/agent/sla/compliance?' + new URLSearchParams({
        timeRange: timeRange,
        ...(agentId && { agentId })
      }), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch SLA metrics');
      }
    } catch (err: any) {
      console.error('Error fetching SLA metrics:', err);
      setError('Failed to load SLA metrics');
      
      // Fallback to mock data if API fails
      const mockMetrics: SLAMetrics = {
        totalTickets: 45,
        onTimeResponses: 38,
        overdueResponses: 7,
        complianceRate: 84.4,
        averageResponseTime: 4.2,
        averageResolutionTime: 18.5,
        escalatedTickets: 3
      };
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (rate: number) => {
    if (rate >= 95) return 'bg-green-100 text-green-800';
    if (rate >= 85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchSLAMetrics}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            SLA Performance {isTeamView ? '- Team Overview' : ''}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance metrics for {timeRange === 'today' ? 'today' : timeRange === 'week' ? 'this week' : 'this month'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => {
              // In real implementation, this would trigger a re-fetch
              console.log('Time range changed:', e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className={`text-2xl font-bold ${getComplianceColor(metrics.complianceRate)}`}>
                {metrics.complianceRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageResponseTime}m
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.overdueResponses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Escalated</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.escalatedTickets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Targets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Targets</h3>
          <div className="space-y-4">
            {targets.map((target) => (
              <div key={target.priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{target.priority} Priority</div>
                  <div className="text-sm text-gray-600">
                    Response: {target.responseTarget}m | Resolution: {target.resolutionTarget}m
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  target.priority === 'Emergency' ? 'bg-red-100 text-red-800' :
                  target.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                  target.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {target.priority}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Tickets Handled</span>
              <span className="font-semibold text-gray-900">{metrics.totalTickets}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">On-Time Responses</span>
              <span className="font-semibold text-green-600">{metrics.onTimeResponses}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overdue Responses</span>
              <span className="font-semibold text-red-600">{metrics.overdueResponses}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Resolution Time</span>
              <span className="font-semibold text-gray-900">{metrics.averageResolutionTime}m</span>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Rating</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceBadge(metrics.complianceRate)}`}>
                  {metrics.complianceRate >= 95 ? 'Excellent' :
                   metrics.complianceRate >= 85 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance Trend</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Compliance trend chart would be displayed here</p>
            <p className="text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};