/**
 * Location Service for Medak Constituency
 * Handles location queries and data retrieval
 */

import {
  medakLocations,
  getDistricts as getDistrictsData,
  getAssembliesByDistrict,
  getMandalsByAssembly,
  getVillagesByMandal,
  searchLocation as searchLocationData,
  getLocationPath,
  validateLocationHierarchy,
  District,
  Assembly,
  Mandal
} from '../data/medak-locations';

export interface LocationSearchResult {
  district?: District;
  assembly?: Assembly;
  mandal?: Mandal;
  village?: string;
  type: 'district' | 'assembly' | 'mandal' | 'village';
  fullPath?: {
    district: string;
    assembly: string;
    mandal: string;
    village: string;
  };
}

export interface LocationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class LocationService {
  /**
   * Get all districts in Medak constituency
   */
  static getDistricts(): LocationServiceResponse<District[]> {
    try {
      const districts = getDistrictsData();
      return {
        success: true,
        data: districts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch districts'
      };
    }
  }

  /**
   * Get assemblies for a specific district
   */
  static getAssemblies(districtId: string): LocationServiceResponse<Assembly[]> {
    try {
      if (!districtId) {
        return {
          success: false,
          error: 'District ID is required'
        };
      }

      const assemblies = getAssembliesByDistrict(districtId);
      
      if (assemblies.length === 0) {
        return {
          success: false,
          error: 'District not found or has no assemblies'
        };
      }

      return {
        success: true,
        data: assemblies
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch assemblies'
      };
    }
  }

  /**
   * Get mandals for a specific assembly
   */
  static getMandals(districtId: string, assemblyId: string): LocationServiceResponse<Mandal[]> {
    try {
      if (!districtId || !assemblyId) {
        return {
          success: false,
          error: 'District ID and Assembly ID are required'
        };
      }

      const mandals = getMandalsByAssembly(districtId, assemblyId);
      
      if (mandals.length === 0) {
        return {
          success: false,
          error: 'Assembly not found or has no mandals'
        };
      }

      return {
        success: true,
        data: mandals
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch mandals'
      };
    }
  }

  /**
   * Get villages for a specific mandal
   */
  static getVillages(
    districtId: string, 
    assemblyId: string, 
    mandalId: string
  ): LocationServiceResponse<string[]> {
    try {
      if (!districtId || !assemblyId || !mandalId) {
        return {
          success: false,
          error: 'District ID, Assembly ID, and Mandal ID are required'
        };
      }

      const villages = getVillagesByMandal(districtId, assemblyId, mandalId);
      
      if (villages.length === 0) {
        return {
          success: false,
          error: 'Mandal not found or has no villages'
        };
      }

      return {
        success: true,
        data: villages
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch villages'
      };
    }
  }

  /**
   * Search locations by query string (fuzzy search)
   */
  static searchLocation(query: string): LocationServiceResponse<LocationSearchResult[]> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters long'
        };
      }

      const searchResults = searchLocationData(query.trim());
      
      // Enhance results with full path information
      const enhancedResults: LocationSearchResult[] = searchResults.map(result => {
        const enhanced: LocationSearchResult = { ...result };
        
        // Add full path for village results
        if (result.type === 'village' && result.village) {
          const fullPath = getLocationPath(result.village);
          if (fullPath) {
            enhanced.fullPath = fullPath;
          }
        }
        
        return enhanced;
      });

      return {
        success: true,
        data: enhancedResults
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search locations'
      };
    }
  }

  /**
   * Get full location path for a village
   */
  static getVillageLocationPath(villageName: string): LocationServiceResponse<{
    district: string;
    assembly: string;
    mandal: string;
    village: string;
  }> {
    try {
      if (!villageName) {
        return {
          success: false,
          error: 'Village name is required'
        };
      }

      const locationPath = getLocationPath(villageName);
      
      if (!locationPath) {
        return {
          success: false,
          error: 'Village not found'
        };
      }

      return {
        success: true,
        data: locationPath
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get village location path'
      };
    }
  }

  /**
   * Validate location hierarchy
   */
  static validateLocation(
    districtId: string,
    assemblyId: string,
    mandalId: string,
    villageName: string
  ): LocationServiceResponse<boolean> {
    try {
      if (!districtId || !assemblyId || !mandalId || !villageName) {
        return {
          success: false,
          error: 'All location parameters are required'
        };
      }

      const isValid = validateLocationHierarchy(districtId, assemblyId, mandalId, villageName);
      
      return {
        success: true,
        data: isValid
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to validate location'
      };
    }
  }

  /**
   * Get location statistics
   */
  static getLocationStats(): LocationServiceResponse<{
    totalDistricts: number;
    totalAssemblies: number;
    totalMandals: number;
    totalVillages: number;
  }> {
    try {
      let totalAssemblies = 0;
      let totalMandals = 0;
      let totalVillages = 0;

      medakLocations.districts.forEach(district => {
        totalAssemblies += district.assemblies.length;
        
        district.assemblies.forEach(assembly => {
          totalMandals += assembly.mandals.length;
          
          assembly.mandals.forEach(mandal => {
            totalVillages += mandal.villages.length;
          });
        });
      });

      return {
        success: true,
        data: {
          totalDistricts: medakLocations.districts.length,
          totalAssemblies,
          totalMandals,
          totalVillages
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get location statistics'
      };
    }
  }
}

export default LocationService;