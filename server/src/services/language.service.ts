/**
 * Language Service
 * Handles language detection, routing, and translation assistance
 */

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Language detection patterns
const LANGUAGE_PATTERNS = {
  // Telugu Unicode ranges
  te: /[\u0C00-\u0C7F]/,
  // Hindi/Devanagari Unicode ranges
  hi: /[\u0900-\u097F]/,
  // English (default if no other patterns match)
  en: /^[a-zA-Z\s\d\p{P}]+$/u
};

// Common phrases for language detection
const LANGUAGE_PHRASES = {
  te: [
    'నమస్కారం', 'ధన్యవాదాలు', 'సహాయం', 'సమస్య', 'ప్రశ్న',
    'మీరు', 'నేను', 'ఎలా', 'ఎక్కడ', 'ఎప్పుడు'
  ],
  hi: [
    'नमस्ते', 'धन्यवाद', 'सहायता', 'समस्या', 'प्रश्न',
    'आप', 'मैं', 'कैसे', 'कहाँ', 'कब'
  ],
  en: [
    'hello', 'thank you', 'help', 'problem', 'question',
    'you', 'i', 'how', 'where', 'when'
  ]
};

/**
 * Detect language from message content
 */
export const detectLanguage = (message: string): SupportedLanguage => {
  if (!message || typeof message !== 'string') {
    return 'en'; // Default to English
  }

  const cleanMessage = message.toLowerCase().trim();

  // Check for Telugu characters
  if (LANGUAGE_PATTERNS.te.test(message)) {
    return 'te';
  }

  // Check for Hindi characters
  if (LANGUAGE_PATTERNS.hi.test(message)) {
    return 'hi';
  }

  // Check for common phrases
  for (const [lang, phrases] of Object.entries(LANGUAGE_PHRASES)) {
    if (phrases.some(phrase => cleanMessage.includes(phrase))) {
      return lang as SupportedLanguage;
    }
  }

  // Default to English
  return 'en';
};

/**
 * Get agents with specific language proficiency
 */
export const getAgentsWithLanguage = async (language: SupportedLanguage): Promise<any[]> => {
  try {
    const User = require('../shared/models/User.model').default;
    
    const agents = await User.find({
      role: 'agent',
      'agentProfile.status': 'available',
      $or: [
        { 'agentProfile.languages': language },
        { 'agentProfile.languages': 'all' }, // Agents who speak all languages
        { 'agentProfile.languages': { $exists: false } } // Default to all languages if not specified
      ]
    }).select('_id email agentProfile');

    return agents;
  } catch (error) {
    console.error('Error fetching agents with language:', error);
    return [];
  }
};

/**
 * Route ticket to agent based on language preference
 */
export const routeTicketByLanguage = async (ticketId: string, customerLanguage: SupportedLanguage): Promise<{
  success: boolean;
  assignedAgent?: any;
  reason?: string;
}> => {
  try {
    const HandoffTicket = require('../shared/models/HandoffTicket.model').default;
    
    // Get agents with matching language skills
    const availableAgents = await getAgentsWithLanguage(customerLanguage);
    
    if (availableAgents.length === 0) {
      return {
        success: false,
        reason: `No agents available for language: ${SUPPORTED_LANGUAGES[customerLanguage]}`
      };
    }

    // Sort agents by workload (agents with fewer active chats first)
    const sortedAgents = availableAgents.sort((a, b) => {
      const aWorkload = a.agentProfile?.activeChats || 0;
      const bWorkload = b.agentProfile?.activeChats || 0;
      return aWorkload - bWorkload;
    });

    const selectedAgent = sortedAgents[0];

    // Update ticket with language-based assignment
    await HandoffTicket.findByIdAndUpdate(ticketId, {
      assignedAgentId: selectedAgent._id,
      assignedAt: new Date(),
      customerLanguage: customerLanguage,
      'autoAssignmentData.assignmentMethod': 'language-based',
      'autoAssignmentData.languageScore': 100 // Perfect language match
    });

    console.log(`🌐 Language-based routing: Ticket ${ticketId} assigned to agent ${selectedAgent.email} for ${SUPPORTED_LANGUAGES[customerLanguage]}`);

    return {
      success: true,
      assignedAgent: selectedAgent
    };
  } catch (error) {
    console.error('Error routing ticket by language:', error);
    return {
      success: false,
      reason: 'Failed to route ticket by language'
    };
  }
};

/**
 * Get translation suggestions for common responses
 */
