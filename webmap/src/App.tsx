// src/App.jsx
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CountrySelector from './components/CountrySelector';
import MapComponent from './components/MapComponent';
import './App.css';

function App() {
  const [pendingCountry, setPendingCountry] = useState('');
  const [confirmedCountry, setConfirmedCountry] = useState('');
  const [layerVisible, setLayerVisible] = useState(true);
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [activeCaseTypes, setActiveCaseTypes] = useState({
    'Case 1: IR = ADM2': true,
    'Case 2: IR covers multiple ADM2s': true,
    'Case 3: ADM2 = multiple IRs': true,
  });

  const handleCountrySubmit = () => {
    // When the submit button is clicked, show the loader.
    setIsCountryLoading(true);
    setConfirmedCountry(pendingCountry);
  };

  const toggleLayerVisibility = () => {
    setLayerVisible(prev => !prev);
  };

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
        </div>
        <div className="map-container">
          <MapComponent 
            countryCode={confirmedCountry} 
            layerVisible={layerVisible} 
            toggleLayer={toggleLayerVisibility}
            activeCaseTypes={activeCaseTypes}
            toggleCaseType={toggleCaseType}
            onDataLoaded={() => setIsCountryLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
