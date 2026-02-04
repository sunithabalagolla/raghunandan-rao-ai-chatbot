/**
 * Location Routes for Medak Constituency API
 */

import { Router } from 'express';
import LocationController from '../controllers/location.controller';

const router = Router();

// GET /api/locations/districts - Get all districts
router.get('/districts', LocationController.getDistricts);

// GET /api/locations/assemblies/:districtId - Get assemblies for a district
router.get('/assemblies/:districtId', LocationController.getAssemblies);

// GET /api/locations/mandals/:districtId/:assemblyId - Get mandals for an assembly
router.get('/mandals/:districtId/:assemblyId', LocationController.getMandals);

// GET /api/locations/villages/:districtId/:assemblyId/:mandalId - Get villages for a mandal
router.get('/villages/:districtId/:assemblyId/:mandalId', LocationController.getVillages);

// GET /api/locations/search?q=searchterm - Search locations
router.get('/search', LocationController.searchLocation);

// GET /api/locations/village-path/:villageName - Get full path for a village
router.get('/village-path/:villageName', LocationController.getVillageLocationPath);

// POST /api/locations/validate - Validate location hierarchy
router.post('/validate', LocationController.validateLocation);

// GET /api/locations/stats - Get location statistics
router.get('/stats', LocationController.getLocationStats);

export default router;