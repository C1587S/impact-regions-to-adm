// src/App.jsx
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CountrySelector from './components/CountrySelector';
import MapComponent from './components/MapComponent';
import './App.css';

function App() {
  const [pendingCountry, setPendingCountry] = useState('');
  const [confirmedCountry, setConfirmedCountry] = useState('');
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [adm2LayerVisible, setAdm2LayerVisible] = useState(true);
  const [impactLayerVisible, setImpactLayerVisible] = useState(true);
  const [activeCaseTypes, setActiveCaseTypes] = useState({
    'Case 1: IR = ADM2': true,
    'Case 2: IR covers multiple ADM2s': true,
    'Case 3: ADM2 = multiple IRs': true,
  });
  const [geojsonError, setGeojsonError] = useState('');

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

  const toggleCaseType = (caseType) => {
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
            onGeojsonError={(msg) => {
              setIsCountryLoading(false);
              setGeojsonError(msg);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
