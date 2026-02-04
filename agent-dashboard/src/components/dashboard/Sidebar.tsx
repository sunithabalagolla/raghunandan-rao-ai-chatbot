import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AgentStatusToggle } from './AgentStatusToggle';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeView, onNavigate }) => {
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState(activeView || 'dashboard');

  // Define navigation menu items
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['agent', 'supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      id: 'emergency',
      label: 'Emergency',
      path: '/emergency',
      roles: ['agent', 'supervisor', 'admin'],
      badge: '2',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      id: 'queue',
      label: 'Ticket Queue',
      path: '/queue',
      roles: ['agent', 'supervisor', 'admin'],
      badge: '12',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'chats',
      label: 'Active Chats',
      path: '/chats',
      roles: ['agent', 'supervisor', 'admin'],
      badge: '3',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
        </svg>
      ),
    },
    {
      id: 'templates',
      label: 'Templates',
      path: '/templates',
      roles: ['agent', 'supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      path: '/performance',
      roles: ['agent', 'supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'feedback',
      label: 'Customer Feedback',
      path: '/feedback',
      roles: ['agent', 'supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      id: 'team',
      label: 'Team Management',
      path: '/team',
      roles: ['supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      roles: ['agent', 'supervisor', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleMenuClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    
    // Map sidebar IDs to Dashboard view names
    const viewMap: { [key: string]: string } = {
      'dashboard': 'overview',
      'queue': 'queue',
      'chats': 'chat',
      'templates': 'templates',
      'performance': 'performance',
      'feedback': 'feedback',
      'emergency': 'emergency',
      'team': 'team',
      'settings': 'settings'
    };
    
    const viewName = viewMap[itemId] || itemId;
    
    if (onNavigate) {
      onNavigate(viewName);
    } else {
      console.log(`Navigate to: ${path} (view: ${viewName})`);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 flex flex-col
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">AD</span>
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white">Agent Dashboard</h2>
              <p className="text-xs text-blue-100">Customer Support Portal</p>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6" style={{ height: 'calc(100vh - 16rem)' }}>
          <div className="space-y-2">
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id, item.path)}
                className={`
                  group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl w-full text-left transition-all duration-200 hover:scale-105
                  ${activeItem === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center">
                  <span className={`
                    mr-3 flex-shrink-0 transition-colors duration-200
                    ${activeItem === item.id ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}
                  `}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {item.badge && (
                  <span className={`
                    inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[20px] h-5
                    ${activeItem === item.id 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Agent Status Section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Agent Status
            </div>
            <AgentStatusToggle />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">12</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Pending</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">8</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Resolved</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};