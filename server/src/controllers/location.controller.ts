/**
 * Location Controller for Medak Constituency API endpoints
 */

import { Request, Response } from 'express';
import LocationService from '../services/location.service';

export class LocationController {
  /**
   * GET /api/locations/districts
   * Get all districts
   */
  static async getDistricts(req: Request, res: Response): Promise<void> {
    try {
      const result = LocationService.getDistricts();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Districts retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve districts'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/assemblies/:districtId
   * Get assemblies for a district
   */
  static async getAssemblies(req: Request, res: Response): Promise<void> {
    try {
      const { districtId } = req.params;
      const result = LocationService.getAssemblies(districtId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Assemblies retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve assemblies'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/mandals/:districtId/:assemblyId
   * Get mandals for an assembly
   */
  static async getMandals(req: Request, res: Response): Promise<void> {
    try {
      const { districtId, assemblyId } = req.params;
      const result = LocationService.getMandals(districtId, assemblyId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Mandals retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve mandals'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/villages/:districtId/:assemblyId/:mandalId
   * Get villages for a mandal
   */
  static async getVillages(req: Request, res: Response): Promise<void> {
    try {
      const { districtId, assemblyId, mandalId } = req.params;
      const result = LocationService.getVillages(districtId, assemblyId, mandalId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Villages retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve villages'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/search?q=searchterm
   * Search locations by query
   */
  static async searchLocation(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query parameter "q" is required',
          message: 'Please provide a search term'
        });
        return;
      }

      const result = LocationService.searchLocation(q);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Search completed successfully',
          query: q,
          resultCount: result.data?.length || 0
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Search failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/village-path/:villageName
   * Get full location path for a village
   */
  static async getVillageLocationPath(req: Request, res: Response): Promise<void> {
    try {
      const { villageName } = req.params;
      const result = LocationService.getVillageLocationPath(villageName);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Village location path retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve village location path'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * POST /api/locations/validate
   * Validate location hierarchy
   */
  static async validateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { districtId, assemblyId, mandalId, villageName } = req.body;
      
      if (!districtId || !assemblyId || !mandalId || !villageName) {
        res.status(400).json({
          success: false,
          error: 'All location parameters are required',
          message: 'Please provide districtId, assemblyId, mandalId, and villageName'
        });
        return;
      }

      const result = LocationService.validateLocation(districtId, assemblyId, mandalId, villageName);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: { isValid: result.data },
          message: result.data ? 'Location is valid' : 'Location is invalid'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Validation failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  /**
   * GET /api/locations/stats
   * Get location statistics
   */
  static async getLocationStats(req: Request, res: Response): Promise<void> {
    try {
      const result = LocationService.getLocationStats();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Location statistics retrieved successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve location statistics'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }
}

export default LocationController;