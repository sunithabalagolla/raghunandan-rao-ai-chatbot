import React, { useState, useRef, useEffect } from 'react';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { TranslationAssistant } from '../language/TranslationAssistant';
import { languageService, type SupportedLanguage } from '../../services/languageService';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPersonal: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
  shortcut?: string;
}

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  customerName?: string;
  agentName?: string;
  ticketId?: string;
  customerLanguage?: SupportedLanguage;
  onTyping?: (isTyping: boolean) => void;
  pendingTemplateInsert?: any;
  onTemplateInserted?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  customerName = 'Customer',
  agentName = 'Agent',
  ticketId = '',
  customerLanguage = 'en',
  onTyping,
  pendingTemplateInsert,
  onTemplateInserted
}) => {
  const [message, setMessage] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTranslationAssistant, setShowTranslationAssistant] = useState(false);
  const [showSlashDropdown, setShowSlashDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Handle pending template insertion from Templates page
  useEffect(() => {
    if (pendingTemplateInsert) {
      console.log('🎯 MessageInput: Processing pending template insert:', pendingTemplateInsert);
      const processedContent = processTemplatePlaceholders(pendingTemplateInsert.content);
      setMessage(processedContent);
      
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      
      // Clear the pending template
      if (onTemplateInserted) {
        onTemplateInserted();
      }
    }
  }, [pendingTemplateInsert, onTemplateInserted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Stop typing indicator before sending
      handleTypingStop();
      
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Handle Escape to close dropdowns
    if (e.key === 'Escape') {
      setShowSlashDropdown(false);
      setShowTemplateLibrary(false);
      setShowTranslationAssistant(false);
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && onTyping) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  };

  // Auto-resize textarea and handle typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Handle typing indicators
    if (message.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  }, [message]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle translation selection
  const handleTranslationSelect = (translation: string) => {
    setMessage(translation);
    setShowTranslationAssistant(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Check for translation shortcuts
  const checkTranslationShortcut = (inputMessage: string) => {
    const shortcutResult = languageService.parseTranslationShortcut(inputMessage);
    if (shortcutResult.isShortcut && shortcutResult.key) {
      // Auto-open translation assistant for shortcuts
      setShowTranslationAssistant(true);
    }
  };

  // Handle template selection from library
  const handleTemplateSelect = (template: Template) => {
    const processedContent = processTemplatePlaceholders(template.content);
    setMessage(processedContent);
    setShowTemplateLibrary(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Process template placeholders with dynamic data
  const processTemplatePlaceholders = (content: string): string => {
    return content
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{agentName\}\}/g, agentName)
      .replace(/\{\{ticketId\}\}/g, ticketId)
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{\{issueType\}\}/g, 'your issue')
      .replace(/\{\{timeframe\}\}/g, '24 hours')
      .replace(/\{\{caseNumber\}\}/g, ticketId || 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  };

  // Handle slash commands
  const handleSlashCommand = (command: string) => {
    const templates: { [key: string]: string } = {
      '/welcome': 'Hello {{customerName}}! Thank you for contacting us. I\'m {{agentName}} and I\'ll be happy to help you today. How can I assist you?',
      '/tech': 'I understand you\'re experiencing a technical issue. Let me investigate this for you. Could you please provide me with:\n\n1. What exactly happened?\n2. When did this issue start?\n3. Have you tried any troubleshooting steps?\n\nThis information will help me assist you better.',
      '/billing': 'Thank you for your billing inquiry. I\'ll be happy to help you with this. For security purposes, I\'ll need to verify your account information first. Could you please provide:\n\n- Your account number or email address\n- The last 4 digits of the payment method on file\n\nOnce verified, I can review your billing details.',
      '/closing': 'Thank you for choosing our service, {{customerName}}! I\'m glad I could help resolve {{issueType}} today. If you have any other questions, please don\'t hesitate to reach out. Have a wonderful day! 😊',
      '/escalate': 'I understand this is a complex issue that requires additional expertise. I\'m going to escalate your case to our specialized team who will be better equipped to help you. They will contact you within {{timeframe}} with a resolution. Your case reference number is {{caseNumber}}.',
      '/hold': 'Thank you for your patience, {{customerName}}. I\'m currently looking into this for you. Please give me a moment to review your account and find the best solution.',
      '/followup': 'Hi {{customerName}}, I wanted to follow up on your recent inquiry. How is everything working for you now? Please let me know if you need any additional assistance.'
    };

    if (templates[command]) {
      const processedTemplate = processTemplatePlaceholders(templates[command]);
      setMessage(processedTemplate);
      setShowSlashDropdown(false);
    }
  };

  // Detect slash commands and show dropdown
  useEffect(() => {
    const words = message.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('/') && lastWord.length > 1) {
      setShowSlashDropdown(true);
      // Check if it's a translation shortcut
      checkTranslationShortcut(lastWord);
    } else {
      setShowSlashDropdown(false);
    }
  }, [message]);

  const quickTemplates = [
    { command: '/welcome', description: 'Welcome greeting', category: 'greetings' },
    { command: '/tech', description: 'Technical issue response', category: 'technical' },
    { command: '/billing', description: 'Billing inquiry response', category: 'billing' },
    { command: '/closing', description: 'Closing message', category: 'closing' },
    { command: '/escalate', description: 'Escalation notice', category: 'escalation' },
    { command: '/hold', description: 'Please hold message', category: 'general' },
    { command: '/followup', description: 'Follow-up message', category: 'general' }
  ];

  const getCurrentSlashQuery = () => {
    const words = message.split(' ');
    const lastWord = words[words.length - 1];
    return lastWord.startsWith('/') ? lastWord : '';
  };

  const filteredTemplates = quickTemplates.filter(template => 
    template.command.toLowerCase().includes(getCurrentSlashQuery().toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 relative">
      {/* Slash Command Dropdown */}
      {showSlashDropdown && filteredTemplates.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Quick Templates:</div>
            {filteredTemplates.map((template) => (
              <button
                key={template.command}
                onClick={() => handleSlashCommand(template.command)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{template.command}</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">{template.description}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{template.category}</span>
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={() => {
                  setShowTemplateLibrary(true);
                  setShowSlashDropdown(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-blue-600 dark:text-blue-400"
              >
                📚 Browse all templates...
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Template Library Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplateLibrary(true)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Open Template Library"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        {/* Translation Assistant Button */}
        {customerLanguage !== 'en' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTranslationAssistant(true)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Translation Assistant (${languageService.formatLanguageName(customerLanguage)})`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (use / for quick templates)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span className="flex items-center space-x-4">
          <span>/ for quick templates</span>
          <span>📚 for template library</span>
          {customerLanguage !== 'en' && (
            <span>🌐 for translations ({languageService.getLanguageFlag(customerLanguage)})</span>
          )}
        </span>
      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl h-[80vh] m-4">
            <TemplateLibrary
              isModal={true}
              onTemplateSelect={handleTemplateSelect}
              onClose={() => setShowTemplateLibrary(false)}
            />
          </div>
        </div>
      )}

      {/* Translation Assistant Modal */}
      <TranslationAssistant
        customerLanguage={customerLanguage}
        onTranslationSelect={handleTranslationSelect}
        isOpen={showTranslationAssistant}
        onClose={() => setShowTranslationAssistant(false)}
      />
    </div>
  );
};