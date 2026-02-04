import React, { useState, useEffect } from 'react';
import { slaService } from '../../services/slaService';

interface SLAInfo {
  responseTimeRemaining: number;
  resolutionTimeRemaining: number;
  isResponseOverdue: boolean;
  isResolutionOverdue: boolean;
  responseDeadline: string;
  resolutionDeadline: string;
}

interface SLATimerProps {
  slaInfo: SLAInfo | null | undefined;
  priority: string;
  ticketId: string;
  onEscalationNeeded?: (ticketId: string, reason: string) => void;
  compact?: boolean;
}

export const SLATimer: React.FC<SLATimerProps> = ({
  slaInfo,
  priority,
  ticketId,
  onEscalationNeeded,
  compact = false
}) => {
  // Add null safety check at the very start
  if (!slaInfo) {
    return null;
  }

  const [_currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for escalation needs and SLA alerts
  useEffect(() => {
    // Check SLA status and create alerts
    if (slaInfo) {
      slaService.checkSLAStatus(ticketId, slaInfo, priority);

      if (slaInfo.isResponseOverdue && onEscalationNeeded) {
        onEscalationNeeded(ticketId, 'Response SLA exceeded');
      }
    }
  }, [slaInfo?.isResponseOverdue, ticketId, onEscalationNeeded, slaInfo, priority]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0m';
    
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSLATarget = (priority: string): number => {
    switch (priority.toLowerCase()) {
      case 'emergency':
        return 2; // 2 minutes
      case 'high':
        return 5; // 5 minutes
      case 'medium':
        return 10; // 10 minutes
      case 'low':
        return 15; // 15 minutes
      default:
        return 10; // Default 10 minutes
    }
  };

  const getSLAStatus = () => {
    if (!slaInfo) {
      return {
        status: 'unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⏱️',
        label: 'LOADING'
      };
    }

    const responseTime = slaInfo.responseTimeRemaining;
    const target = getSLATarget(priority) * 60000; // Convert to milliseconds
    const warningThreshold = target * 0.25; // 25% of target time
    
    if (slaInfo.isResponseOverdue) {
      return {
        status: 'overdue',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🚨',
        label: 'OVERDUE'
      };
    } else if (responseTime < warningThreshold) {
      return {
        status: 'critical',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⚠️',
        label: 'CRITICAL'
      };
    } else if (responseTime < target * 0.5) {
      return {
        status: 'warning',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏰',
        label: 'WARNING'
      };
    } else {
      return {
        status: 'good',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
        label: 'ON TIME'
      };
    }
  };

  const slaStatus = getSLAStatus();
  const responseTimeFormatted = formatTimeRemaining(slaInfo.responseTimeRemaining);
  const resolutionTimeFormatted = formatTimeRemaining(slaInfo.resolutionTimeRemaining);

  if (compact) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${slaStatus.color}`}>
        <span className="mr-1">{slaStatus.icon}</span>
        <span>SLA: {responseTimeFormatted}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${slaStatus.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{slaStatus.icon}</span>
          <h3 className="font-semibold">SLA Status</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          slaStatus.status === 'overdue' ? 'bg-red-200 text-red-900' :
          slaStatus.status === 'critical' ? 'bg-orange-200 text-orange-900' :
          slaStatus.status === 'warning' ? 'bg-yellow-200 text-yellow-900' :
          'bg-green-200 text-green-900'
        }`}>
          {slaStatus.label}
        </span>
      </div>

      <div className="space-y-3">
        {/* Response Time */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium">First Response</div>
            <div className="text-xs text-gray-600">
              Target: {getSLATarget(priority)} minutes ({priority} priority)
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              slaInfo.isResponseOverdue ? 'text-red-600' : 
              slaStatus.status === 'critical' ? 'text-orange-600' :
              slaStatus.status === 'warning' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {slaInfo.isResponseOverdue ? 'OVERDUE' : responseTimeFormatted}
            </div>
            <div className="text-xs text-gray-500">
              Due: {new Date(slaInfo.responseDeadline).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Resolution Time */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div>
            <div className="text-sm font-medium">Resolution</div>
            <div className="text-xs text-gray-600">
              Target: {getSLATarget(priority) * 4} minutes
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              slaInfo.isResolutionOverdue ? 'text-red-600' : 
              slaInfo.resolutionTimeRemaining < 900000 ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {slaInfo.isResolutionOverdue ? 'OVERDUE' : resolutionTimeFormatted}
            </div>
            <div className="text-xs text-gray-500">
              Due: {new Date(slaInfo.resolutionDeadline).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Response Progress</span>
          <span>{Math.max(0, Math.round((1 - slaInfo.responseTimeRemaining / (getSLATarget(priority) * 60000)) * 100))}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              slaInfo.isResponseOverdue ? 'bg-red-500' :
              slaStatus.status === 'critical' ? 'bg-orange-500' :
              slaStatus.status === 'warning' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ 
              width: `${Math.min(100, Math.max(0, (1 - slaInfo.responseTimeRemaining / (getSLATarget(priority) * 60000)) * 100))}%` 
            }}
          />
        </div>
      </div>

      {/* Escalation Warning */}
      {(slaStatus.status === 'critical' || slaStatus.status === 'overdue') && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center space-x-2">
            <span>🚨</span>
            <span className="font-medium text-red-800">
              {slaStatus.status === 'overdue' 
                ? 'SLA exceeded - Supervisor notified'
                : 'SLA deadline approaching - Prioritize response'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};