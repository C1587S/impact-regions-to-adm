// src/App.tsx
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CountrySelector from './components/CountrySelector';
import MapComponent from './components/MapComponent';
import Documentation from './components/Documentation';
import './App.css';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'Map' | 'Documentation'>('Map');
  const [pendingCountry, setPendingCountry] = useState<string>('');
  const [confirmedCountry, setConfirmedCountry] = useState<string>('');
  const [isCountryLoading, setIsCountryLoading] = useState<boolean>(false);
  const [adm2LayerVisible, setAdm2LayerVisible] = useState<boolean>(true);
  const [impactLayerVisible, setImpactLayerVisible] = useState<boolean>(false);
  const [activeCaseTypes, setActiveCaseTypes] = useState<{ [key: string]: boolean }>({
    'Case 1: IR = ADM2': true,
    'Case 1': true,
    'Case 2a: IR ⊃ ADM2 (1 ADM1)': true,
    'Case 2: IR covers multiple ADM2s': true,
    'Case 2b: IR ⊃ ADM2 (multi ADM1)': true,
    'Case 3a: ADM2 ⊃ IR (1 ADM1)': true,
    'Case 3: ADM2 = multiple IRs': true,
    'Case 3b: ADM2 ⊃ IR (multi ADM1)': true,
    'Case 4: ADM2 with no IR assigned': true,
  });

  const [geojsonError, setGeojsonError] = useState<string>('');

  const handleCountrySubmit = () => {
    setIsCountryLoading(true);
    setConfirmedCountry(pendingCountry);
    setGeojsonError('');
    setImpactLayerVisible(false);
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
      <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {currentTab === 'Map' && (
        <div className="main-content">
          <div className="controls">
            <CountrySelector
              pendingCountry={pendingCountry}
              setPendingCountry={setPendingCountry}
              onSubmit={handleCountrySubmit}
              isLoading={isCountryLoading}
            />
            {geojsonError && <div className="geojson-error">{geojsonError}</div>}
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
      )}

      {currentTab === 'Documentation' && <Documentation />}
    </div>
  );
};

export default App;
