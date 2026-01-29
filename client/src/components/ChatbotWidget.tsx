import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import socketService from '../services/socketService';
import type { MessageType } from './chatbot';
import {
  primaryActions,
  TypingIndicator,
  Message,
  ChatbotButton,
  ChatbotHeader,
  ChatbotWelcome,
  ChatbotInput,
  ServicesScreen,
  HelpScreen
} from './chatbot';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Professional Chatbot Widget - With Multilingual Support
 * Supports English, Telugu, and Hindi via i18next
 * Updated: Back button navigation, Services screen
 */

type ScreenType = 'welcome' | 'chat' | 'services' | 'help';

export const ChatbotWidget = () => {
  const { t, i18n} = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');
  const [previousScreen, setPreviousScreen] = useState<ScreenType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      text: t('chatbot.initialMessage'),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket.isConnected || !isOpen) return;
    socket.connectToChat(userId, sessionId, i18n.language as 'en' | 'te' | 'hi');
    return () => {
      if (!isOpen) {
        socket.disconnectFromChat(userId, sessionId);
      }
    };
  }, [socket.isConnected, isOpen, userId, sessionId]);

  useEffect(() => {
    if (!socket.isConnected) return;
    const unsubscribe = socket.onRateLimitExceeded((data) => {
      setIsRateLimited(true);
      setRateLimitMessage(data.errorMessage);
      setRateLimitCountdown(data.retryAfter);
    });
    return () => {
      unsubscribe();
    }
  }, [socket.isConnected]);

  useEffect(() => {
    if (!isRateLimited || rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        const newCountdown = prev - 1;
        if (newCountdown <= 0) {
          setIsRateLimited(false);
          setRateLimitMessage('');
          setRateLimitCountdown(0);
          return 0;
        }
        return newCountdown;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
    }
  }, [isRateLimited, rateLimitCountdown]);

  // Listen for chat responses
  useEffect(() => {
    let isSubscribed = true;
    
    const handleResponse = (data: any) => {
      if (!isSubscribed) return; // Ignore if unsubscribed
      setIsTyping(false);
      const botMessage: MessageType = {
        id: `bot_${Date.now()}`,
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    };

    const unsubscribeResponse = socketService.onChatResponse(handleResponse);

    const handleTyping = (data: any) => {
      if (!isSubscribed) return; // Ignore if unsubscribed
      if (data.sender === 'bot') {
        setIsTyping(data.isTyping);
      }
    };

    const unsubscribeTyping = socketService.onTyping(handleTyping);

    return () => {
      isSubscribed = false;
      unsubscribeResponse();
      unsubscribeTyping();
    };
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !socket.isConnected) return;

    setPreviousScreen(currentScreen);
    setCurrentScreen('chat');
    const userMessage: MessageType = {
      id: `user_${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Generate userId if not available
    socket.sendMessage(userId, sessionId, text.trim(), i18n.language as 'en' | 'te' | 'hi');
  };

  const handlePrimaryActionClick = (action: typeof primaryActions[0]) => {
    setPreviousScreen('welcome');
    setCurrentScreen('chat');
    handleSendMessage(action.prompt);
  };

  const handleBack = () => {
    // If we have a previous screen, go there; otherwise go to welcome
    if (previousScreen) {
      setCurrentScreen(previousScreen);
      setPreviousScreen(null);
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleServicesClick = () => {
    setPreviousScreen('welcome');
    setCurrentScreen('services');
  };

  const handleHelpClick = () => {
    setPreviousScreen('welcome');
    setCurrentScreen('help');
  };

  const handleServiceSelect = (_serviceId: string, prompt: string) => {
    setPreviousScreen('services');
    setCurrentScreen('chat');
    handleSendMessage(prompt);
  };

  const handleHelpSelect = (_helpId: string, prompt: string) => {
    setPreviousScreen('help');
    setCurrentScreen('chat');
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Button */}
      {!isOpen && <ChatbotButton onClick={() => setIsOpen(true)} />}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-48px)] h-[650px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Header - Only show on welcome screen */}
          {currentScreen === 'welcome' && (
            <ChatbotHeader onClose={() => setIsOpen(false)}>
              <LanguageSwitcher />
            </ChatbotHeader>
          )}

          {/* Back Button - Show in chat and services mode */}
          {currentScreen !== 'welcome' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 300ms ease-out'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>{t('chatbot.header.back')}</span>
              </button>
            </div>
          )}

          {/* Main Content */}
          <div style={{ flex: 1, backgroundColor: '#F3F4F6', overflowY: 'auto', padding: '20px' }}>

            {/* Welcome Screen */}
            {currentScreen === 'welcome' && (
              <ChatbotWelcome 
                onActionClick={handlePrimaryActionClick} 
                onServicesClick={handleServicesClick}
                onHelpClick={handleHelpClick}
              />
            )}

            {/* Services Screen */}
            {currentScreen === 'services' && (
              <ServicesScreen 
                onBack={handleBack}
                onServiceClick={handleServiceSelect}
              />
            )}

            {/* Help Screen */}
            {currentScreen === 'help' && (
              <HelpScreen 
                onBack={handleBack}
                onHelpClick={handleHelpSelect}
              />
            )}

            {/* Chat Messages */}
            {currentScreen === 'chat' && messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {currentScreen === 'chat' && isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Rate Limit Banner */}
          {isRateLimited && (
            <div style={{
              backgroundColor: '#FEE2E2',
              borderTop: '2px solid #FCA5A5',
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {rateLimitMessage}
              </div>
              <div style={{
                color: '#991B1B',
                fontSize: '13px'
              }}>
                {t('chatbot.rateLimit.wait', { seconds: rateLimitCountdown })}
              </div>
            </div>
          )}

          {/* Input Section */}
          <ChatbotInput
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSendMessage(inputValue)}
            onKeyDown={handleKeyDown}
            disabled={isRateLimited}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
