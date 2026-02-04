/**
 * Location Service - Frontend API client for location data
 */

export interface District {
  id: string;
  name: string;
}

export interface Assembly {
  id: string;
  name: string;
}

export interface Mandal {
  id: string;
  name: string;
  villages: string[];
}

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class LocationService {
  private baseUrl = '/api/locations';

  /**
   * Get all districts
   */
  async getDistricts(): Promise<ApiResponse<District[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/districts`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch districts'
      };
    }
  }

  /**
   * Get assemblies for a district
   */
  async getAssemblies(districtId: string): Promise<ApiResponse<Assembly[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/assemblies/${districtId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch assemblies'
      };
    }
  }

  /**
   * Get mandals for an assembly
   */
  async getMandals(districtId: string, assemblyId: string): Promise<ApiResponse<Mandal[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/mandals/${districtId}/${assemblyId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch mandals'
      };
    }
  }

  /**
   * Get villages for a mandal
   */
  async getVillages(
    districtId: string, 
    assemblyId: string, 
    mandalId: string
  ): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/villages/${districtId}/${assemblyId}/${mandalId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch villages'
      };
    }
  }

  /**
   * Search locations by query
   */
  async searchLocation(query: string): Promise<ApiResponse<LocationSearchResult[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
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
  async getVillageLocationPath(villageName: string): Promise<ApiResponse<{
    district: string;
    assembly: string;
    mandal: string;
    village: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/village-path/${encodeURIComponent(villageName)}`);
      const data = await response.json();
      return data;
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
  async validateLocation(
    districtId: string,
    assemblyId: string,
    mandalId: string,
    villageName: string
  ): Promise<ApiResponse<{ isValid: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          districtId,
          assemblyId,
          mandalId,
          villageName
        })
      });
      const data = await response.json();
      return data;
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
  async getLocationStats(): Promise<ApiResponse<{
    totalDistricts: number;
    totalAssemblies: number;
    totalMandals: number;
    totalVillages: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get location statistics'
      };
    }
  }
}

export default new LocationService();