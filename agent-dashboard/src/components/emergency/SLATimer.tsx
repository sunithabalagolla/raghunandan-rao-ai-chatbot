import React, { useState, useEffect } from 'react';
import { emergencyService } from '../../services/emergencyService';

interface SLATimerProps {
  ticketId: string;
  priority: number;
  createdAt: string;
  onSLAExceeded?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const SLATimer: React.FC<SLATimerProps> = ({ 
  ticketId, 
  priority: _priority, 
  createdAt: _createdAt, 
  onSLAExceeded,
  size = 'md' 
}) => {
  const [slaStatus, setSlaStatus] = useState<{
    status: 'safe' | 'warning' | 'critical' | 'exceeded';
    timeRemaining: number;
    percentage: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSLAStatus();
    const interval = setInterval(loadSLAStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    // Real-time countdown
    if (slaStatus && slaStatus.timeRemaining > 0) {
      const interval = setInterval(() => {
        setSlaStatus(prev => {
          if (!prev || prev.timeRemaining <= 0) return prev;
          
          const newTimeRemaining = prev.timeRemaining - 1/60; // Decrease by 1 second
          const newStatus = newTimeRemaining <= 0 ? 'exceeded' : prev.status;
          
          if (newStatus === 'exceeded' && prev.status !== 'exceeded' && onSLAExceeded) {
            onSLAExceeded();
          }
          
          return {
            ...prev,
            timeRemaining: Math.max(0, newTimeRemaining),
            status: newStatus
          };
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [slaStatus, onSLAExceeded]);

  const loadSLAStatus = async () => {
    try {
      const status = await emergencyService.getSLAStatus(ticketId);
      setSlaStatus({
        status: status.status,
        timeRemaining: status.timeRemaining,
        percentage: status.percentage
      });
    } catch (error) {
      console.error('Error loading SLA status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (!slaStatus) {
    return null;
  }

  const style = emergencyService.getSLAStatusStyle(slaStatus.status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const progressBarHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`inline-flex flex-col space-y-1 ${style.bgColor} rounded-lg p-2`}>
      <div className="flex items-center justify-between space-x-2">
        <span className={`${sizeClasses[size]} font-medium ${style.color}`}>
          {style.icon} SLA
        </span>
        <span className={`${sizeClasses[size]} font-bold ${style.color}`}>
          {emergencyService.formatTimeRemaining(slaStatus.timeRemaining)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${progressBarHeight[size]} rounded-full transition-all duration-1000 ${
            slaStatus.status === 'exceeded' ? 'bg-red-500' :
            slaStatus.status === 'critical' ? 'bg-orange-500' :
            slaStatus.status === 'warning' ? 'bg-yellow-500' :
            'bg-green-500'
          } ${slaStatus.status === 'exceeded' ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(100, slaStatus.percentage)}%` }}
        />
      </div>
      
      <div className={`text-xs ${style.color} text-center`}>
        {slaStatus.status.toUpperCase()}
      </div>
    </div>
  );
};

export default SLATimer;