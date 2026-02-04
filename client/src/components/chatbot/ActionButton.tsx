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
  
  // Fixed sizing for consistent button dimensions
  const isTelugu = i18n.language === 'te';
  const isHindi = i18n.language === 'hi';
  const buttonHeight = '56px'; // Fixed height for all buttons
  const verticalPadding = '12px';
  const horizontalPadding = isTelugu ? '12px' : isHindi ? '12px' : '14px';
  const lineHeight = isTelugu ? '1.3' : isHindi ? '1.35' : '1.4';
  const fontSize = isTelugu ? '13px' : isHindi ? '13px' : '13px';
  const iconSize = 16; // Fixed icon size
  const fontWeight = isTelugu ? '700' : isHindi ? '700' : '600';
  const iconGap = '8px'; // Fixed gap
  
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconGap,
        height: buttonHeight, // Fixed height instead of minHeight
        width: '100%', // Ensure full width
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
        textAlign: 'center',
        boxSizing: 'border-box' // Ensure padding is included in dimensions
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
