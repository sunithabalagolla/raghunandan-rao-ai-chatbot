import React, { useState, useEffect } from 'react';
import { languageService, type SupportedLanguage, type SupportedLanguages } from '../../services/languageService';

interface LanguageSelectorProps {
  selectedLanguages: SupportedLanguage[];
  onLanguageChange: (languages: SupportedLanguage[]) => void;
  multiple?: boolean;
  label?: string;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onLanguageChange,
  multiple = true,
  label = 'Language Proficiency',
  className = ''
}) => {
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  const loadSupportedLanguages = async () => {
    try {
      const languages = await languageService.getSupportedLanguages();
      setSupportedLanguages(languages);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (language: SupportedLanguage) => {
    if (multiple) {
      const newSelection = selectedLanguages.includes(language)
        ? selectedLanguages.filter(lang => lang !== language)
        : [...selectedLanguages, language];
      onLanguageChange(newSelection);
    } else {
      onLanguageChange([language]);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="animate-pulse flex space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!supportedLanguages) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="text-sm text-red-600">Failed to load languages</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(supportedLanguages).map(([code, name]) => {
          const language = code as SupportedLanguage;
          const isSelected = selectedLanguages.includes(language);
          const colors = languageService.getLanguageColor(language);
          const flag = languageService.getLanguageFlag(language);

          return (
            <button
              key={language}
              onClick={() => handleLanguageToggle(language)}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? `${colors.bg} ${colors.text} ${colors.border} shadow-md` 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <span className="mr-2" role="img" aria-label={`${name} flag`}>
                {flag}
              </span>
              <span className="font-medium">{name}</span>
              {isSelected && (
                <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      
      {multiple && (
        <div className="text-xs text-gray-500 mt-2">
          {selectedLanguages.length === 0 
            ? 'Select the languages you can communicate in'
            : `Selected ${selectedLanguages.length} language${selectedLanguages.length === 1 ? '' : 's'}`
          }
        </div>
      )}
    </div>
  );
};