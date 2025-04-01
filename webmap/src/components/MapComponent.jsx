// src/components/MapComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './Legend';
import centroid from '@turf/centroid';
import 'mapbox-gl/dist/mapbox-gl.css';
import colors from '../layerColors';

// Use your Mapbox token from environment variables.
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({
  countryCode,
  layerVisible,
  toggleLayer,
  activeCaseTypes,
  toggleCaseType,
  impactLayerVisible,
  toggleImpactLayer,
  onDataLoaded,
  onGeojsonError,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [caseCounts, setCaseCounts] = useState({});
  const [adm2Center, setAdm2Center] = useState(null);

  // Reset data when a new country is selected.
  useEffect(() => {
    setSelectedFeature(null);
    setCaseCounts({});
    setAdm2Center(null);
  }, [countryCode]);

  // Helper: returns the corresponding color for a given case type.
  const getCaseColor = (caseType) => {
    switch (true) {
      case caseType === 'Case 1: IR = ADM2' || caseType === 'Case 1':
        return colors.case1;
      case caseType === 'Case 2a: IR ⊃ ADM2 (1 ADM1)' || caseType === 'Case 2: IR covers multiple ADM2s':
        return colors.case2a;
      case caseType === 'Case 2b: IR ⊃ ADM2 (multi ADM1)':
        return colors.case2b;
      case caseType === 'Case 3a: ADM2 ⊃ IR (1 ADM1)' || caseType === 'Case 3: ADM2 = multiple IRs':
        return colors.case3a;
      case caseType === 'Case 3b: ADM2 ⊃ IR (multi ADM1)':
        return colors.case3b;
      case caseType === 'Case 4: ADM2 with no IR assigned':
        return colors.case4;
      default:
        return colors.defaultCase;
    }
  };
  

  // Expression for ADM2 fill color.
  const getFillColorExpression = () => {
    return [
      'match',
      ['get', 'case_type'],
      'Case 1: IR = ADM2', colors.case1,
      'Case 1', colors.case1,
      'Case 2a: IR ⊃ ADM2 (1 ADM1)', colors.case2a,
      'Case 2: IR covers multiple ADM2s', colors.case2a,
      'Case 2b: IR ⊃ ADM2 (multi ADM1)', colors.case2b,
      'Case 3a: ADM2 ⊃ IR (1 ADM1)', colors.case3a,
      'Case 3: ADM2 = multiple IRs', colors.case3a,
      'Case 3b: ADM2 ⊃ IR (multi ADM1)', colors.case3b,
      'Case 4: ADM2 with no IR assigned', colors.case4,
      colors.defaultCase,
    ];
  };
  
  
  // Initialize the map.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 0],
        zoom: 1.5,
        projection: 'globe',
      });
  
      mapRef.current.addControl(new mapboxgl.NavigationControl());
      mapRef.current.on('style.load', () => {
        // Hide unwanted admin layers – keep only country borders.
        const layersToHide = [
          'admin-1-boundary',
          'admin-0-boundary-disputed',
          'admin-0-boundary-bg'
        ];
        layersToHide.forEach(layerId => {
          if (mapRef.current.getLayer(layerId)) {
            mapRef.current.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      });
    }
  }, []);

  // When ADM2 layer is turned off, disable all case types.
  useEffect(() => {
    if (!layerVisible) {
      Object.keys(activeCaseTypes).forEach(caseType => {
        if (activeCaseTypes[caseType]) {
          toggleCaseType(caseType);
        }
      });
    }
  }, [layerVisible, activeCaseTypes, toggleCaseType]);

  // Load ADM2 GeoJSON and set up ADM2 layers.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!countryCode) {
    //   console.log('No country selected.');
      return;
    }
    console.log('ADM2 - Country selected:', countryCode);
    const loadADM2GeoJSON = async () => {
      try {
        const url = `https://huggingface.co/datasets/c1587s/adm2-geojson-dataset/resolve/main/${countryCode}_adm2.geojson`;
        console.log('Fetching ADM2 GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Error fetching ADM2 GeoJSON:', response.status);
          if (onGeojsonError)
            onGeojsonError('GeoJSON not found for the selected country.');
          return;
        }
        const data = await response.json();
        console.log('ADM2 GeoJSON loaded:', data);
        if (onGeojsonError) onGeojsonError('');

        const counts = data.features.reduce((acc, feature) => {
          const ct = feature.properties.case_type;
          acc[ct] = (acc[ct] || 0) + 1;
          return acc;
        }, {});
        setCaseCounts(counts);
        console.log('Case types found in ADM2 GeoJSON:', Object.entries(counts));

        const centerFeature = centroid(data);
        const computedCenter = centerFeature.geometry.coordinates;
        setAdm2Center(computedCenter);

        if (map.getSource('adm2-regions')) {
          map.getSource('adm2-regions').setData(data);
        } else {
          map.addSource('adm2-regions', { type: 'geojson', data });
          map.addLayer({
            id: 'adm2-fill',
            type: 'fill',
            source: 'adm2-regions',
            layout: { visibility: layerVisible ? 'visible' : 'none' },
            paint: {
              'fill-color': getFillColorExpression(),
              'fill-opacity': 1, // full opacity
            },
          });
          map.addLayer({
            id: 'adm2-outline',
            type: 'line',
            source: 'adm2-regions',
            layout: { visibility: layerVisible ? 'visible' : 'none' },
            paint: {
              'line-color': colors.adm2Outline,
              'line-width': 2,
            },
          });
        }

        const activeTypes = Object.keys(activeCaseTypes).filter((key) => activeCaseTypes[key]);
        const filterExpression = activeTypes.length
          ? ['in', ['get', 'case_type'], ['literal', activeTypes]]
          : ['==', ['get', 'case_type'], ''];
        map.setFilter('adm2-fill', filterExpression);

        const targetZoom = (['USA', 'CHN', 'IND'].includes(countryCode)) ? 4 : 5;
        // console.log('Computed ADM2 center:', computedCenter, 'Target zoom:', targetZoom);
        map.once('idle', () => {
        //   console.log('Flying to ADM2 center...');
          map.flyTo({
            center: computedCenter,
            zoom: targetZoom,
            speed: 1.2,
            curve: 1.42,
            easing: (t) => t,
          });
          if (onDataLoaded) onDataLoaded();
        });

        const handleADM2Click = (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            if (
              selectedFeature &&
              selectedFeature.properties.adm2_id === feature.properties.adm2_id
            ) {
              setSelectedFeature(null);
            } else {
              setSelectedFeature(feature);
            }
          }
        };

        if (map.getLayer('adm2-fill')) {
          map.off('click', 'adm2-fill', handleADM2Click);
          map.on('click', 'adm2-fill', handleADM2Click);
        }
      } catch (error) {
        console.error('Error loading ADM2 GeoJSON:', error);
        if (onGeojsonError)
          onGeojsonError('GeoJSON not found for the selected country.');
      }
    };
    loadADM2GeoJSON();
    return () => {
      if (map && map.getLayer('adm2-fill')) {
        map.off('click', 'adm2-fill');
      }
    };
  }, [countryCode, layerVisible, activeCaseTypes, onDataLoaded, onGeojsonError]);

  // Load Impact Regions (IR) GeoJSON and set up IR layers.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!countryCode) {
    //   console.log('No country selected for Impact Regions.');
      return;
    }
    if (!impactLayerVisible) {
      if (map.getLayer('impact-fill')) map.setLayoutProperty('impact-fill', 'visibility', 'none');
      if (map.getLayer('impact-outline')) map.setLayoutProperty('impact-outline', 'visibility', 'none');
      return;
    }
    // console.log('Loading Impact Regions for:', countryCode);
    const loadImpactGeoJSON = async () => {
      try {
        const url = `https://huggingface.co/datasets/c1587s/adm2-geojson-dataset/resolve/main/${countryCode}_ir.geojson`;
        // console.log('Fetching Impact Regions GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Error fetching Impact Regions GeoJSON:', response.status);
          return;
        }
        const data = await response.json();
        // console.log('Impact Regions GeoJSON loaded:', data);

        if (map.getSource('impact-regions')) {
          map.getSource('impact-regions').setData(data);
        } else {
          map.addSource('impact-regions', { type: 'geojson', data });
          // Add an invisible fill layer for hover detection.
          map.addLayer({
            id: 'impact-fill',
            type: 'fill',
            source: 'impact-regions',
            layout: { visibility: impactLayerVisible ? 'visible' : 'none' },
            paint: {
              'fill-opacity': 0, // invisible but captures events
            },
          });
          // Add an outline layer with the desired styling.
          map.addLayer({
            id: 'impact-outline',
            type: 'line',
            source: 'impact-regions',
            layout: { visibility: impactLayerVisible ? 'visible' : 'none' },
            paint: {
              'line-color': colors.impactFill, // cyan
              'line-width': 2,
              'line-dasharray': [1],
            },
          });
        }
        // Move the Impact Regions layers above ADM2.
        map.moveLayer('impact-fill');
        map.moveLayer('impact-outline');
      } catch (error) {
        console.error('Error loading Impact Regions GeoJSON:', error);
      }
    };
    loadImpactGeoJSON();
  }, [countryCode, impactLayerVisible]);

  // Update ADM2 layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const vis = layerVisible ? 'visible' : 'none';
      if (map.getLayer('adm2-fill')) map.setLayoutProperty('adm2-fill', 'visibility', vis);
      if (map.getLayer('adm2-outline')) map.setLayoutProperty('adm2-outline', 'visibility', vis);
    }
  }, [layerVisible]);

  // Update Impact Regions layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const vis = impactLayerVisible ? 'visible' : 'none';
      if (map.getLayer('impact-fill')) map.setLayoutProperty('impact-fill', 'visibility', vis);
      if (map.getLayer('impact-outline')) map.setLayoutProperty('impact-outline', 'visibility', vis);
    }
  }, [impactLayerVisible]);

  // Update ADM2 filter when activeCaseTypes changes.
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer('adm2-fill')) {
      const activeTypes = Object.keys(activeCaseTypes).filter((key) => activeCaseTypes[key]);
      const filterExpression = activeTypes.length
        ? ['in', ['get', 'case_type'], ['literal', activeTypes]]
        : ['==', ['get', 'case_type'], ''];
      map.setFilter('adm2-fill', filterExpression);
    }
  }, [activeCaseTypes]);

  // Impact Regions hover behavior – attach to the invisible fill layer.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!impactLayerVisible) return;
    let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
    const handleIRMouseMove = (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const tooltipHTML = `<div style="background: rgba(0,0,0,0.5); padding: 5px; border-radius: 3px; color: #fff; font-size:12px;">
             <strong>Impact Region</strong><br/>
             HierID: ${feature.properties.hierid || 'N/A'}<br/>
             GADM ID: ${feature.properties.gadmid || 'N/A'}<br/>
             ISO: ${feature.properties.ISO || 'N/A'}
           </div>`;
        popup.setLngLat(e.lngLat).setHTML(tooltipHTML).addTo(map);
      }
    };
    const handleIRMouseLeave = () => {
      popup.remove();
    };
    map.on('mousemove', 'impact-fill', handleIRMouseMove);
    map.on('mouseleave', 'impact-fill', handleIRMouseLeave);
    return () => {
      map.off('mousemove', 'impact-fill', handleIRMouseMove);
      map.off('mouseleave', 'impact-fill', handleIRMouseLeave);
      popup.remove();
    };
  }, [impactLayerVisible]);

  // Reset View button.
  const resetView = () => {
    if (!mapRef.current || !adm2Center) return;
    const targetZoom = (['USA', 'CHN', 'IND'].includes(countryCode)) ? 4 : 5;
    mapRef.current.flyTo({
      center: adm2Center,
      zoom: targetZoom,
      speed: 1.2,
      curve: 1.42,
      easing: (t) => t,
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {adm2Center && (
        <button 
          onClick={resetView} 
          style={{
            position: 'absolute',
            top: '100px',
            right: '10px',
            padding: '8px',
            background: 'transparent',
            border: '1px solid grey',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <img 
            src="/reset_black.png" 
            alt="Reset View" 
            style={{ width: '13px' }}
          />
        </button>
      )}
      {selectedFeature && (
        <div className="feature-info">
          <button className="close-btn" onClick={() => setSelectedFeature(null)}>X</button>
          <h4>Feature Details</h4>
          <p><strong>ADM1:</strong> {selectedFeature.properties.NAME_1}</p>
          <p><strong>ADM2:</strong> {selectedFeature.properties.NAME_2}</p>
          <p>
            <strong>Case Type:</strong>{' '}
            <span style={{ color: getCaseColor(selectedFeature.properties.case_type) }}>
              {selectedFeature.properties.case_type}
            </span>
          </p>
        </div>
      )}
      <Legend
        activeCaseTypes={activeCaseTypes}
        toggleCaseType={toggleCaseType}
        layerVisible={layerVisible}
        toggleLayer={toggleLayer}
        caseCounts={caseCounts}
        impactLayerVisible={impactLayerVisible}
        toggleImpactLayer={toggleImpactLayer}
      />
    </div>
  );
};

export default MapComponent;
