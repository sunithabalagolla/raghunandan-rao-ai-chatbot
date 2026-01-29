import { apiService as api } from './api';

export interface SupportedLanguages {
  en: string;
  hi: string;
  te: string;
}

export type SupportedLanguage = keyof SupportedLanguages;

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  languageName: string;
  confidence: number;
}

export interface TranslationSuggestions {
  language: SupportedLanguage;
  languageName: string;
  translations: Record<string, string>;
}

export interface AgentLanguageInfo {
  id: string;
  email: string;
  status: string;
  activeChats: number;
  languages: SupportedLanguage[];
}

export interface LanguageStatistics {
  ticketsByLanguage: Record<SupportedLanguage, number>;
  agentsByLanguage: Record<SupportedLanguage, number>;
  averageResponseTime: Record<SupportedLanguage, number>;
}

class LanguageService {
  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<SupportedLanguages> {
    const response = await api.get('/language/supported');
    return response.data.data;
  }

  /**
   * Detect language from message content
   */
  async detectLanguage(message: string): Promise<LanguageDetectionResult> {
    const response = await api.post('/language/detect', { message });
    return response.data.data;
  }

  /**
   * Get translation suggestions for a specific language
   */
  async getTranslations(language: SupportedLanguage): Promise<TranslationSuggestions> {
    const response = await api.get(`/language/translations/${language}`);
    return response.data.data;
  }

  /**
   * Get agents with specific language proficiency
   */
  async getAgentsWithLanguage(language: SupportedLanguage): Promise<{
    language: SupportedLanguage;
    languageName: string;
    agents: AgentLanguageInfo[];
    count: number;
  }> {
    const response = await api.get(`/language/agents/${language}`);
    return response.data.data;
  }

  /**
   * Route ticket based on language preference
   */
  async routeTicketByLanguage(ticketId: string, language: SupportedLanguage): Promise<void> {
    await api.post('/language/route-ticket', { ticketId, language });
  }

  /**
   * Update agent language proficiency
   */
  async updateAgentLanguages(languages: SupportedLanguage[]): Promise<void> {
    await api.put('/language/agent/languages', { languages });
  }

  /**
   * Get language routing statistics
   */
  async getLanguageStatistics(): Promise<LanguageStatistics> {
    const response = await api.get('/language/statistics');
    return response.data.data;
  }

  /**
   * Get language flag emoji
   */
  getLanguageFlag(language: SupportedLanguage): string {
    const flags = {
      en: '🇺🇸',
      hi: '🇮🇳',
      te: '🇮🇳'
    };
    return flags[language] || '🌐';
  }

  /**
   * Get language color for UI styling
   */
  getLanguageColor(language: SupportedLanguage): {
    bg: string;
    text: string;
    border: string;
  } {
    const colors = {
      en: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300'
      },
      hi: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300'
      },
      te: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300'
      }
    };
    return colors[language] || colors.en;
  }

  /**
   * Format language name for display
   */
  formatLanguageName(language: SupportedLanguage): string {
    const names = {
      en: 'English',
      hi: 'हिंदी (Hindi)',
      te: 'తెలుగు (Telugu)'
    };
    return names[language] || language.toUpperCase();
  }

  /**
   * Get common translation shortcuts
   */
  getTranslationShortcuts(): Record<string, { key: string; description: string }> {
    return {
      '/hello': { key: 'greeting', description: 'Greeting message' },
      '/thanks': { key: 'thanks', description: 'Thank you message' },
      '/wait': { key: 'wait', description: 'Please wait message' },
      '/resolve': { key: 'resolve', description: 'Resolution check message' },
      '/bye': { key: 'goodbye', description: 'Goodbye message' },
      '/escalate': { key: 'escalate', description: 'Escalation message' },
      '/tech': { key: 'technical', description: 'Technical support message' },
      '/bill': { key: 'billing', description: 'Billing inquiry message' },
      '/help': { key: 'general', description: 'General help message' }
    };
  }

  /**
   * Check if message contains translation shortcut
   */
  parseTranslationShortcut(message: string): { isShortcut: boolean; key?: string } {
    const shortcuts = this.getTranslationShortcuts();
    const trimmedMessage = message.trim();
    
    if (trimmedMessage in shortcuts) {
      return {
        isShortcut: true,
        key: shortcuts[trimmedMessage].key
      };
    }
    
    return { isShortcut: false };
  }

  /**
   * Get language proficiency levels
   */
  getLanguageProficiencyLevels(): Record<string, string> {
    return {
      native: 'Native Speaker',
      fluent: 'Fluent',
      intermediate: 'Intermediate',
      basic: 'Basic'
    };
  }

  /**
   * Validate language code
   */
  isValidLanguage(language: string): language is SupportedLanguage {
    return ['en', 'hi', 'te'].includes(language);
  }

  /**
   * Get language direction (LTR/RTL)
   */
  getLanguageDirection(_language: SupportedLanguage): 'ltr' | 'rtl' {
    // All supported languages use LTR
    return 'ltr';
  }

  /**
   * Format language statistics for display
   */
  formatLanguageStats(stats: LanguageStatistics): {
    language: SupportedLanguage;
    name: string;
    flag: string;
    tickets: number;
    agents: number;
    avgResponseTime: string;
    color: { bg: string; text: string; border: string };
  }[] {
    return Object.entries(stats.ticketsByLanguage).map(([lang, tickets]) => {
      const language = lang as SupportedLanguage;
      return {
        language,
        name: this.formatLanguageName(language),
        flag: this.getLanguageFlag(language),
        tickets,
        agents: stats.agentsByLanguage[language] || 0,
        avgResponseTime: stats.averageResponseTime[language] 
          ? `${stats.averageResponseTime[language]}m` 
          : 'N/A',
        color: this.getLanguageColor(language)
      };
    });
  }
}

export const languageService = new LanguageService();