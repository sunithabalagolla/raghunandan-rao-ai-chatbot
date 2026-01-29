import { Router } from 'express';
import * as languageController from '../controllers/language.controller';
import { authenticate } from '../auth/middleware/auth.middleware';

const router = Router();

/**
 * Language Routes
 * Task 25: Multi-language Support and Routing
 * All endpoints require agent authentication
 */

// Get supported languages (public endpoint)
router.get('/supported', languageController.getSupportedLanguages);

// Detect language from message content
router.post('/detect', authenticate, languageController.detectLanguage);

// Get translation suggestions for a specific language
router.get('/translations/:language', authenticate, languageController.getTranslations);

// Get agents with specific language proficiency
router.get('/agents/:language', authenticate, languageController.getAgentsWithLanguage);

// Route ticket based on language preference
router.post('/route-ticket', authenticate, languageController.routeTicketByLanguage);

// Update agent language proficiency
router.put('/agent/languages', authenticate, languageController.updateAgentLanguages);

// Get language routing statistics
router.get('/statistics', authenticate, languageController.getLanguageStatistics);

export default router;