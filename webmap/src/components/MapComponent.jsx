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
  onDataLoaded,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [caseCounts, setCaseCounts] = useState({});

  // Helper: returns the corresponding color for an ADM2 case type.
  const getCaseColor = (caseType) => {
    switch (caseType) {
      case 'Case 1: IR = ADM2':
        return '#2E8B57';
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
      'Case 1: IR = ADM2', '#2E8B57',
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
        const url = `/outputs/geometries/countries/${countryCode}_adm2.geojson`;
        console.log('Fetching ADM2 GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Error fetching ADM2 GeoJSON:', response.status);
          return;
        }
        const data = await response.json();
        console.log('ADM2 GeoJSON loaded:', data);

        // Compute counts for each ADM2 case type.
        const counts = data.features.reduce((acc, feature) => {
          const ct = feature.properties.case_type;
          acc[ct] = (acc[ct] || 0) + 1;
          return acc;
        }, {});
        setCaseCounts(counts);

        // Update or add the ADM2 source and layers.
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

        // Build filter for ADM2 features.
        const activeTypes = Object.keys(activeCaseTypes).filter(
          (key) => activeCaseTypes[key]
        );
        const filterExpression = activeTypes.length
          ? ['in', ['get', 'case_type'], ['literal', activeTypes]]
          : ['==', ['get', 'case_type'], ''];
        map.setFilter('adm2-fill', filterExpression);

        // Compute centroid using Turf.js.
        const centerFeature = centroid(data);
        const center = centerFeature.geometry.coordinates;
        const targetZoom = (['USA', 'CHN', 'IND'].includes(countryCode)) ? 4 : 5;

        // Fly-to function.
        const fly = () => {
          console.log('Flying to ADM2 centroid:', center, 'with zoom:', targetZoom);
          map.flyTo({
            center,
            zoom: targetZoom,
            speed: 1.2,
            curve: 1.42,
            easing: (t) => t,
          });
          if (onDataLoaded) onDataLoaded();
        };

        // Trigger fly-to when ADM2 source is fully loaded.
        map.on('data', function flyToHandler(e) {
          if (e.sourceId === 'adm2-regions' && e.isSourceLoaded) {
            fly();
            map.off('data', flyToHandler);
          }
        });

        // Attach click handler for ADM2 features.
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
      }
    };

    loadADM2GeoJSON();
    return () => {
      if (map && map.getLayer('adm2-fill')) {
        map.off('click', 'adm2-fill');
      }
    };
  }, [countryCode, layerVisible, activeCaseTypes, onDataLoaded]);

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
        const url = `/outputs/geometries/countries/${countryCode}_ir.geojson`;
        console.log('Fetching Impact Regions GeoJSON from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Error fetching Impact Regions GeoJSON:', response.status);
          return;
        }
        const data = await response.json();
        console.log('Impact Regions GeoJSON loaded:', data);

        // Update or add the Impact Regions source and layers.
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
              'fill-color': '#9C27B0', // Contrasting purple
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
          // Add a hover layer for IR highlighting.
          // Use 'hierid' as the unique identifier.
          map.addLayer({
            id: 'impact-hover',
            type: 'fill',
            source: 'impact-regions',
            layout: { visibility: 'visible' },
            paint: {
              'fill-color': 'cyan',
              'fill-opacity': 0.7,
            },
            // Default filter: show nothing.
            filter: ['==', ['get', 'hierid'], null],
          });
        }
        // Ensure IR layers are rendered beneath ADM2.
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
        // Use 'hierid' as unique identifier.
        const impactId = feature.properties.hierid !== undefined ? feature.properties.hierid : null;
        // Update the hover layer filter.
        map.setFilter('impact-hover', ['==', ['get', 'hierid'], impactId]);
        // Build tooltip HTML using available properties.
        const tooltipHTML = `<div style="background: rgba(0,0,0,0.8); padding: 5px; border-radius: 3px; color: #fff; font-size:12px;">
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
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
