import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import './CrimeHeatmap.css';
import FeatureHeaderBlock from '../../components/FeatureHeaderBlock';

// Helper component to handle the heatmap layer
const HeatmapLayer = ({ data }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (data.length > 0) {
      // Remove existing layer if it exists
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      // Create new heat layer
      const heat = L.heatLayer(data, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
      }).addTo(map);

      heatLayerRef.current = heat;

      // Fit map to the heat layer bounds if needed
      const points = data.map(point => [point[0], point[1]]);
      if (points.length > 0) {
        map.fitBounds(points);
      }
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [data, map]);

  return null;
};

const CrimeHeatMap = () => {
  const [crimeData, setCrimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/crime_data.csv');
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }
        
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }

            const parsedData = results.data
              .filter(row => !isNaN(row.lat) && !isNaN(row.long))
              .map(row => [row.lat, row.long, 1]); // [lat, lng, intensity]

            if (parsedData.length === 0) {
              setError('No valid data points found in CSV');
            } else {
              setCrimeData(parsedData);
            }
            setLoading(false);
          },
          error: (error) => {
            setError(`CSV parsing error: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Default center (India)
  const center = [20.5937, 78.9629];
  const zoom = 5;

  if (loading) {
    return <div className="loading">Loading crime data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="crime-heatmap-container">
      {/* <h1 className='heat-map-h1'>Crime Against Women in India - Heatmap</h1> */}
      <FeatureHeaderBlock featureName='Crime HeatMap' />
      {crimeData.length > 0 ? (
        <>
          <div className="map-container">
            <MapContainer 
              center={center} 
              zoom={zoom} 
              style={{ height: '600px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <HeatmapLayer data={crimeData} />
            </MapContainer>
          </div>
          <div className="legend">
            <h3>Heatmap Legend</h3>
            <div className="legend-gradient">
              <span style={{ background: 'blue' }}>Low</span>
              <span style={{ background: 'cyan' }}></span>
              <span style={{ background: 'lime' }}></span>
              <span style={{ background: 'yellow' }}></span>
              <span style={{ background: 'red' }}>High</span>
            </div>
          </div>
          <div className="data-info">
            Displaying {crimeData.length} crime locations
          </div>
        </>
      ) : (
        <div className="no-data">No crime data available</div>
      )}
    </div>
  );
};

export default CrimeHeatMap;