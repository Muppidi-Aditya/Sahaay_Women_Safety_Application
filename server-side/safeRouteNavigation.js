const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { kdTree } = require('kd-tree-javascript');
const haversine = require('haversine-distance');
const cors = require('cors');

// Graph library for path finding
const { Graph } = require('./graph');

const app = express();
const port = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Global variables for storing crime data
let globalCrimeData = [];
let crimeBallTree = null;

// Path to your crime dataset - CHANGE THIS TO YOUR ACTUAL FILE PATH
const CRIME_DATA_PATH = 'crime_data.csv';

// Load crime data at startup
loadCrimeDataFromFile(CRIME_DATA_PATH);

/**
 * Load crime data from file at startup
 */
async function loadCrimeDataFromFile(filePath) {
  try {
    console.log(`Loading crime data from ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Crime data file not found: ${filePath}`);
      return;
    }
    
    const result = await loadCrimeData(filePath);
    globalCrimeData = result.crimeData;
    crimeBallTree = result.crimeTree;
    
    console.log(`Successfully loaded ${globalCrimeData.length} crime data points at startup`);
  } catch (error) {
    console.error('Error loading crime data at startup:', error);
  }
}

/**
 * Helper function to load and process crime data
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<{crimeData: Array, crimeTree: Object}>}
 */
async function loadCrimeData(filePath) {
  return new Promise((resolve, reject) => {
    const crimeData = [];
    let totalRows = 0;
    let invalidRows = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        totalRows++;
        let lat, long;

        // Handle different column names
        if (row.lat !== undefined) lat = row.lat;
        else if (row.latitude !== undefined) lat = row.latitude;
        else if (row.Latitude !== undefined) lat = row.Latitude;
        
        if (row.long !== undefined) long = row.long;
        else if (row.longitude !== undefined) long = row.longitude;
        else if (row.lon !== undefined) long = row.lon;
        else if (row.Longitude !== undefined) long = row.Longitude;
        
        lat = parseFloat(lat);
        long = parseFloat(long);
        
        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(long)) {
          invalidRows++;
          return;
        }
        
        crimeData.push({
          id: row.id || crimeData.length,
          lat,
          long
        });
      })
      .on('end', () => {
        console.log(`Processed ${totalRows} total rows`);
        console.log(`Skipped ${invalidRows} rows due to invalid coordinates`);
        console.log(`Valid crime points: ${crimeData.length}`);

        // Create a spatial index
        const tree = createKDTree(crimeData);
        
        console.log(`Loaded ${crimeData.length} crime points`);
        resolve({ crimeData, crimeTree: tree });
      })
      .on('error', (err) => {
        console.error("Error reading CSV:", err);
        resolve({ crimeData: [], crimeTree: null });
      });
  });
}

/**
 * Create a kdTree from crime data for spatial queries
 * @param {Array} data - Array of crime data points
 * @returns {Object} kdTree object
 */
function createKDTree(data) {
  try {
    // If no data, return null
    if (!data || data.length === 0) return null;
    
    // Convert crime data to format needed by kdTree
    const points = data.map(point => ({
      x: point.lat,
      y: point.long,
      id: point.id
    }));
    
    // Distance function for the kdTree (haversine)
    const distance = (a, b) => {
      return haversine(
        { latitude: a.x, longitude: a.y },
        { latitude: b.x, longitude: b.y }
      ) / 1000; // Convert to km
    };
    
    // Create and return the tree
    return new kdTree(points, distance, ['x', 'y']);
  } catch (error) {
    console.error("Error creating kdTree:", error);
    return null;
  }
}

/**
 * Generate waypoints along a route with better variation like in Python version
 * @param {number} srcLat - Source latitude
 * @param {number} srcLon - Source longitude
 * @param {number} dstLat - Destination latitude
 * @param {number} dstLon - Destination longitude
 * @param {number} numPoints - Number of waypoints to generate
 * @returns {Array} Array of waypoint coordinates
 */
