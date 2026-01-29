import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from './DashboardLayout';
import { TicketQueue } from '../tickets/TicketQueue';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { SLADashboard } from '../sla/SLADashboard';
import { AgentStats } from '../performance/AgentStats';
import { FeedbackDisplay } from '../feedback/FeedbackDisplay';
import EmergencyDashboard from '../emergency/EmergencyDashboard';
import SupervisorDashboard from '../supervisor/SupervisorDashboard';
import { notificationService } from '../../services/notificationService';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'queue' | 'chat' | 'templates' | 'sla' | 'performance' | 'feedback' | 'emergency' | 'team' | 'settings'>('overview');

  const handleNavigate = (view: string) => {
    const validViews = ['overview', 'queue', 'chat', 'templates', 'sla', 'performance', 'feedback', 'emergency', 'team', 'settings'];
    if (validViews.includes(view)) {
      setActiveView(view as typeof activeView);
    }
  };

  const handleTicketAccept = (ticketId: string) => {
    // Mock data for accepted ticket
    const ticketData = {
      ticketId,
      customerName: 'John Smith',
      subject: 'Payment Issue'
    };

    // Add chat session (this would normally come from the server)
    if ((window as any).addChatSession) {
      (window as any).addChatSession(ticketData.ticketId, ticketData.customerName, ticketData.subject);
    }

    // Show notification for ticket acceptance
    notificationService.showTicketNotification('assigned', {
      id: ticketId,
      subject: ticketData.subject,
      priority: 'high'
    });

    // Switch to chat view
    setActiveView('chat');
  };

  const testNotifications = async () => {
    // Test different types of notifications to show the badge
    await notificationService.showNotification({
      title: 'Welcome!',
      body: 'Notification system is working perfectly!',
      priority: 'normal',
      sound: true
    });

    setTimeout(async () => {
      await notificationService.showTicketNotification('new', {
        id: 'TICKET-123',
        subject: 'Customer needs help with billing',
        priority: 'high'
      });
    }, 1000);

    setTimeout(async () => {
      await notificationService.showSLANotification('warning', {
        ticketId: 'TICKET-456',
        message: 'SLA deadline approaching in 5 minutes'
      });
    }, 2000);

    setTimeout(async () => {
      await notificationService.showNotification({
        title: 'Urgent Alert',
        body: 'High priority ticket requires immediate attention',
        priority: 'urgent',
        sound: true
      });
    }, 3000);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'queue':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <TicketQueue onTicketAccept={handleTicketAccept} />
          </div>
        );
      
      case 'chat':
        return <ChatWorkspace maxConcurrentChats={5} />;
      
      case 'templates':
        return (
          <div className="h-full">
            <TemplateLibrary />
          </div>
        );
      
      case 'sla':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <SLADashboard />
          </div>
        );
      
      case 'performance':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <AgentStats />
          </div>
        );
      
      case 'feedback':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <FeedbackDisplay />
          </div>
        );
      
      case 'emergency':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <EmergencyDashboard />
          </div>
        );
      
      case 'team':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <SupervisorDashboard />
          </div>
        );
      
      case 'settings':
        return (
          <div className="h-full p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.firstName}!
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Ready to help customers today? Your dashboard is updated and ready to go.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-gray-900">2.5m</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agent Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-gray-600 capitalize">{user?.role} Agent</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Email</span>
                      <span className="text-sm text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Department</span>
                      <span className="text-sm text-gray-900">
                        {user?.agentProfile?.department || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Max Chats</span>
                      <span className="text-sm text-gray-900">
                        {user?.agentProfile?.maxConcurrentChats || 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {user?.agentProfile?.skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      )) || (
                        <span className="text-sm text-gray-500">No skills assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {user?.agentProfile?.languages?.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {language}
                        </span>
                      )) || (
                        <span className="text-sm text-gray-500">No languages assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setActiveView('queue')}
                      className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">View Queue</p>
                          <p className="text-sm text-gray-600">Check pending tickets</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveView('templates')}
                      className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Templates</p>
                          <p className="text-sm text-gray-600">Manage responses</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveView('chat')}
                      className="group p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Active Chats</p>
                          <p className="text-sm text-gray-600">Manage conversations</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveView('sla')}
                      className="group p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:from-orange-100 hover:to-red-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">SLA Performance</p>
                          <p className="text-sm text-gray-600">View metrics</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveView('performance')}
                      className="group p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100 hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-teal-500 rounded-lg group-hover:bg-teal-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Performance</p>
                          <p className="text-sm text-gray-600">View your stats</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveView('feedback')}
                      className="group p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100 hover:from-pink-100 hover:to-rose-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-pink-500 rounded-lg group-hover:bg-pink-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Customer Feedback</p>
                          <p className="text-sm text-gray-600">View ratings</p>
                        </div>
                      </div>
                    </button>

                    <button className="group p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:from-gray-100 hover:to-slate-100 transition-all duration-300 text-left hover:shadow-lg">
                      <div className="flex items-center">
                        <div className="p-3 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Settings</p>
                          <p className="text-sm text-gray-600">Update profile</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={testNotifications}
                      className="group p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 text-left hover:shadow-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 3.74a6 6 0 0 1 8.25 8.25l-8.25-8.25z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-semibold text-gray-900">Test Notifications</p>
                          <p className="text-sm text-gray-600">Demo notification system</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeView={activeView} onNavigate={handleNavigate}>
      {renderContent()}
    </DashboardLayout>
  );
};