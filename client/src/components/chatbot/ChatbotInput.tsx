import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatbotInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled?:boolean;
}

export const ChatbotInput = ({ value, onChange, onSend, onKeyDown ,disabled}: ChatbotInputProps) => {
  const { t, i18n } = useTranslation();
  
  // Optimized input sizing for Telugu and Hindi
  const isTelugu = i18n.language === 'te';
  const isHindi = i18n.language === 'hi';
  const inputPadding = isTelugu ? '11px 48px 11px 15px' : isHindi ? '11px 48px 11px 15px' : '12px 50px 12px 16px';
  const lineHeight = isTelugu ? '1.45' : isHindi ? '1.45' : '1.5';
  const fontSize = isTelugu ? '13px' : isHindi ? '13px' : '14px';
  const minHeight = isTelugu ? '44px' : isHindi ? '44px' : '44px';
  
  return (
    <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('chatbot.input.placeholder')}
          autoComplete="off"
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            padding: inputPadding,
            fontSize: fontSize,
            color: '#1F2937',
            outline: 'none',
            transition: 'all 300ms ease-out',
            lineHeight: lineHeight,
            minHeight: minHeight,
            WebkitUserSelect: 'text',
            userSelect: 'text'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            // Clear any selection on focus
            if (e.currentTarget.value === '') {
              e.currentTarget.setSelectionRange(0, 0);
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseEnter={(e) => {
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.borderColor = '#3B82F6';
            }
          }}
          onMouseLeave={(e) => {
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }
          }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim()|| disabled}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: (value.trim() && !disabled) ? 'pointer' : 'not-allowed',
            color: '#3B82F6',
            opacity: (value.trim() && !disabled) ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms ease-out',
            padding: '8px'
          }}
          onMouseEnter={(e) => {
            if (value.trim()&& !disabled) {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              e.currentTarget.style.color = '#2563EB';
            }
          }}
          onMouseLeave={(e) => {
            if (value.trim()&& !disabled) {
              e.currentTarget.style.color = '#3B82F6';
            }
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
};
