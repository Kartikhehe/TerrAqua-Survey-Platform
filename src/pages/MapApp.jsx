import { useEffect, useState, useRef } from 'react'
import '../App.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
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
import { AddLocation, MyLocation, Menu as MenuIcon } from '@mui/icons-material';
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
import GPSWarningDialog from '../components/GPSWarningDialog';

// Responsive drawer widths - using rem units
const drawerWidth = { xs: '16rem', sm: '16.25rem', md: '17.5rem' };
const drawerCollapsedWidth = { xs: '3.5rem', sm: '4rem' };

// India's center location for initial map view
const INDIA_CENTER = {
  lat: 20.5937,
  lng: 78.9629
};

// Ensure default Leaflet markers load correctly when bundled (e.g., on Vercel)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

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
  const [imageUploading, setImageUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'dark';
  });
  const [savedWaypointsList, setSavedWaypointsList] = useState([]); // List of all saved waypoints for navigation
  const [loginPromptOpen, setLoginPromptOpen] = useState(false); // Login prompt dialog state
  const [gpsWarningOpen, setGpsWarningOpen] = useState(false); // GPS warning dialog state
  const [locationSelectionActive, setLocationSelectionActive] = useState(false); // Location selection mode state
  const [defaultLocation, setDefaultLocation] = useState({ lat: 26.516654, lng: 80.231507 }); // Default location from database
  const [satelliteHybridMode, setSatelliteHybridMode] = useState(false); // Satellite hybrid view mode
  const watchPositionIdRef = useRef(null); // Reference to watchPosition ID for cleanup
  const routePolylineRef = useRef(null); // Reference to route polyline on map
  const navigationStartMarkerRef = useRef(null); // Reference to starting point marker for navigation
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Object with waypoint IDs as keys
  const selectedMarkerOverlayRef = useRef(null); // Red circleMarker overlay for selected waypoint
  const liveLocationMarkerRef = useRef(null); // Blue circle marker for live GPS location
  const customCursorRef = useRef(null); // Store custom cursor for restoration
  const tileLayerRef = useRef(null); // Reference to tile layer for dark mode switching
  const labelLayerRef = useRef(null); // Reference to label layer for satellite hybrid view
  const locateHandlerRef = useRef(null); // Reference to locate handler function
  const fileInputRef = useRef(null); // Reference to file input for import
  const liveCoordsRef = useRef(null); // Measure live coordinates card height (mobile)
  const waypointDetailsRef = useRef(null); // Measure waypoint details card height (mobile)
  const [mapDynamicHeight, setMapDynamicHeight] = useState(null);
  const theme = createAppTheme(darkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useAuth();
  
  // Detect if device has cursor (mouse) or is touch-only
  // Check for touch support - if device supports touch, assume no cursor
  const [hasCursor, setHasCursor] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Check if device has touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Check if it's a hybrid device (like Surface) - assume it has cursor if screen is large
    const isLargeScreen = window.innerWidth >= 768;
    return !hasTouch || (hasTouch && isLargeScreen);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkCursor = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isLargeScreen = window.innerWidth >= 768;
      setHasCursor(!hasTouch || (hasTouch && isLargeScreen));
    };
    window.addEventListener('resize', checkCursor);
    return () => window.removeEventListener('resize', checkCursor);
  }, []);

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
        updateSelectedMarkerOverlay(null);
      }
    } else if (item === 'Saved Points') {
      if (!isAuthenticated) {
        setLoginPromptOpen(true);
        return;
      }
      setSavedPointsOpen(true);
    } else if (item === 'Export Data') {
      setExportDialogOpen(true);
    } else if (item === 'Import File') {
      // Trigger file input click
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
    console.log(`${item} clicked`);
    }
    // Close sidebar on mobile after any action
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle file selection from file input
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidFile = fileName.endsWith('.geojson') || 
                        fileName.endsWith('.json') || 
                        fileName.endsWith('.kml');

    if (!isValidFile) {
      showSnackbar('Invalid file type. Please select KML or GeoJSON files', 'error');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Import the file
    await importWaypointsFromFile(file);

    // Reset file input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveWaypoint = async () => {
    if (!selectedWaypointId) return;
    
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    
    try {
      // Validate file type and size client-side before attempting upload
      if (!file.type || !file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Only image files are allowed', severity: 'error' });
        return;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setSnackbar({ open: true, message: 'Image is too large. Max 10MB allowed', severity: 'error' });
        return;
      }
      const waypoint = waypoints.find(wp => wp.id === selectedWaypointId);
      if (!waypoint) return;

      // Check if this is "Default Location" - if so, ensure name stays as "Default Location"
      const isDefaultLocation = waypoint.name && waypoint.name.trim().toLowerCase() === 'default location';
      const finalName = isDefaultLocation ? 'Default Location' : (waypointData.name || `Point ${waypoints.findIndex(wp => wp.id === selectedWaypointId) + 1}`);

      const waypointPayload = {
        name: finalName,
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
          ? { ...wp, ...waypointData, lat: parseFloat(waypointData.lat), lng: parseFloat(waypointData.lng), name: finalName }
          : { ...wp, name: `Point ${index + 1}` }
      );
      setWaypoints(updatedWaypoints);
      
      // Update waypointData to ensure name is correct
      if (isDefaultLocation) {
        setWaypointData(prev => ({ ...prev, name: 'Default Location' }));
        // Reload default location from database after saving
        try {
          const defaultLoc = await waypointsAPI.getDefault();
          setDefaultLocation({
            lat: parseFloat(defaultLoc.latitude),
            lng: parseFloat(defaultLoc.longitude)
          });
        } catch (error) {
          console.error('Error reloading default location:', error);
        }
      }
      
    } catch (error) {
      console.error('Error saving waypoint:', error);
      if (error.message === 'Authentication required') {
        setLoginPromptOpen(true);
      } else {
        showSnackbar(error.message || 'Failed to save waypoint. Please try again.', 'error');
      }
    }
  };

  // Compute dynamic map height on mobile based on visible bottom cards
  const updateMobileMapHeight = () => {
    if (!isMobile || typeof window === 'undefined') return;
    const headerEl = document.querySelector('header');
    const headerHeight = headerEl?.offsetHeight || 56;
    const liveH = liveCoordsRef.current?.offsetHeight || 0;
    const detailsH = selectedWaypointId ? (waypointDetailsRef.current?.offsetHeight || 0) : 0;
    const available = Math.max(200, window.innerHeight - headerHeight - liveH - detailsH);
    setMapDynamicHeight(available);
  };

  const handleDeleteWaypoint = async () => {
    if (!selectedWaypointId) return;
    
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    
    // Prevent deletion of "Default Location"
    const waypoint = waypoints.find(wp => wp.id === selectedWaypointId);
    if (waypoint && waypoint.name && waypoint.name.trim().toLowerCase() === 'default location') {
      showSnackbar('Cannot delete "Default Location"', 'error');
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
      updateSelectedMarkerOverlay(null);
    } catch (error) {
      console.error('Error deleting waypoint:', error);
      if (error.message === 'Authentication required') {
        setLoginPromptOpen(true);
      } else {
        showSnackbar(error.message || 'Failed to delete waypoint. Please try again.', 'error');
      }
    }
  };

  // Helper function to create red circle marker for new survey points
  const createSurveyMarker = (latlng) => {
    // Responsive marker sizes
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 8 : 10;
    
    const marker = L.circleMarker(latlng, {
      radius: radius,
      fillColor: '#f44336', // Red for new survey points
      color: '#d32f2f',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      interactive: false, // Make it non-interactive so clicks pass through to the marker below
      bubblingMouseEvents: false // Prevent event bubbling
    });
    
    // Set pointer-events to none on the element to ensure clicks pass through
    marker.on('add', function() {
      const element = this.getElement();
      if (element) {
        element.style.zIndex = '1000';
        element.style.pointerEvents = 'none'; // Ensure clicks pass through
        element.style.cursor = 'default';
        // Also set on SVG path and circle if they exist
        const path = element.querySelector('path');
        if (path) {
          path.style.pointerEvents = 'none';
        }
        const circle = element.querySelector('circle');
        if (circle) {
          circle.style.pointerEvents = 'none';
        }
        // Set on all children
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          child.style.pointerEvents = 'none';
        });
      }
    });
    
    return marker;
  };

  // Helper function to create blue circle marker for live location
  const createLiveLocationMarker = (latlng) => {
    // Responsive marker sizes
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 8 : 10;
    
    const marker = L.circleMarker(latlng, {
      radius: radius,
      fillColor: '#2196F3', // Blue for live location
      color: '#1976D2',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      interactive: false, // Make it non-interactive
      bubblingMouseEvents: false // Prevent event bubbling
    });
    
    // Set pointer-events to none on the element
    marker.on('add', function() {
      const element = this.getElement();
      if (element) {
        element.style.zIndex = '999';
        element.style.pointerEvents = 'none'; // Ensure clicks pass through
        element.style.cursor = 'default';
        // Also set on SVG path and circle if they exist
        const path = element.querySelector('path');
        if (path) {
          path.style.pointerEvents = 'none';
        }
        const circle = element.querySelector('circle');
        if (circle) {
          circle.style.pointerEvents = 'none';
        }
        // Set on all children
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          child.style.pointerEvents = 'none';
        });
      }
    });
    
    return marker;
  };

  // Helper function to parse GeoJSON file
  const parseGeoJSON = (text) => {
    try {
      const geoJSON = JSON.parse(text);
      if (geoJSON.type === 'FeatureCollection' && Array.isArray(geoJSON.features)) {
        return geoJSON.features
          .filter(feature => feature.type === 'Feature' && feature.geometry && feature.geometry.type === 'Point')
          .map(feature => {
            const [lng, lat] = feature.geometry.coordinates;
            const props = feature.properties || {};
            return {
              lat,
              lng,
              name: props.name || 'Imported Point',
              notes: props.notes || props.description || '',
              image: props.image_url || null
            };
          });
      }
      return [];
    } catch (error) {
      console.error('Error parsing GeoJSON:', error);
      throw new Error('Invalid GeoJSON file format');
    }
  };

  // Helper function to parse KML file
  const parseKML = (text) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid KML file format');
      }
      
      const placemarks = xmlDoc.querySelectorAll('Placemark');
      const waypoints = [];
      
      placemarks.forEach(placemark => {
        const nameElement = placemark.querySelector('name');
        const descriptionElement = placemark.querySelector('description');
        const pointElement = placemark.querySelector('Point');
        
        if (pointElement) {
          const coordinatesElement = pointElement.querySelector('coordinates');
          if (coordinatesElement) {
            const coords = coordinatesElement.textContent.trim().split(',');
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              const name = nameElement ? nameElement.textContent.trim() : 'Imported Point';
              const notes = descriptionElement ? descriptionElement.textContent.trim() : '';
              
              waypoints.push({
                lat,
                lng,
                name,
                notes,
                image: null
              });
            }
          }
        }
      });
      
      return waypoints;
    } catch (error) {
      console.error('Error parsing KML:', error);
      throw new Error('Invalid KML file format');
    }
  };

  // Helper function to import waypoints from file
  const importWaypointsFromFile = async (file) => {
    try {
      const text = await file.text();
      let waypoints = [];
      
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        waypoints = parseGeoJSON(text);
      } else if (file.name.endsWith('.kml')) {
        waypoints = parseKML(text);
      } else {
        throw new Error('Unsupported file format. Please use GeoJSON or KML files.');
      }
      
      if (waypoints.length === 0) {
        showSnackbar('No valid waypoints found in the file', 'warning');
        return;
      }
      
      // Activate survey mode if not already active
      if (!surveyActive) {
        setSurveyActive(true);
      }
      
      // Add waypoints to the map
      const map = mapRef.current;
      if (!map) {
        showSnackbar('Map not initialized', 'error');
        return;
      }
      
      const newWaypoints = [];
      const newMarkers = {};
      
      waypoints.forEach((wp, index) => {
        const waypointId = `imported-${Date.now()}-${index}`;
        
        // Create waypoint object
        const waypoint = {
          id: waypointId,
          lat: wp.lat,
          lng: wp.lng,
          name: wp.name || `Point ${index + 1}`,
          notes: wp.notes || '',
          image: wp.image || null
        };
        
        newWaypoints.push(waypoint);
        
        // Create marker
        const marker = L.marker([wp.lat, wp.lng]).addTo(map);
        
        // Ensure marker can receive clicks
        marker.on('add', function() {
          const element = this.getElement();
          if (element) {
            element.style.zIndex = '999';
            element.style.pointerEvents = 'auto';
          }
        });
        
        // Add click handler
        marker.on('click', function(e) {
          e.originalEvent.stopPropagation();
          handleSelectWaypoint(waypointId);
        });
        
        newMarkers[waypointId] = marker;
      });
      
      // Update waypoints array with sequential naming
      setWaypoints(prev => {
        const allWaypoints = [...prev, ...newWaypoints];
        // Rename all waypoints sequentially, preserving custom names if they don't match default patterns
        return allWaypoints.map((wp, index) => {
          // Check if name is a default pattern (Point X, Imported Point, etc.)
          const trimmedName = wp.name.trim();
          const isDefaultName = /^(Point|Imported Point)(\s*\d*)?$/i.test(trimmedName) || trimmedName === 'Imported Point';
          return {
            ...wp,
            name: isDefaultName ? `Point ${index + 1}` : wp.name
          };
        });
      });
      
      // Add markers to markersRef
      Object.assign(markersRef.current, newMarkers);
      
      // Select the first imported waypoint and center map
      if (newWaypoints.length > 0) {
        const firstWaypointId = newWaypoints[0].id;
        setTimeout(() => {
          handleSelectWaypoint(firstWaypointId);
          // Center map on all imported waypoints (fit bounds)
          if (newWaypoints.length > 1) {
            const bounds = L.latLngBounds(newWaypoints.map(wp => [wp.lat, wp.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
          } else {
            map.setView([newWaypoints[0].lat, newWaypoints[0].lng], 13);
          }
        }, 100);
      }
      
      showSnackbar(`Imported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''} from ${file.name}`, 'success');
    } catch (error) {
      console.error('Error importing file:', error);
      showSnackbar(error.message || 'Failed to import file. Please check the file format.', 'error');
    }
  };

  // Helper function to update selected marker overlay
  const updateSelectedMarkerOverlay = (waypointId) => {
    if (!mapRef.current) return;
    
    // Remove previous red circleMarker overlay if it exists
    if (selectedMarkerOverlayRef.current) {
      selectedMarkerOverlayRef.current.remove();
      selectedMarkerOverlayRef.current = null;
    }
    
    // If a waypoint is selected, add red circleMarker overlay on top of its default marker
    if (waypointId) {
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        const marker = markersRef.current[waypointId];
        if (marker && mapRef.current) {
          const latlng = marker.getLatLng();
          // Only add overlay for survey waypoints (not navigation or current location)
          const isSurveyWaypoint = waypoints.some(wp => wp.id === waypointId && wp.id !== currentLocationWaypointId);
          if (isSurveyWaypoint) {
            const redOverlay = createSurveyMarker(latlng).addTo(mapRef.current);
            selectedMarkerOverlayRef.current = redOverlay;
            
            // Ensure the underlying marker can still receive clicks
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.style.pointerEvents = 'auto'; // Ensure marker can receive clicks
              markerElement.style.zIndex = '999'; // Keep it below overlay visually but above for events
            }
          }
        }
      }, 10);
    }
  };

  const handleSelectWaypoint = (waypointId) => {
    const waypoint = waypoints.find(wp => wp.id === waypointId);
    if (!waypoint) return;

    // Set selected waypoint
    setSelectedWaypointId(waypointId);
    
    // Update red circleMarker overlay for selected waypoint (use setTimeout to ensure state is updated)
    setTimeout(() => {
      updateSelectedMarkerOverlay(waypointId);
    }, 0);
    
    // Use the actual name from the waypoint object, not recalculated
    setWaypointData({
      name: waypoint.name, // Use the actual name from waypoint object
      lat: waypoint.lat.toFixed(6),
      lng: waypoint.lng.toFixed(6),
      notes: waypoint.notes || '',
      image: waypoint.image || null
    });
  };

  // Handler for "Set Default Location" button
  // This simply finds "Default Location" and calls the same handler as saved waypoints
  const handleSetDefaultLocation = async () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    
    try {
      // Fetch "Default Location" from database
      const existingWaypoints = await waypointsAPI.getAll();
      let defaultWaypoint = existingWaypoints.find(wp => wp.name && wp.name.trim().toLowerCase() === 'default location');
      
      // If "Default Location" doesn't exist, create it at current map center
      if (!defaultWaypoint && mapRef.current) {
        const mapCenter = mapRef.current.getCenter();
        const newDefaultWaypoint = {
          name: 'Default Location',
          lat: mapCenter.lat.toFixed(6),
          lng: mapCenter.lng.toFixed(6),
          notes: 'User-defined default location',
          image: null
        };
        
        const savedWaypoint = await waypointsAPI.create(newDefaultWaypoint);
        defaultWaypoint = savedWaypoint;
      }
      
      if (!defaultWaypoint) {
        showSnackbar('Failed to load or create default location', 'error');
        return;
      }
      
      // Convert database format to waypoint format (same as saved waypoints)
      const waypoint = {
        id: defaultWaypoint.id,
        lat: parseFloat(defaultWaypoint.latitude),
        lng: parseFloat(defaultWaypoint.longitude),
        name: defaultWaypoint.name,
        notes: defaultWaypoint.notes || '',
        image: defaultWaypoint.image_url || null
      };
      
      // Now use the EXACT same code as onSelectWaypoint from saved waypoints
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
        
        // Create marker (default L.marker)
        const marker = L.marker([waypoint.lat, waypoint.lng]).addTo(map);
        
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
    } catch (error) {
      console.error('Error loading default location:', error);
      showSnackbar(error.message || 'Failed to load default location. Please try again.', 'error');
    }
  };

  // Toggle satellite hybrid view
  const handleToggleSatelliteHybrid = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const newMode = !satelliteHybridMode;
    
    // Show loading state
    showSnackbar(newMode ? 'Switching to satellite view...' : 'Switching to map view...', 'info');
    
    // Remove existing layers with proper cleanup
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      } catch (e) {
        console.warn('Error removing tile layer:', e);
      }
    }
    if (labelLayerRef.current) {
      try {
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      } catch (e) {
        console.warn('Error removing label layer:', e);
      }
    }
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
      if (!mapRef.current) return;
      
      setSatelliteHybridMode(newMode);
      
      if (newMode) {
        // Satellite hybrid mode: Use Esri World Imagery with labels
        // Using a more reliable tile server configuration
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 19,
          minZoom: 1,
          tileSize: 256,
          zoomOffset: 0,
          errorTileUrl: '', // Prevent error tiles from showing
          crossOrigin: true
        });
        
        // Add satellite layer first
        satelliteLayer.addTo(map);
        tileLayerRef.current = satelliteLayer;
        
        // Add label layer with slight delay to ensure satellite loads first
        setTimeout(() => {
          if (!mapRef.current) return;
          
          const labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 19,
            minZoom: 1,
            opacity: 0.7, // Semi-transparent labels over satellite
            tileSize: 256,
            zoomOffset: 0,
            errorTileUrl: '',
            crossOrigin: true
          });
          
          labelLayer.addTo(map);
          labelLayerRef.current = labelLayer;
        }, 100);
        
        showSnackbar('Satellite hybrid view enabled', 'success');
      } else {
        // OSM mode: Use current dark/light mode setting
        const tileUrl = darkMode 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
        const tileLayer = L.tileLayer(tileUrl, {
          attribution: '',
          maxZoom: 19,
          errorTileUrl: '',
          crossOrigin: true
        });
        
        tileLayer.addTo(map);
        tileLayerRef.current = tileLayer;
        
        showSnackbar('Map view enabled', 'success');
      }
    }, 50);
  };

  // Helper function to navigate to default location
  const goToDefaultLocation = () => {
    const map = mapRef.current;
    if (!map) return;

    // Set view to default location
    map.setView([defaultLocation.lat, defaultLocation.lng], 15);
    
    // Update coordinates with default location
    setCoordinates({
      lat: defaultLocation.lat.toFixed(6),
      lng: defaultLocation.lng.toFixed(6),
      accuracy: null
    });
    
    // Create a default location marker
    const waypointId = `default-location-${Date.now()}`;
    const defaultLocationWaypoint = {
      id: waypointId,
      lat: defaultLocation.lat,
      lng: defaultLocation.lng,
      name: 'Default Location',
      notes: 'GPS unavailable - using default location',
      image: null
    };
    
    // Add to waypoints array
    setWaypoints([defaultLocationWaypoint]);
    setCurrentLocationWaypointId(waypointId);
    
    // Create marker (default L.marker)
    const marker = L.marker([defaultLocation.lat, defaultLocation.lng]).addTo(map);
    
    // Add click handler to select waypoint
    marker.on('click', function() {
      handleSelectWaypoint(waypointId);
    });
    
    markersRef.current[waypointId] = marker;
    
    // Select this waypoint by default
    setSelectedWaypointId(waypointId);
    setWaypointData({
      name: 'Default Location',
      lat: defaultLocation.lat.toFixed(6),
      lng: defaultLocation.lng.toFixed(6),
      notes: 'GPS unavailable - using default location',
      image: null
    });
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

      // Create marker for starting point (default L.marker)
      const startMarker = L.marker([startLat, startLng]).addTo(mapRef.current);
      navigationStartMarkerRef.current = startMarker;

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

  // Fetch default location from database on mount
  useEffect(() => {
    const fetchDefaultLocation = async () => {
      try {
        const defaultLoc = await waypointsAPI.getDefault();
        setDefaultLocation({
          lat: parseFloat(defaultLoc.latitude),
          lng: parseFloat(defaultLoc.longitude)
        });
      } catch (error) {
        console.error('Error fetching default location:', error);
        // Use fallback if fetch fails
        setDefaultLocation({ lat: 26.516654, lng: 80.231507 });
      }
    };
    fetchDefaultLocation();
  }, []);

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
        const filtered = user?.id
          ? data.filter(
              (wp) =>
                wp.user_id === user.id ||
                wp.userId === user.id ||
                wp.user?.id === user.id
            )
          : data;
        setSavedWaypointsList(filtered);
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
    // Client-side validation: only accept images and size <= 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (!file.type || !file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Only image files allowed', severity: 'error' });
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      setSnackbar({ open: true, message: 'Image too large. Max size is 10MB', severity: 'error' });
      event.target.value = '';
      return;
    }
    // Prevent multiple uploads
    if (imageUploading) return;
    setImageUploading(true);
    let attempt = 0;
    const maxAttempts = 2;

    try {
      // Try upload with a small retry mechanism for transient network errors
      let uploadResult = null;
      while (attempt < maxAttempts) {
        try {
          uploadResult = await uploadAPI.uploadImage(file);
          break;
        } catch (err) {
          attempt += 1;
          console.warn(`Upload attempt ${attempt} failed:`, err);
          // If we've reached max attempts, rethrow to outer catch
          if (attempt >= maxAttempts) throw err;
          // Wait briefly before retrying
          await new Promise((res) => setTimeout(res, 700));
        }
      }
      
      // Update waypoint data with Cloudinary URL
      setWaypointData(prev => ({ ...prev, image: uploadResult.image_url }));
      setSnackbar({ open: true, message: 'Image uploaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error && error.message && error.message.toLowerCase().includes('authentication')) {
        setLoginPromptOpen(true);
        setSnackbar({ open: true, message: 'Please login to upload images', severity: 'error' });
      } else if (error && error.message && error.message.toLowerCase().includes('networkerror')) {
        setSnackbar({ open: true, message: 'Network error: Unable to reach upload server', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to upload image. Please try again.', severity: 'error' });
      }
    }
    finally {
      setImageUploading(false);
      // Reset file input value so same file can be uploaded again if needed
      const input = document.getElementById('image-upload');
      if (input) input.value = '';
    }
  };

  useEffect(() => {
    // initialize map only once
    // Start with default location, will update to user's location if available
    const map = L.map('map', {
      zoomControl: false, // Disable default zoom control
      attributionControl: false, // Disable attribution control
      rotate: true, // Enable map rotation
      touchRotate: true, // Enable rotation with touch gestures (finger/trackpad)
      touchGestures: true, // Enable touch gestures
      rotateControl: false, // Disable rotate control button (only use gestures)
      bearing: 0, // Initial bearing (rotation angle in degrees)
    }).setView([INDIA_CENTER.lat, INDIA_CENTER.lng], 5); // Show India at zoom 5 while detecting GPS (will be updated if geolocation succeeds)
    mapRef.current = map;

    // Initialize tile layer based on satellite hybrid mode
    if (satelliteHybridMode) {
      // Satellite hybrid mode: Esri World Imagery (satellite) + Reference labels
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        minZoom: 1,
        tileSize: 256,
        zoomOffset: 0,
        errorTileUrl: '',
        crossOrigin: true
      });
      
      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;
      
      // Add label layer after a short delay
      setTimeout(() => {
        if (mapRef.current && satelliteHybridMode) {
          const labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 19,
            minZoom: 1,
            opacity: 0.7,
            tileSize: 256,
            zoomOffset: 0,
            errorTileUrl: '',
            crossOrigin: true
          });
          
          labelLayer.addTo(mapRef.current);
          labelLayerRef.current = labelLayer;
        }
      }, 200);
    } else {
      // OSM mode: Use dark/light mode setting
      const tileUrl = darkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '',
        maxZoom: 19,
        errorTileUrl: '',
        crossOrigin: true
      }).addTo(map);
      
      tileLayerRef.current = tileLayer;
    }

    // Try to get user's current location and center map on it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const hasAccuracy = typeof accuracy === 'number' && !Number.isNaN(accuracy);
          
          // If accuracy is reported but is low, log a warning and show a small snackbar
          // Do NOT block or return — still show the live location even if accuracy is poor.
          if (hasAccuracy && accuracy > 100) {
            console.log('Low GPS accuracy detected. Accuracy (m):', accuracy);
            setSnackbar({ open: true, message: `Low GPS accuracy: ±${Math.round(accuracy)}m — location may be imprecise`, severity: 'warning' });
          }
          
          // Set view to current location with zoomed out view (zoom level 12 for city-level view)
          map.setView([latitude, longitude], 15);
          if (isMobile) {
            updateMobileMapHeight();
          }
          
          // Update coordinates with accuracy
          setCoordinates({
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            accuracy: accuracy ? Math.round(accuracy) : null
          });
          
          // Create blue circle marker for live location
          const liveMarker = createLiveLocationMarker([latitude, longitude]).addTo(map);
          liveLocationMarkerRef.current = liveMarker;
          
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
          
          // Create marker (default L.marker)
          const marker = L.marker([latitude, longitude]).addTo(map);
          
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

              // If accuracy becomes low, show a lightweight snackbar warning (non-blocking)
              if (typeof newAccuracy === 'number' && !Number.isNaN(newAccuracy) && newAccuracy > 100) {
                setSnackbar({ open: true, message: `Low GPS accuracy: ±${Math.round(newAccuracy)}m — location may be imprecise`, severity: 'warning' });
              }
              
              // Update live location marker position
              if (liveLocationMarkerRef.current) {
                liveLocationMarkerRef.current.setLatLng([newLat, newLng]);
              } else if (mapRef.current) {
                // Recreate marker if it was removed
                const liveMarker = createLiveLocationMarker([newLat, newLng]).addTo(mapRef.current);
                liveLocationMarkerRef.current = liveMarker;
              }
              
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
              // Remove live location marker if GPS is lost
              if (liveLocationMarkerRef.current) {
                liveLocationMarkerRef.current.remove();
                liveLocationMarkerRef.current = null;
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 1000 // Update every second
            }
          );
        },
        (error) => {
          // If geolocation fails, show GPS warning dialog
          console.log('Geolocation error:', error);
          // Keep map on India center, don't navigate anywhere
          // The map is already set to India center, so we just show the warning
          setGpsWarningOpen(true);
        },
        {
          enableHighAccuracy: true, // Use high accuracy for better location
          timeout: 5000, // Reduced timeout to show warning faster
          maximumAge: 0 // Don't use cached location, get fresh one
        }
      );
    } else {
      // Geolocation not available - show GPS warning dialog
      setGpsWarningOpen(true);
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
        const buttonSize = window.innerWidth < 600 ? '2rem' : '2.125rem';
        const iconSize = window.innerWidth < 600 ? '1rem' : '1.125rem';
        searchButton.style.cssText = `
          width: ${buttonSize};
          height: ${buttonSize};
          line-height: ${buttonSize};
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
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: ${window.innerWidth < 600 ? '0.375rem' : '0.5rem'};">
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
          width: ${buttonSize};
          height: ${buttonSize};
          line-height: ${buttonSize};
          text-align: center;
          display: block;
          background-color: ${darkMode ? '#1e1e1e' : '#fff'};
          color: ${darkMode ? '#fff' : '#333'};
          text-decoration: none;
          border: none;
        `;
        
        // Add Material-UI MyLocation icon as SVG
        const locateIconSize = window.innerWidth < 600 ? '0.984375rem' : '1.09375rem';
        const locateIcon = `
          <svg width="${locateIconSize}" height="${locateIconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: ${window.innerWidth < 600 ? '0.375rem' : '0.4375rem'};">
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
                  
                  // Add marker to map (default L.marker)
                  const marker = L.marker(latlng).addTo(map);
                  
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
                // Show GPS warning dialog
                setGpsWarningOpen(true);
              },
              {
                enableHighAccuracy: true, // Request most accurate location
                timeout: 10000,
                maximumAge: 0
              }
            );
          } else {
            // Geolocation not supported - show GPS warning dialog
            setGpsWarningOpen(true);
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

    // Add drag-and-drop handlers for GeoJSON and KML files
    const mapContainer = map.getContainer();
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Check if dragging a valid file
      const hasGeoFile = Array.from(e.dataTransfer.items || []).some(item => {
        const fileName = item.getAsFile()?.name || '';
        return fileName.endsWith('.geojson') || fileName.endsWith('.json') || fileName.endsWith('.kml');
      });
      if (hasGeoFile) {
        mapContainer.style.opacity = '0.9';
        mapContainer.style.cursor = 'copy';
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      mapContainer.style.opacity = '1';
      mapContainer.style.cursor = '';
    };
    
    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      mapContainer.style.opacity = '1';
      mapContainer.style.cursor = '';
      
      const files = Array.from(e.dataTransfer.files);
      const geoFiles = files.filter(file => 
        file.name.endsWith('.geojson') || 
        file.name.endsWith('.json') || 
        file.name.endsWith('.kml')
      );
      
      if (geoFiles.length === 0) {
        showSnackbar('Please drop a GeoJSON or KML file', 'warning');
        return;
      }
      
      // Process the first file
      await importWaypointsFromFile(geoFiles[0]);
    };
    
    mapContainer.addEventListener('dragover', handleDragOver);
    mapContainer.addEventListener('dragleave', handleDragLeave);
    mapContainer.addEventListener('drop', handleDrop);

    if (isMobile) {
      updateMobileMapHeight();
    }

    // Cleanup function to remove map instance when component unmounts
    return () => {
      // Stop watching position
      if (watchPositionIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
      // Remove live location marker
      if (liveLocationMarkerRef.current) {
        liveLocationMarkerRef.current.remove();
        liveLocationMarkerRef.current = null;
      }
      // Remove drag-and-drop handlers
      mapContainer.removeEventListener('dragover', handleDragOver);
      mapContainer.removeEventListener('dragleave', handleDragLeave);
      mapContainer.removeEventListener('drop', handleDrop);
      map.remove();
    };
  }, [darkMode, satelliteHybridMode]);

  // Update tile layer when dark mode changes (only if not in satellite hybrid mode)
  useEffect(() => {
    if (!mapRef.current || satelliteHybridMode) return;
    
    const map = mapRef.current;
    
    // Check if map container exists and is properly initialized
    const mapContainer = map.getContainer();
    if (!mapContainer || !mapContainer.parentNode) {
      console.warn('Map container not ready, skipping tile layer update');
      return;
    }
    
    // Remove existing tile layer with proper cleanup
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      } catch (e) {
        console.warn('Error removing tile layer:', e);
      }
    }
    
    // Small delay to ensure cleanup
    setTimeout(() => {
      if (!mapRef.current || satelliteHybridMode) return;
      
      // Double-check map is still valid
      const currentMap = mapRef.current;
      const currentContainer = currentMap.getContainer();
      if (!currentContainer || !currentContainer.parentNode) {
        console.warn('Map container not ready after delay, skipping tile layer update');
        return;
      }
      
      // Add new tile layer based on dark mode
      const tileUrl = darkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '',
        maxZoom: 19,
        errorTileUrl: '',
        crossOrigin: true
      });
      
      tileLayer.addTo(currentMap);
      tileLayerRef.current = tileLayer;
    }, 50);
  }, [darkMode, satelliteHybridMode]);

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
      
      // Note: Live coordinates are handled by a separate always-on useEffect
      // This handler is only for survey mode click events

      // Add click event listener to place marker
      const handleMapClick = (e) => {
        // Don't handle clicks if location selection mode is active (it's handled separately)
        if (locationSelectionActive && selectedWaypointId) {
          return;
        }
        
        // Check if click is on an existing marker (marker click events are handled separately)
        // This prevents creating duplicate waypoints when clicking existing markers
        if (e.originalEvent && e.originalEvent.target) {
          // If click originated from a marker, let the marker's click handler deal with it
          const clickedElement = e.originalEvent.target.closest('.leaflet-marker-icon, .leaflet-interactive');
          if (clickedElement) {
            return; // Marker click will be handled by marker's click handler
          }
        }
        
        const latlng = e.latlng;
        
        // Check if there's already a waypoint at this location (within small tolerance)
        const existingWaypoint = waypoints.find(wp => {
          const latDiff = Math.abs(parseFloat(wp.lat) - latlng.lat);
          const lngDiff = Math.abs(parseFloat(wp.lng) - latlng.lng);
          return latDiff < 0.0001 && lngDiff < 0.0001;
        });
        
        if (existingWaypoint) {
          // Select existing waypoint instead of creating new one
          handleSelectWaypoint(existingWaypoint.id);
          return;
        }
        
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
          
          // Add marker to map (default L.marker initially, will turn red when selected)
          const marker = L.marker(latlng).addTo(map);
          
          // Ensure marker can receive clicks even when overlay is on top
          marker.on('add', function() {
            const element = this.getElement();
            if (element) {
              element.style.zIndex = '999'; // Just below overlay but still receives events
              element.style.pointerEvents = 'auto'; // Ensure it can receive clicks
            }
          });
          
          // Add click handler to select waypoint
          marker.on('click', function(e) {
            e.originalEvent.stopPropagation(); // Prevent map click
            handleSelectWaypoint(waypointId);
          });
          
          markersRef.current[waypointId] = marker;
          
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
          
          // Update red circleMarker overlay since it's selected
          setTimeout(() => {
            updateSelectedMarkerOverlay(waypointId);
          }, 0);
          
          // Update red circleMarker overlay since it's selected
          setTimeout(() => {
            updateSelectedMarkerOverlay(waypointId);
          }, 0);
          
          return renamed;
        });
      };

      map.on('click', handleMapClick);
      map.on('dragstart', handleDragStart);
      map.on('dragend', handleDragEnd);

      return () => {
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
      // Remove red overlay when survey is deactivated
      if (selectedMarkerOverlayRef.current) {
        selectedMarkerOverlayRef.current.remove();
        selectedMarkerOverlayRef.current = null;
      }
      // Remove waypoints except current location
      setWaypoints(prev => prev.filter(wp => wp.id === currentLocationWaypointId));
      // Don't clear selection if it's the current location
      if (selectedWaypointId !== currentLocationWaypointId) {
        setSelectedWaypointId(null);
        updateSelectedMarkerOverlay(null);
      }
    }
  }, [surveyActive]);

  // Recalculate map size when mobile padding changes (e.g., waypoint details open)
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => updateMobileMapHeight();
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, selectedWaypointId, sidebarOpen]);

  useEffect(() => {
    if (!mapRef.current || !isMobile) return;
    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    // Wait briefly for layout to settle, then resize and restore center/zoom
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize();
      mapRef.current.setView(currentCenter, currentZoom, { animate: false });
    }, 140);
    return () => clearTimeout(timer);
  }, [mapDynamicHeight, isMobile]);

  // Handle location selection mode
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const mapContainer = map.getContainer();
    
    if (locationSelectionActive && selectedWaypointId) {
      // Set cursor for location selection (different from survey mode)
      mapContainer.style.cursor = 'cell';
      customCursorRef.current = 'cell';

      // Handle map drag events
      const handleDragStart = () => {
        mapContainer.style.cursor = 'grabbing';
      };

      const handleDragEnd = () => {
        mapContainer.style.cursor = 'cell';
      };

      // Add mouse move event listener to update waypoint coordinates in real-time
      const handleMouseMove = (e) => {
        const latlng = map.mouseEventToLatLng(e.originalEvent);
        // Update waypoint data coordinates as cursor moves
        setWaypointData(prev => ({
          ...prev,
          lat: latlng.lat.toFixed(6),
          lng: latlng.lng.toFixed(6)
        }));
      };

      // Add click event listener to set location and deactivate
      const handleMapClick = (e) => {
        const latlng = e.latlng;
        
        // Update the selected waypoint's coordinates to the clicked location
        setWaypointData(prev => ({
          ...prev,
          lat: latlng.lat.toFixed(6),
          lng: latlng.lng.toFixed(6)
        }));

        // Update waypoint in array
        setWaypoints(prev => prev.map(wp => 
          wp.id === selectedWaypointId 
            ? { ...wp, lat: latlng.lat, lng: latlng.lng }
            : wp
        ));

        // Update marker position if it exists
        const marker = markersRef.current[selectedWaypointId];
        if (marker) {
          marker.setLatLng(latlng);
        }

        // Deactivate location selection mode immediately
        setLocationSelectionActive(false);
        
        // Restore cursor based on survey mode
        if (surveyActive) {
          mapContainer.style.cursor = 'crosshair';
          customCursorRef.current = 'crosshair';
            } else {
          mapContainer.style.cursor = '';
          customCursorRef.current = null;
        }
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
        // Restore cursor based on survey mode when location selection deactivates
        if (surveyActive) {
          mapContainer.style.cursor = 'crosshair';
          customCursorRef.current = 'crosshair';
        } else {
          mapContainer.style.cursor = '';
          customCursorRef.current = null;
        }
      };
    } else {
      // When location selection is not active, restore cursor based on survey mode
      if (surveyActive) {
        mapContainer.style.cursor = 'crosshair';
        customCursorRef.current = 'crosshair';
      } else {
        mapContainer.style.cursor = '';
        customCursorRef.current = null;
      }
    }
  }, [locationSelectionActive, selectedWaypointId, surveyActive]);

  // Update live coordinates based on device type
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const updateCenterCoordinates = () => {
      const center = map.getCenter();
      setCoordinates({
        lat: center.lat.toFixed(6),
        lng: center.lng.toFixed(6),
        accuracy: null
      });
    };

    if (hasCursor) {
      // Desktop: Update coordinates on mouse move
      const handleMouseMove = (e) => {
        const latlng = map.mouseEventToLatLng(e.originalEvent);
        setCoordinates({
          lat: latlng.lat.toFixed(6),
          lng: latlng.lng.toFixed(6),
          accuracy: null
        });
      };

      map.on('mousemove', handleMouseMove);

      return () => {
        map.off('mousemove', handleMouseMove);
      };
    } else {
      // Touch device: Update coordinates based on map center
      updateCenterCoordinates();
      
      // Update on map move/zoom (use move event for real-time updates during drag)
      map.on('move', updateCenterCoordinates);
      map.on('moveend', updateCenterCoordinates);
      map.on('zoomend', updateCenterCoordinates);

      return () => {
        map.off('move', updateCenterCoordinates);
        map.off('moveend', updateCenterCoordinates);
        map.off('zoomend', updateCenterCoordinates);
      };
    }
  }, [hasCursor]); // Re-run when hasCursor changes

  // Update red overlay when selected waypoint changes
  useEffect(() => {
    // Use a small delay to ensure markers are properly initialized and state is updated
    const timer = setTimeout(() => {
      updateSelectedMarkerOverlay(selectedWaypointId);
    }, 50);
    
    return () => clearTimeout(timer);
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
          onSetDefaultLocation={handleSetDefaultLocation}
          onToggleSatelliteHybrid={handleToggleSatelliteHybrid}
          satelliteHybridMode={satelliteHybridMode}
        />
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
        onMenuItemClick={handleMenuItemClick}
      />
      {isMobile && (
        <IconButton
          onClick={handleSidebarToggle}
          sx={{
            position: 'fixed',
            top: '3.5rem',
            left: '0.75rem',
            zIndex: theme.zIndex.drawer + 15,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.45)'
              : '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
          size="small"
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          height: '100vh',
          overflow: 'hidden',
          marginTop: { xs: '3.0625rem', sm: '3.5rem' },
          width: '100%',
          position: 'relative',
        }}
      >
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: isMobile && mapDynamicHeight ? `${mapDynamicHeight}px` : '100%',
            overflow: 'hidden',
          }}
        >
          <Box 
            id="map" 
            sx={{ 
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />
          
          {/* Center crosshair for touch devices - relative to map area */}
          {!hasCursor && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '1px',
                height: { xs: '24px', sm: '30px' },
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                zIndex: theme.zIndex.drawer + 1,
                pointerEvents: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '24px', sm: '30px' },
                  height: '1px',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                }
              }}
            />
          )}
        </Box>
        
        {/* Live Coordinates card - always visible */}
        <LiveCoordinates coordinates={coordinates} sidebarOpen={sidebarOpen} ref={liveCoordsRef} />

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
                  setLocationSelectionActive(false); // Deactivate location selection when closing
                  // Remove route when closing waypoint details
                }}
                onSave={handleSaveWaypoint}
                locationSelectionActive={locationSelectionActive}
                onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
                onDelete={handleDeleteWaypoint}
                onImageUpload={handleImageUpload}
                imageUploading={imageUploading}
                savedWaypoints={savedWaypointsList}
                onNavigate={handleNavigate}
                sidebarOpen={sidebarOpen}
                ref={waypointDetailsRef}
              />
            )}
          </>
        )}
        
        {/* Desktop waypoint details - fixed position */}
        {selectedWaypointId && !isMobile && (
          <WaypointDetails
            selectedWaypointId={selectedWaypointId}
            waypointData={waypointData}
            setWaypointData={setWaypointData}
            onClose={() => {
              setSelectedWaypointId(null);
              setWaypointData({ name: '', lat: '', lng: '', notes: '', image: null });
              setLocationSelectionActive(false); // Deactivate location selection when closing
              updateSelectedMarkerOverlay(null);
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
                }}
                onSave={handleSaveWaypoint}
            locationSelectionActive={locationSelectionActive}
            onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
                onDelete={handleDeleteWaypoint}
                onImageUpload={handleImageUpload}
                imageUploading={imageUploading}
                savedWaypoints={savedWaypointsList}
                onNavigate={handleNavigate}
                currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : null}
            sidebarOpen={sidebarOpen}
              />
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
              setLocationSelectionActive(false); // Deactivate location selection when closing
              updateSelectedMarkerOverlay(null);
            }}
            onSave={handleSaveWaypoint}
            locationSelectionActive={locationSelectionActive}
            onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
            onDelete={() => {
              // Don't allow deleting the current location marker
              showSnackbar('Cannot delete current location marker', 'info');
            }}
            onImageUpload={handleImageUpload}
            imageUploading={imageUploading}
            savedWaypoints={savedWaypointsList}
            onNavigate={handleNavigate}
            currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : null}
            sidebarOpen={sidebarOpen}
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
            
            // Clear previous selection and red circle overlay
            const previousSelectedId = selectedWaypointId;
            if (previousSelectedId) {
              updateSelectedMarkerOverlay(null);
              setSelectedWaypointId(null);
            }
            
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
              
              // Create marker (default L.marker)
              const marker = L.marker([waypoint.lat, waypoint.lng]).addTo(map);
              
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
        <GPSWarningDialog
          open={gpsWarningOpen}
          onClose={() => setGpsWarningOpen(false)}
          onContinue={goToDefaultLocation}
        />

        {/* Hidden file input for importing GeoJSON/KML files */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,.kml"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>
    </Box>
    </ThemeProvider>
  )
}

export default App;