function generateWaypoints(srcLat, srcLon, dstLat, dstLon, numPoints = 8) {
  console.log(`Generating ${numPoints} waypoints between source and destination`);
  
  // Parse coordinates to ensure they're numbers
  const sourceLat = parseFloat(srcLat);
  const sourceLon = parseFloat(srcLon);
  const destLat = parseFloat(dstLat);
  const destLon = parseFloat(dstLon);
  
  // Handle invalid coordinates
  if (isNaN(sourceLat) || isNaN(sourceLon) || isNaN(destLat) || isNaN(destLon)) {
    console.error("Invalid coordinates:", { srcLat, srcLon, dstLat, dstLon });
    return [
      { lat: sourceLat || 0, lon: sourceLon || 0 },
      { lat: destLat || 0, lon: destLon || 0 }
    ];
  }
  
  // Calculate direct distance for scaling variations
  const directDistance = haversine(
    { latitude: sourceLat, longitude: sourceLon },
    { latitude: destLat, longitude: destLon }
  ) / 1000; // Convert to km
  
  try {
    // Calculate direct vector from source to destination
    const latDiff = destLat - sourceLat;
    const lonDiff = destLon - sourceLon;
    
    // Create waypoints with some random variation
    const waypoints = [];
    
    // Start with source
    waypoints.push({ lat: sourceLat, lon: sourceLon });
    
    // Generate intermediates
    for (let i = 1; i <= numPoints; i++) {
      // Base position along the route (0 to 1)
      const t = i / (numPoints + 1);
      
      // Basic linear interpolation
      const baseLat = sourceLat + latDiff * t;
      const baseLon = sourceLon + lonDiff * t;
      
      // Add some random variation
      // More variation in the middle, less at the ends (similar to Python version)
      const variationFactor = 0.03;  // controls the amount of deviation
      const variationScale = 4 * t * (1 - t);  // parabolic shape, max at t=0.5
      
      const variation = variationFactor * variationScale * directDistance;
      
      // Add some randomness
      const randomOffset = (Math.random() * 2 - 1) * variation;
      
      // Compute perpendicular direction
      let perpLat = -lonDiff;  // perpendicular to the direct path
      let perpLon = latDiff;
      
      // Normalize perpendicular vector
      const norm = Math.sqrt(perpLat**2 + perpLon**2);
      if (norm > 0) {
        perpLat /= norm;
        perpLon /= norm;
      }
      
      // Apply offset perpendicular to the direct route
      // Convert km to degrees (approximately)
      const waypointLat = baseLat + perpLat * randomOffset / 111.32;
      const waypointLon = baseLon + perpLon * randomOffset / (111.32 * Math.cos(baseLat * Math.PI / 180));
      
      waypoints.push({ lat: waypointLat, lon: waypointLon });
    }
    
    // End with destination
    waypoints.push({ lat: destLat, lon: destLon });
    
    return waypoints;
  } catch (error) {
    console.error("Error generating waypoints:", error);
    // Return just source and destination as fallback
    return [
      { lat: sourceLat, lon: sourceLon },
      { lat: destLat, lon: destLon }
    ];
  }
}

/**
 * Create a graph from waypoints and apply crime penalties - enhanced to better match Python approach
 * @param {Array} waypoints - Array of waypoint coordinates
 * @param {Array} crimeData - Array of crime data points
 * @param {Object} crimeTree - kdTree for spatial queries
 * @param {number} numConnections - Number of additional connections
 * @returns {Object} Graph object
 */
