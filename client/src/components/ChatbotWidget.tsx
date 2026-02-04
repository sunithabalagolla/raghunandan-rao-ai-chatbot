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
  HelpScreen,
  LocationSelector
} from './chatbot';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Professional Chatbot Widget - With Multilingual Support and Location Selection
 * Supports English, Telugu, and Hindi via i18next
 * Updated: Back button navigation, Services screen, Location selection flow
 */

type ScreenType = 'welcome' | 'chat' | 'services' | 'help';

interface LocationData {
  district?: {
    id: string;
    name: string;
  };
  assembly?: {
    id: string;
    name: string;
  };
  mandal?: {
    id: string;
    name: string;
  };
  village?: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isConnectedToAgent, setIsConnectedToAgent] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  
  // Location selection state
  const [isCollectingLocation, setIsCollectingLocation] = useState(false);
  const [currentLocationLevel, setCurrentLocationLevel] = useState<'district' | 'assembly' | 'mandal' | 'village'>('district');
  
  // Application status state
  const [showApplicationButtons, setShowApplicationButtons] = useState(false);
  const [showContinueOptions, setShowContinueOptions] = useState(false);

  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket.isConnected || !isOpen) return;
    socket.connectToChat(sessionId, i18n.language as 'en' | 'te' | 'hi');
    return () => {
      if (!isOpen) {
        socket.disconnectFromChat(sessionId);
      }
    };
  }, [socket.isConnected, isOpen, sessionId]);

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
      
      // Check if AI is asking for location
      const message = data.message.toLowerCase();
      if (message.includes('which district are you from') || 
          message.includes('select your district') ||
          message.includes('district are you from')) {
        setIsCollectingLocation(true);
        setCurrentLocationLevel('district');
      }
      
      // Check if AI is asking for application status
      if (message.includes('have you already submitted') || 
          message.includes('application for this issue') ||
          message.includes('raghunandanrao.in/apply')) {
        setShowApplicationButtons(true);
      }
      
      // Check if AI is asking what to do after user said no
      if (message.includes('what would you like to do') && 
          (message.includes('apply on website') || message.includes('continue without'))) {
        setShowContinueOptions(true);
      }
      
      const botMessage: MessageType = {
        id: `bot_${Date.now()}`,
        text: data.message,
        sender: data.sender === 'agent' ? 'agent' : 'bot', // ← FIX: Detect agent messages
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    };

    const unsubscribeResponse = socketService.onChatResponse(handleResponse);

    const handleTyping = (data: any) => {
      if (!isSubscribed) return; // Ignore if unsubscribed
      if (data.sender === 'bot' || data.sender === 'agent') {
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

  // Listen for agent joining
  useEffect(() => {
    const unsubscribeAgentJoined = socketService.onAgentJoined(() => {
      setIsConnectedToAgent(true);
      setAgentName('Support Agent');
      
      // Add system message about agent joining
      const systemMessage: MessageType = {
        id: `system_${Date.now()}`,
        text: 'A support agent has joined the conversation and will assist you.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    return () => unsubscribeAgentJoined();
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
    
    // Send message using correct parameter order
    socket.sendMessage(sessionId, text.trim(), i18n.language as 'en' | 'te' | 'hi');
  };

  const handleLocationSelected = (location: LocationData) => {
    // Determine next level and send appropriate message
    if (!location.district) {
      setCurrentLocationLevel('district');
    } else if (!location.assembly) {
      setCurrentLocationLevel('assembly');
      // Send district selection as message
      handleSendMessage(location.district.name);
    } else if (!location.mandal) {
      setCurrentLocationLevel('mandal');
      // Send assembly selection as message
      handleSendMessage(location.assembly.name);
    } else if (!location.village) {
      setCurrentLocationLevel('village');
      // Send mandal selection as message
      handleSendMessage(location.mandal.name);
    } else {
      // All levels complete - send village and complete location collection
      setIsCollectingLocation(false);
      
      // Send village selection
      handleSendMessage(location.village);
      
      // Send complete location summary
      const locationSummary = `My complete location: ${location.village}, ${location.mandal?.name}, ${location.assembly?.name}, ${location.district?.name}`;
      
      // Add location summary as user message
      setTimeout(() => {
        const locationMessage: MessageType = {
          id: `user_location_${Date.now()}`,
          text: locationSummary,
          sender: 'user',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, locationMessage]);
        
        // Send to backend
        socket.sendMessage(sessionId, locationSummary, i18n.language as 'en' | 'te' | 'hi');
      }, 500);
    }
  };

  const handleApplicationResponse = (hasApplied: boolean) => {
    setShowApplicationButtons(false);
    
    if (hasApplied) {
      // User has applied - send "Yes" response
      handleSendMessage('✅ Yes, I have applied');
    } else {
      // User hasn't applied - send "No" response
      handleSendMessage('❌ No, I haven\'t applied yet');
      setShowContinueOptions(true);
    }
  };

  const handleContinueWithoutId = () => {
    setShowContinueOptions(false);
    handleSendMessage('➡️ Continue Without Application ID');
  };

  const handleApplyOnWebsite = () => {
    setShowContinueOptions(false);
    handleSendMessage('🌐 Apply on Website');
    // Open website in new tab
    window.open('https://raghunandanrao.in/apply', '_blank');
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
              backgroundColor: isConnectedToAgent ? '#EFF6FF' : '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
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
              
              {/* Agent Status Indicator */}
              {isConnectedToAgent && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'white',
                    borderRadius: '50%'
                  }}></div>
                  Connected to {agentName}
                </div>
              )}
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
            {currentScreen === 'chat' && messages.map((message, index) => (
              <div key={message.id}>
                <Message message={message} />
                
                {/* Application Status Buttons */}
                {showApplicationButtons && index === messages.length - 1 && 
                 message.sender === 'bot' && 
                 message.text.toLowerCase().includes('have you already submitted') && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <button
                      onClick={() => handleApplicationResponse(true)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                    >
                      ✅ Yes, I have applied
                    </button>
                    <button
                      onClick={() => handleApplicationResponse(false)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#F97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
                    >
                      ❌ No, I haven't applied yet
                    </button>
                  </div>
                )}

                {/* Continue Options Buttons */}
                {showContinueOptions && index === messages.length - 1 && 
                 message.sender === 'bot' && 
                 message.text.toLowerCase().includes('what would you like to do') && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <button
                      onClick={handleApplyOnWebsite}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                    >
                      🌐 Apply on Website
                    </button>
                    <button
                      onClick={handleContinueWithoutId}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#6B7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                    >
                      ➡️ Continue Without Application ID
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Location Selection Component */}
            {currentScreen === 'chat' && isCollectingLocation && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #3B82F6'
              }}>
                <LocationSelector
                  currentLevel={currentLocationLevel}
                  onLocationSelected={handleLocationSelected}
                />
              </div>
            )}

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
