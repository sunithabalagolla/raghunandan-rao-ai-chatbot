import React, { useState, useEffect } from 'react';
import { performanceService } from '../../services/performanceService';
import type { AgentPerformanceData } from '../../services/performanceService';

export const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<AgentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await performanceService.getAgentPerformance(timeRange);
      setPerformanceData(data);
    } catch (err) {
      console.error('Failed to load performance data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'bg-green-100 text-green-800';
    if (value >= threshold.warning) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Performance Data</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadPerformanceData}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) return null;

  const { current, historical, teamAverage, suggestions } = performanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
              <p className="text-gray-600">Track your productivity and service quality metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{current.chatsHandled}</div>
            <div className="text-sm text-gray-600">Chats Handled</div>
            <div className="text-xs text-gray-500 mt-1">
              Team avg: {teamAverage.chatsHandled}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(current.averageResponseTime, { good: 120, warning: 180 })}`}>
              {current.averageResponseTime}s
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-xs text-gray-500 mt-1">
              Team avg: {teamAverage.averageResponseTime}s
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(current.resolutionRate, { good: 85, warning: 70 })}`}>
              {current.resolutionRate}%
            </div>
            <div className="text-sm text-gray-600">Resolution Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Team avg: {teamAverage.resolutionRate}%
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(current.customerSatisfaction, { good: 4.0, warning: 3.5 })}`}>
              {current.customerSatisfaction.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Customer Rating</div>
            <div className="text-xs text-gray-500 mt-1">
              Team avg: {teamAverage.customerSatisfaction.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Team Average</h2>
        <div className="space-y-4">
          {[
            { label: 'Chats Handled', current: current.chatsHandled, team: teamAverage.chatsHandled, unit: '' },
            { label: 'Response Time', current: current.averageResponseTime, team: teamAverage.averageResponseTime, unit: 's', inverse: true },
            { label: 'Resolution Rate', current: current.resolutionRate, team: teamAverage.resolutionRate, unit: '%' },
            { label: 'Customer Rating', current: current.customerSatisfaction, team: teamAverage.customerSatisfaction, unit: '', decimal: 1 }
          ].map((metric) => {
            const percentage = metric.inverse 
              ? ((metric.team - metric.current) / metric.team) * 100
              : ((metric.current - metric.team) / metric.team) * 100;
            const isPositive = percentage > 0;
            
            return (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{metric.label}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {metric.decimal ? metric.current.toFixed(metric.decimal) : metric.current}{metric.unit}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isPositive ? '+' : ''}{percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{current.activeTime}</div>
            <div className="text-sm text-blue-700">Active Time</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{current.currentChats}</div>
            <div className="text-sm text-green-700">Active Chats</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{current.templatesUsed}</div>
            <div className="text-sm text-purple-700">Templates Used</div>
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h2>
        <div className="space-y-4">
          {historical.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-900">{day.date}</div>
                <div className="text-sm text-gray-600">{day.chatsHandled} chats</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">{day.averageResponseTime}s avg</div>
                <div className="text-sm text-gray-600">{day.resolutionRate}% resolved</div>
                <div className={`text-sm px-2 py-1 rounded-full ${getPerformanceBadge(day.customerSatisfaction, { good: 4.0, warning: 3.5 })}`}>
                  {day.customerSatisfaction.toFixed(1)} ⭐
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Improvement Suggestions</h2>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-yellow-800">{suggestion.title}</div>
                  <div className="text-sm text-yellow-700">{suggestion.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};