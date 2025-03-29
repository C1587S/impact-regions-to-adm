// src/components/Legend.jsx
import React from 'react';
import './Legend.css';

const Legend = ({
  activeCaseTypes,
  toggleCaseType,
  layerVisible,
  toggleLayer,
  caseCounts,
  impactLayerVisible,
  toggleImpactLayer,
}) => {
  return (
    <div className="legend">
      <h4>In-house Generated ADM2</h4>
      <div className="layer-toggle">
        <label>
          <input
            type="checkbox"
            checked={layerVisible}
            onChange={toggleLayer}
          />
          Show ADM2 Layer
        </label>
      </div>
      <div className="layer-toggle">
        <label>
          <input
            type="checkbox"
            checked={impactLayerVisible}
            onChange={toggleImpactLayer}
          />
          Show Impact Regions
        </label>
      </div>
      <div className="case-filters">
        {Object.keys(activeCaseTypes).map((caseType) => (
          <label key={caseType} className="legend-item">
            <input
              type="checkbox"
              checked={activeCaseTypes[caseType]}
              onChange={() => toggleCaseType(caseType)}
            />
            <span
              className="color-box"
              style={{
                backgroundColor:
                  caseType === 'Case 1: IR = ADM2'
                    ? '#2E8B57'
                    : caseType === 'Case 2: IR covers multiple ADM2s'
                    ? '#FF8C00'
                    : caseType === 'Case 3: ADM2 = multiple IRs'
                    ? '#8B0000'
                    : '#CCCCCC',
              }}
            ></span>
            {caseType}{' '}
            {caseCounts && caseCounts[caseType] !== undefined
              ? `(${caseCounts[caseType]})`
              : ''}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Legend;
