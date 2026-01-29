import React, { useState, useEffect } from 'react';
import { notificationService, type InAppNotification } from '../../services/notificationService';

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const handleNewNotification = (notification: InAppNotification) => {
      // Only show toast for notifications with autoClose
      if (notification.autoClose && notification.autoClose > 0) {
        setToasts(prev => [...prev, notification]);

        // Auto-remove after specified time
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, notification.autoClose);
      }
    };

    notificationService.onNotification(handleNewNotification);
  }, []);

  const removeToast = (notificationId: string) => {
    setToasts(prev => prev.filter(t => t.id !== notificationId));
  };

  const getToastStyles = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return 'bg-red-500 text-white border-red-600';
    }

    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full shadow-lg rounded-lg border-l-4 p-4 
            transform transition-all duration-300 ease-in-out
            animate-slide-in-right
            ${getToastStyles(toast.type, toast.priority)}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(toast.type, toast.priority)}
            </div>
            
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold">
                {toast.title}
              </h4>
              <p className="text-sm mt-1 opacity-90">
                {toast.message}
              </p>
              
              {toast.actions && toast.actions.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  {toast.actions.map((action, index) => (
                    <button
                      key={index}
                      className="px-3 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                    >
                      {action.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};