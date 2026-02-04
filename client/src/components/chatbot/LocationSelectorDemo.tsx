import React, { useState } from 'react';
import { LocationSelector } from './LocationSelector';

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

/**
 * Demo component showing how to use LocationSelector
 * This demonstrates the cascading location selection flow
 */
export const LocationSelectorDemo: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<'district' | 'assembly' | 'mandal' | 'village'>('district');
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleLocationSelected = (location: LocationData) => {
    setSelectedLocation(location);
    
    // Determine next level based on what's been selected
    if (!location.district) {
      setCurrentLevel('district');
    } else if (!location.assembly) {
      setCurrentLevel('assembly');
    } else if (!location.mandal) {
      setCurrentLevel('mandal');
    } else if (!location.village) {
      setCurrentLevel('village');
    } else {
      // All levels complete
      setIsComplete(true);
    }
  };

  const resetSelection = () => {
    setSelectedLocation({});
    setCurrentLevel('district');
    setIsComplete(false);
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Location Selection Demo
      </h2>

      {!isComplete ? (
        <LocationSelector
          currentLevel={currentLevel}
          onLocationSelected={handleLocationSelected}
        />
      ) : (
        <div>
          <div style={{
            padding: '16px',
            backgroundColor: '#D1FAE5',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#065F46',
              marginBottom: '8px'
            }}>
              ✅ Location Selected Successfully!
            </h3>
            <div style={{ fontSize: '14px', color: '#047857' }}>
              <div><strong>District:</strong> {selectedLocation.district?.name}</div>
              <div><strong>Assembly:</strong> {selectedLocation.assembly?.name}</div>
              <div><strong>Mandal:</strong> {selectedLocation.mandal?.name}</div>
              <div><strong>Village:</strong> {selectedLocation.village}</div>
            </div>
          </div>

          <button
            onClick={resetSelection}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Select Different Location
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#F9FAFB',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        <div><strong>Current Level:</strong> {currentLevel}</div>
        <div><strong>Selected:</strong> {JSON.stringify(selectedLocation, null, 2)}</div>
      </div>
    </div>
  );
};

export default LocationSelectorDemo;