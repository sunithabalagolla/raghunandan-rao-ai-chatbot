import { apiService } from './api';

export interface PerformanceMetrics {
  chatsHandled: number;
  averageResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  activeTime: string;
  currentChats: number;
  templatesUsed: number;
}

export interface HistoricalPerformance {
  date: string;
  chatsHandled: number;
  averageResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
}

export interface PerformanceSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AgentPerformanceData {
  current: PerformanceMetrics;
  historical: HistoricalPerformance[];
  teamAverage: PerformanceMetrics;
  suggestions: PerformanceSuggestion[];
}

export interface PerformanceGoals {
  chatsHandled: number;
  averageResponseTime: number; // in minutes
  resolutionRate: number; // percentage
  customerSatisfaction: number; // rating 1-5
}

export interface PerformanceComparison {
  metric: string;
  current: number;
  target: number;
  teamAverage: number;
  status: 'above' | 'below' | 'meeting';
  improvement: number; // percentage change
}

class PerformanceService {
  /**
   * Get comprehensive agent performance data for dashboard
   */
  async getAgentPerformance(timeRange: 'today' | 'week' | 'month' = 'today'): Promise<AgentPerformanceData> {
    try {
      const response = await apiService.get(`/agent/performance?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agent performance:', error);
      // Return mock data for development
      return this.getMockPerformanceData(timeRange);
    }
  }

  /**
   * Get agent performance metrics
   */
  async getPerformanceMetrics(timeRange: 'today' | 'week' | 'month' = 'today'): Promise<PerformanceMetrics> {
    try {
      const response = await apiService.get(`/agent/performance/metrics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      return this.getMockSessionMetrics();
    }
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await apiService.get('/agent/performance/session');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch session metrics:', error);
      return this.getMockSessionMetrics();
    }
  }

  /**
   * Get historical performance data
   */
  async getHistoricalData(days: number = 7): Promise<HistoricalPerformance[]> {
    try {
      const response = await apiService.get(`/agent/performance/historical?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      return this.getMockHistoricalData(days);
    }
  }

  /**
   * Get team comparison data
   */
  async getTeamComparison(): Promise<{ agent: PerformanceMetrics; team: PerformanceMetrics }> {
    try {
      const response = await apiService.get('/agent/performance/comparison');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch team comparison:', error);
      return this.getMockTeamComparison();
    }
  }

  /**
   * Get performance goals for the agent
   */
  async getPerformanceGoals(): Promise<PerformanceGoals> {
    const response = await apiService.get('/agent/performance/goals');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch performance goals');
    }
    
    return response.data;
  }

  /**
   * Update performance goals
   */
  async updatePerformanceGoals(goals: Partial<PerformanceGoals>): Promise<PerformanceGoals> {
    const response = await apiService.put('/agent/performance/goals', goals);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update performance goals');
    }
    
    return response.data;
  }

  /**
   * Get detailed performance comparison
   */
  async getPerformanceComparison(timeRange: 'today' | 'week' | 'month' = 'today'): Promise<PerformanceComparison[]> {
    const response = await apiService.get(`/agent/performance/comparison?timeRange=${timeRange}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch performance comparison');
    }
    
    return response.data;
  }

  /**
   * Get performance insights and suggestions
   */
  async getPerformanceInsights(): Promise<{
    insights: string[];
    suggestions: string[];
    strengths: string[];
    improvements: string[];
  }> {
    const response = await apiService.get('/agent/performance/insights');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch performance insights');
    }
    
    return response.data;
  }

  // Mock data methods for development
  private getMockPerformanceData(timeRange: string): AgentPerformanceData {
    const baseMetrics = {
      today: { chatsHandled: 12, averageResponseTime: 145, resolutionRate: 92, customerSatisfaction: 4.3 },
      week: { chatsHandled: 67, averageResponseTime: 138, resolutionRate: 89, customerSatisfaction: 4.2 },
      month: { chatsHandled: 284, averageResponseTime: 142, resolutionRate: 91, customerSatisfaction: 4.4 }
    };

    const metrics = baseMetrics[timeRange as keyof typeof baseMetrics] || baseMetrics.today;

    return {
      current: {
        ...metrics,
        activeTime: '6h 23m',
        currentChats: 3,
        templatesUsed: 8
      },
      historical: this.getMockHistoricalData(timeRange === 'month' ? 30 : timeRange === 'week' ? 7 : 1),
      teamAverage: {
        chatsHandled: Math.round(metrics.chatsHandled * 0.85),
        averageResponseTime: metrics.averageResponseTime + 20,
        resolutionRate: metrics.resolutionRate - 5,
        customerSatisfaction: metrics.customerSatisfaction - 0.2,
        activeTime: '5h 45m',
        currentChats: 2,
        templatesUsed: 6
      },
      suggestions: this.getMockSuggestions(metrics)
    };
  }

  private getMockSessionMetrics(): PerformanceMetrics {
    return {
      chatsHandled: 12,
      averageResponseTime: 145,
      resolutionRate: 92,
      customerSatisfaction: 4.3,
      activeTime: '6h 23m',
      currentChats: 3,
      templatesUsed: 8
    };
  }

