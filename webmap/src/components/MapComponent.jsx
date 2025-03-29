// src/components/MapComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './Legend';
import centroid from '@turf/centroid';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use your Mapbox token from environment variables.
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({ countryCode, layerVisible, toggleLayer, activeCaseTypes, toggleCaseType, onDataLoaded }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Expression to set fill colors by case_type.
  const getFillColorExpression = () => {
    return [
      'match',
      ['get', 'case_type'],
      'Case 1: IR = ADM2', '#2E8B57',
      'Case 2: IR covers multiple ADM2s', '#FF8C00',
      'Case 3: ADM2 = multiple IRs', '#8B0000',
      '#CCCCCC'
    ];
  };

  // Initialize the map only once.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [0, 0],
        zoom: 1.5,
        projection: 'globe'
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl());

      // Hide some default boundary layers if they exist.
      mapRef.current.on('style.load', () => {
        const map = mapRef.current;
        const layersToHide = [
          'admin-0-boundary',
          'admin-1-boundary',
          'admin-0-boundary-bg',
          'admin-1-boundary-bg'
        ];
        layersToHide.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      });
    }
  }, []);

  // Load GeoJSON and attach click handler when a country is selected.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!countryCode) {
      console.log("No country selected.");
      return;
    }
    console.log("Country selected:", countryCode);

    const loadGeoJSON = async () => {
      try {
        const url = `/outputs/geometries/countries/${countryCode}_adm2.geojson`;
        console.log("Fetching GeoJSON from:", url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Error fetching GeoJSON:", response.status);
          return;
        }
        const data = await response.json();
        console.log("GeoJSON loaded:", data);

        // Update or add the GeoJSON source and layers.
        if (map.getSource('adm2-regions')) {
          map.getSource('adm2-regions').setData(data);
        } else {
          map.addSource('adm2-regions', {
            type: 'geojson',
            data: data
          });
          map.addLayer({
            id: 'adm2-fill',
            type: 'fill',
            source: 'adm2-regions',
            layout: {
              visibility: layerVisible ? 'visible' : 'none'
            },
            paint: {
              'fill-color': getFillColorExpression(),
              'fill-opacity': 0.7
            }
          });
          map.addLayer({
            id: 'adm2-outline',
            type: 'line',
            source: 'adm2-regions',
            layout: {
              visibility: layerVisible ? 'visible' : 'none'
            },
            paint: {
              'line-color': '#000000',
              'line-width': 2
            }
          });
        }

        // Build the filter based on active case types.
        const activeTypes = Object.keys(activeCaseTypes).filter(key => activeCaseTypes[key]);
        const filterExpression = activeTypes.length
          ? ['in', ['get', 'case_type'], ['literal', activeTypes]]
          : ['==', ['get', 'case_type'], ''];
        map.setFilter('adm2-fill', filterExpression);

        // Compute centroid using Turf.js.
        const centerFeature = centroid(data);
        const center = centerFeature.geometry.coordinates;
        const targetZoom = (['USA','CHN','IND'].includes(countryCode)) ? 4 : 5;

        // Function to trigger fly-to.
        const fly = () => {
          console.log("Flying to:", center, "with zoom:", targetZoom);
          map.flyTo({
            center,
            zoom: targetZoom,
            speed: 1.2,
            curve: 1.42,
            easing: (t) => t
          });
          // Signal that data is loaded.
          if (onDataLoaded) {
            onDataLoaded();
          }
        };

        // Trigger fly-to after the source is fully loaded.
        map.on('data', function flyToHandler(e) {
          if (e.sourceId === 'adm2-regions' && e.isSourceLoaded) {
            fly();
            map.off('data', flyToHandler);
          }
        });

        // Define and attach the click handler.
        const handleFeatureClick = (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            if (selectedFeature && selectedFeature.properties.adm2_id === feature.properties.adm2_id) {
              setSelectedFeature(null);
            } else {
              setSelectedFeature(feature);
            }
          }
        };

        if (map.getLayer('adm2-fill')) {
          map.off('click', 'adm2-fill', handleFeatureClick);
          map.on('click', 'adm2-fill', handleFeatureClick);
        }
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      }
    };

    loadGeoJSON();

    // Cleanup the click listener when this effect re-runs.
    return () => {
      if (map && map.getLayer('adm2-fill')) {
        map.off('click', 'adm2-fill');
      }
    };
  }, [countryCode, layerVisible, activeCaseTypes, onDataLoaded]);

  // Update layer visibility when layerVisible changes.
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const visibility = layerVisible ? 'visible' : 'none';
      if (map.getLayer('adm2-fill')) {
        map.setLayoutProperty('adm2-fill', 'visibility', visibility);
      }
      if (map.getLayer('adm2-outline')) {
        map.setLayoutProperty('adm2-outline', 'visibility', visibility);
      }
    }
  }, [layerVisible]);

  // Also update the filter when activeCaseTypes changes.
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer('adm2-fill')) {
      const activeTypes = Object.keys(activeCaseTypes).filter(key => activeCaseTypes[key]);
      const filterExpression = activeTypes.length
        ? ['in', ['get', 'case_type'], ['literal', activeTypes]]
        : ['==', ['get', 'case_type'], ''];
      map.setFilter('adm2-fill', filterExpression);
    }
  }, [activeCaseTypes]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {selectedFeature && (
        <div className="feature-info">
          <button className="close-btn" onClick={() => setSelectedFeature(null)}>
            X
          </button>
          <h4>Feature Details</h4>
          <p><strong>ADM1:</strong> {selectedFeature.properties.NAME_1}</p>
          <p><strong>ADM2:</strong> {selectedFeature.properties.NAME_2}</p>
          <p><strong>Case Type:</strong> {selectedFeature.properties.case_type}</p>
        </div>
      )}
      <Legend 
         activeCaseTypes={activeCaseTypes} 
         toggleCaseType={toggleCaseType} 
         layerVisible={layerVisible} 
         toggleLayer={toggleLayer}
      />
    </div>
  );
};

export default MapComponent;
