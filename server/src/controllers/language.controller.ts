import { Request, Response } from 'express';
import * as languageService from '../services/language.service';

/**
 * Language Controller
 * Handles multi-language support and routing endpoints
 */

/**
 * GET /api/language/supported
 * Get list of supported languages
 */
export const getSupportedLanguages = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: languageService.SUPPORTED_LANGUAGES
    });
  } catch (error: any) {
    console.error('Error fetching supported languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supported languages'
    });
  }
};

/**
 * POST /api/language/detect
 * Detect language from message content
 */
export const detectLanguage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const detectedLanguage = languageService.detectLanguage(message);

    res.status(200).json({
      success: true,
      data: {
        language: detectedLanguage,
        languageName: languageService.SUPPORTED_LANGUAGES[detectedLanguage],
        confidence: detectedLanguage === 'en' ? 0.8 : 0.95 // Higher confidence for non-English
      }
    });
  } catch (error: any) {
    console.error('Error detecting language:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to detect language'
    });
  }
};

/**
 * GET /api/language/translations/:language
 * Get translation suggestions for a specific language
 */
export const getTranslations = async (req: Request, res: Response) => {
  try {
    const { language } = req.params;

    if (!language || !(language in languageService.SUPPORTED_LANGUAGES)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unsupported language'
      });
    }

    const translations = languageService.getTranslationSuggestions(language as languageService.SupportedLanguage);

    res.status(200).json({
      success: true,
      data: {
        language,
        languageName: languageService.SUPPORTED_LANGUAGES[language as languageService.SupportedLanguage],
        translations
      }
    });
  } catch (error: any) {
    console.error('Error fetching translations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch translations'
    });
  }
};

/**
 * GET /api/language/agents/:language
 * Get agents with specific language proficiency
 */
export const getAgentsWithLanguage = async (req: Request, res: Response) => {
  try {
    const { language } = req.params;

    if (!language || !(language in languageService.SUPPORTED_LANGUAGES)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unsupported language'
      });
    }

    const agents = await languageService.getAgentsWithLanguage(language as languageService.SupportedLanguage);

    res.status(200).json({
      success: true,
      data: {
        language,
        languageName: languageService.SUPPORTED_LANGUAGES[language as languageService.SupportedLanguage],
        agents: agents.map(agent => ({
          id: agent._id,
          email: agent.email,
          status: agent.agentProfile?.status || 'offline',
          activeChats: agent.agentProfile?.activeChats || 0,
          languages: agent.agentProfile?.languages || ['en']
        })),
        count: agents.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching agents with language:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agents with language'
    });
  }
};

/**
 * POST /api/language/route-ticket
 * Route ticket based on language preference
 */
export const routeTicketByLanguage = async (req: Request, res: Response) => {
  try {
    const { ticketId, language } = req.body;

    if (!ticketId || !language) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and language are required'
      });
    }

    if (!(language in languageService.SUPPORTED_LANGUAGES)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    const result = await languageService.routeTicketByLanguage(ticketId, language as languageService.SupportedLanguage);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Ticket routed successfully',
        data: {
          ticketId,
          language,
          assignedAgent: result.assignedAgent ? {
            id: result.assignedAgent._id,
            email: result.assignedAgent.email
          } : null
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.reason || 'Failed to route ticket'
      });
    }
  } catch (error: any) {
    console.error('Error routing ticket by language:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to route ticket by language'
    });
  }
};

/**
 * PUT /api/language/agent/languages
 * Update agent language proficiency
 */
export const updateAgentLanguages = async (req: Request, res: Response) => {
  try {
    const { languages } = req.body;
    const agentId = (req as any).user?.userId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    if (!languages || !Array.isArray(languages)) {
      return res.status(400).json({
        success: false,
        message: 'Languages array is required'
      });
    }

    // Validate languages
    const validLanguages = languages.filter(lang => lang in languageService.SUPPORTED_LANGUAGES);
    if (validLanguages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid language is required'
      });
    }

    const success = await languageService.updateAgentLanguages(agentId, validLanguages);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Language proficiency updated successfully',
        data: {
          agentId,
          languages: validLanguages
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update language proficiency'
      });
    }
  } catch (error: any) {
    console.error('Error updating agent languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update agent languages'
    });
  }
};

/**
 * GET /api/language/statistics
 * Get language routing statistics
 */
export const getLanguageStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await languageService.getLanguageStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching language statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch language statistics'
    });
  }
};