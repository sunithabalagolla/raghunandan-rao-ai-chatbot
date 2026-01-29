import { useTranslation } from 'react-i18next';
import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  index: number;
}

export const ActionButton = ({
  icon: Icon,
  label,
  color,
  bgColor,
  borderColor,
  onClick,
  index
}: ActionButtonProps) => {
  const { i18n } = useTranslation();
  
  // Optimized sizing for Telugu and Hindi
  const isTelugu = i18n.language === 'te';
  const isHindi = i18n.language === 'hi';
  const buttonHeight = isTelugu ? '52px' : isHindi ? '50px' : '48px';
  const verticalPadding = isTelugu ? '10px' : isHindi ? '10px' : '12px';
  const horizontalPadding = isTelugu ? '14px' : isHindi ? '14px' : '16px';
  const lineHeight = isTelugu ? '1.4' : isHindi ? '1.45' : '1.5';
  const fontSize = isTelugu ? '14px' : isHindi ? '14px' : '14px';
  const iconSize = isTelugu ? 16 : isHindi ? 16 : 18;
  const fontWeight = isTelugu ? '700' : isHindi ? '700' : '600';
  const iconGap = isTelugu ? '10px' : isHindi ? '10px' : '8px';
  
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconGap,
        minHeight: buttonHeight,
        backgroundColor: bgColor,
        color: color,
        border: `2px solid ${borderColor}`,
        borderRadius: '24px',
        fontSize: fontSize,
        fontWeight: fontWeight,
        cursor: 'pointer',
        padding: `${verticalPadding} ${horizontalPadding}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'all 300ms ease-out',
        animation: `fadeIn 500ms ease-out ${index * 100}ms backwards`,
        lineHeight: lineHeight,
        whiteSpace: 'normal',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${borderColor}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
      }}
    >
      <Icon size={iconSize} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
};