export const getTranslationSuggestions = (language: SupportedLanguage): Record<string, string> => {
  const translations = {
    en: {
      greeting: "Hello! How can I help you today?",
      thanks: "Thank you for contacting us.",
      wait: "Please wait a moment while I check that for you.",
      resolve: "Is there anything else I can help you with?",
      goodbye: "Thank you for contacting us. Have a great day!",
      escalate: "Let me connect you with a specialist who can better assist you.",
      technical: "I understand you're having a technical issue. Let me help you resolve this.",
      billing: "I can help you with your billing inquiry.",
      general: "I'm here to help. Could you please provide more details about your concern?"
    },
    hi: {
      greeting: "नमस्ते! आज मैं आपकी कैसे सहायता कर सकता हूँ?",
      thanks: "हमसे संपर्क करने के लिए धन्यवाद।",
      wait: "कृपया एक क्षण प्रतीक्षा करें जबकि मैं आपके लिए इसकी जांच करता हूँ।",
      resolve: "क्या कोई और चीज़ है जिसमें मैं आपकी सहायता कर सकता हूँ?",
      goodbye: "हमसे संपर्क करने के लिए धन्यवाद। आपका दिन शुभ हो!",
      escalate: "मैं आपको एक विशेषज्ञ से जोड़ता हूँ जो आपकी बेहतर सहायता कर सकता है।",
      technical: "मैं समझता हूँ कि आपको तकनीकी समस्या हो रही है। मैं इसे हल करने में आपकी सहायता करूंगा।",
      billing: "मैं आपकी बिलिंग संबंधी पूछताछ में सहायता कर सकता हूँ।",
      general: "मैं यहाँ सहायता के लिए हूँ। क्या आप कृपया अपनी चिंता के बारे में अधिक विवरण दे सकते हैं?"
    },
    te: {
      greeting: "నమస్కారం! ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
      thanks: "మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు।",
      wait: "దయచేసి ఒక క్షణం వేచి ఉండండి, నేను మీ కోసం దీన్ని తనిఖీ చేస్తాను.",
      resolve: "నేను మీకు సహాయం చేయగల మరేదైనా ఉందా?",
      goodbye: "మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు. మీకు మంచి రోజు కలుగుగాక!",
      escalate: "మీకు మెరుగైన సహాయం చేయగల నిపుణుడితో మిమ్మల్ని కనెక్ట్ చేస్తాను.",
      technical: "మీకు సాంకేతిక సమస్య ఉందని నేను అర్థం చేసుకున్నాను. దీన్ని పరిష్కరించడంలో నేను మీకు సహాయం చేస్తాను.",
      billing: "మీ బిల్లింగ్ విచారణలో నేను మీకు సహాయం చేయగలను.",
      general: "నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మీ ఆందోళన గురించి మరిన్ని వివరాలు అందించగలరా?"
    }
  };

  return translations[language] || translations.en;
};

/**
 * Update agent language proficiency
 */
export const updateAgentLanguages = async (agentId: string, languages: SupportedLanguage[]): Promise<boolean> => {
  try {
    const User = require('../shared/models/User.model').default;
    
    await User.findByIdAndUpdate(agentId, {
      $set: {
        'agentProfile.languages': languages
      }
    });

    console.log(`🌐 Updated language proficiency for agent ${agentId}:`, languages);
    return true;
  } catch (error) {
    console.error('Error updating agent languages:', error);
    return false;
  }
};

/**
 * Get language statistics for routing analytics
 */
export const getLanguageStatistics = async (): Promise<{
  ticketsByLanguage: Record<SupportedLanguage, number>;
  agentsByLanguage: Record<SupportedLanguage, number>;
  averageResponseTime: Record<SupportedLanguage, number>;
}> => {
  try {
    const HandoffTicket = require('../shared/models/HandoffTicket.model').default;
    const User = require('../shared/models/User.model').default;

    // Get ticket counts by language
    const ticketCounts = await HandoffTicket.aggregate([
      { $match: { customerLanguage: { $exists: true } } },
      { $group: { _id: '$customerLanguage', count: { $sum: 1 } } }
    ]);

    // Get agent counts by language
    const agentCounts = await User.aggregate([
      { $match: { role: 'agent', 'agentProfile.languages': { $exists: true } } },
      { $unwind: '$agentProfile.languages' },
      { $group: { _id: '$agentProfile.languages', count: { $sum: 1 } } }
    ]);

    // Get average response times by language
    const responseTimes = await HandoffTicket.aggregate([
      { 
        $match: { 
          customerLanguage: { $exists: true },
          assignedAt: { $exists: true },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          responseTime: { $subtract: ['$assignedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: '$customerLanguage',
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // Format results
    const ticketsByLanguage = {} as Record<SupportedLanguage, number>;
    const agentsByLanguage = {} as Record<SupportedLanguage, number>;
    const averageResponseTime = {} as Record<SupportedLanguage, number>;

    // Initialize with zeros
    Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
      const language = lang as SupportedLanguage;
      ticketsByLanguage[language] = 0;
      agentsByLanguage[language] = 0;
      averageResponseTime[language] = 0;
    });

    // Fill in actual data
    ticketCounts.forEach((item: any) => {
      if (item._id in SUPPORTED_LANGUAGES) {
        ticketsByLanguage[item._id as SupportedLanguage] = item.count;
      }
    });

    agentCounts.forEach((item: any) => {
      if (item._id in SUPPORTED_LANGUAGES) {
        agentsByLanguage[item._id as SupportedLanguage] = item.count;
      }
    });

    responseTimes.forEach((item: any) => {
      if (item._id in SUPPORTED_LANGUAGES) {
        // Convert milliseconds to minutes
        averageResponseTime[item._id as SupportedLanguage] = Math.round(item.avgResponseTime / (1000 * 60));
      }
    });

    return {
      ticketsByLanguage,
      agentsByLanguage,
      averageResponseTime
    };
  } catch (error) {
    console.error('Error getting language statistics:', error);
    return {
      ticketsByLanguage: { en: 0, hi: 0, te: 0 },
      agentsByLanguage: { en: 0, hi: 0, te: 0 },
      averageResponseTime: { en: 0, hi: 0, te: 0 }
    };
  }
};