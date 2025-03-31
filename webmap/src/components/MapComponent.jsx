// src/components/MapComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './Legend';
import centroid from '@turf/centroid';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  problematicLayerVisible,
  toggleProblematicLayer, // provided in case you need to toggle from the map
  onDataLoaded,
  onGeojsonError,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [caseCounts, setCaseCounts] = useState({});
  const [adm2Center, setAdm2Center] = useState(null);
  const [problematicCount, setProblematicCount] = useState(0);

  // Helper: returns the corresponding color for an ADM2 case type.
  const getCaseColor = (caseType) => {
    switch (caseType) {
      case 'Case 1: IR = ADM2':
        return '#88c0d0';
      case 'Case 2: IR covers multiple ADM2s':
        return '#FF8C00';
      case 'Case 3: ADM2 = multiple IRs':
        return '#8B0000';
      default:
        return '#CCCCCC';
    }
  };

  // Expression for ADM2 fill color.
  const getFillColorExpression = () => {
    return [
      'match',
      ['get', 'case_type'],
      'Case 1: IR = ADM2', '#88c0d0',
      'Case 2: IR covers multiple ADM2s', '#FF8C00',
      'Case 3: ADM2 = multiple IRs', '#8B0000',
      '#CCCCCC',
    ];
  };

  // Initialize the map.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [0, 0],
        zoom: 1.5,
        projection: 'globe',
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl());
      mapRef.current.on('style.load', () => {
        const map = mapRef.current;
        const layersToHide = [
          'admin-0-boundary',
          'admin-1-boundary',
          'admin-0-boundary-bg',
          'admin-1-boundary-bg',
        ];
        layersToHide.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      });
    }
  }, []);

  // Load ADM2 GeoJSON and set up ADM2 layers.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!countryCode) {
      console.log('No country selected.');
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
              'fill-opacity': 0.7,
            },
          });
          map.addLayer({
            id: 'adm2-outline',
            type: 'line',
            source: 'adm2-regions',
            layout: { visibility: layerVisible ? 'visible' : 'none' },
            paint: {
              'line-color': '#000000',
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
        console.log('Computed ADM2 center:', computedCenter, 'Target zoom:', targetZoom);
        map.once('idle', () => {
          console.log('Flying to ADM2 center...');
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
      console.log('No country selected for Impact Regions.');
      return;
    }
    if (!impactLayerVisible) {
      if (map.getLayer('impact-fill')) map.setLayoutProperty('impact-fill', 'visibility', 'none');
      if (map.getLayer('impact-outline')) map.setLayoutProperty('impact-outline', 'visibility', 'none');
      if (map.getLayer('impact-hover')) map.setLayoutProperty('impact-hover', 'visibility', 'none');
      return;
    }
    console.log('Loading Impact Regions for:', countryCode);

    const loadImpactGeoJSON = async () => {
      try {
        const url = `https://huggingface.co/datasets/c1587s/adm2-geojson-dataset/resolve/main/${countryCode}_ir.geojson`;
        console.log('Fetching Impact Regions GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Error fetching Impact Regions GeoJSON:', response.status);
          return;
        }
        const data = await response.json();
        console.log('Impact Regions GeoJSON loaded:', data);

        if (map.getSource('impact-regions')) {
          map.getSource('impact-regions').setData(data);
        } else {
          map.addSource('impact-regions', { type: 'geojson', data });
          map.addLayer({
            id: 'impact-fill',
            type: 'fill',
            source: 'impact-regions',
            layout: { visibility: 'visible' },
            paint: {
              'fill-color': '#9C27B0',
              'fill-opacity': 0.5,
            },
          });
          map.addLayer({
            id: 'impact-outline',
            type: 'line',
            source: 'impact-regions',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': '#000000',
              'line-width': 1,
            },
          });
          map.addLayer({
            id: 'impact-hover',
            type: 'fill',
            source: 'impact-regions',
            layout: { visibility: 'visible' },
            paint: {
              'fill-color': 'cyan',
              'fill-opacity': 0.7,
            },
            filter: ['==', ['get', 'hierid'], null],
          });
        }
        if (map.getLayer('adm2-fill')) {
          map.moveLayer('impact-fill', 'adm2-fill');
          map.moveLayer('impact-outline', 'adm2-fill');
          map.moveLayer('impact-hover', 'adm2-fill');
        }
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

  // Update IR layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const vis = impactLayerVisible ? 'visible' : 'none';
      if (map.getLayer('impact-fill')) map.setLayoutProperty('impact-fill', 'visibility', vis);
      if (map.getLayer('impact-outline')) map.setLayoutProperty('impact-outline', 'visibility', vis);
      if (map.getLayer('impact-hover')) map.setLayoutProperty('impact-hover', 'visibility', vis);
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

  // Impact Regions hover behavior.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!impactLayerVisible) return;

    let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
    const handleIRMouseMove = (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        console.log("Hovered Impact Region properties:", feature.properties);
        const impactId = feature.properties.hierid !== undefined ? feature.properties.hierid : null;
        map.setFilter('impact-hover', ['==', ['get', 'hierid'], impactId]);
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
      map.setFilter('impact-hover', ['==', ['get', 'hierid'], null]);
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

  // New: Load and manage Problematic Impact Regions layer.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!countryCode) return;

    if (!problematicLayerVisible) {
      if (map.getLayer('problematic-ir-fill')) {
        map.setLayoutProperty('problematic-ir-fill', 'visibility', 'none');
        map.setLayoutProperty('problematic-ir-outline', 'visibility', 'none');
        map.setLayoutProperty('problematic-ir-hover', 'visibility', 'none');
      }
      // Reset the count when layer is hidden.
      setProblematicCount(0);
      return;
    }

    const loadProblematicIR = async () => {
      try {
        const url = `https://huggingface.co/datasets/c1587s/adm2-geojson-dataset/resolve/main/ir_problematic/${countryCode}_ir_problematic.geojson`;
        console.log('Fetching Problematic Impact Regions GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Problematic IR GeoJSON not found for', countryCode);
          return;
        }
        const data = await response.json();
        console.log('Problematic IR GeoJSON loaded:', data);

        // Update the count based on the number of features.
        setProblematicCount(data.features.length);

        if (map.getSource('problematic-ir')) {
          map.getSource('problematic-ir').setData(data);
        } else {
          map.addSource('problematic-ir', { type: 'geojson', data });
          map.addLayer({
            id: 'problematic-ir-fill',
            type: 'fill',
            source: 'problematic-ir',
            layout: { visibility: 'visible' },
            paint: {
              'fill-color': '#FF0000', // Distinct color for problematic IR
              'fill-opacity': 0.5,
            },
          });
          map.addLayer({
            id: 'problematic-ir-outline',
            type: 'line',
            source: 'problematic-ir',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': '#000000',
              'line-width': 2,
            },
          });
          map.addLayer({
            id: 'problematic-ir-hover',
            type: 'fill',
            source: 'problematic-ir',
            layout: { visibility: 'visible' },
            paint: {
              'fill-color': 'yellow',
              'fill-opacity': 0.7,
            },
            filter: ['==', ['get', 'id'], ''],
          });

          if (map.getLayer('adm2-fill')) {
            map.moveLayer('problematic-ir-fill', 'adm2-fill');
            map.moveLayer('problematic-ir-outline', 'adm2-fill');
            map.moveLayer('problematic-ir-hover', 'adm2-fill');
          }
        }

        let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        const handleProbIRMouseMove = (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            map.setFilter('problematic-ir-hover', ['==', ['get', 'id'], feature.properties.id || '']);
            const tooltipHTML = `<div style="background: rgba(0,0,0,0.5); padding: 5px; border-radius: 3px; color: #fff; font-size:12px;">
              <strong>Problematic IR</strong><br/>
              ID: ${feature.properties.id || 'N/A'}<br/>
              Additional info if available...
            </div>`;
            popup.setLngLat(e.lngLat).setHTML(tooltipHTML).addTo(map);
          }
        };
        const handleProbIRMouseLeave = () => {
          map.setFilter('problematic-ir-hover', ['==', ['get', 'id'], '']);
          popup.remove();
        };
        map.on('mousemove', 'problematic-ir-fill', handleProbIRMouseMove);
        map.on('mouseleave', 'problematic-ir-fill', handleProbIRMouseLeave);
      } catch (error) {
        console.error('Error loading problematic IR GeoJSON:', error);
      }
    };

    loadProblematicIR();

    return () => {
      if (map.getLayer('problematic-ir-fill')) {
        map.off('mousemove', 'problematic-ir-fill');
        map.off('mouseleave', 'problematic-ir-fill');
      }
    };
  }, [countryCode, problematicLayerVisible]);

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
            border: '1px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 2,
            }}
        >
            <img 
            src="/reset.png" 
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
        problematicLayerVisible={problematicLayerVisible}
        toggleProblematicLayer={toggleProblematicLayer}
        problematicCount={problematicCount}
      />
    </div>
  );
};

export default MapComponent;
