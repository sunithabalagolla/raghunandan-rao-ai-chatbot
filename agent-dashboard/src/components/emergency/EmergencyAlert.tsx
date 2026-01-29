import React, { useState, useEffect } from 'react';
import { emergencyService } from '../../services/emergencyService';
import type { EmergencyTicket } from '../../services/emergencyService';

interface EmergencyAlertProps {
  ticket: EmergencyTicket;
  onAccept: (ticketId: string) => void;
  onDismiss: (ticketId: string) => void;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ ticket, onAccept, onDismiss }) => {
  const [timeRemaining, setTimeRemaining] = useState(ticket.slaStatus.timeRemaining);
  const priorityStyle = emergencyService.getPriorityStyle(ticket.priority);
  const slaStyle = emergencyService.getSLAStatusStyle(ticket.slaStatus.status);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1/60)); // Decrease by 1 second
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Play alert sound when component mounts
    emergencyService.playEmergencyAlert();
    
    // Show browser notification
    emergencyService.showEmergencyNotification(ticket);
  }, [ticket]);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${priorityStyle.bgColor} ${priorityStyle.borderColor} border-2 rounded-lg shadow-2xl animate-pulse`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚨</span>
            <span className={`font-bold text-sm ${priorityStyle.color}`}>
              {priorityStyle.label} PRIORITY
            </span>
          </div>
          <button
            onClick={() => onDismiss(ticket._id)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Customer Info */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900">
            {ticket.customerInfo.name}
          </h3>
          <p className="text-sm text-gray-600">
            {ticket.department} Department
          </p>
          {ticket.customerInfo.email && (
            <p className="text-sm text-gray-600">
              {ticket.customerInfo.email}
            </p>
          )}
        </div>

        {/* SLA Status */}
        <div className={`mb-4 p-2 rounded ${slaStyle.bgColor}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${slaStyle.color}`}>
              {slaStyle.icon} SLA: {ticket.slaStatus.status.toUpperCase()}
            </span>
            <span className={`text-sm font-bold ${slaStyle.color}`}>
              {emergencyService.formatTimeRemaining(timeRemaining)}
            </span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                ticket.slaStatus.status === 'exceeded' ? 'bg-red-500' :
                ticket.slaStatus.status === 'critical' ? 'bg-orange-500' :
                ticket.slaStatus.status === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, ticket.slaStatus.percentage)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onAccept(ticket._id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Accept Emergency
          </button>
          <button
            onClick={() => onDismiss(ticket._id)}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;