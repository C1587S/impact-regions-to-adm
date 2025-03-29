// src/App.jsx
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CountrySelector from './components/CountrySelector';
import MapComponent from './components/MapComponent';
import './App.css';

function App() {
  // Country selection states.
  const [pendingCountry, setPendingCountry] = useState('');
  const [confirmedCountry, setConfirmedCountry] = useState('');
  const [isCountryLoading, setIsCountryLoading] = useState(false);

  // ADM2 layer toggle state.
  const [adm2LayerVisible, setAdm2LayerVisible] = useState(true);

  // Impact Regions (IR) layer toggle state.
  const [impactLayerVisible, setImpactLayerVisible] = useState(true);

  // Case type filter state.
  const [activeCaseTypes, setActiveCaseTypes] = useState({
    'Case 1: IR = ADM2': true,
    'Case 2: IR covers multiple ADM2s': true,
    'Case 3: ADM2 = multiple IRs': true,
  });

  // When submit is clicked, store the pending country and show loader.
  const handleCountrySubmit = () => {
    setIsCountryLoading(true);
    setConfirmedCountry(pendingCountry);
  };

  // Toggle ADM2 layer visibility.
  const toggleAdm2Layer = () => {
    setAdm2LayerVisible(prev => !prev);
  };

  // Toggle Impact Regions layer visibility.
  const toggleImpactLayer = () => {
    setImpactLayerVisible(prev => !prev);
  };

  // Toggle a specific case type filter.
  const toggleCaseType = (caseType) => {
    setActiveCaseTypes(prev => ({
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
          {/* Optionally, you could also add small checkboxes here for ADM2 and IR toggles.
              For a minimal design, you might choose to integrate these into your Legend component instead. */}
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
          />
        </div>
      </div>
    </div>
  );
}

export default App;
