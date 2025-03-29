// src/components/LayerControl.jsx
import React from 'react';
import './LayerControl.css';

const LayerControl = ({ layerVisible, toggleLayer }) => {
  return (
    <div className="layer-control">
      <label>
        <input
          type="checkbox"
          checked={layerVisible}
          onChange={toggleLayer}
        />
        In-house Generated ADM2 Regions
      </label>
    </div>
  );
};

export default LayerControl;
