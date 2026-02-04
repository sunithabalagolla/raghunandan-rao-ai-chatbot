import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import locationService from '../../services/locationService';
import type { District, Assembly, Mandal } from '../../services/locationService';

// Temporary hardcoded data while API is being fixed
const HARDCODED_DISTRICTS: District[] = [
  { id: 'siddipet', name: 'Siddipet District' },
  { id: 'medak', name: 'Medak District' },
  { id: 'sangareddy', name: 'Sangareddy District' }
];

const HARDCODED_ASSEMBLIES: { [key: string]: Assembly[] } = {
  'siddipet': [
    { id: 'dubbak', name: 'Dubbak Assembly' },
    { id: 'gajwel', name: 'Gajwel Assembly' }
  ],
  'medak': [
    { id: 'chegunta', name: 'Chegunta Assembly' },
    { id: 'medak', name: 'Medak Assembly' },
    { id: 'narsapur', name: 'Narsapur Assembly' }
  ],
  'sangareddy': [
    { id: 'sangareddy', name: 'Sangareddy Assembly' },
    { id: 'patancheru', name: 'Patancheru Assembly' }
  ]
};

const HARDCODED_MANDALS: { [key: string]: Mandal[] } = {
  'dubbak': [
    { id: 'dubbak-municipality', name: 'Dubbak Municipality', villages: [] },
    { id: 'dubbak-rural', name: 'Dubbak Rural', villages: [] },
    { id: 'akbarpet-bhoomally', name: 'Akbarpet–Bhoompally', villages: [] }
  ],
  'gajwel': [
    { id: 'gajwel-area', name: 'Gajwel Area', villages: [] },
    { id: 'kondapak', name: 'Kondapak Mandal', villages: [] },
    { id: 'kukunoorpally', name: 'Kukunoorpally Mandal', villages: [] }
  ],
  'chegunta': [
    { id: 'chegunta-mandal', name: 'Chegunta Mandal', villages: [] },
    { id: 'narsingi-mandal', name: 'Narsingi Mandal', villages: [] },
    { id: 'masaipet-mandal', name: 'Masaipet Mandal', villages: [] }
  ],
  'medak': [
    { id: 'papannapet', name: 'Papannapet Mandal', villages: [] },
    { id: 'haveli-ghanpur', name: 'Haveli Ghanpur Mandal', villages: [] },
    { id: 'ch-shankarampet', name: 'CH Shankarampet Mandal', villages: [] },
    { id: 'nizampet', name: 'Nizampet Mandal', villages: [] },
    { id: 'ramayampet-town', name: 'Ramayampet Town', villages: [] },
    { id: 'ramayampet-mandal', name: 'Ramayampet Mandal', villages: [] },
    { id: 'medak-town', name: 'Medak Town', villages: [] },
    { id: 'medak-mandal', name: 'Medak Mandal', villages: [] }
  ],
  'narsapur': [
    { id: 'chilipiched', name: 'Chilipiched Mandal', villages: [] },
    { id: 'narsapur-town', name: 'Narsapur Town', villages: [] },
    { id: 'shivampet', name: 'Shivampet Mandal', villages: [] }
  ],
  'sangareddy': [
    { id: 'sangareddy-municipality', name: 'Sangareddy Municipality', villages: [] },
    { id: 'sangareddy-mandal', name: 'Sangareddy Mandal', villages: [] },
    { id: 'sadashivapet-municipality', name: 'Sadashivapet Municipality', villages: [] }
  ],
  'patancheru': [
    { id: 'bharathi-nagar', name: 'Bharathi Nagar (111 Division)', villages: [] },
    { id: 'patancheru-mandal', name: 'Patancheru Mandal', villages: [] },
    { id: 'patancheru-urban', name: 'Patancheru Urban Areas', villages: [] }
  ]
};