function createWaypointGraph(waypoints, crimeData, crimeTree, numConnections = 3) {
  try {
    const G = new Graph();
    
    // Add nodes for all waypoints
    for (let i = 0; i < waypoints.length; i++) {
      G.addNode(i, { 
        y: waypoints[i].lat, 
        x: waypoints[i].lon 
      });
    }
    
    // Create primary path through all waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      // Distance for direct connection
      const dist = haversine(
        { latitude: waypoints[i].lat, longitude: waypoints[i].lon },
        { latitude: waypoints[i+1].lat, longitude: waypoints[i+1].lon }
      );
      G.addEdge(i, i+1, { length: dist, type: 'primary' });
    }
    
    // Add additional connections between waypoints (like in Python)
    const maxForwardSkip = Math.min(numConnections, waypoints.length - 1);
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      // Add forward connections (skip some nodes)
      for (let j = i+2; j < Math.min(i+maxForwardSkip+2, waypoints.length); j++) {
        // Distance for this connection
        const dist = haversine(
          { latitude: waypoints[i].lat, longitude: waypoints[i].lon },
          { latitude: waypoints[j].lat, longitude: waypoints[j].lon }
        );
        
        // Only add if distance is not too much longer than going through nodes
        const directDist = haversine(
          { latitude: waypoints[i].lat, longitude: waypoints[i].lon },
          { latitude: waypoints[i+1].lat, longitude: waypoints[i+1].lon }
        );
        
        if (dist < directDist * 2.5) {  // limit to 2.5x direct distance
          G.addEdge(i, j, { length: dist, type: 'secondary' });
        }
      }
    }
    
    // Apply crime penalties if crime data is available
    if (crimeTree && crimeData && crimeData.length > 0) {
      const radiusKm = 0.4;  // 400m radius around crime points (same as Python)
      let penaltyCount = 0;
      
      // Apply penalties to edges
      // FIXED: Use getEdges() method instead of edges() function
      for (const [u, v, data] of G.getEdges()) {
        try {
          if (!('length' in data)) continue;
          
          // Get edge endpoints
          const uNode = G.getNode(u);
          const vNode = G.getNode(v);
          
          // Check multiple points along the edge (like in Python)
          const checkPoints = [];
          for (const t of [0.25, 0.5, 0.75]) {  // 3 points along the edge
            const lat = uNode.y + (vNode.y - uNode.y) * t;
            const lon = uNode.x + (vNode.x - uNode.x) * t;
            checkPoints.push({ lat, lon });
          }
          
          // Check each point for crime proximity
          let maxPenalty = 1.0;
          for (const point of checkPoints) {
            // Find crimes within radius
            const nearbyPoints = findCrimesNear(point.lat, point.lon, radiusKm, crimeData, crimeTree);
            
            if (nearbyPoints.length > 0) {
              // Calculate distance to nearest crime
              let minDist = Infinity;
              for (const crime of nearbyPoints) {
                const dist = haversine(
                  { latitude: point.lat, longitude: point.lon },
                  { latitude: crime.lat, longitude: crime.long }
                ) / 1000; // Convert to km
                
                minDist = Math.min(minDist, dist);
              }
              
              // Penalty based on proximity (more similar to Python)
              if (minDist < radiusKm) {
                // Higher penalty for closer crimes (2-5x penalty like Python)
                const pointPenalty = 2.0 + (radiusKm - minDist) / radiusKm * 3.0;
                maxPenalty = Math.max(maxPenalty, pointPenalty);
              }
            }
          }
          
          // Apply the highest penalty found
          if (maxPenalty > 1.0) {
            G.updateEdge(u, v, { length: data.length * maxPenalty });
            penaltyCount++;
          }
        } catch (err) {
          console.error(`Error processing edge ${u}-${v}:`, err);
          continue;  // Skip problematic edges
        }
      }
      
      console.log(`Applied penalties to ${penaltyCount} edges based on crime proximity`);
    }
    
    return G;
  } catch (error) {
    console.error("Error creating graph:", error);
    
    // Create a fallback direct graph
    const G = new Graph();
    
    // Just add source and destination nodes
    G.addNode(0, { y: waypoints[0].lat, x: waypoints[0].lon });
    G.addNode(1, { y: waypoints[waypoints.length-1].lat, x: waypoints[waypoints.length-1].lon });
    
    // Add direct edge
    const dist = haversine(
      { latitude: waypoints[0].lat, longitude: waypoints[0].lon },
      { latitude: waypoints[waypoints.length-1].lat, longitude: waypoints[waypoints.length-1].lon }
    );
    G.addEdge(0, 1, { length: dist, type: 'direct' });
    
    return G;
  }
}

