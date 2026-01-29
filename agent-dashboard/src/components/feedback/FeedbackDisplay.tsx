import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentFeedback: Array<{
    ticketId: string;
    rating: number;
    comment: string;
    resolvedAt: string;
    priority: string;
  }>;
  teamAverageRating: number;
  timeRange: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface FeedbackDisplayProps {
  className?: string;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ className = '' }) => {
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchFeedbackStats();
  }, [timeRange]);

  const fetchFeedbackStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/agent/feedback/stats?timeRange=${timeRange}`);
      
      if (response.success) {
        setFeedbackStats(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch feedback statistics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feedback statistics');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getPerformanceStatus = (rating: number, teamAverage: number): string => {
    const threshold = 0.2; // 0.2 point threshold
    
    if (rating > teamAverage + threshold) return 'above';
    if (rating < teamAverage - threshold) return 'below';
    return 'average';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'above': return 'text-green-600 bg-green-50';
      case 'below': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'above': return '↗';
      case 'below': return '↘';
      default: return '→';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchFeedbackStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!feedbackStats) return null;

  const performanceStatus = getPerformanceStatus(feedbackStats.averageRating, feedbackStats.teamAverageRating);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Customer Feedback</h2>
          <div className="flex space-x-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Rating */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">Overall Rating</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(performanceStatus)}`}>
              {getStatusIcon(performanceStatus)} vs Team
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900 mr-2">
                {feedbackStats.averageRating.toFixed(1)}
              </span>
              {renderStars(feedbackStats.averageRating, 'lg')}
            </div>
            <div className="text-sm text-gray-500">
              <p>{feedbackStats.totalFeedbacks} reviews</p>
              <p>Team avg: {feedbackStats.teamAverageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = feedbackStats.ratingDistribution[rating as keyof typeof feedbackStats.ratingDistribution];
              const percentage = feedbackStats.totalFeedbacks > 0 ? (count / feedbackStats.totalFeedbacks) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center w-12">
                    <span className="text-sm text-gray-600 mr-1">{rating}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Feedback */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Recent Feedback</h3>
          {feedbackStats.recentFeedback.length > 0 ? (
            <div className="space-y-4">
              {feedbackStats.recentFeedback.map((feedback, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(feedback.rating, 'sm')}
                      <span className="text-sm font-medium text-gray-900">
                        {feedback.rating}/5
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        feedback.priority === 'Emergency' ? 'bg-red-100 text-red-800' :
                        feedback.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        feedback.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {feedback.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(feedback.resolvedAt)}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 italic">
                      "{feedback.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No feedback received yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};