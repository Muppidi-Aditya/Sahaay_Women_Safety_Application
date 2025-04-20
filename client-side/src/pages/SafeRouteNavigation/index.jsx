import React, { useState, useEffect } from 'react';
import './index.css'
import FeatureHeaderBlock from '../../components/FeatureHeaderBlock';

const SafeRouteNavigation = () => {
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [sourceCoordinates, setSourceCoordinates] = useState(null);
  const [destCoordinates, setDestCoordinates] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUsed, setApiUsed] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // Update map URL when we have coordinates for both source and destination
  useEffect(() => {
    if (sourceCoordinates && destCoordinates) {
      const newMapUrl = `https://www.google.com/maps/embed/v1/directions?key=YOUR_GOOGLE_MAPS_API_KEY&origin=${sourceCoordinates.lat},${sourceCoordinates.lon}&destination=${destCoordinates.lat},${destCoordinates.lon}&mode=walking`;
      setMapUrl(newMapUrl);
    }
  }, [sourceCoordinates, destCoordinates]);

  const getCoordinates = async (locationName) => {
    try {
      // Try OpenStreetMap Nominatim API first (no key required)
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json`
      );
      
      const nominatimData = await nominatimResponse.json();
      
      if (nominatimData.length > 0) {
        return {
          lat: parseFloat(nominatimData[0].lat),
          lon: parseFloat(nominatimData[0].lon),
          apiUsed: 'OpenStreetMap'
        };
      }
      
      // Fallback to PositionStack (requires free API key)
      const positionstackKey = 'YOUR_POSITIONSTACK_KEY'; // Get free key from positionstack.com
      const positionstackResponse = await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${positionstackKey}&query=${encodeURIComponent(locationName)}`
      );
      
      const positionstackData = await positionstackResponse.json();
      
      if (positionstackData.data && positionstackData.data.length > 0) {
        return {
          lat: positionstackData.data[0].latitude,
          lon: positionstackData.data[0].longitude,
          apiUsed: 'PositionStack'
        };
      }
      
      throw new Error('Location not found');
    } catch (err) {
      throw new Error(`Failed to fetch coordinates: ${err.message}`);
    }
  };

  const calculateRoute = async (e) => {
    e.preventDefault();
    if (sourceLocation.trim() && destinationLocation.trim()) {
      setLoading(true);
      setError(null);
      setRouteResult(null);
      
      try {
        // Get source coordinates
        const source = await getCoordinates(sourceLocation);
        setSourceCoordinates(source);
        
        // Get destination coordinates
        const destination = await getCoordinates(destinationLocation);
        setDestCoordinates(destination);
        
        setApiUsed(source.apiUsed);
        
        // Call the route API with coordinates
        const response = await fetch('http://localhost:3000/api/route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sourceLat: source.lat,
            sourceLon: source.lon,
            destLat: destination.lat,
            destLon: destination.lon
          })
        });
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const routeData = await response.json();
        setRouteResult(routeData);
        
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const openInGoogleMaps = () => {
    if (sourceCoordinates && destCoordinates) {
      const googleMapsUrl = routeResult.googleMapsUrl;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Alternative map URL using OpenStreetMap if Google Maps API key is not available
  const getOpenStreetMapUrl = () => {
    if (sourceCoordinates && destCoordinates) {
      return `https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${sourceCoordinates.lat}%2C${sourceCoordinates.lon}%3B${destCoordinates.lat}%2C${destCoordinates.lon}`;
    }
    return null;
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }} className='safe-route-main-page'>
      <FeatureHeaderBlock featureName='Save Route Navigation' />
      
      <form onSubmit={calculateRoute} style={{ marginBottom: '20px', marginTop: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="source" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Starting Point:
          </label>
          <input
            id="source"
            type="text"
            value={sourceLocation}
            onChange={(e) => setSourceLocation(e.target.value)}
            placeholder="Enter starting location (e.g., Central Park, NY)"
            style={{
              padding: '10px',
              width: '100%',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="destination" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Destination:
          </label>
          <input
            id="destination"
            type="text"
            value={destinationLocation}
            onChange={(e) => setDestinationLocation(e.target.value)}
            placeholder="Enter destination (e.g., Times Square, NY)"
            style={{
              padding: '10px',
              width: '100%',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !sourceLocation.trim() || !destinationLocation.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#999' : '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            width: '100%'
          }}
        >
          {loading ? 'Calculating Route...' : 'Find Safe Route'}
        </button>
      </form>

      {/* Map iframe and Google Maps button */}
      {sourceCoordinates && destCoordinates && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            overflow: 'hidden', 
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* <iframe
              title="Route Map"
              width="100%"
              height="450"
              frameBorder="0"
              style={{ border: 0 }}
              src={routeResult.googleMapsUrl || getOpenStreetMapUrl()}
              allowFullScreen
            ></iframe> */}
          </div>
          
          <button
            onClick={openInGoogleMaps}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              backgroundColor: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              marginBottom: '20px'
            }}
          >
            <span style={{ marginRight: '8px' }}>
              {/* Simple Google Maps icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            Open in Google Maps
          </button>
        </div>
      )}

      {(sourceCoordinates || destCoordinates) && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          borderLeft: '4px solid #4285F4'
        }}>
          <h3 style={{ marginTop: 0 }}>Coordinates:</h3>
          
          {sourceCoordinates && (
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ margin: '10px 0 5px 0' }}>Starting Point:</h4>
              <p style={{ margin: '0' }}>Latitude: {sourceCoordinates.lat}</p>
              <p style={{ margin: '0' }}>Longitude: {sourceCoordinates.lon}</p>
            </div>
          )}
          
          {destCoordinates && (
            <div>
              <h4 style={{ margin: '10px 0 5px 0' }}>Destination:</h4>
              <p style={{ margin: '0' }}>Latitude: {destCoordinates.lat}</p>
              <p style={{ margin: '0' }}>Longitude: {destCoordinates.lon}</p>
            </div>
          )}
          
          {apiUsed && <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>Source: {apiUsed}</p>}
        </div>
      )}

      {routeResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e6f4ea', 
          borderRadius: '4px',
          borderLeft: '4px solid #34a853'
        }}>
          <h3 style={{ marginTop: 0 }}>Route Information:</h3>
          <pre style={{ 
            overflow: 'auto', 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px' 
          }}>
            {JSON.stringify(routeResult, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#d32f2f', 
          borderRadius: '4px',
          borderLeft: '4px solid #d32f2f'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default SafeRouteNavigation;