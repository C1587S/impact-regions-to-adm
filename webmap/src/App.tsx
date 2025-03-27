// src/App.jsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiYzE1ODdzIiwiYSI6ImNtNjczeGFhdjA2engybXBxa2F2MWRheWsifQ.tkA3s8bLDXISVWaR9jBACg';

function App() {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Initialize the Mapbox map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10', // or any preferred Mapbox style
      center: [-98, 38.88], // Center on the USA (adjust as needed)
      zoom: 3,
      projection: 'globe' // Enable globe projection
    });

    // When the map loads, fetch and add the GeoJSON data
    map.on('load', () => {
      fetch('/outputs/geometries/countries/USA_adm2.geojson')
        .then((response) => response.json())
        .then((data) => {
          // Add the GeoJSON data as a new source
          map.addSource('usa-borders', {
            type: 'geojson',
            data: data
          });

          // Add a layer to display the outlines
          map.addLayer({
            id: 'usa-borders-layer',
            type: 'line',
            source: 'usa-borders',
            paint: {
              'line-color': '#FF0000', // Red outlines
              'line-width': 2          // Outline thickness
            }
          });
        })
        .catch((err) => console.error('Error loading GeoJSON:', err));
    });

    // Cleanup on unmount
    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default App;
