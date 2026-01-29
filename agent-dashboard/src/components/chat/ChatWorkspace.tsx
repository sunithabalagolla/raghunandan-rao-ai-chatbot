import React, { useState, useEffect } from 'react';
import { ChatTab } from './ChatTab';
import { ChatWindow } from './ChatWindow';

interface ChatSession {
  id: string;
  ticketId: string;
  customerName: string;
  subject: string;
  isActive: boolean;
  hasUnread: boolean;
  lastMessage?: string;
  timestamp: Date;
}

interface ChatWorkspaceProps {
  maxConcurrentChats?: number;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ maxConcurrentChats = 5 }) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAtCapacity, setIsAtCapacity] = useState(false);

  useEffect(() => {
    setIsAtCapacity(chatSessions.length >= maxConcurrentChats);
  }, [chatSessions.length, maxConcurrentChats]);

  const addChatSession = (ticketId: string, customerName: string, subject: string) => {
    if (chatSessions.length >= maxConcurrentChats) {
      alert(`Maximum ${maxConcurrentChats} concurrent chats allowed`);
      return false;
    }

    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      ticketId,
      customerName,
      subject,
      isActive: true,
      hasUnread: false,
      timestamp: new Date()
    };

    setChatSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return true;
  };

  const closeChatSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    
    if (activeSessionId === sessionId) {
      const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const switchToSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, hasUnread: false }
          : session
      )
    );
  };

  const markSessionAsUnread = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, hasUnread: true }
            : session
        )
      );
    }
  };

  const updateSessionLastMessage = (sessionId: string, message: string) => {
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, lastMessage: message, timestamp: new Date() }
          : session
      )
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= chatSessions.length) {
          e.preventDefault();
          switchToSession(chatSessions[num - 1].id);
        }
        
        if (e.key === 'w' && activeSessionId) {
          e.preventDefault();
          closeChatSession(activeSessionId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatSessions, activeSessionId]);

  const activeSession = chatSessions.find(session => session.id === activeSessionId);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {chatSessions.map((session, index) => (
              <ChatTab
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                tabNumber={index + 1}
                onSwitch={() => switchToSession(session.id)}
                onClose={() => closeChatSession(session.id)}
              />
            ))}
            
            {chatSessions.length === 0 && (
              <div className="text-gray-500 text-sm py-2">
                No active chats
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 ml-4">
            <div className={`text-sm ${isAtCapacity ? 'text-red-600' : 'text-gray-600'}`}>
              {chatSessions.length}/{maxConcurrentChats} chats
            </div>
            
            {isAtCapacity && (
              <div className="flex items-center space-x-1 text-red-600">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-medium">At Capacity</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <ChatWindow
            session={activeSession}
            onMessageReceived={(message) => {
              markSessionAsUnread(activeSession.id);
              updateSessionLastMessage(activeSession.id, message);
            }}
            onClose={() => closeChatSession(activeSession.id)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl text-gray-300 mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h3>
              <p className="text-gray-500 mb-4">Accept a ticket from the queue to start chatting</p>
              <div className="text-sm text-gray-400">
                <p>Keyboard shortcuts:</p>
                <p>Ctrl/Cmd + 1-5: Switch between chats</p>
                <p>Ctrl/Cmd + W: Close current chat</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expose method to add new chat sessions */}
      <div style={{ display: 'none' }}>
        {/* This is a hack to expose the addChatSession method to parent components */}
        {React.createElement('div', { 
          ref: (el: any) => {
            if (el) {
              (window as any).addChatSession = addChatSession;
            }
          }
        })}
      </div>
    </div>
  );
};