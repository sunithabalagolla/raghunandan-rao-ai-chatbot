import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  acceptedTicket?: any;
  insertTemplate?: any;
  onTemplateInserted?: () => void;
}

export const ChatWorkspace = forwardRef<any, ChatWorkspaceProps>(({ 
  maxConcurrentChats = 5, 
  acceptedTicket,
  insertTemplate,
  onTemplateInserted 
}, ref) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAtCapacity, setIsAtCapacity] = useState(false);
  const [pendingTemplateInsert, setPendingTemplateInsert] = useState<any>(null);

  console.log('🎯 ChatWorkspace: Component rendered with maxConcurrentChats:', maxConcurrentChats);
  console.log('🎯 ChatWorkspace: Current sessions:', chatSessions);
  console.log('🎯 ChatWorkspace: acceptedTicket prop:', acceptedTicket);
  console.log('🎯 ChatWorkspace: insertTemplate prop:', insertTemplate);

  // Handle template insertion
  useEffect(() => {
    if (insertTemplate && activeSessionId) {
      console.log('🎯 ChatWorkspace: Template insertion requested:', insertTemplate);
      setPendingTemplateInsert(insertTemplate);
      
      // Clear the template after setting it
      if (onTemplateInserted) {
        onTemplateInserted();
      }
    }
  }, [insertTemplate, activeSessionId, onTemplateInserted]);

  // Load persisted sessions on mount
  useEffect(() => {
    const savedSessions = sessionStorage.getItem('chatSessions');
    const savedActiveId = sessionStorage.getItem('activeSessionId');
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert timestamp strings back to Date objects
        const sessionsWithDates = parsedSessions.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp)
        }));
        setChatSessions(sessionsWithDates);
        console.log('🔄 ChatWorkspace: Restored sessions from storage:', sessionsWithDates);
      } catch (error) {
        console.error('Error parsing saved sessions:', error);
      }
    }
    
    if (savedActiveId) {
      setActiveSessionId(savedActiveId);
      console.log('🔄 ChatWorkspace: Restored active session ID:', savedActiveId);
    }
  }, []);

  // Persist sessions whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      sessionStorage.setItem('chatSessions', JSON.stringify(chatSessions));
      console.log('💾 ChatWorkspace: Saved sessions to storage');
    } else {
      sessionStorage.removeItem('chatSessions');
    }
  }, [chatSessions]);

  // Persist active session ID whenever it changes
  useEffect(() => {
    if (activeSessionId) {
      sessionStorage.setItem('activeSessionId', activeSessionId);
      console.log('💾 ChatWorkspace: Saved active session ID to storage');
    } else {
      sessionStorage.removeItem('activeSessionId');
    }
  }, [activeSessionId]);

  useEffect(() => {
    setIsAtCapacity(chatSessions.length >= maxConcurrentChats);
  }, [chatSessions.length, maxConcurrentChats]);

  // Handle acceptedTicket prop changes
  useEffect(() => {
    if (acceptedTicket && acceptedTicket.id) {
      console.log('🎯 ChatWorkspace: Processing acceptedTicket:', acceptedTicket);
      
      // Check if session already exists for this ticket
      const existingSession = chatSessions.find(session => session.ticketId === acceptedTicket.id);
      if (existingSession) {
        console.log('🎯 ChatWorkspace: Session already exists, updating with new data and switching to it');
        
        // Update existing session with new data from acceptedTicket
        setChatSessions(prev => prev.map(session => 
          session.ticketId === acceptedTicket.id 
            ? {
                ...session,
                customerName: acceptedTicket.customerName || session.customerName,
                subject: acceptedTicket.subject || session.subject
              }
            : session
        ));
        
        setActiveSessionId(existingSession.id);
        return;
      }

      // Check if we're at capacity
      if (chatSessions.length >= maxConcurrentChats) {
        console.error('❌ ChatWorkspace: At capacity, cannot add session');
        alert(`Maximum ${maxConcurrentChats} concurrent chats allowed`);
        return;
      }

      // Create new session from acceptedTicket
      const newSession: ChatSession = {
        id: `chat-${acceptedTicket.id}-${Date.now()}`, // Use ticket ID in the key to ensure uniqueness
        ticketId: acceptedTicket.id,
        customerName: acceptedTicket.customerName || 'Anonymous User',
        subject: acceptedTicket.subject || 'Support Request',
        isActive: true,
        hasUnread: false,
        timestamp: new Date()
      };

      console.log('🎯 ChatWorkspace: Creating session from acceptedTicket:', newSession);
      
      setChatSessions(prev => {
        // Double-check to prevent race conditions
        const stillExists = prev.find(session => session.ticketId === acceptedTicket.id);
        if (stillExists) {
          console.log('🎯 ChatWorkspace: Race condition detected, session already exists');
          setActiveSessionId(stillExists.id);
          return prev;
        }
        
        const updated = [...prev, newSession];
        console.log('🎯 ChatWorkspace: Updated sessions from acceptedTicket:', updated);
        return updated;
      });
      
      setActiveSessionId(newSession.id);
      console.log('🎯 ChatWorkspace: Set active session ID from acceptedTicket:', newSession.id);
    }
  }, [acceptedTicket, maxConcurrentChats]); // Watch entire acceptedTicket object, not just the id

  const addChatSession = (ticketId: string, customerName: string, subject: string) => {
    console.log('🎯 ChatWorkspace: addChatSession called with:', { ticketId, customerName, subject });
    console.log('🎯 ChatWorkspace: Current sessions count:', chatSessions.length);
    console.log('🎯 ChatWorkspace: Max concurrent chats:', maxConcurrentChats);
    
    if (chatSessions.length >= maxConcurrentChats) {
      console.error('❌ ChatWorkspace: At capacity, cannot add session');
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

    console.log('🎯 ChatWorkspace: Creating new session:', newSession);
    
    setChatSessions(prev => {
      const updated = [...prev, newSession];
      console.log('🎯 ChatWorkspace: Updated sessions:', updated);
      return updated;
    });
    
    setActiveSessionId(newSession.id);
    console.log('🎯 ChatWorkspace: Set active session ID:', newSession.id);
    
    return true;
  };

  const closeChatSession = (sessionId: string) => {
    setChatSessions(prev => {
      const updated = prev.filter(session => session.id !== sessionId);
      
      // Clean up storage if no sessions left
      if (updated.length === 0) {
        sessionStorage.removeItem('chatSessions');
        sessionStorage.removeItem('activeSessionId');
      }
      
      return updated;
    });
    
    if (activeSessionId === sessionId) {
      const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
      const newActiveId = remainingSessions.length > 0 ? remainingSessions[0].id : null;
      setActiveSessionId(newActiveId);
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

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => {
    console.log('🎯 ChatWorkspace: useImperativeHandle setting up ref with methods');
    return {
      addChatSession,
      closeChatSession,
      switchToSession
    };
  });

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
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
              <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                No active chats
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 ml-4">
            <div className={`text-sm ${isAtCapacity ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
              {chatSessions.length}/{maxConcurrentChats} chats
            </div>
            
            {isAtCapacity && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
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
            pendingTemplateInsert={pendingTemplateInsert}
            onTemplateInserted={() => setPendingTemplateInsert(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
            <div className="text-center">
              <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Chats</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Accept a ticket from the queue to start chatting</p>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                <p>Keyboard shortcuts:</p>
                <p>Ctrl/Cmd + 1-5: Switch between chats</p>
                <p>Ctrl/Cmd + W: Close current chat</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
});