  private getMockHistoricalData(days: number): HistoricalPerformance[] {
    const data: HistoricalPerformance[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        chatsHandled: Math.floor(Math.random() * 20) + 5,
        averageResponseTime: Math.floor(Math.random() * 60) + 120,
        resolutionRate: Math.floor(Math.random() * 20) + 80,
        customerSatisfaction: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10
      });
    }

    return data;
  }

  private getMockTeamComparison(): { agent: PerformanceMetrics; team: PerformanceMetrics } {
    const agent = this.getMockSessionMetrics();
    return {
      agent,
      team: {
        chatsHandled: Math.round(agent.chatsHandled * 0.85),
        averageResponseTime: agent.averageResponseTime + 20,
        resolutionRate: agent.resolutionRate - 5,
        customerSatisfaction: agent.customerSatisfaction - 0.2,
        activeTime: '5h 45m',
        currentChats: 2,
        templatesUsed: 6
      }
    };
  }

  private getMockSuggestions(metrics: Partial<PerformanceMetrics>): PerformanceSuggestion[] {
    const suggestions: PerformanceSuggestion[] = [];

    if (metrics.averageResponseTime && metrics.averageResponseTime > 180) {
      suggestions.push({
        title: 'Improve Response Time',
        description: 'Your average response time is above the target. Consider using more templates for common responses.',
        priority: 'high'
      });
    }

    if (metrics.resolutionRate && metrics.resolutionRate < 85) {
      suggestions.push({
        title: 'Focus on Resolution Rate',
        description: 'Try to resolve more tickets in the first interaction. Ask clarifying questions early.',
        priority: 'medium'
      });
    }

    if (metrics.customerSatisfaction && metrics.customerSatisfaction < 4.0) {
      suggestions.push({
        title: 'Enhance Customer Experience',
        description: 'Consider being more empathetic and ensuring customers feel heard before providing solutions.',
        priority: 'high'
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Great Performance!',
        description: 'You\'re performing well across all metrics. Keep up the excellent work!',
        priority: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Format time in minutes to human readable format
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  /**
   * Calculate performance status compared to target
   */
  getPerformanceStatus(
    current: number, 
    target: number, 
    higherIsBetter: boolean = true
  ): 'above' | 'below' | 'meeting' {
    const threshold = 0.05; // 5% threshold
    const ratio = higherIsBetter ? current / target : target / current;
    
    if (ratio > 1 + threshold) return 'above';
    if (ratio < 1 - threshold) return 'below';
    return 'meeting';
  }

  /**
   * Get status color classes for UI
   */
  getStatusColor(status: 'above' | 'below' | 'meeting'): string {
    switch (status) {
      case 'above': return 'text-green-600 bg-green-50 border-green-200';
      case 'below': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: 'above' | 'below' | 'meeting'): string {
    switch (status) {
      case 'above': return '↗️';
      case 'below': return '↘️';
      default: return '➡️';
    }
  }

  /**
   * Calculate improvement percentage
   */
  calculateImprovement(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(metrics: PerformanceMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 0;
    
    // Response time score (0-25 points)
    if (metrics.averageResponseTime <= 120) score += 25;
    else if (metrics.averageResponseTime <= 180) score += 20;
    else if (metrics.averageResponseTime <= 240) score += 15;
    else score += 10;

    // Resolution rate score (0-25 points)
    if (metrics.resolutionRate >= 90) score += 25;
    else if (metrics.resolutionRate >= 80) score += 20;
    else if (metrics.resolutionRate >= 70) score += 15;
    else score += 10;

    // Customer satisfaction score (0-25 points)
    if (metrics.customerSatisfaction >= 4.5) score += 25;
    else if (metrics.customerSatisfaction >= 4.0) score += 20;
    else if (metrics.customerSatisfaction >= 3.5) score += 15;
    else score += 10;

    // Chat volume score (0-25 points)
    if (metrics.chatsHandled >= 20) score += 25;
    else if (metrics.chatsHandled >= 15) score += 20;
    else if (metrics.chatsHandled >= 10) score += 15;
    else score += 10;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary(metrics: PerformanceMetrics, teamAverage: PerformanceMetrics): {
    overallScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
  } {
    // Calculate scores for each metric (0-100)
    const chatScore = Math.min(100, (metrics.chatsHandled / teamAverage.chatsHandled) * 100);
    const responseScore = Math.max(0, 100 - ((metrics.averageResponseTime / teamAverage.averageResponseTime - 1) * 100));
    const resolutionScore = (metrics.resolutionRate / teamAverage.resolutionRate) * 100;
    const satisfactionScore = (metrics.customerSatisfaction / teamAverage.customerSatisfaction) * 100;
    
    // Weighted average (equal weights for now)
    const overallScore = Math.round((chatScore + responseScore + resolutionScore + satisfactionScore) / 4);
    
    // Determine grade
    const grade = this.getPerformanceGrade(metrics);
    
    // Generate summary
    let summary = '';
    if (overallScore >= 90) {
      summary = 'Excellent performance! You\'re exceeding expectations across all metrics.';
    } else if (overallScore >= 80) {
      summary = 'Great job! Your performance is above average with room for minor improvements.';
    } else if (overallScore >= 70) {
      summary = 'Good performance overall. Focus on key areas for improvement.';
    } else if (overallScore >= 60) {
      summary = 'Performance needs improvement. Consider reviewing best practices.';
    } else {
      summary = 'Performance is below expectations. Immediate attention and training recommended.';
    }
    
    return { overallScore, grade, summary };
  }
}

export const performanceService = new PerformanceService();