const HARDCODED_VILLAGES: { [key: string]: string[] } = {
  'dubbak-municipality': ['Dharmajipet', 'Lachapet', 'Chervapur', 'Dubbak', 'Chellapur', 'Dumpalaplly', 'Mallaipally'],
  'dubbak-rural': ['Gambhirpur', 'Potharam', 'Shilaji Nagar', 'Venkatagiri Thanda', 'Gosanpally', 'Akaram', 'Raghthampally'],
  'akbarpet-bhoomally': ['Boppapur', 'Enagurthi', 'Chinna Nizampet', 'Rameshrampaliy', 'Kudavelli', 'Thallapally'],
  'gajwel-area': ['Anthasagar', 'Thimmapur', 'Thigul', 'Ram Nagar', 'Chatlapalli', 'Thigulla Narsapur'],
  'kondapak': ['Thimmareddy Pally', 'Sirsigandla', 'Marpadaga', 'Giraipally', 'Dammakkapalli', 'Khammampalli'],
  'kukunoorpally': ['Mangole', 'Konayipalli', 'Kukunoorpally', 'Medinipur', 'Mathpally', 'Lakudaram'],
  'chegunta-mandal': ['B Kondapur', 'Bonala', 'Karnalpally', 'Chandaipet', 'Kasanpally', 'Chittojipally'],
  'narsingi-mandal': ['Narsingi', 'Narsampally', 'Vallabhapoor', 'Vallur', 'Bhimraopally'],
  'masaipet-mandal': ['Masaipet', 'Pothanshettiipally', 'Pothanpally', 'CH Thimmaipally', 'Nadimi Thanda'],
  'papannapet': ['Kompally', 'Cheekod', 'Kotha Lingayipally', 'Patha Lingayipalli', 'Amriya Thanda', 'Mallampet'],
  'haveli-ghanpur': ['Sulthanpur', 'Nagapur', 'Jakkannapet', 'Pochammaral', 'Boguda Bhoopathipur', 'Sardhana', 'Fareedpur', 'Muthaipally', 'Maddulwai', 'Kothapally', 'Wadi', 'Burugupally', 'Gajireddypally', 'Rajpet', 'Kapraipally', 'Shamnapur', 'Gangapoor', 'Haveli Ghanapur Thanda', 'Shamnapur Thanda', 'Aurangabad Thanda', 'Lingasanipally', 'Lingasanipally Thanda', 'B Thimmaipally', 'Byathole', 'Haveli Ghanapur', 'Choutlapally', 'Thogita', 'Kuchanpally'],
  'ch-shankarampet': ['Shalipet', 'Madoor', 'Gajagatlapally', 'Venkatraopalli', 'Chennaipally', 'Shankarampet (R)', 'Ambajipet'],
  'nizampet': ['Chelmeda', 'Naskal', 'Nanda Gokul', 'Nagaram (Lt)', 'Rampur', 'Nizampet', 'Bachhurajupalli'],
  'ramayampet-town': ['Ramayampet', 'Komatpally', 'Golparthy'],
  'ramayampet-mandal': ['Dongal Dharamaram', 'Akkannapet', 'Jansi Lingapoor', 'Rayilapoor', 'Sutharpally'],
  'medak-town': ['Aurangabad', 'Ausulapally', 'Medak', 'Pillikottal'],
  'medak-mandal': ['Thimma Nagar', 'Maktha Bhoopathipoor', 'Malkapally Thanda', 'Shivayipalli', 'Guttakindi Pally'],
  'chilipiched': ['Chitkul', 'Banjara Thanda', 'Chandoor', 'Gujri Thanda', 'Gouthampoor', 'Ganya Thanda'],
  'narsapur-town': ['Narsapur'],
  'narsapur-mandal': ['Naagula Palli', 'Moosapet', 'Ibrahimbad', 'Ahmamad Nagar', 'Tujalpur', 'Bramhanpally'],
  'shivampet': ['Konthanpally', 'Danthanpally', 'Gundlapally', 'Pothula Boguda', 'Usirika Pally', 'Shankar Thanda'],
  'yeldurthy': ['Shettipally Kalan', 'Ramayipally', 'Edulapally', 'Uppu Lingapur', 'Mellur', 'Peddapur'],
  'sangareddy-municipality': ['Sangareddy', 'Nethaji Nagar', 'Bhagathsingh Nagar', 'Brahmanwada', 'Babanagar'],
  'sangareddy-mandal': ['Kalabgoor', 'Angadipeta', 'Thalapally', 'Fasalwaadi', 'Gudithanda', 'Hanuman Nagar'],
  'sadashivapet-municipality': ['Sadashivpet'],
  'sadashivapet-mandal': ['Pottipalli', 'Kolkoor', 'Melgiripet', 'Sooraram', 'Thangedpally', 'Gollagudem'],
  'bharathi-nagar': ['Ranganathapuram', 'LIG', 'H.I.G.I', 'Bombay Colony', 'Srinivas Nagar Colony'],
  'ramachandrapuram': ['Ramachandrapuram'],
  'ameenpur-municipality': ['Beeramguda', 'Ammenpur', 'Bandamkommu', 'KSR NRI Colony', 'Uske Bavi'],
  'tellapur-municipality': ['Tellapur', 'Indira Nagar', 'Eedulanagulapally', 'Velimela'],
  'bollaram-municipality': ['Bollaram'],
  'patancheru-mandal': ['Rameshwaram Banda', 'Indresham', 'Pedda Kanjera', 'Lakdaram', 'Bachuguda'],
  'patancheru-urban': ['JP Colony', 'Ambedkar Colony', 'Mangali Basthi', 'Kammargalli', 'Sai Ram Nagar']
};

