import React from 'react';
import { languageService } from '../../services/languageService';
import type { SupportedLanguage } from '../../services/languageService';

interface LanguageBadgeProps {
  language: SupportedLanguage;
  size?: 'sm' | 'md' | 'lg';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  language,
  size = 'md',
  showFlag = true,
  showName = true,
  className = ''
}) => {
  const colors = languageService.getLanguageColor(language);
  const flag = languageService.getLanguageFlag(language);
  const name = languageService.formatLanguageName(language);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showFlag && (
        <span className="mr-1" role="img" aria-label={`${name} flag`}>
          {flag}
        </span>
      )}
      {showName && (
        <span>{name}</span>
      )}
    </span>
  );
};