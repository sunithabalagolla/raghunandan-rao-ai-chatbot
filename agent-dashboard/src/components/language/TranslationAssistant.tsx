import React, { useState, useEffect } from 'react';
import { languageService, type SupportedLanguage, type TranslationSuggestions } from '../../services/languageService';

interface TranslationAssistantProps {
  customerLanguage: SupportedLanguage;
  onTranslationSelect: (translation: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TranslationAssistant: React.FC<TranslationAssistantProps> = ({
  customerLanguage,
  onTranslationSelect,
  isOpen,
  onClose
}) => {
  const [translations, setTranslations] = useState<TranslationSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && customerLanguage) {
      loadTranslations();
    }
  }, [isOpen, customerLanguage]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      const result = await languageService.getTranslations(customerLanguage);
      setTranslations(result);
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationClick = (translation: string) => {
    onTranslationSelect(translation);
    onClose();
  };

  const filteredTranslations = translations?.translations 
    ? Object.entries(translations.translations).filter(([key, value]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const shortcuts = languageService.getTranslationShortcuts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Translation Assistant</h2>
              <p className="text-sm text-gray-600">
                {translations ? `Suggestions for ${translations.languageName}` : 'Loading translations...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading translations...</span>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Shortcuts Guide */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(shortcuts).slice(0, 6).map(([shortcut, info]) => (
                    <div key={shortcut} className="flex items-center space-x-2">
                      <code className="bg-blue-200 text-blue-800 px-1 rounded">{shortcut}</code>
                      <span className="text-blue-700">{info.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translation Suggestions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Common Responses</h3>
                {filteredTranslations.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTranslations.map(([key, translation]) => (
                      <button
                        key={key}
                        onClick={() => handleTranslationClick(translation)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 capitalize mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {translation}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No translations found matching your search.' : 'No translations available.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click any suggestion to insert into your message</span>
            </div>
            <div className="text-xs text-gray-500">
              ESC to close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};