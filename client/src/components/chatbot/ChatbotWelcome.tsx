import { useTranslation } from 'react-i18next';
import { ActionButton } from './ActionButton';
import { primaryActions } from './constants';

interface ChatbotWelcomeProps {
  onActionClick: (action: typeof primaryActions[0]) => void;
  onServicesClick?: () => void;
  onHelpClick?: () => void;
}

export const ChatbotWelcome = ({ onActionClick, onServicesClick, onHelpClick }: ChatbotWelcomeProps) => {
  const { t, i18n } = useTranslation();
  
  // Optimized text sizing for Telugu and Hindi
  const isTelugu = i18n.language === 'te';
  const isHindi = i18n.language === 'hi';
  const boxPadding = isTelugu ? '18px 22px' : isHindi ? '18px 20px' : '20px 24px';
  const lineHeight = isTelugu ? '1.65' : isHindi ? '1.65' : '1.5';
  const footerGap = isTelugu ? '30px' : isHindi ? '30px' : '32px';
  const titleFontSize = isTelugu ? '17px' : isHindi ? '17px' : '18px';
  const descFontSize = isTelugu ? '13px' : isHindi ? '13.5px' : '14px';
  const titleFontWeight = isTelugu ? '700' : isHindi ? '700' : '700';
  const descFontWeight = isTelugu ? '500' : isHindi ? '500' : '400';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Greeting Card */}
      <div style={{
        background: 'linear-gradient(to bottom right, #FFFFFF, #E0F2FE)',
        borderRadius: '12px',
        padding: boxPadding,
        borderLeft: '2px solid #3B82F6',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
        animation: 'fadeIn 500ms ease-out'
      }}>
        <h3 style={{ 
          fontSize: titleFontSize, 
          fontWeight: titleFontWeight, 
          color: '#1F2937', 
          marginBottom: isTelugu ? '6px' : isHindi ? '6px' : '10px',
          lineHeight: lineHeight
        }}>
          {t('chatbot.welcome.greeting')}
        </h3>
        <p style={{ 
          fontSize: descFontSize, 
          fontWeight: descFontWeight,
          color: '#6B7280', 
          margin: 0, 
          lineHeight: lineHeight
        }}>
          {t('chatbot.welcome.description')}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {primaryActions.map((action, index) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={t(`chatbot.actions.${action.id}`)}
            color={action.color}
            bgColor={action.bgColor}
            borderColor={action.borderColor}
            onClick={() => onActionClick(action)}
            index={index}
          />
        ))}
      </div>

      {/* Footer Links */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: footerGap,
        marginTop: '16px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onHelpClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'color 300ms ease-out',
            padding: '6px 10px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#14B8A6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          ? {t('chatbot.footer.help')}
        </button>
        <button
          onClick={onServicesClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'color 300ms ease-out',
            padding: '6px 10px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#14B8A6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          ⚙ {t('chatbot.footer.services')}
        </button>
      </div>
    </div>
  );
};
