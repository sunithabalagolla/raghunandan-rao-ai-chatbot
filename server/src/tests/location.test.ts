/**
 * Location Service Tests
 * Basic tests to verify location service functionality
 */

import LocationService from '../services/location.service';

describe('Location Service Tests', () => {
  
  test('should get all districts', () => {
    const result = LocationService.getDistricts();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBe(3); // Siddipet, Medak, Sangareddy
    
    const districtNames = result.data?.map(d => d.name);
    expect(districtNames).toContain('Siddipet District');
    expect(districtNames).toContain('Medak District');
    expect(districtNames).toContain('Sangareddy District');
  });

  test('should get assemblies for Siddipet district', () => {
    const result = LocationService.getAssemblies('siddipet');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBe(2); // Dubbak, Gajwel
    
    const assemblyNames = result.data?.map(a => a.name);
    expect(assemblyNames).toContain('Dubbak Assembly');
    expect(assemblyNames).toContain('Gajwel Assembly');
  });

  test('should get mandals for Gajwel assembly', () => {
    const result = LocationService.getMandals('siddipet', 'gajwel');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBe(9); // 9 mandals in Gajwel
  });

  test('should get villages for a mandal', () => {
    const result = LocationService.getVillages('siddipet', 'gajwel', 'gajwel-area');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data).toContain('Anthasagar');
  });

  test('should search locations', () => {
    const result = LocationService.searchLocation('Gajwel');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
  });

  test('should get location statistics', () => {
    const result = LocationService.getLocationStats();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalDistricts).toBe(3);
    expect(result.data?.totalAssemblies).toBe(7);
    expect(result.data?.totalMandals).toBeGreaterThan(40);
    expect(result.data?.totalVillages).toBeGreaterThan(100);
  });

  test('should handle invalid district ID', () => {
    const result = LocationService.getAssemblies('invalid-district');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle short search query', () => {
    const result = LocationService.searchLocation('a');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 2 characters');
  });

});

// Manual test function for development
export const testLocationService = () => {
  console.log('🧪 Testing Location Service...');
  
  // Test districts
  const districts = LocationService.getDistricts();
  console.log('Districts:', districts.data?.map(d => d.name));
  
  // Test assemblies
  const assemblies = LocationService.getAssemblies('siddipet');
  console.log('Siddipet Assemblies:', assemblies.data?.map(a => a.name));
  
  // Test mandals
  const mandals = LocationService.getMandals('siddipet', 'gajwel');
  console.log('Gajwel Mandals:', mandals.data?.map(m => m.name));
  
  // Test villages
  const villages = LocationService.getVillages('siddipet', 'gajwel', 'gajwel-area');
  console.log('Gajwel Area Villages:', villages.data?.slice(0, 5));
  
  // Test search
  const searchResults = LocationService.searchLocation('Medak');
  console.log('Search Results for "Medak":', searchResults.data?.length);
  
  // Test stats
  const stats = LocationService.getLocationStats();
  console.log('Location Stats:', stats.data);
  
  console.log('✅ Location Service tests completed!');
};