interface LocationData {
  district?: {
    id: string;
    name: string;
  };
  assembly?: {
    id: string;
    name: string;
  };
  mandal?: {
    id: string;
    name: string;
  };
  village?: string;
}

interface LocationSelectorProps {
  onLocationSelected: (location: LocationData) => void;
  currentLevel: 'district' | 'assembly' | 'mandal' | 'village';
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelected,
  currentLevel
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({});
  const [districts, setDistricts] = useState<District[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [mandals, setMandals] = useState<Mandal[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dropdown states
  const [showMandalDropdown, setShowMandalDropdown] = useState(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [mandalSearch, setMandalSearch] = useState('');
  const [villageSearch, setVillageSearch] = useState('');

  // Fetch districts on component mount
  useEffect(() => {
    if (currentLevel === 'district') {
      fetchDistricts();
    }
  }, [currentLevel]);

  // Fetch assemblies on component mount if we're at assembly level
  useEffect(() => {
    if (currentLevel === 'assembly' && selectedLocation.district) {
      fetchAssemblies(selectedLocation.district.id);
    }
  }, [currentLevel, selectedLocation.district]);

  // Fetch mandals on component mount if we're at mandal level
  useEffect(() => {
    if (currentLevel === 'mandal' && selectedLocation.district && selectedLocation.assembly) {
      fetchMandals(selectedLocation.district.id, selectedLocation.assembly.id);
    }
  }, [currentLevel, selectedLocation.district, selectedLocation.assembly]);

  // Fetch villages on component mount if we're at village level
  useEffect(() => {
    if (currentLevel === 'village' && selectedLocation.district && selectedLocation.assembly && selectedLocation.mandal) {
      fetchVillages(selectedLocation.district.id, selectedLocation.assembly.id, selectedLocation.mandal.id);
    }
  }, [currentLevel, selectedLocation.district, selectedLocation.assembly, selectedLocation.mandal]);

  const fetchDistricts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try API first, fallback to hardcoded data
      const result = await locationService.getDistricts();
      if (result.success && result.data) {
        setDistricts(result.data);
      } else {
        // Fallback to hardcoded data
        console.log('API failed, using hardcoded districts');
        setDistricts(HARDCODED_DISTRICTS);
      }
    } catch (err) {
      // Fallback to hardcoded data on network error
      console.log('Network error, using hardcoded districts');
      setDistricts(HARDCODED_DISTRICTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblies = async (districtId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Try API first, fallback to hardcoded data
      const result = await locationService.getAssemblies(districtId);
      if (result.success && result.data) {
        setAssemblies(result.data);
      } else {
        // Fallback to hardcoded data
        console.log('API failed, using hardcoded assemblies');
        setAssemblies(HARDCODED_ASSEMBLIES[districtId] || []);
      }
    } catch (err) {
      // Fallback to hardcoded data on network error
      console.log('Network error, using hardcoded assemblies');
      setAssemblies(HARDCODED_ASSEMBLIES[districtId] || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMandals = async (districtId: string, assemblyId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Try API first, fallback to hardcoded data
      const result = await locationService.getMandals(districtId, assemblyId);
      if (result.success && result.data) {
        setMandals(result.data);
      } else {
        // Fallback to hardcoded data
        console.log('API failed, using hardcoded mandals');
        setMandals(HARDCODED_MANDALS[assemblyId] || []);
      }
    } catch (err) {
      // Fallback to hardcoded data on network error
      console.log('Network error, using hardcoded mandals');
      setMandals(HARDCODED_MANDALS[assemblyId] || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async (districtId: string, assemblyId: string, mandalId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Try API first, fallback to hardcoded data
      const result = await locationService.getVillages(districtId, assemblyId, mandalId);
      if (result.success && result.data) {
        setVillages(result.data);
      } else {
        // Fallback to hardcoded data
        console.log('API failed, using hardcoded villages');
        setVillages(HARDCODED_VILLAGES[mandalId] || []);
      }
    } catch (err) {
      // Fallback to hardcoded data on network error
      console.log('Network error, using hardcoded villages');
      setVillages(HARDCODED_VILLAGES[mandalId] || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = (district: District) => {
    const newLocation = { ...selectedLocation, district };
    setSelectedLocation(newLocation);
    onLocationSelected(newLocation);
    fetchAssemblies(district.id);
  };

  const handleAssemblySelect = (assembly: Assembly) => {
    const newLocation = { ...selectedLocation, assembly };
    setSelectedLocation(newLocation);
    onLocationSelected(newLocation);
    if (selectedLocation.district) {
      fetchMandals(selectedLocation.district.id, assembly.id);
    }
  };

  const handleMandalSelect = (mandal: Mandal) => {
    const newLocation = { ...selectedLocation, mandal };
    setSelectedLocation(newLocation);
    onLocationSelected(newLocation);
    setShowMandalDropdown(false);
    if (selectedLocation.district && selectedLocation.assembly) {
      fetchVillages(selectedLocation.district.id, selectedLocation.assembly.id, mandal.id);
    }
  };

  const handleVillageSelect = (village: string) => {
    const newLocation = { ...selectedLocation, village };
    setSelectedLocation(newLocation);
    onLocationSelected(newLocation);
    setShowVillageDropdown(false);
  };

  // Filter functions
  const filteredMandals = mandals.filter(mandal =>
    mandal.name.toLowerCase().includes(mandalSearch.toLowerCase())
  );

  const filteredVillages = villages.filter(village =>
    village.toLowerCase().includes(villageSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#6B7280'
      }}>
        <div style={{ marginRight: '8px' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#FEE2E2',
        borderRadius: '8px',
        color: '#DC2626',
        fontSize: '14px'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <MapPin size={18} color="#3B82F6" />
        <span style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1F2937'
        }}>
          Select Your Location
        </span>
      </div>

      {/* District Selection - Inline Buttons with Selection Display */}
      {currentLevel === 'district' && (
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Which district are you from?
          </h4>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* District Buttons */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {districts.map((district) => (
                <button
                  key={district.id}
                  onClick={() => handleDistrictSelect(district)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: selectedLocation.district?.id === district.id ? '#10B981' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedLocation.district?.id !== district.id) {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLocation.district?.id === district.id) {
                      e.currentTarget.style.backgroundColor = '#10B981';
                    } else {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                    }
                  }}
                >
                  • {district.name}
                </button>
              ))}
            </div>
            
            {/* Selected District Display */}
            {selectedLocation.district && (
              <div style={{
                minWidth: '120px',
                padding: '12px',
                backgroundColor: '#F0FDF4',
                border: '2px solid #10B981',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#059669',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Selected:
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#047857',
                  fontWeight: '500'
                }}>
                  {selectedLocation.district.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assembly Selection - Inline Buttons with Selection Display */}
      {currentLevel === 'assembly' && selectedLocation.district && (
        <div>
          {/* Selected District Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#EFF6FF',
            borderRadius: '6px',
            border: '1px solid #DBEAFE'
          }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Selected:</span>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {selectedLocation.district.name}
            </span>
          </div>
          
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Which assembly constituency in {selectedLocation.district.name.replace(' District', '')}?
          </h4>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Assembly Buttons */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assemblies.map((assembly) => (
                <button
                  key={assembly.id}
                  onClick={() => handleAssemblySelect(assembly)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: selectedLocation.assembly?.id === assembly.id ? '#10B981' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedLocation.assembly?.id !== assembly.id) {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLocation.assembly?.id === assembly.id) {
                      e.currentTarget.style.backgroundColor = '#10B981';
                    } else {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                    }
                  }}
                >
                  • {assembly.name}
                </button>
              ))}
            </div>
            
            {/* Selected Assembly Display */}
            {selectedLocation.assembly && (
              <div style={{
                minWidth: '120px',
                padding: '12px',
                backgroundColor: '#F0FDF4',
                border: '2px solid #10B981',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#059669',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Selected:
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#047857',
                  fontWeight: '500'
                }}>
                  {selectedLocation.assembly.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandal Selection - Dropdown */}
      {currentLevel === 'mandal' && selectedLocation.assembly && (
        <div>
          {/* Selected Path Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#EFF6FF',
            borderRadius: '6px',
            border: '1px solid #DBEAFE',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Selected:</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'white',
              backgroundColor: '#3B82F6',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {selectedLocation.district?.name}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>→</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'white',
              backgroundColor: '#10B981',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {selectedLocation.assembly.name}
            </span>
          </div>
          
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Which mandal/area in {selectedLocation.assembly.name.replace(' Assembly', '')}?
            {mandals.length > 0 && (
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '400' }}>
                {' '}({mandals.length} options available)
              </span>
            )}
          </h4>
          <div style={{ position: 'relative' }}>
            {/* Show loading state if mandals are being fetched */}
            {loading && mandals.length === 0 ? (
              <div style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#F9FAFB',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center'
              }}>
                Loading mandals...
              </div>
            ) : mandals.length === 0 ? (
              <div style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                border: '2px solid #FECACA',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#DC2626',
                textAlign: 'center'
              }}>
                No mandals found. Please try selecting assembly again.
              </div>
            ) : (
              <button
                onClick={() => setShowMandalDropdown(!showMandalDropdown)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <span style={{ color: selectedLocation.mandal ? '#1F2937' : '#9CA3AF' }}>
                  {selectedLocation.mandal ? selectedLocation.mandal.name : 'Select mandal/area...'}
                </span>
                <ChevronDown size={16} color="#6B7280" />
              </button>
            )}

            {showMandalDropdown && mandals.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '200px',
                overflow: 'hidden'
              }}>
                {/* Search Input */}
                <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#9CA3AF" style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }} />
                    <input
                      type="text"
                      placeholder="Search mandals..."
                      value={mandalSearch}
                      onChange={(e) => setMandalSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Options */}
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {filteredMandals.map((mandal) => (
                    <button
                      key={mandal.id}
                      onClick={() => handleMandalSelect(mandal)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {mandal.name}
                    </button>
                  ))}
                  {filteredMandals.length === 0 && (
                    <div style={{
                      padding: '12px 16px',
                      color: '#9CA3AF',
                      fontSize: '14px'
                    }}>
                      No mandals found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Village Selection - Dropdown */}
      {currentLevel === 'village' && selectedLocation.mandal && (
        <div>
          {/* Selected Path Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#EFF6FF',
            borderRadius: '6px',
            border: '1px solid #DBEAFE',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Selected:</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '500', 
              color: 'white',
              backgroundColor: '#3B82F6',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>
              {selectedLocation.district?.name}
            </span>
            <span style={{ fontSize: '10px', color: '#6B7280' }}>→</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '500', 
              color: 'white',
              backgroundColor: '#10B981',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>
              {selectedLocation.assembly?.name}
            </span>
            <span style={{ fontSize: '10px', color: '#6B7280' }}>→</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '500', 
              color: 'white',
              backgroundColor: '#F59E0B',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>
              {selectedLocation.mandal.name}
            </span>
          </div>
          
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Which village in {selectedLocation.mandal.name}?
            {villages.length > 0 && (
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '400' }}>
                {' '}({villages.length} options available)
              </span>
            )}
          </h4>
          <div style={{ position: 'relative' }}>
            {/* Show loading state if villages are being fetched */}
            {loading && villages.length === 0 ? (
              <div style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#F9FAFB',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center'
              }}>
                Loading villages...
              </div>
            ) : villages.length === 0 ? (
              <div style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                border: '2px solid #FECACA',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#DC2626',
                textAlign: 'center'
              }}>
                No villages found. Please try selecting mandal again.
              </div>
            ) : (
              <button
                onClick={() => setShowVillageDropdown(!showVillageDropdown)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <span style={{ color: selectedLocation.village ? '#1F2937' : '#9CA3AF' }}>
                  {selectedLocation.village || 'Select village...'}
                </span>
                <ChevronDown size={16} color="#6B7280" />
              </button>
            )}

            {showVillageDropdown && villages.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '200px',
                overflow: 'hidden'
              }}>
                {/* Search Input */}
                <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#9CA3AF" style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }} />
                    <input
                      type="text"
                      placeholder="Search villages..."
                      value={villageSearch}
                      onChange={(e) => setVillageSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Options */}
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {filteredVillages.map((village) => (
                    <button
                      key={village}
                      onClick={() => handleVillageSelect(village)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 200ms ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {village}
                    </button>
                  ))}
                  {filteredVillages.length === 0 && (
                    <div style={{
                      padding: '12px 16px',
                      color: '#9CA3AF',
                      fontSize: '14px'
                    }}>
                      No villages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;