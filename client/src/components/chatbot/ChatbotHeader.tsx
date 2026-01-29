import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

interface ChatbotHeaderProps {
  onClose: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
}

export const ChatbotHeader = ({ onClose, onBack, children }: ChatbotHeaderProps) => {
  const { t, i18n } = useTranslation();
  
  // Optimized Telugu and Hindi text sizes for better readability
  const isTelugu = i18n.language === 'te';
  const isHindi = i18n.language === 'hi';
  const headerPadding = isTelugu ? '16px 20px' : isHindi ? '16px 20px' : '16px 20px';
  const lineHeight = isTelugu ? '1.5' : isHindi ? '1.5' : '1.5';
  const titleFontSize = isTelugu ? '14px' : isHindi ? '15px' : '16px';
  const subtitleFontSize = isTelugu ? '12.5px' : isHindi ? '13px' : '13px';
  const titleFontWeight = isTelugu ? '700' : isHindi ? '700' : 'bold';
  
  return (
    <div style={{ 
      backgroundColor: '#FFFFFF', 
      borderBottom: '1px solid #E5E7EB', 
      padding: headerPadding, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      minHeight: isTelugu ? '64px' : isHindi ? '70px' : '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            title={t('chatbot.header.back')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 300ms ease-out',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={t('chatbot.header.back')}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div style={{ width: '44px', height: '44px', backgroundColor: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg style={{ width: '20px', height: '20px', color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: titleFontSize, 
            fontWeight: titleFontWeight, 
            color: '#1F2937',
            lineHeight: lineHeight,
            wordBreak: 'break-word',
            marginBottom: (isTelugu || isHindi) ? '2px' : '0'
          }}>
            {t('chatbot.header.title')}
          </div>
          <div style={{ 
            fontSize: subtitleFontSize, 
            fontWeight: '500',
            color: '#6B7280',
            lineHeight: lineHeight,
            wordBreak: 'break-word'
          }}>
            {t('chatbot.header.subtitle')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', flexShrink: 0 }}>
        {children}
        <button
          onClick={onClose}
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            color: '#1F2937',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'background-color 300ms ease-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};
