import React, { useState, useEffect } from 'react';
import { languageService } from '../../services/languageService';
import type { LanguageStatistics as LanguageStatsType } from '../../services/languageService';

export const LanguageStatistics: React.FC = () => {
  const [stats, setStats] = useState<LanguageStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const statistics = await languageService.getLanguageStatistics();
      setStats(statistics);
    } catch (err) {
      console.error('Failed to load language statistics:', err);
      setError('Failed to load language statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Statistics</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadStatistics}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formattedStats = languageService.formatLanguageStats(stats);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Language Statistics</h2>
              <p className="text-sm text-gray-600">Ticket distribution and agent availability by language</p>
            </div>
          </div>
          <button
            onClick={loadStatistics}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh statistics"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {formattedStats.map((langStat) => (
            <div
              key={langStat.language}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl" role="img" aria-label={`${langStat.name} flag`}>
                    {langStat.flag}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{langStat.name}</div>
                    <div className="text-sm text-gray-500">
                      {langStat.language.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Tickets */}
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{langStat.tickets}</div>
                  <div className="text-xs text-gray-500">Tickets</div>
                </div>

                {/* Agents */}
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{langStat.agents}</div>
                  <div className="text-xs text-gray-500">Agents</div>
                </div>

                {/* Response Time */}
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{langStat.avgResponseTime}</div>
                  <div className="text-xs text-gray-500">Avg Response</div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${langStat.color.bg} ${langStat.color.text}`}>
                  {langStat.agents > 0 ? 'Available' : 'No Agents'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(stats.ticketsByLanguage).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Tickets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(stats.agentsByLanguage).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  Object.values(stats.averageResponseTime).reduce((sum, time) => sum + time, 0) / 
                  Object.values(stats.averageResponseTime).filter(time => time > 0).length
                ) || 0}m
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};