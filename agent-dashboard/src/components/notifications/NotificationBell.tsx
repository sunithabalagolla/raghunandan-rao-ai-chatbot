import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Update unread count
    const updateCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    // Initial count
    updateCount();

    // Listen for new notifications
    const handleNewNotification = () => {
      updateCount();
      
      // Animate bell
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    };

    notificationService.onNotification(handleNewNotification);

    // Update count periodically
    const interval = setInterval(updateCount, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
        isAnimating ? 'animate-bounce' : ''
      } ${className}`}
      title="Notifications"
    >
      {/* Bell Icon */}
      <svg 
        className={`w-6 h-6 ${isAnimating ? 'animate-pulse' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-5 5v-5zM10.5 3.74a6 6 0 0 1 8.25 8.25l-8.25-8.25z" 
        />
      </svg>
      
      {/* Notification Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};