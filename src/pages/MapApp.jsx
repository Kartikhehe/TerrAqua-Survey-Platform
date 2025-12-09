import { useEffect, useState, useRef } from 'react'
import '../App.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import { 
  Box, 
  useTheme, 
  useMediaQuery, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Collapse,
  IconButton,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { AddLocation, MyLocation } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LiveCoordinates from '../components/LiveCoordinates';
import WaypointDetails from '../components/WaypointDetails';
import WaypointSelector from '../components/WaypointSelector';
import SavedPoints from '../components/SavedPoints';
import ExportDialog from '../components/ExportDialog';
import CustomSnackbar from '../components/Snackbar';
import { waypointsAPI, uploadAPI } from '../services/api';
import { createAppTheme } from '../theme/theme.js';
import { useAuth } from '../context/AuthContext';
import LoginPromptDialog from '../components/LoginPromptDialog';

const drawerWidth = 260;
const drawerCollapsedWidth = 64;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [surveyActive, setSurveyActive] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0, accuracy: null });
  const [currentLocationWaypointId, setCurrentLocationWaypointId] = useState(null);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [waypoints, setWaypoints] = useState([]); // Array of { id, lat, lng, name, notes, image }
  const [waypointData, setWaypointData] = useState({ name: '', lat: '', lng: '', notes: '', image: null });
  const [savedPointsOpen, setSavedPointsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dbWaypointIds, setDbWaypointIds] = useState({}); // Map local waypoint IDs to database IDs
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'dark';
  });
  const [savedWaypointsList, setSavedWaypointsList] = useState([]); // List of all saved waypoints for navigation
  const [loginPromptOpen, setLoginPromptOpen] = useState(false); // Login prompt dialog state
  const watchPositionIdRef = useRef(null); // Reference to watchPosition ID for cleanup
  const routePolylineRef = useRef(null); // Reference to route polyline on map
  const navigationStartMarkerRef = useRef(null); // Reference to starting point marker for navigation
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Object with waypoint IDs as keys
  const customCursorRef = useRef(null); // Store custom cursor for restoration
  const tileLayerRef = useRef(null); // Reference to tile layer for dark mode switching
  const locateHandlerRef = useRef(null); // Reference to locate handler function
  const theme = createAppTheme(darkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    
    // Reload the page to apply theme changes
    window.location.reload();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuItemClick = (item) => {
    if (item === 'Start Survey') {
      setSurveyActive(!surveyActive);
      if (surveyActive) {
        // Reset when turning off survey
        setSelectedWaypointId(null);
        setWaypointData({ name: '', lat: '', lng: '', notes: '', image: null });
      }
    } else if (item === 'Saved Points') {
      if (!isAuthenticated) {
        setLoginPromptOpen(true);
        return;
      }
      setSavedPointsOpen(true);
    } else if (item === 'Export Data') {
      setExportDialogOpen(true);
    } else {
    console.log(`${item} clicked`);
    }
  };

  const handleSaveWaypoint = async () => {
    if (!selectedWaypointId) return;
    
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    
    try {
      const waypoint = waypoints.find(wp => wp.id === selectedWaypointId);
      if (!waypoint) return;

      const waypointPayload = {
        name: waypointData.name || `Point ${waypoints.findIndex(wp => wp.id === selectedWaypointId) + 1}`,
        lat: waypointData.lat,
        lng: waypointData.lng,
        notes: waypointData.notes || '',
        image: waypointData.image || null,
      };

      const dbId = dbWaypointIds[selectedWaypointId];
      
      let savedWaypoint;
      if (dbId) {
        // Update existing waypoint
        savedWaypoint = await waypointsAPI.update(dbId, waypointPayload);
        showSnackbar('Waypoint updated successfully!', 'success');
      } else {
        // Create new waypoint
        savedWaypoint = await waypointsAPI.create(waypointPayload);
        setDbWaypointIds(prev => ({ ...prev, [selectedWaypointId]: savedWaypoint.id }));
        showSnackbar('Waypoint saved successfully!', 'success');
      }

      // Update local state
      const updatedWaypoints = waypoints.map((wp, index) => 
        wp.id === selectedWaypointId 
          ? { ...wp, ...waypointData, lat: parseFloat(waypointData.lat), lng: parseFloat(waypointData.lng), name: waypointPayload.name }
          : { ...wp, name: `Point ${index + 1}` }
      );
      setWaypoints(updatedWaypoints);
      updateMarkerIcon(selectedWaypointId);
    } catch (error) {
      console.error('Error saving waypoint:', error);
      if (error.message === 'Authentication required') {
        setLoginPromptOpen(true);
      } else {
        showSnackbar(error.message || 'Failed to save waypoint. Please try again.', 'error');
      }
    }
  };

  const handleDeleteWaypoint = async () => {
    if (!selectedWaypointId) return;
    
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    
    try {
      const dbId = dbWaypointIds[selectedWaypointId];
      
      // Delete from database if it exists
      if (dbId) {
        await waypointsAPI.delete(dbId);
        setDbWaypointIds(prev => {
          const updated = { ...prev };
          delete updated[selectedWaypointId];
          return updated;
        });
        showSnackbar('Waypoint deleted successfully!', 'success');
      } else {
        showSnackbar('Waypoint removed!', 'success');
      }
      
      // Remove marker from map
      if (markersRef.current[selectedWaypointId]) {
        markersRef.current[selectedWaypointId].remove();
        delete markersRef.current[selectedWaypointId];
      }
      
      // Remove from waypoints array
      const updatedWaypoints = waypoints.filter(wp => wp.id !== selectedWaypointId);
      // Rename remaining waypoints sequentially
      const renamedWaypoints = updatedWaypoints.map((wp, index) => ({
        ...wp,
        name: `Point ${index + 1}`
      }));
      setWaypoints(renamedWaypoints);
      
      // Clear selection
      setSelectedWaypointId(null);
      setWaypointData({ name: '', lat: '', lng: '', notes: '', image: null });
    } catch (error) {
      console.error('Error deleting waypoint:', error);
      if (error.message === 'Authentication required') {
        setLoginPromptOpen(true);
      } else {
        showSnackbar(error.message || 'Failed to delete waypoint. Please try again.', 'error');
      }
    }
  };

  const handleSelectWaypoint = (waypointId) => {
    const waypoint = waypoints.find(wp => wp.id === waypointId);
    if (!waypoint) return;

    const map = mapRef.current;
    const mapContainer = map ? map.getContainer() : null;

    // Update all markers - iterate over markersRef to ensure all markers are updated
    Object.keys(markersRef.current).forEach(id => {
      const marker = markersRef.current[id];
      if (marker) {
        const isSelected = id === waypointId;
        const icon = createMarkerIcon(isSelected, id);
        marker.setIcon(icon);
        
        // Re-attach hover effects
        if (mapContainer) {
          marker.off('mouseover mouseout');
          marker.on('mouseover', function() {
            const markerElement = this.getElement();
            if (markerElement) {
              mapContainer.style.cursor = 'none';
              
              // Ensure marker and its children stay visible
              markerElement.style.pointerEvents = 'auto';
              markerElement.style.opacity = '1';
              markerElement.style.visibility = 'visible';
              markerElement.style.display = 'block';
              
              // Ensure inner div stays visible
              const innerDiv = markerElement.querySelector('div');
              if (innerDiv) {
                innerDiv.style.pointerEvents = 'auto';
                innerDiv.style.opacity = '1';
                innerDiv.style.visibility = 'visible';
                innerDiv.style.display = 'block';
              }
              
              if (isSelected) {
                markerElement.style.transform = 'scale(1.3) translateY(-8px)';
                markerElement.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))';
                markerElement.style.zIndex = '1000';
              } else {
                markerElement.style.transform = 'scale(1.2) translateY(-5px)';
                markerElement.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))';
                markerElement.style.zIndex = '1000';
              }
            }
          });
          
          marker.on('mouseout', function() {
            const markerElement = this.getElement();
            if (markerElement) {
              if (customCursorRef.current) {
                mapContainer.style.cursor = customCursorRef.current;
              }
              markerElement.style.transform = 'scale(1) translateY(0)';
              markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
              markerElement.style.zIndex = 'auto';
            }
          });
        }
      }
    });

    // Set selected waypoint
    setSelectedWaypointId(waypointId);
    // Use the actual name from the waypoint object, not recalculated
    setWaypointData({
      name: waypoint.name, // Use the actual name from waypoint object
      lat: waypoint.lat.toFixed(6),
      lng: waypoint.lng.toFixed(6),
      notes: waypoint.notes || '',
      image: waypoint.image || null
    });
  };

  const updateMarkerIcon = (waypointId) => {
    const marker = markersRef.current[waypointId];
    if (!marker) return;
    
    const waypoint = waypoints.find(wp => wp.id === waypointId);
    if (!waypoint) return;
    
    const isSelected = waypointId === selectedWaypointId;
    const icon = createMarkerIcon(isSelected, waypointId);
    marker.setIcon(icon);
  };

  const createMarkerIcon = (isSelected, waypointId, isNavigationStart = false) => {
    if (isNavigationStart) {
      // Blue filled icon for navigation starting point
      return L.divIcon({
        className: 'custom-marker navigation-start',
        html: `<div style="
          width: 56px;
          height: 56px;
          position: relative;
          transition: transform 0.2s, filter 0.2s;
          filter: drop-shadow(0 6px 12px rgba(33, 150, 243, 0.4));
          pointer-events: auto;
          opacity: 1;
          visibility: visible;
          display: block;
          transform: translateY(-6px);
        ">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2196f3"/>
          </svg>
        </div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 56],
      });
    } else if (isSelected) {
      // Red filled AddLocation icon for selected - bigger and popped up
      return L.divIcon({
        className: 'custom-marker selected',
        html: `<div style="
          width: 64px;
          height: 64px;
          position: relative;
          transition: transform 0.2s, filter 0.2s;
          filter: drop-shadow(0 6px 12px rgba(244, 67, 54, 0.4));
          pointer-events: auto;
          opacity: 1;
          visibility: visible;
          display: block;
          transform: translateY(-8px);
        ">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#f44336"/>
          </svg>
        </div>`,
        iconSize: [64, 64],
        iconAnchor: [32, 64],
      });
    } else {
      // Blue outlined LocationOnOutlined icon for unselected
      return L.divIcon({
        className: 'custom-marker unselected',
        html: `<div style="
          width: 48px;
          height: 48px;
          position: relative;
          transition: transform 0.2s, filter 0.2s;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          pointer-events: auto;
          opacity: 1;
          visibility: visible;
          display: block;
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="none" stroke="#2196f3" stroke-width="2"/>
          </svg>
        </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });
    }
  };

  // Fetch route from OpenRouteService
  const handleNavigate = async (fromWaypoint) => {
    if (!mapRef.current) {
      showSnackbar('Map not initialized', 'error');
      return;
    }

    if (!selectedWaypointId && (!waypointData.lat || !waypointData.lng)) {
      showSnackbar('Please select a destination waypoint', 'error');
      return;
    }

    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }

    if (!fromWaypoint || !fromWaypoint.latitude || !fromWaypoint.longitude) {
      showSnackbar('Invalid starting location', 'error');
      return;
    }

    try {
      // Try to find destination waypoint in waypoints array, otherwise use waypointData
      let toWaypoint = waypoints.find(wp => wp.id === selectedWaypointId);
      
      if (!toWaypoint && waypointData.lat && waypointData.lng) {
        // Use waypointData as fallback
        toWaypoint = {
          id: selectedWaypointId || 'temp-waypoint',
          lat: parseFloat(waypointData.lat),
          lng: parseFloat(waypointData.lng),
          name: waypointData.name || 'Destination'
        };
      }

      if (!toWaypoint || !toWaypoint.lat || !toWaypoint.lng) {
        showSnackbar('Destination waypoint not found. Please select a waypoint first.', 'error');
        return;
      }

      // Remove previous navigation start marker if exists
      if (navigationStartMarkerRef.current) {
        navigationStartMarkerRef.current.remove();
        navigationStartMarkerRef.current = null;
      }

      // Validate coordinates
      const startLng = parseFloat(fromWaypoint.longitude);
      const startLat = parseFloat(fromWaypoint.latitude);
      const endLng = parseFloat(toWaypoint.lng);
      const endLat = parseFloat(toWaypoint.lat);

      if (isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
        showSnackbar('Invalid coordinates. Please check waypoint locations.', 'error');
        return;
      }

      // Check if starting point is in current waypoints (on map)
      const startWaypointOnMap = waypoints.find(wp => 
        Math.abs(parseFloat(wp.lat) - startLat) < 0.0001 &&
        Math.abs(parseFloat(wp.lng) - startLng) < 0.0001
      );

      // Create blue highlighted marker for starting point
      const startIcon = createMarkerIcon(false, null, true);
      const startMarker = L.marker([startLat, startLng], { icon: startIcon }).addTo(mapRef.current);
      navigationStartMarkerRef.current = startMarker;

      // If starting point exists on map, update its marker to blue
      if (startWaypointOnMap) {
        const existingMarker = markersRef.current[startWaypointOnMap.id];
        if (existingMarker) {
          const blueIcon = createMarkerIcon(false, startWaypointOnMap.id, true);
          existingMarker.setIcon(blueIcon);
        }
      }

      // Get API key from environment or use a placeholder
      const apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY || 'YOUR_KEY';
      
      if (apiKey === 'YOUR_KEY') {
        showSnackbar('Please configure OpenRouteService API key in .env file', 'error');
        return;
      }

      // Coordinates format: [longitude, latitude]
      const coordinates = [
        [startLng, startLat],
        [endLng, endLat]
      ];

      showSnackbar('Calculating route...', 'info');

      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&format=geojson`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coordinates }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch route');
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Decode polyline using Leaflet's polyline decoder
        // OpenRouteService returns geometry as encoded polyline
        let routeCoordinates = [];
        
        if (route.geometry) {
          // Use Leaflet's polyline decoder if available, or decode manually
          // For now, we'll use a simple approach: decode the polyline
          try {
            // Import polyline decoder or use built-in Leaflet method
            // Leaflet doesn't have built-in polyline decoder, so we'll use coordinates from segments
            if (route.geometry.coordinates) {
              // If coordinates are already decoded
              routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            } else {
              // Decode polyline string
              const encoded = route.geometry;
              routeCoordinates = decodePolyline(encoded);
            }
          } catch (e) {
            // Fallback: use start and end coordinates
            routeCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
          }
        } else {
          // Fallback: use start and end coordinates
          routeCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
        }

        // Remove existing route if any
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        // Create polyline for the route
        const polyline = L.polyline(routeCoordinates, {
          color: '#4CAF50',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5',
        }).addTo(mapRef.current);

        routePolylineRef.current = polyline;

        // Fit map to show entire route
        if (routeCoordinates.length > 0) {
          const bounds = L.latLngBounds(routeCoordinates);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        const distance = route.summary?.distance ? (route.summary.distance / 1000).toFixed(2) : 'N/A';
        const duration = route.summary?.duration ? Math.round(route.summary.duration / 60) : 'N/A';
        
        showSnackbar(`Route found! Distance: ${distance} km, Duration: ${duration} min`, 'success');
      } else {
        showSnackbar('No route found', 'error');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      showSnackbar(error.message || 'Failed to calculate route. Please check API key and try again.', 'error');
    }
  };

  // Simple polyline decoder (for encoded polyline format)
  const decodePolyline = (encoded) => {
    const coordinates = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push([lat * 1e-5, lng * 1e-5]);
    }

    return coordinates;
  };

  // Load saved waypoints for navigation dropdown
  useEffect(() => {
    const loadSavedWaypoints = async () => {
      // Only load if authenticated
      if (!isAuthenticated) {
        setSavedWaypointsList([]);
        return;
      }
      
      try {
        const data = await waypointsAPI.getAll();
        setSavedWaypointsList(data);
      } catch (error) {
        // Silently fail if not authenticated or other error
        console.error('Error loading saved waypoints:', error);
        setSavedWaypointsList([]);
      }
    };
    loadSavedWaypoints();
  }, [savedPointsOpen, selectedWaypointId, isAuthenticated]); // Reload when saved points dialog opens/closes or waypoint is selected or auth changes

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Show loading state (optional - you can add a loading indicator)
      const uploadResult = await uploadAPI.uploadImage(file);
      
      // Update waypoint data with Cloudinary URL
      setWaypointData(prev => ({ ...prev, image: uploadResult.image_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  useEffect(() => {
    // initialize map only once
    // Start with default location, will update to user's location if available
    const map = L.map('map', {
      zoomControl: false, // Disable default zoom control
      rotate: true, // Enable map rotation
      touchRotate: true, // Enable rotation with touch gestures (finger/trackpad)
      touchGestures: true, // Enable touch gestures
      rotateControl: false, // Disable rotate control button (only use gestures)
      bearing: 0, // Initial bearing (rotation angle in degrees)
    }).setView([28.6139, 77.2090], 5); // Default location (will be updated if geolocation succeeds)
    mapRef.current = map;

    // Use dark tile layer if dark mode is enabled
    const tileUrl = darkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: darkMode 
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    tileLayerRef.current = tileLayer;

    // Try to get user's current location and center map on it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          // Set view to current location with zoomed out view (zoom level 12 for city-level view)
          map.setView([latitude, longitude], 15);
          
          // Update coordinates with accuracy
          setCoordinates({
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            accuracy: accuracy ? Math.round(accuracy) : null
          });
          
          // Create a default location marker at current position
          const waypointId = `current-location-${Date.now()}`;
          const currentLocationWaypoint = {
            id: waypointId,
            lat: latitude,
            lng: longitude,
            name: 'My Current Location',
            notes: `Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}`,
            image: null
          };
          
          // Add to waypoints array
          setWaypoints([currentLocationWaypoint]);
          setCurrentLocationWaypointId(waypointId);
          
          // Create marker icon (blue for current location)
          const icon = createMarkerIcon(false, waypointId, true);
          const marker = L.marker([latitude, longitude], { icon }).addTo(map);
          
          // Add hover effects
          const mapContainer = map.getContainer();
          marker.on('mouseover', function() {
            const markerElement = this.getElement();
            if (markerElement && mapContainer) {
              mapContainer.style.cursor = 'none';
              markerElement.style.pointerEvents = 'auto';
              markerElement.style.opacity = '1';
              markerElement.style.visibility = 'visible';
              markerElement.style.display = 'block';
              const innerDiv = markerElement.querySelector('div');
              if (innerDiv) {
                innerDiv.style.pointerEvents = 'auto';
                innerDiv.style.opacity = '1';
                innerDiv.style.visibility = 'visible';
                innerDiv.style.display = 'block';
              }
              markerElement.style.transform = 'scale(1.2) translateY(-5px)';
              markerElement.style.filter = 'drop-shadow(0 8px 16px rgba(33, 150, 243, 0.4))';
              markerElement.style.zIndex = '1000';
            }
          });
          
          marker.on('mouseout', function() {
            const markerElement = this.getElement();
            if (markerElement && mapContainer) {
              if (customCursorRef.current) {
                mapContainer.style.cursor = customCursorRef.current;
              }
              markerElement.style.transform = 'scale(1) translateY(0)';
              markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
              markerElement.style.zIndex = 'auto';
            }
          });
          
          // Add click handler to select waypoint
          marker.on('click', function() {
            handleSelectWaypoint(waypointId);
          });
          
          markersRef.current[waypointId] = marker;
          
          // Select this waypoint by default
          setSelectedWaypointId(waypointId);
          setWaypointData({
            name: 'My Current Location',
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            notes: `Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}`,
            image: null
          });

          // Start watching position for live updates
          watchPositionIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude: newLat, longitude: newLng, accuracy: newAccuracy } = position.coords;
              
              // Update coordinates
              setCoordinates({
                lat: newLat.toFixed(6),
                lng: newLng.toFixed(6),
                accuracy: newAccuracy ? Math.round(newAccuracy) : null
              });
              
              // Update marker position if it exists
              const currentMarker = markersRef.current[waypointId];
              if (currentMarker) {
                currentMarker.setLatLng([newLat, newLng]);
              }
              
              // Update waypoint data if this is the selected waypoint
              if (selectedWaypointId === waypointId) {
                setWaypointData(prev => ({
                  ...prev,
                  lat: newLat.toFixed(6),
                  lng: newLng.toFixed(6),
                  notes: `Accuracy: ${newAccuracy ? Math.round(newAccuracy) + 'm' : 'N/A'}`
                }));
              }
              
              // Update waypoint in array
              setWaypoints(prev => prev.map(wp => 
                wp.id === waypointId 
                  ? { ...wp, lat: newLat, lng: newLng, notes: `Accuracy: ${newAccuracy ? Math.round(newAccuracy) + 'm' : 'N/A'}` }
                  : wp
              ));
            },
            (error) => {
              console.log('Watch position error:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 1000 // Update every second
            }
          );
        },
        (error) => {
          // If geolocation fails, keep default location (already set)
          console.log('Geolocation error, using default location:', error);
        },
        {
          enableHighAccuracy: true, // Use high accuracy for better location
          timeout: 10000,
          maximumAge: 0 // Don't use cached location, get fresh one
        }
      );
    }

    // Create custom control container for all map controls (search, locate, zoom)
    const MapControlsContainer = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control map-controls-container');
        container.style.marginTop = '80px'; // Just below navbar (64px) + some spacing
        container.style.marginRight = '10px';
        container.style.borderRadius = '12px';
        container.style.overflow = 'hidden';
        container.style.boxShadow = darkMode 
          ? '0 2px 8px rgba(0, 0, 0, 0.5)' 
          : '0 2px 8px rgba(0, 0, 0, 0.15)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '0';
        
        // Search button
        const searchButton = L.DomUtil.create('a', 'leaflet-control-search', container);
        searchButton.href = '#';
        searchButton.title = 'Search Location';
        searchButton.style.cssText = `
          width: 34px;
          height: 34px;
          line-height: 34px;
          text-align: center;
          display: block;
          background-color: ${darkMode ? '#1e1e1e' : '#fff'};
          color: ${darkMode ? '#fff' : '#333'};
          text-decoration: none;
          border: none;
          border-bottom: 1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'};
        `;
        
        // Add Search icon as SVG
        const searchIcon = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: 8px;">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#4CAF50"/>
          </svg>
        `;
        searchButton.innerHTML = searchIcon;
        
        L.DomEvent.disableClickPropagation(searchButton);
        L.DomEvent.on(searchButton, 'click', L.DomEvent.stop);
        L.DomEvent.on(searchButton, 'click', () => {
          const query = prompt('Enter location to search:');
          if (query && query.trim()) {
            // Use Nominatim (OpenStreetMap geocoding service)
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
              .then(response => response.json())
              .then(data => {
                if (data && data.length > 0) {
                  const { lat, lon } = data[0];
                  map.setView([parseFloat(lat), parseFloat(lon)], 13);
                  setTimeout(() => {
                    setSnackbar({ open: true, message: `Found: ${data[0].display_name}`, severity: 'success' });
                  }, 0);
                } else {
                  setTimeout(() => {
                    setSnackbar({ open: true, message: 'Location not found. Please try a different search term.', severity: 'error' });
                  }, 0);
                }
              })
              .catch(error => {
                console.error('Search error:', error);
                setTimeout(() => {
                  setSnackbar({ open: true, message: 'Search failed. Please try again.', severity: 'error' });
                }, 0);
              });
          }
        });
        
        // Locate button
        const locateButton = L.DomUtil.create('a', 'leaflet-control-locate', container);
        locateButton.href = '#';
        locateButton.title = 'Locate Me';
        locateButton.style.cssText = `
          width: 34px;
          height: 34px;
          line-height: 34px;
          text-align: center;
          display: block;
          background-color: ${darkMode ? '#1e1e1e' : '#fff'};
          color: ${darkMode ? '#fff' : '#333'};
          text-decoration: none;
          border: none;
        `;
        
        // Add Material-UI MyLocation icon as SVG
        const locateIcon = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: 7px;">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="#4CAF50"/>
          </svg>
        `;
        locateButton.innerHTML = locateIcon;
        
        L.DomEvent.disableClickPropagation(locateButton);
        L.DomEvent.on(locateButton, 'click', L.DomEvent.stop);
        
        // Store the locate handler in a ref so it can access latest state
        locateHandlerRef.current = () => {
          if (navigator.geolocation) {
            locateButton.style.opacity = '0.6';
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                const accuracy = position.coords.accuracy || 0;
                
                // Center map on location
                map.setView([latitude, longitude], 15);
                locateButton.style.opacity = '1';
                
                // Activate survey mode if not already active
                setSurveyActive(prev => {
                  if (!prev) {
                    return true;
                  }
                  return prev;
                });
                
                // Wait a bit for survey mode to activate, then create waypoint
                setTimeout(() => {
                  const waypointId = `waypoint-${Date.now()}`;
                  const latlng = [latitude, longitude];
                  
                  // Create waypoint with "My Location" as name
                  const newWaypoint = {
                    id: waypointId,
                    lat: latitude,
                    lng: longitude,
                    name: 'My Location',
                    notes: '',
                    image: null
                  };
                  
                  // Add to waypoints array
                  setWaypoints(prev => {
                    const updated = [...prev, newWaypoint];
                    return updated;
                  });
                  
                  // Create marker icon (selected, so red)
                  const icon = createMarkerIcon(true, waypointId);
                  
                  // Add marker to map
                  const marker = L.marker(latlng, { icon }).addTo(map);
                  
                  // Add hover effects
                  marker.on('mouseover', function() {
                    const markerElement = this.getElement();
                    if (markerElement) {
                      const mapContainer = map.getContainer();
                      if (mapContainer) {
                        mapContainer.style.cursor = 'none';
                      }
                      markerElement.style.pointerEvents = 'auto';
                      markerElement.style.opacity = '1';
                      markerElement.style.visibility = 'visible';
                      markerElement.style.display = 'block';
                      const innerDiv = markerElement.querySelector('div');
                      if (innerDiv) {
                        innerDiv.style.pointerEvents = 'auto';
                        innerDiv.style.opacity = '1';
                        innerDiv.style.visibility = 'visible';
                        innerDiv.style.display = 'block';
                      }
                      markerElement.style.transform = 'scale(1.3) translateY(-8px)';
                      markerElement.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))';
                      markerElement.style.zIndex = '1000';
                    }
                  });
                  
                  marker.on('mouseout', function() {
                    const markerElement = this.getElement();
                    if (markerElement) {
                      const mapContainer = map.getContainer();
                      if (customCursorRef.current && mapContainer) {
                        mapContainer.style.cursor = customCursorRef.current;
                      }
                      markerElement.style.transform = 'scale(1) translateY(0)';
                      markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
                      markerElement.style.zIndex = 'auto';
                    }
                  });
                  
                  // Add click handler to select waypoint
                  marker.on('click', function() {
                    handleSelectWaypoint(waypointId);
                  });
                  
                  markersRef.current[waypointId] = marker;
                  
                  // Update coordinates
                  setCoordinates({
                    lat: latitude.toFixed(6),
                    lng: longitude.toFixed(6)
                  });
                  
                  // Select the waypoint and open details
                  setSelectedWaypointId(waypointId);
                  setWaypointData({
                    name: 'My Location',
                    lat: latitude.toFixed(6),
                    lng: longitude.toFixed(6),
                    notes: '',
                    image: null
                  });
                  
                  setTimeout(() => {
                    setSnackbar({ open: true, message: `Location found! Accuracy: ${Math.round(accuracy)}m`, severity: 'success' });
                  }, 0);
                }, 200);
              },
              (error) => {
                locateButton.style.opacity = '1';
                console.error('Geolocation error:', error);
                setTimeout(() => {
                  setSnackbar({ open: true, message: 'Unable to get your location. Please check permissions.', severity: 'error' });
                }, 0);
              },
              {
                enableHighAccuracy: true, // Request most accurate location
                timeout: 10000,
                maximumAge: 0
              }
            );
          } else {
            setTimeout(() => {
              setSnackbar({ open: true, message: 'Geolocation is not supported by your browser.', severity: 'error' });
            }, 0);
          }
        };
        
        L.DomEvent.on(locateButton, 'click', locateHandlerRef.current);
        
        return container;
      },
      onRemove: function(map) {
        // Cleanup if needed
      }
    });

    // Add custom controls container to map (search + locate)
    const mapControlsContainer = new MapControlsContainer({ position: 'topright' });
    mapControlsContainer.addTo(map);

    // Add custom zoom control positioned at top right (below search/locate)
    const zoomControl = L.control.zoom({
      position: 'topright'
    });
    zoomControl.addTo(map);

    // Custom CSS to position zoom control just below the custom controls
    setTimeout(() => {
      const zoomControlElement = document.querySelector('.leaflet-control-zoom');
      if (zoomControlElement) {
        zoomControlElement.style.marginTop = '10px'; // Small gap after search/locate controls
        zoomControlElement.style.marginRight = '10px';
        zoomControlElement.style.borderRadius = '12px';
        zoomControlElement.style.overflow = 'hidden';
        zoomControlElement.style.boxShadow = darkMode 
          ? '0 2px 8px rgba(0, 0, 0, 0.5)' 
          : '0 2px 8px rgba(0, 0, 0, 0.15)';
        
        // Style the zoom buttons
        const zoomInBtn = zoomControlElement.querySelector('.leaflet-control-zoom-in');
        const zoomOutBtn = zoomControlElement.querySelector('.leaflet-control-zoom-out');
        
        if (zoomInBtn) {
          zoomInBtn.style.backgroundColor = darkMode ? '#1e1e1e' : '#fff';
          zoomInBtn.style.color = darkMode ? '#fff' : '#333';
          zoomInBtn.style.border = 'none';
          zoomInBtn.style.borderBottom = `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'}`;
        }
        
        if (zoomOutBtn) {
          zoomOutBtn.style.backgroundColor = darkMode ? '#1e1e1e' : '#fff';
          zoomOutBtn.style.color = darkMode ? '#fff' : '#333';
          zoomOutBtn.style.border = 'none';
        }
      }
    }, 100);

    // Cleanup function to remove map instance when component unmounts
    return () => {
      // Stop watching position
      if (watchPositionIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
      map.remove();
    };
  }, [darkMode]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const mapContainer = map.getContainer();

    if (surveyActive) {
      // Use Leaflet's default crosshair cursor
      mapContainer.style.cursor = 'crosshair';
      
      // Store custom cursor for restoration
      customCursorRef.current = 'crosshair';
      
      // Handle map drag events
      const handleDragStart = () => {
        mapContainer.style.cursor = 'grabbing';
      };
      
      const handleDragEnd = () => {
        if (customCursorRef.current) {
          mapContainer.style.cursor = customCursorRef.current;
        }
      };
      
      // Add mouse move event listener
      const handleMouseMove = (e) => {
        const latlng = map.mouseEventToLatLng(e.originalEvent);
        setCoordinates({
          lat: latlng.lat.toFixed(6),
          lng: latlng.lng.toFixed(6)
        });
      };

      // Add click event listener to place marker
      const handleMapClick = (e) => {
        const latlng = e.latlng;
        const waypointId = `waypoint-${Date.now()}`;
        
        // Get current waypoints count for naming
        const currentCount = waypoints.length;
        
        // Create new waypoint
        const newWaypoint = {
          id: waypointId,
          lat: latlng.lat,
          lng: latlng.lng,
          name: `Point ${currentCount + 1}`,
          notes: '',
          image: null
        };
        
        // Add to waypoints array
        setWaypoints(prev => {
          const updated = [...prev, newWaypoint];
          // Update all waypoint names to ensure sequential naming
          const renamed = updated.map((wp, index) => ({
            ...wp,
            name: `Point ${index + 1}`
          }));
          
          // Find the updated waypoint with correct name
          const updatedWaypoint = renamed.find(wp => wp.id === waypointId);
          
          // Create marker icon (initially selected, so red)
          const icon = createMarkerIcon(true, waypointId);
          
          // Add marker to map
          const marker = L.marker(latlng, { icon }).addTo(map);
          
          // Add hover effects
          marker.on('mouseover', function() {
            const markerElement = this.getElement();
            if (markerElement) {
              // Hide cursor when hovering over marker
              mapContainer.style.cursor = 'none';
              
              // Ensure marker and its children stay visible
              markerElement.style.pointerEvents = 'auto';
              markerElement.style.opacity = '1';
              markerElement.style.visibility = 'visible';
              markerElement.style.display = 'block';
              
              // Ensure inner div stays visible
              const innerDiv = markerElement.querySelector('div');
              if (innerDiv) {
                innerDiv.style.pointerEvents = 'auto';
                innerDiv.style.opacity = '1';
                innerDiv.style.visibility = 'visible';
                innerDiv.style.display = 'block';
              }
              
              // Pop up effect for selected markers
              const isSelected = waypointId === selectedWaypointId;
              if (isSelected) {
                markerElement.style.transform = 'scale(1.3) translateY(-8px)';
                markerElement.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))';
                markerElement.style.zIndex = '1000';
              } else {
                markerElement.style.transform = 'scale(1.2) translateY(-5px)';
                markerElement.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))';
                markerElement.style.zIndex = '1000';
              }
            }
          });
          
          marker.on('mouseout', function() {
            const markerElement = this.getElement();
            if (markerElement) {
              // Restore cursor when leaving marker
              if (customCursorRef.current) {
                mapContainer.style.cursor = customCursorRef.current;
              }
              
              markerElement.style.transform = 'scale(1) translateY(0)';
              markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
              markerElement.style.zIndex = 'auto';
            }
          });
          
          // Add click handler to select waypoint
          marker.on('click', function() {
            handleSelectWaypoint(waypointId);
          });
          
          markersRef.current[waypointId] = marker;
          
          // Update all existing markers to unselected (blue) state BEFORE setting new one as selected
          Object.keys(markersRef.current).forEach(id => {
            if (id !== waypointId) {
              const unselectedIcon = createMarkerIcon(false, id);
              markersRef.current[id].setIcon(unselectedIcon);
            }
          });
          
          // Set as selected waypoint with correct name
          setSelectedWaypointId(waypointId);
          if (updatedWaypoint) {
            setWaypointData({
              name: updatedWaypoint.name,
              lat: latlng.lat.toFixed(6),
              lng: latlng.lng.toFixed(6),
              notes: '',
              image: null
            });
          }
          
          return renamed;
        });
      };

      map.on('mousemove', handleMouseMove);
      map.on('click', handleMapClick);
      map.on('dragstart', handleDragStart);
      map.on('dragend', handleDragEnd);

      return () => {
        map.off('mousemove', handleMouseMove);
        map.off('click', handleMapClick);
        map.off('dragstart', handleDragStart);
        map.off('dragend', handleDragEnd);
        mapContainer.style.cursor = '';
      };
    } else {
      mapContainer.style.cursor = '';
      // Clear markers when survey is deactivated, but keep current location marker
      Object.keys(markersRef.current).forEach(id => {
        if (id !== currentLocationWaypointId) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      });
      // Remove waypoints except current location
      setWaypoints(prev => prev.filter(wp => wp.id === currentLocationWaypointId));
      // Don't clear selection if it's the current location
      if (selectedWaypointId !== currentLocationWaypointId) {
        setSelectedWaypointId(null);
      }
    }
  }, [surveyActive]);

  // Update marker icons when selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const mapContainer = map.getContainer();
    
    waypoints.forEach(waypoint => {
      const marker = markersRef.current[waypoint.id];
      if (marker) {
        const isSelected = waypoint.id === selectedWaypointId;
        const icon = createMarkerIcon(isSelected, waypoint.id);
        marker.setIcon(icon);
        
        // Re-attach hover effects to ensure they persist
        marker.off('mouseover mouseout');
        marker.on('mouseover', function() {
          const markerElement = this.getElement();
          if (markerElement) {
            // Hide cursor when hovering over marker
            mapContainer.style.cursor = 'none';
            
            // Ensure marker and its children stay visible
            markerElement.style.pointerEvents = 'auto';
            markerElement.style.opacity = '1';
            markerElement.style.visibility = 'visible';
            markerElement.style.display = 'block';
            
            // Ensure inner div stays visible
            const innerDiv = markerElement.querySelector('div');
            if (innerDiv) {
              innerDiv.style.pointerEvents = 'auto';
              innerDiv.style.opacity = '1';
              innerDiv.style.visibility = 'visible';
              innerDiv.style.display = 'block';
            }
            
            // Pop up effect - more pronounced for selected markers
            if (isSelected) {
              markerElement.style.transform = 'scale(1.3) translateY(-8px)';
              markerElement.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))';
              markerElement.style.zIndex = '1000';
            } else {
              markerElement.style.transform = 'scale(1.2) translateY(-5px)';
              markerElement.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))';
              markerElement.style.zIndex = '1000';
            }
          }
        });
        
        marker.on('mouseout', function() {
          const markerElement = this.getElement();
          if (markerElement) {
            // Restore cursor when leaving marker
            if (customCursorRef.current) {
              mapContainer.style.cursor = customCursorRef.current;
            }
            
            markerElement.style.transform = 'scale(1) translateY(0)';
            markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
            markerElement.style.zIndex = 'auto';
          }
        });
      }
    });
  }, [selectedWaypointId, waypoints]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default
      }}>
        <Navbar 
          sidebarOpen={sidebarOpen} 
          isMobile={isMobile} 
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
        onMenuItemClick={handleMenuItemClick}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          height: '100vh',
          overflow: 'hidden',
          marginTop: '64px',
          width: '100%',
          position: 'relative',
        }}
      >
        <Box 
          id="map" 
          sx={{ 
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Live Coordinates card - always visible */}
        <LiveCoordinates coordinates={coordinates} />

        {surveyActive && (
          <>
            {/* Waypoint Selector - horizontal scrollable tabs */}
            <WaypointSelector
              waypoints={waypoints}
              selectedWaypointId={selectedWaypointId}
              onSelectWaypoint={handleSelectWaypoint}
            />

            {/* Expanded waypoint card - only visible when a point is clicked */}
            {selectedWaypointId && (
              <WaypointDetails
                selectedWaypointId={selectedWaypointId}
                waypointData={waypointData}
                setWaypointData={setWaypointData}
                onClose={() => {
                  setSelectedWaypointId(null);
                  setWaypointData({ name: '', lat: '', lng: '', notes: '', image: null });
                  // Remove route when closing waypoint details
                  if (routePolylineRef.current) {
                    routePolylineRef.current.remove();
                    routePolylineRef.current = null;
                  }
                  // Remove navigation start marker
                  if (navigationStartMarkerRef.current) {
                    navigationStartMarkerRef.current.remove();
                    navigationStartMarkerRef.current = null;
                  }
                  // Reset any waypoint markers that were changed to blue
                  waypoints.forEach(wp => {
                    const marker = markersRef.current[wp.id];
                    if (marker) {
                      const isSelected = wp.id === selectedWaypointId;
                      const icon = createMarkerIcon(isSelected, wp.id, false);
                      marker.setIcon(icon);
                    }
                  });
                }}
                onSave={handleSaveWaypoint}
                onDelete={handleDeleteWaypoint}
                onImageUpload={handleImageUpload}
                savedWaypoints={savedWaypointsList}
                onNavigate={handleNavigate}
                currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : null}
              />
            )}
          </>
        )}

        {/* Waypoint Details - also show when default location is selected (even if survey not active) */}
        {selectedWaypointId && !surveyActive && currentLocationWaypointId === selectedWaypointId && (
          <WaypointDetails
            selectedWaypointId={selectedWaypointId}
            waypointData={waypointData}
            setWaypointData={setWaypointData}
            onClose={() => {
              setSelectedWaypointId(null);
              setWaypointData({ name: '', lat: '', lng: '', notes: '', image: null });
            }}
            onSave={handleSaveWaypoint}
            onDelete={() => {
              // Don't allow deleting the current location marker
              showSnackbar('Cannot delete current location marker', 'info');
            }}
            onImageUpload={handleImageUpload}
            savedWaypoints={savedWaypointsList}
            onNavigate={handleNavigate}
            currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : null}
          />
        )}

        {/* Saved Points Dialog */}
        <SavedPoints
          open={savedPointsOpen}
          onClose={() => setSavedPointsOpen(false)}
          onShowSnackbar={showSnackbar}
          onSelectWaypoint={(waypoint) => {
            if (!mapRef.current) return;
            
            const map = mapRef.current;
            const mapContainer = map.getContainer();
            
            // Check if waypoint already exists (by database ID)
            const existingEntry = Object.entries(dbWaypointIds).find(
              ([localId, dbId]) => dbId === waypoint.id
            );
            
            let waypointId;
            
            if (existingEntry) {
              // Waypoint already exists, use existing local ID
              waypointId = existingEntry[0];
              
              // Update waypoint data in case it changed in database
              setWaypoints(prev => prev.map(wp => 
                wp.id === waypointId 
                  ? { ...wp, name: waypoint.name, notes: waypoint.notes || '', image: waypoint.image || null }
                  : wp
              ));
            } else {
              // Create new waypoint ID
              waypointId = `waypoint-${Date.now()}`;
              
              // Add to waypoints array
              setWaypoints(prev => [...prev, {
                id: waypointId,
                lat: waypoint.lat,
                lng: waypoint.lng,
                name: waypoint.name,
                notes: waypoint.notes || '',
                image: waypoint.image || null
              }]);
              
              // Create marker
              const icon = createMarkerIcon(true, waypointId); // Start as selected
              const marker = L.marker([waypoint.lat, waypoint.lng], { icon }).addTo(map);
              
              // Add hover effects
              marker.on('mouseover', function() {
                const markerElement = this.getElement();
                if (markerElement) {
                  if (mapContainer) {
                    mapContainer.style.cursor = 'none';
                  }
                  markerElement.style.pointerEvents = 'auto';
                  markerElement.style.opacity = '1';
                  markerElement.style.visibility = 'visible';
                  markerElement.style.display = 'block';
                  const innerDiv = markerElement.querySelector('div');
                  if (innerDiv) {
                    innerDiv.style.pointerEvents = 'auto';
                    innerDiv.style.opacity = '1';
                    innerDiv.style.visibility = 'visible';
                    innerDiv.style.display = 'block';
                  }
                  markerElement.style.transform = 'scale(1.3) translateY(-8px)';
                  markerElement.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))';
                  markerElement.style.zIndex = '1000';
                }
              });
              
              marker.on('mouseout', function() {
                const markerElement = this.getElement();
                if (markerElement) {
                  if (customCursorRef.current && mapContainer) {
                    mapContainer.style.cursor = customCursorRef.current;
                  }
                  markerElement.style.transform = 'scale(1) translateY(0)';
                  markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
                  markerElement.style.zIndex = 'auto';
                }
              });
              
              // Add click handler
              marker.on('click', function() {
                handleSelectWaypoint(waypointId);
              });
              
              markersRef.current[waypointId] = marker;
              
              // Store database ID mapping (waypoint.id is the database ID)
              setDbWaypointIds(prev => ({ ...prev, [waypointId]: waypoint.id }));
            }
            
            // Activate survey mode if not already active
            if (!surveyActive) {
              setSurveyActive(true);
            }
            
            // Update coordinates to show the waypoint location
            setCoordinates({
              lat: waypoint.lat.toFixed(6),
              lng: waypoint.lng.toFixed(6)
            });
            
            // Select the waypoint and open details
            // Use setTimeout to ensure survey mode is activated and state is updated first
            setTimeout(() => {
              // Center map on waypoint
              map.setView([waypoint.lat, waypoint.lng], 13);
              
              // Get current waypoints to ensure we have the latest state
              setWaypoints(currentWaypoints => {
                // Update all markers to unselected state except the selected one
                currentWaypoints.forEach(wp => {
                  const marker = markersRef.current[wp.id];
                  if (marker) {
                    const isSelected = wp.id === waypointId;
                    const icon = createMarkerIcon(isSelected, wp.id);
                    marker.setIcon(icon);
                  }
                });
                
                // Also update the new waypoint marker if it was just created
                if (markersRef.current[waypointId]) {
                  const selectedIcon = createMarkerIcon(true, waypointId);
                  markersRef.current[waypointId].setIcon(selectedIcon);
                }
                
                return currentWaypoints;
              });
              
              // Set selected waypoint
              setSelectedWaypointId(waypointId);
              
              // Set waypoint data for editing with all database information
              setWaypointData({
                name: waypoint.name,
                lat: waypoint.lat.toFixed(6),
                lng: waypoint.lng.toFixed(6),
                notes: waypoint.notes || '',
                image: waypoint.image || null
              });
            }, 150);
          }}
        />

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onShowSnackbar={showSnackbar}
        />

        {/* Snackbar for notifications */}
        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />

        {/* Login Prompt Dialog */}
        <LoginPromptDialog
          open={loginPromptOpen}
          onClose={() => setLoginPromptOpen(false)}
        />
      </Box>
    </Box>
    </ThemeProvider>
  )
}

export default App;
