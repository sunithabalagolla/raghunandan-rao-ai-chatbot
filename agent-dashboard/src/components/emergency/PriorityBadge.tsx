import React from 'react';
import { emergencyService } from '../../services/emergencyService';

interface PriorityBadgeProps {
  priority: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'md', 
  showIcon = true,
  animated = false 
}) => {
  const style = emergencyService.getPriorityStyle(priority);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconMap = {
    5: '🚨', // Emergency
    4: '⚠️', // High
    3: '🔶', // Medium
    2: '🔵', // Normal
    1: '⚪'  // Low
  };

  return (
    <span
      className={`
        inline-flex items-center space-x-1 font-semibold rounded-full border
        ${style.color} ${style.bgColor} ${style.borderColor}
        ${sizeClasses[size]}
        ${animated && priority >= 4 ? 'animate-pulse' : ''}
        ${priority === 5 ? 'shadow-lg shadow-red-200' : ''}
      `}
    >
      {showIcon && (
        <span className="text-current">
          {iconMap[priority as keyof typeof iconMap] || iconMap[2]}
        </span>
      )}
      <span>{style.label}</span>
    </span>
  );
};

export default PriorityBadge;