/**
 * Find crimes near a point using the kdTree
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {Array} crimeData - Array of crime data points
 * @param {Object} crimeTree - kdTree for spatial queries
 * @returns {Array} Array of nearby crime points
 */
function findCrimesNear(lat, lon, radiusKm, crimeData, crimeTree) {
  try {
    // If no crime data or tree, return empty array
    if (!crimeTree || !crimeData || crimeData.length === 0) {
      return [];
    }
    
    // Find nearest points within radius
    const point = { x: lat, y: lon };
    const nearestPoints = crimeTree.nearest(point, 50, radiusKm);
    
    return nearestPoints.map(entry => {
      const idx = crimeData.findIndex(crime => crime.id === entry[0].id);
      return idx >= 0 ? crimeData[idx] : null;
    }).filter(x => x !== null);
  } catch (err) {
    console.error('Error in findCrimesNear:', err);
    return [];
  }
}

/**
 * Find optimal route
 * @param {Object} G - Graph object
 * @returns {Array} Array of node IDs representing the route
 */
function findOptimalRoute(G) {
  try {
    // Source is first node (0), destination is last node
    const startNode = 0;
    const endNode = G.nodeCount() - 1;
    
    const route = G.shortestPath(startNode, endNode);
    console.log(`Found optimal route with ${route.length} nodes`);
    return route;
  } catch (err) {
    console.error('Error finding route:', err);
    
    // If path finding fails, return direct route
    return [0, G.nodeCount() - 1];  // Source to destination directly
  }
}

/**
 * Generate route statistics to help user understand the safe route benefits
 * @param {Object} G - Graph with route
 * @param {Array} routePath - Path nodes
 * @param {Array} crimeData - Crime data
 * @returns {Object} Statistics about the route
 */
function generateRouteStatistics(G, routePath, crimeData) {
  try {
    const stats = {
      routeLength: 0,
      directDistance: 0,
      crimePointsNearby: 0,
      estimatedTime: 0
    };
    
    // Get first and last nodes
    const firstNode = G.getNode(routePath[0]);
    const lastNode = G.getNode(routePath[routePath.length - 1]);
    
    // Calculate direct distance (as the crow flies)
    stats.directDistance = haversine(
      { latitude: firstNode.y, longitude: firstNode.x },
      { latitude: lastNode.y, longitude: lastNode.x }
    ) / 1000; // km
    
    // Calculate actual route length
    for (let i = 0; i < routePath.length - 1; i++) {
      const node1 = G.getNode(routePath[i]);
      const node2 = G.getNode(routePath[i + 1]);
      const segmentDist = haversine(
        { latitude: node1.y, longitude: node1.x },
        { latitude: node2.y, longitude: node2.x }
      ) / 1000; // km
      stats.routeLength += segmentDist;
    }
    
    // Estimate time (rough estimate using 30 km/h average urban speed)
    stats.estimatedTime = (stats.routeLength / 30) * 60; // minutes
    
    return stats;
  } catch (err) {
    console.error('Error generating route statistics:', err);
    return {
      routeLength: 0,
      directDistance: 0,
      crimePointsNearby: 0,
      estimatedTime: 0
    };
  }
}

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Safe Route API is working!',
    crimeDataLoaded: globalCrimeData.length > 0,
    crimeDataPoints: globalCrimeData.length
  });
});

