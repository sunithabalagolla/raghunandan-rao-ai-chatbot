import { useTranslation } from 'react-i18next';
import { Scale, AlertCircle, Users, BookOpen, Heart, HandHeart, Building2, ChevronRight } from 'lucide-react';

interface ServiceCategory {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'legal',
    icon: Scale,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'emergency',
    icon: AlertCircle,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'citizen',
    icon: Users,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
  {
    id: 'education',
    icon: BookOpen,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'women',
    icon: Heart,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: 'volunteer',
    icon: HandHeart,
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'community',
    icon: Building2,
    color: '#14B8A6',
    bgColor: '#F0FDFA',
  },
];

interface ServicesScreenProps {
  onBack?: () => void;
  onServiceClick: (serviceId: string, prompt: string) => void;
}

export const ServicesScreen = ({ onServiceClick }: ServicesScreenProps) => {
  const { t } = useTranslation();

  const handleServiceClick = (category: ServiceCategory) => {
    const prompt = t(`chatbot.services.${category.id}.prompt`);
    onServiceClick(category.id, prompt);
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
        {t('chatbot.services.title')}
      </h3>

      {/* Services List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {serviceCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleServiceClick(category)}
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
                  {t(`chatbot.services.${category.id}.title`)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {t(`chatbot.services.${category.id}.description`)}
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
