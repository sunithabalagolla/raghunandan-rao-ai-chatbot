import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

type AgentStatus = 'available' | 'busy' | 'away' | 'offline';

interface StatusOption {
  value: AgentStatus;
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  description: string;
}

export const AgentStatusToggle: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const statusOptions: StatusOption[] = [
    {
      value: 'available',
      label: 'Available',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      dotColor: 'bg-green-500',
      description: 'Ready to accept new tickets'
    },
    {
      value: 'busy',
      label: 'Busy',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
      dotColor: 'bg-yellow-500',
      description: 'At maximum capacity'
    },
    {
      value: 'away',
      label: 'Away',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-orange-200',
      dotColor: 'bg-orange-500',
      description: 'Temporarily unavailable'
    },
    {
      value: 'offline',
      label: 'Offline',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200',
      dotColor: 'bg-gray-500',
      description: 'Not accepting tickets'
    }
  ];

  const currentStatus = (user?.agentProfile?.status as AgentStatus) || 'available';
  const currentStatusOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  const handleStatusChange = async (newStatus: AgentStatus) => {
    if (newStatus === currentStatus || isUpdating) return;

    try {
      setIsUpdating(true);
      setIsDropdownOpen(false);

      // Call API to update status
      await apiService.updateAgentStatus(newStatus);

      // Update local user state
      if (user?.agentProfile) {
        updateUser({
          agentProfile: {
            ...user.agentProfile,
            status: newStatus
          }
        });
      }

      console.log(`Status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      // TODO: Show error notification to user
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      {/* Status Toggle Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isUpdating}
        className={`
          flex items-center w-full px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md
          ${isUpdating 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }
          ${currentStatusOption.bgColor} ${currentStatusOption.color}
        `}
      >
        {/* Status Indicator Dot with Pulse Animation */}
        <div className="relative mr-3">
          <div className={`w-3 h-3 rounded-full ${currentStatusOption.dotColor}`} />
          {currentStatus === 'available' && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${currentStatusOption.dotColor} animate-ping opacity-75`} />
          )}
        </div>
        
        {/* Status Text */}
        <div className="flex-1 text-left">
          <div className="font-semibold">
            {isUpdating ? 'Updating...' : currentStatusOption.label}
          </div>
          <div className="text-xs opacity-75 mt-0.5">
            {currentStatusOption.description}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
            <div className="py-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating || option.value === currentStatus}
                  className={`
                    w-full px-4 py-3 text-left text-sm transition-all duration-200
                    ${option.value === currentStatus
                      ? 'bg-blue-50 text-blue-700 cursor-default'
                      : 'hover:bg-gray-50 text-gray-700 hover:scale-105'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <div className={`w-3 h-3 rounded-full ${option.dotColor}`} />
                      {option.value === 'available' && (
                        <div className={`absolute inset-0 w-3 h-3 rounded-full ${option.dotColor} animate-ping opacity-75`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    </div>
                    {option.value === currentStatus && (
                      <div className="ml-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};