// Enhanced route endpoint with more details like the Python version
app.post('/api/route', async (req, res) => {
  try {
    // Extract coordinates from request
    const { sourceLat, sourceLon, destLat, destLon } = req.body;
    
    // Validate inputs
    if (!sourceLat || !sourceLon || !destLat || !destLon) {
      return res.status(400).json({ error: 'Missing required coordinates' });
    }
    
    // Use the pre-loaded crime data
    if (globalCrimeData.length === 0) {
      console.warn("No crime data available. Loading default dataset...");
      try {
        // Try to load data if not already loaded
        await loadCrimeDataFromFile(CRIME_DATA_PATH);
      } catch (error) {
        console.error("Failed to load crime data:", error);
      }
    }
    
    console.log(`Planning safe route from (${sourceLat}, ${sourceLon}) to (${destLat}, ${destLon})`);
    
    // Filter crime data to only include points in the relevant area (like Python)
    // This improves performance by not checking all crime points
    const buffer = 0.1;  // Roughly 10km buffer
    const min_lat = Math.min(sourceLat, destLat) - buffer;
    const max_lat = Math.max(sourceLat, destLat) + buffer;
    const min_lon = Math.min(sourceLon, destLon) - buffer;
    const max_lon = Math.max(sourceLon, destLon) + buffer;
    
    const areaCrimeData = globalCrimeData.filter(
      crime => crime.lat >= min_lat && 
              crime.lat <= max_lat && 
              crime.long >= min_lon && 
              crime.long <= max_lon
    );
    
    console.log(`Found ${areaCrimeData.length} crime points in the route area.`);
    
    // Generate waypoints and calculate route
    const waypoints = generateWaypoints(sourceLat, sourceLon, destLat, destLon, 8);
    const G = createWaypointGraph(waypoints, areaCrimeData, crimeBallTree, 3);
    const routePath = findOptimalRoute(G);
    
    // Extract waypoints for Google Maps URL
    const routeWaypoints = routePath.map(nodeId => {
      const node = G.getNode(nodeId);
      return { lat: node.y, lon: node.x };
    });
    
    // Generate Google Maps URL
    let googleMapsUrl = "https://www.google.com/maps/dir/";
    routeWaypoints.forEach(wp => {
      googleMapsUrl += `${wp.lat},${wp.lon}/`;
    });
    
    // Generate route statistics
    const routeStats = generateRouteStatistics(G, routePath, areaCrimeData);
    
    // Return enhanced response with more details
    res.json({ 
      googleMapsUrl,
      waypoints: routeWaypoints,
      statistics: {
        routeLength: routeStats.routeLength.toFixed(2) + " km",
        directDistance: routeStats.directDistance.toFixed(2) + " km",
        estimatedTime: Math.round(routeStats.estimatedTime) + " minutes",
        crimePointsAvoided: areaCrimeData.length,
        waypointCount: routeWaypoints.length
      },
      message: "Safe route calculated successfully!"
    });
    
  } catch (err) {
    console.error('Error processing request:', err);
    
    // Fallback - create a direct Google Maps URL
    const { sourceLat, sourceLon, destLat, destLon } = req.body;
    const fallbackUrl = `https://www.google.com/maps/dir/${sourceLat},${sourceLon}/${destLat},${destLon}/`;
    
    res.status(500).json({ 
      googleMapsUrl: fallbackUrl,
      error: 'Error calculating safe route. Falling back to direct route.',
      message: 'An error occurred while calculating the safe route. A direct route has been provided instead.' 
    });
  }
});

// Add an endpoint for geocoding support (like in Python)
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }
    
    // Simple geocoding implementation (you may want to use a more robust service)
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SafeRouteApp/1.0' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const displayName = data[0].display_name;
        
        return res.json({
          lat,
          lon,
          displayName
        });
      } else {
        return res.status(404).json({ error: `Could not find location: ${address}` });
      }
    } else {
      return res.status(response.status).json({ error: `Error from geocoding service: ${response.status}` });
    }
  } catch (err) {
    console.error('Error geocoding address:', err);
    return res.status(500).json({ error: 'Error geocoding address' });
  }
});

// Serve static HTML for testing the API
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
  console.log(`Safe Route API listening at http://localhost:${port}`);
  console.log(`Crime data loaded: ${globalCrimeData.length} points`);
});
