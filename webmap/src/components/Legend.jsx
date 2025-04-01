// src/components/Legend.jsx
import React from 'react';
import './Legend.css';
import colors from '../layerColors';

const Legend = ({
  activeCaseTypes,
  toggleCaseType,
  layerVisible,
  toggleLayer,
  caseCounts,
  impactLayerVisible,
  toggleImpactLayer,
}) => {
  const allCaseTypes = Object.keys(activeCaseTypes);

  return (
    <div className="legend" style={{ width: '250px', padding: '10px' }}>
      {/* No title */}
      <div className="layer-toggle" style={{ marginBottom: '6px' }}>
        <label>
          <input
            type="checkbox"
            checked={layerVisible}
            onChange={toggleLayer}
          />
          Show ADM2 Layer
        </label>
      </div>
      {/* Case type checkboxes indented under ADM2 toggle */}
      {layerVisible && (
        <div className="case-checkboxes" style={{ marginLeft: '15px', marginBottom: '6px' }}>
          {allCaseTypes.map((caseType) => (
            <label key={caseType} className="legend-item" style={{ display: 'block', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={activeCaseTypes[caseType]}
                onChange={() => toggleCaseType(caseType)}
              />
              <span
                className="color-box"
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  marginRight: '6px',
                  backgroundColor:
                  caseType === 'Case 1: IR = ADM2' || caseType === 'Case 1' ? colors.case1 :
                  caseType === 'Case 2a: IR ⊃ ADM2 (1 ADM1)' || caseType === 'Case 2: IR covers multiple ADM2s' ? colors.case2a :
                  caseType === 'Case 2b: IR ⊃ ADM2 (multi ADM1)' ? colors.case2b :
                  caseType === 'Case 3a: ADM2 ⊃ IR (1 ADM1)' || caseType === 'Case 3: ADM2 = multiple IRs' ? colors.case3a :
                  caseType === 'Case 3b: ADM2 ⊃ IR (multi ADM1)' ? colors.case3b :
                  caseType === 'Case 4: ADM2 with no IR assigned' ? colors.case4 :
                  colors.defaultCase                  
                }}
              ></span>
              {caseType} {caseCounts[caseType] !== undefined ? `(${caseCounts[caseType]})` : ''}
            </label>
          ))}
        </div>
      )}
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
    </div>
  );
};

export default Legend;
