import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { NotificationSettingsComponent } from '../notifications/NotificationSettings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeView, onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        activeView={activeView}
        onNavigate={onNavigate}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors duration-200"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Header content */}
          <div className="flex-1 px-6 flex justify-between items-center">
            {/* Left side - Page title */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Agent Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Manage your tickets and customer interactions
              </p>
            </div>

            {/* Right side - user info and controls */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="relative bg-white dark:bg-gray-700 p-2 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <span className="sr-only">Toggle theme</span>
                {theme === 'light' ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>

              {/* Notifications */}
              <NotificationBell 
                onClick={() => setNotificationPanelOpen(true)}
                className="hover:scale-105 transition-transform"
              />

              {/* Settings button */}
              <button 
                onClick={() => setNotificationSettingsOpen(true)}
                className="relative bg-white dark:bg-gray-700 p-2 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                title="Notification Settings"
              >
                <span className="sr-only">Notification settings</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* User info */}
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-full py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                {/* User avatar */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role} • Online
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white dark:bg-gray-900">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Notification Panel */}
        <NotificationPanel 
          isOpen={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
        />

        {/* Notification Settings Modal */}
        {notificationSettingsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" onClick={() => setNotificationSettingsOpen(false)} />
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <NotificationSettingsComponent onClose={() => setNotificationSettingsOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};