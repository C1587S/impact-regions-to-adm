// src/App.tsx
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CountrySelector from './components/CountrySelector';
import MapComponent from './components/MapComponent';
import './App.css';

const App: React.FC = () => {
  const [pendingCountry, setPendingCountry] = useState<string>('');
  const [confirmedCountry, setConfirmedCountry] = useState<string>('');
  const [isCountryLoading, setIsCountryLoading] = useState<boolean>(false);
  const [adm2LayerVisible, setAdm2LayerVisible] = useState<boolean>(true);
  const [impactLayerVisible, setImpactLayerVisible] = useState<boolean>(true);
  const [activeCaseTypes, setActiveCaseTypes] = useState<{ [key: string]: boolean }>({
    'Case 1: IR = ADM2': true,
    'Case 2: IR covers multiple ADM2s': true,
    'Case 3: ADM2 = multiple IRs': true,
  });
  const [geojsonError, setGeojsonError] = useState<string>('');

  const handleCountrySubmit = () => {
    setIsCountryLoading(true);
    setConfirmedCountry(pendingCountry);
    setGeojsonError('');
  };

  const toggleAdm2Layer = () => {
    setAdm2LayerVisible((prev) => !prev);
  };

  const toggleImpactLayer = () => {
    setImpactLayerVisible((prev) => !prev);
  };

  const toggleCaseType = (caseType: string) => {
    setActiveCaseTypes((prev) => ({
      ...prev,
      [caseType]: !prev[caseType],
    }));
  };

  return (
    <div className="app-container">
      <Navigation currentTab="Map" />
      <div className="main-content">
        <div className="controls">
          <CountrySelector 
            pendingCountry={pendingCountry}
            setPendingCountry={setPendingCountry}
            onSubmit={handleCountrySubmit}
            isLoading={isCountryLoading}
          />
          {geojsonError && (
            <div className="geojson-error">
              {geojsonError}
            </div>
          )}
        </div>
        <div className="map-container">
          <MapComponent 
            countryCode={confirmedCountry}
            layerVisible={adm2LayerVisible}
            toggleLayer={toggleAdm2Layer}
            activeCaseTypes={activeCaseTypes}
            toggleCaseType={toggleCaseType}
            impactLayerVisible={impactLayerVisible}
            toggleImpactLayer={toggleImpactLayer}
            onDataLoaded={() => setIsCountryLoading(false)}
            onGeojsonError={(msg: string) => {
              setIsCountryLoading(false);
              setGeojsonError(msg);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
