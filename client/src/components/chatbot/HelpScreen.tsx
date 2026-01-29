import { useTranslation } from 'react-i18next';
import { BookOpen, Target, Globe, Users, Star, ChevronRight } from 'lucide-react';

interface HelpCategory {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const helpCategories: HelpCategory[] = [
  {
    id: 'gettingStarted',
    icon: BookOpen,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'usingServices',
    icon: Target,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
  {
    id: 'languages',
    icon: Globe,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'contactSupport',
    icon: Users,
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'feedback',
    icon: Star,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
];

interface HelpScreenProps {
  onBack?: () => void;
  onHelpClick: (helpId: string, prompt: string) => void;
}

export const HelpScreen = ({ onHelpClick }: HelpScreenProps) => {
  const { t } = useTranslation();

  const handleHelpClick = (category: HelpCategory) => {
    const prompt = t(`chatbot.help.${category.id}.prompt`);
    onHelpClick(category.id, prompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title */}
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#1F2937'
      }}>
        {t('chatbot.help.title')}
      </h3>

      {/* Help Categories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {helpCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleHelpClick(category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 200ms ease-out',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = category.color;
                e.currentTarget.style.boxShadow = `0 4px 12px ${category.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: category.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={22} color={category.color} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: '2px'
                }}>
                  {t(`chatbot.help.${category.id}.title`)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {t(`chatbot.help.${category.id}.description`)}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight size={20} color="#9CA3AF" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
