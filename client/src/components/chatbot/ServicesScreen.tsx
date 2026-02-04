import { Droplets, Wheat, Zap, Heart, Briefcase, Home, Bus, Waves, GraduationCap, Beef, FileText, Building, Phone, ChevronRight } from 'lucide-react';

interface ServiceCategory {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'water',
    icon: Droplets,
    color: '#0EA5E9',
    bgColor: '#E0F7FA',
  },
  {
    id: 'irrigation',
    icon: Wheat,
    color: '#65A30D',
    bgColor: '#F7FEE7',
  },
  {
    id: 'crop-loss',
    icon: FileText,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'road-repair',
    icon: Building,
    color: '#6B7280',
    bgColor: '#F9FAFB',
  },
  {
    id: 'electricity',
    icon: Zap,
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'healthcare',
    icon: Heart,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'employment',
    icon: Briefcase,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
  {
    id: 'pension',
    icon: Phone,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'housing',
    icon: Home,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: 'land-dharani',
    icon: FileText,
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'transport',
    icon: Bus,
    color: '#14B8A6',
    bgColor: '#F0FDFA',
  },
  {
    id: 'drainage',
    icon: Waves,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'education',
    icon: GraduationCap,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'stray-cattle',
    icon: Beef,
    color: '#92400E',
    bgColor: '#FEF3C7',
  },
];

interface ServicesScreenProps {
  onBack?: () => void;
  onServiceClick: (serviceId: string, prompt: string) => void;
}

export const ServicesScreen = ({ onServiceClick }: ServicesScreenProps) => {

  const getServiceTitle = (id: string) => {
    const titles: { [key: string]: string } = {
      'water': 'Drinking Water',
      'irrigation': 'Irrigation',
      'crop-loss': 'Crop Loss',
      'road-repair': 'Road Repair',
      'electricity': 'Electricity',
      'healthcare': 'Healthcare',
      'employment': 'Employment',
      'pension': 'Pension',
      'housing': 'Housing',
      'land-dharani': 'Land/Dharani',
      'transport': 'Transport',
      'drainage': 'Drainage',
      'education': 'Education',
      'stray-cattle': 'Stray Cattle'
    };
    return titles[id] || id;
  };

  const getServiceDescription = (id: string) => {
    const descriptions: { [key: string]: string } = {
      'water': 'Water supply issues, bore wells, pipeline problems',
      'irrigation': 'Canal maintenance, water allocation, pump sets',
      'crop-loss': 'Compensation claims, insurance, weather damage',
      'road-repair': 'Pothole complaints, road construction, connectivity',
      'electricity': 'Power cuts, transformer issues, new connections',
      'healthcare': 'PHC services, ambulance requests, medical camps',
      'employment': 'Job opportunities, skill training, MGNREGA work',
      'pension': 'Old age pension, widow pension, disability pension',
      'housing': 'Housing schemes, construction permits, Indiramma houses',
      'land-dharani': 'Land records, title disputes, land registration',
      'transport': 'Bus services, auto permits, transport connectivity',
      'drainage': 'Sewage problems, flood management, water logging',
      'education': 'School infrastructure, scholarships, teacher appointments',
      'stray-cattle': 'Cattle menace, goshalas, cattle insurance'
    };
    return descriptions[id] || id;
  };

  const getServicePrompt = (id: string) => {
    const prompts: { [key: string]: string } = {
      'water': 'I have a drinking water problem in my village',
      'irrigation': 'My crops need irrigation water',
      'crop-loss': 'I need crop loss compensation',
      'road-repair': 'Village roads need repair',
      'electricity': 'We have frequent power cuts',
      'healthcare': 'No doctors in our hospital',
      'employment': 'Youth need job opportunities',
      'pension': 'My pension is delayed',
      'housing': 'I need housing scheme help',
      'land-dharani': 'Land records problem',
      'transport': 'No bus facility in village',
      'drainage': 'Sanitation and drainage issues',
      'education': 'School/college facilities needed',
      'stray-cattle': 'Stray cattle damaging crops'
    };
    return prompts[id] || `I need help with ${id}`;
  };

  const handleServiceClick = (category: ServiceCategory) => {
    const prompt = getServicePrompt(category.id);
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
        All Constituency Issues
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
                  {getServiceTitle(category.id)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {getServiceDescription(category.id)}
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
