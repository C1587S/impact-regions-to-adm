// src/components/Legend.jsx
import React from 'react';
import './Legend.css';
import colors from '../layerColors';

const CASE_TYPE_GROUPS = {
  'Case 1: IR = ADM2': ['Case 1: IR = ADM2', 'Case 1'],
  'Case 2a: IR ⊃ ADM2 (1 ADM1)': ['Case 2a: IR ⊃ ADM2 (1 ADM1)', 'Case 2: IR covers multiple ADM2s'],
  'Case 2b: IR ⊃ ADM2 (multi ADM1)': ['Case 2b: IR ⊃ ADM2 (multi ADM1)'],
  'Case 3a: ADM2 ⊃ IR (1 ADM1)': ['Case 3a: ADM2 ⊃ IR (1 ADM1)', 'Case 3: ADM2 = multiple IRs'],
  'Case 3b: ADM2 ⊃ IR (multi ADM1)': ['Case 3b: ADM2 ⊃ IR (multi ADM1)'],
  'Case 4: ADM2 with no IR assigned': ['Case 4: ADM2 with no IR assigned'],
};

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
    <div className="legend" style={{ width: '250px', padding: '10px' }}>
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

      {layerVisible && (
        <div className="case-checkboxes" style={{ marginLeft: '15px', marginBottom: '6px' }}>
          {Object.entries(CASE_TYPE_GROUPS).map(([canonicalLabel, synonyms]) => {
            const isChecked = synonyms.some(label => activeCaseTypes[label]);
            const totalCount = synonyms.reduce(
              (sum, label) => sum + (caseCounts[label] || 0),
              0
            );

            const color =
              canonicalLabel.includes('Case 1') ? colors.case1 :
              canonicalLabel.includes('Case 2a') ? colors.case2a :
              canonicalLabel.includes('Case 2b') ? colors.case2b :
              canonicalLabel.includes('Case 3a') ? colors.case3a :
              canonicalLabel.includes('Case 3b') ? colors.case3b :
              canonicalLabel.includes('Case 4') ? colors.case4 :
              colors.defaultCase;

            return (
              <label key={canonicalLabel} className="legend-item" style={{ display: 'block', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    synonyms.forEach(label => toggleCaseType(label));
                  }}
                />
                <span
                  className="color-box"
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    marginRight: '6px',
                    backgroundColor: color,
                  }}
                ></span>
                {canonicalLabel} {totalCount > 0 ? `(${totalCount})` : ''}
              </label>
            );
          })}
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
