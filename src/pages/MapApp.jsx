import { useEffect, useState, useRef, useCallback } from 'react'
// import { Capacitor } from '@capacitor/core';
import * as turf from '@turf/turf'
import '../App.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
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
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { AddLocation, MyLocation, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LiveCoordinates from '../components/LiveCoordinates';
import WaypointDetails from '../components/WaypointDetails';
import WaypointSelector from '../components/WaypointSelector';
import SavedPoints from '../components/SavedPoints';
import StartSurveyDialog from '../components/StartSurveyDialog';
import ExportDialog from '../components/ExportDialog';
import CRSConverterDialog from '../components/CRSConverterDialog';
import MeasureToolbar from '../components/MeasureToolbar';
import CustomSnackbar from '../components/Snackbar';
import { waypointsAPI, uploadAPI, projectsAPI, tracksAPI } from '../services/api';
import { createAppTheme } from '../theme/theme.js';
import { useAuth } from '../context/AuthContext';
import LoginPromptDialog from '../components/LoginPromptDialog';
import GPSWarningDialog from '../components/GPSWarningDialog';
import BottomSheet from '../components/BottomSheet';

// Import utilities
import { formatTime } from '../utils/formatUtils';
import { createSurveyMarker, createLiveLocationMarker, updateMobileMapHeight } from '../utils/mapUtils';
import { parseGeoJSON, parseKML } from '../utils/fileUtils';
import { startTimerFromProject, stopTimer } from '../utils/projectUtils';
import { decodePolyline } from '../utils/navigationUtils';
import { GPSTracker } from '../utils/gpsTracker';
import { INDIA_CENTER, drawerWidth, drawerCollapsedWidth } from '../constants/mapConstants';
import { addWatermarkToImage } from '../utils/watermarkUtils';
import { saveToNativeGallery } from '../utils/nativeUtils';

// Ensure default Leaflet markers load correctly when bundled (e.g., on Vercel)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [singlePointCaptureActive, setSinglePointCaptureActive] = useState(false);
  const [previewModeActive, setPreviewModeActive] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0, accuracy: null, elevation: null });
  const [cursorCoordinates, setCursorCoordinates] = useState({ lat: 0, lng: 0, accuracy: null });
  const [currentLocationWaypointId, setCurrentLocationWaypointId] = useState(null);
  const currentLocationWaypointRef = useRef(null);
  useEffect(() => { currentLocationWaypointRef.current = currentLocationWaypointId; }, [currentLocationWaypointId]);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [waypoints, setWaypoints] = useState([]); // Array of { id, lat, lng, name, notes, image }
  const [waypointData, setWaypointData] = useState({ name: '', lat: '', lng: '', notes: '', images: [] });
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
  const [gpsWarningShown, setGpsWarningShown] = useState(false); // Track if GPS warning has been shown
  const [gpsRequiredForSurvey, setGpsRequiredForSurvey] = useState(false); // Track if GPS is required for current operation
  const [gpsActive, setGpsActive] = useState(false); // Whether device GPS watch is active
  const [locationSelectionActive, setLocationSelectionActive] = useState(false); // Location selection mode state
  const [pinModeActive, setPinModeActive] = useState(false); // pin behavior: allow adding non-project waypoint during survey

  const [startSurveyDialogOpen, setStartSurveyDialogOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null); // { id, name }
  const [projectRecording, setProjectRecording] = useState(false);
  const recordingIntervalRef = useRef(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const [waypointDetailsOpen, setWaypointDetailsOpen] = useState(false);
  const [projectBarExpanded, setProjectBarExpanded] = useState(true);
  const projectBarRef = useRef(null);
  const infoBoxRef = useRef(null);
  const optionsRef = useRef(null);
  const [collapsedWidth, setCollapsedWidth] = useState(null);
  const [expandedWidth, setExpandedWidth] = useState(null);
  const [projectBarWidth, setProjectBarWidth] = useState(null);
  const [autoPausedPromptShown, setAutoPausedPromptShown] = useState(false);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [endProjectDialogOpen, setEndProjectDialogOpen] = useState(false); // Confirmation dialog for ending project
  const [exitProjectWarningOpen, setExitProjectWarningOpen] = useState(false); // Warning dialog for restricted actions during project
  const [satelliteHybridMode, setSatelliteHybridMode] = useState(true); // Satellite hybrid view mode
  const [crsConverterOpen, setCrsConverterOpen] = useState(false); // CRS Converter dialog state
  const [measureActive, setMeasureActive] = useState(false);
  const [hasMeasureSelection, setHasMeasureSelection] = useState(false);
  const measurementLabelsRef = useRef(new L.LayerGroup());
  const drawControlRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const [defaultLocation, setDefaultLocation] = useState(INDIA_CENTER);

  // GPS Tracking (using GPSTracker class)
  const gpsTrackerRef = useRef(null); // Reference to GPSTracker instance
  const loadedTracksRef = useRef([]); // Array of loaded track polylines for cleanup

  // Refs to track state for async/timeout usage (prevent stale closures)
  const waypointsRef = useRef(waypoints);
  const activeProjectRef = useRef(activeProject);
  const isProjectModeRef = useRef(isProjectMode);
  const loadingProjectRef = useRef(false); // Lock to prevent clearing map while loading project

  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);
  useEffect(() => { activeProjectRef.current = activeProject; }, [activeProject]);
  useEffect(() => { isProjectModeRef.current = isProjectMode; }, [isProjectMode]);

  const dbWaypointIdsRef = useRef(dbWaypointIds);
  useEffect(() => { dbWaypointIdsRef.current = dbWaypointIds; }, [dbWaypointIds]);

  // Image Upload Queue
  const uploadQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
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

  // --- Map Action Handlers (Search & Locate) ---
  const handleMapSearch = (query) => {
    if (query && query.trim()) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const map = mapRef.current;
            if (map) {
              map.setView([parseFloat(lat), parseFloat(lon)], 13);
              showSnackbar(`Found: ${data[0].display_name}`, 'success');
            }
          } else {
            showSnackbar('Location not found. Please try a different search term.', 'error');
          }
        })
        .catch(error => {
          console.error('Search error:', error);
          showSnackbar('Search failed. Please try again.', 'error');
        });
    }
  };

  const handleMapLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const accuracy = position.coords.accuracy || 0;
          const map = mapRef.current;

          if (map) {
            map.flyTo([latitude, longitude], 15, {
              animate: true,
              duration: 1.5
            });

            // Activate survey mode if not already active to allow waypoint insertion
            setSinglePointCaptureActive(prev => (!prev ? true : prev));
            setPreviewModeActive(false);

            // Brief delay to ensure state updates if we were in a different mode
            setTimeout(() => {
              const waypointId = `waypoint-${Date.now()}`;
              const latlng = [latitude, longitude];

              const newWaypoint = {
                id: waypointId,
                lat: latitude,
                lng: longitude,
                name: 'My Location',
                notes: '',
                images: []
              };

              // Add to state and refs
              setWaypoints(prev => [...prev, newWaypoint]);

              const marker = L.marker(latlng).addTo(map);
              marker.on('click', (e) => {
                e.originalEvent?.stopPropagation?.();
                handleSelectWaypoint(waypointId);
              });
              markersRef.current[waypointId] = marker;

              setCoordinates({
                lat: latitude.toFixed(6),
                lng: longitude.toFixed(6),
                accuracy: accuracy.toFixed(1),
                elevation: position.coords.altitude ? position.coords.altitude.toFixed(1) : null
              });

              setSelectedWaypointId(waypointId);
              setWaypointData({
                name: 'My Location',
                lat: latitude.toFixed(6),
                lng: longitude.toFixed(6),
                notes: '',
                images: []
              });
              setWaypointDetailsOpen(true);

              // Auto-save My Location to DB if authenticated
              if (isAuthenticated) {
                const waypointPayload = {
                  name: 'My Location',
                  lat: latitude,
                  lng: longitude,
                  notes: '',
                  images: [],
                  elevation: position.coords.altitude || null,
                  project_id: isProjectMode ? activeProject?.id : null,
                  project_name: isProjectMode ? activeProject?.name : null
                };

                waypointsAPI.create(waypointPayload).then(saved => {
                  setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
                  showSnackbar('Location saved to database!', 'success');
                }).catch(err => {
                  console.error('Error auto-saving My Location:', err);
                });
              }

              showSnackbar(`Location found! Accuracy: ${Math.round(accuracy)}m`, 'success');
            }, 500); // Increased delay slightly to allow flyTo to progress
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          showSnackbar('Unable to get your location. Please check GPS settings.', 'error');
          setGpsWarningOpen(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showSnackbar('Geolocation is not supported by your browser', 'error');
    }
  };
  const liveCoordsRef = useRef(null); // Measure live coordinates card height (mobile)
  const waypointDetailsRef = useRef(null); // Measure waypoint details card height (mobile)
  const [mapDynamicHeight, setMapDynamicHeight] = useState(null);
  const theme = createAppTheme(darkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useAuth();
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const bottomSheetRef = useRef(null);

  useEffect(() => {
    setProjectBarExpanded(isMobile ? false : true);
  }, [isMobile]);

  // Compute which waypoints should be shown in the top selector
  let selectorWaypoints = [];
  if (isProjectMode) {
    // In project mode show only points that belong to this project or that were created during this session/project (or are following live GPS)
    selectorWaypoints = waypoints.filter(wp => (
      (wp.project_id && activeProject && String(wp.project_id) === String(activeProject.id)) ||
      wp.createdDuringProject ||
      wp.followsLive
    ));
  } else {
    // Outside project mode show all plotted waypoints
    selectorWaypoints = [...waypoints];
  }

  // Deduplicate waypoints for selector (avoid duplicate names/entries for same lat/lng)
  const seen = new Map();
  selectorWaypoints = selectorWaypoints.filter(wp => {
    const key = `${parseFloat(wp.lat).toFixed(6)}:${parseFloat(wp.lng).toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });

  // Rebuild markers on map according to mode (project mode shows only project's points + live location)
  const clearAllMarkers = () => {
    // 1. Clear via ref (cleanup knowns)
    try {
      Object.keys(markersRef.current).forEach(id => {
        try { markersRef.current[id].remove(); } catch (e) { }
        delete markersRef.current[id];
      });
    } catch (e) { console.error('Error clearing markers ref:', e); }

    // 2. Clear selected overlay
    if (selectedMarkerOverlayRef.current) {
      try { selectedMarkerOverlayRef.current.remove(); } catch (e) { }
      selectedMarkerOverlayRef.current = null;
    }

    // 3. Nuclear sweep: iterate map layers to remove any ghost markers
    if (mapRef.current) {
      // Get all legitimate marker instances from markersRef
      const legitimateMarkers = new Set(Object.values(markersRef.current));

      mapRef.current.eachLayer((layer) => {
        // Skip base tile layers
        if (layer instanceof L.TileLayer) return;

        // Skip the live location marker
        if (liveLocationMarkerRef.current && layer === liveLocationMarkerRef.current) return;

        // Remove Markers (pins) and CircleMarkers (overlays)
        // Also remove Polylines (routes) to ensure clean slate, BUT preserve the live GPS track and current navigation route
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
          // Exclude legitimate waypoint markers that are tracked in markersRef
          if (layer instanceof L.Marker && legitimateMarkers.has(layer)) {
            return;
          }

          // Exclude live GPS track polyline if it exists
          if (gpsTrackerRef.current && gpsTrackerRef.current.polyline && layer === gpsTrackerRef.current.polyline) {
            return;
          }

          // Exclude loaded project tracks (and their segments)
          if (loadedTracksRef.current.includes(layer) || layer.isTrackSegment) {
            return;
          }

          // Exclude current navigation route polyline
          if (routePolylineRef.current && layer === routePolylineRef.current) {
            return;
          }

          try { layer.remove(); } catch (e) { }
        }
      });
    }
  };

  const addMarkerForWaypoint = (wp) => {
    const map = mapRef.current;
    if (!map) return null;
    try {
      const marker = L.marker([parseFloat(wp.lat), parseFloat(wp.lng)]).addTo(map);
      marker.on('click', function (e) {
        e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
        handleSelectWaypoint(wp.id);
      });
      // ensure marker element receives pointer events
      marker.on('add', function () {
        const element = this.getElement();
        if (element) {
          element.style.zIndex = '999';
          element.style.pointerEvents = 'auto';
        }
      });
      markersRef.current[wp.id] = marker;
      return marker;
    } catch (e) {
      console.error('Error creating marker for waypoint', wp, e);
      return null;
    }
  };

  const refreshMapMarkers = (wps = waypointsRef.current, isProj = isProjectModeRef.current, activeProj = activeProjectRef.current) => {
    const map = mapRef.current;
    if (!map) return;

    clearAllMarkers();

    // Add only project waypoints in project mode, otherwise add all
    const itemsToAdd = (isProj && activeProj && activeProj.id)
      ? wps.filter(wp => wp.project_id && String(wp.project_id) === String(activeProj.id))
      : wps;

    itemsToAdd.forEach(wp => addMarkerForWaypoint(wp));
    // add live location marker
    try {
      if (liveLocationMarkerRef.current) {
        liveLocationMarkerRef.current.remove();
        liveLocationMarkerRef.current = null;
      }
      if (coordinates && coordinates.lat && coordinates.lng) {
        liveLocationMarkerRef.current = createLiveLocationMarker([coordinates.lat, coordinates.lng]).addTo(map);
      }
    } catch (e) { console.error('Error adding live marker:', e); }
    // If current selected waypoint is not part of visible markers, clear selection
    if (selectedWaypointId) {
      const stillVisible = Object.keys(markersRef.current).includes(selectedWaypointId);
      if (!stillVisible) {
        setSelectedWaypointId(null);
        setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
      }
    }
    // ensure selected overlay is updated
    updateSelectedMarkerOverlay(selectedWaypointId);
  };

  // Universal function to clear everything but the live location
  const resetMapAndState = () => {
    // 1. Clear waypoints state (clears selector bar and effectively the React representation of points)
    setWaypoints([]);

    // 2. Clear all marker instances from the map
    clearAllMarkers();

    // 3. Clear GPS tracks
    clearGPSTrack();

    // 4. Clear other relevant UI states
    setDbWaypointIds({});
    setSelectedWaypointId(null);
    setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
    updateSelectedMarkerOverlay(null);
    setCurrentLocationWaypointId(null);

    // Note: Live location marker (liveLocationMarkerRef) is separate from markersRef 
    // and is NOT cleared by clearAllMarkers(), so it stays.

    // Update refs immediately to reflect cleared state
    waypointsRef.current = [];
  };

  // Detect if device has cursor (mouse/trackpad) or is touch-only
  // Use pointer media query to detect if primary input is a fine pointer (mouse/trackpad)
  const [hasCursor, setHasCursor] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Check if the primary pointing device is precise (mouse/trackpad)
    // pointer: fine = mouse/trackpad, pointer: coarse = touch
    return window.matchMedia('(pointer: fine)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkCursor = () => {
      // Re-check if primary pointing device is precise
      setHasCursor(window.matchMedia('(pointer: fine)').matches);
    };
    // Listen for changes (e.g., when external mouse is connected/disconnected)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    mediaQuery.addEventListener('change', checkCursor);
    window.addEventListener('resize', checkCursor);
    return () => {
      mediaQuery.removeEventListener('change', checkCursor);
      window.removeEventListener('resize', checkCursor);
    };
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

  // Start Survey handlers
  const handleStartSurveyNew = async (project) => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      setStartSurveyDialogOpen(false);
      return;
    }

    // Set active project FIRST - update both state and ref immediately
    const projectInfo = { id: project.id, name: project.name };
    setActiveProject(projectInfo);
    activeProjectRef.current = projectInfo; // Update ref immediately for synchronous access
    setIsProjectMode(true);
    isProjectModeRef.current = true; // Update ref immediately
    // Clear everything before starting fresh project survey
    resetMapAndState();

    // Remove previously-staged single-point captures so only project points remain visible
    removePinCapturedPoints();
    setWaypointDetailsOpen(true);
    setSinglePointCaptureActive(false);
    setProjectRecording(true);
    setStartSurveyDialogOpen(false);
    showSnackbar(`Started project: ${project.name}`, 'success');

    // Persist state and save Start Point
    try {
      // Set project status to playing FIRST
      await projectsAPI.setStatus(project.id, 'playing');

      // Start GPS tracking for new project
      startGPSTracking(project.id);

      console.log('Waiting for GPS coordinates...', coordinates);

      // Wait for GPS coordinates to be available
      let attempts = 0;
      const maxAttempts = 30; // 6 seconds total (more generous wait for initial lock)
      while ((!coordinates?.lat || !coordinates?.lng) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
        console.log(`Attempt ${attempts}: coordinates =`, coordinates);
      }

      console.log('Final coordinates check:', coordinates);

      // Auto-save Start Point with current GPS location
      if (coordinates?.lat && coordinates?.lng) {
        console.log('Saving Start Point with coordinates:', coordinates);

        // Directly save the waypoint with project ID
        const lat = parseFloat(coordinates.lat);
        const lng = parseFloat(coordinates.lng);
        const waypointId = `wp-${Date.now()}`;

        try {
          const saved = await waypointsAPI.create({
            name: 'Start Point',
            lat: lat,
            lng: lng,
            notes: '',
            project_id: project.id,
            elevation: coordinates.elevation || null
          });

          // Add to local state
          const waypoint = {
            id: waypointId,
            name: 'Start Point',
            lat,
            lng,
            notes: '',
            images: [],
            project_id: project.id,
            project_name: project.name,
            elevation: saved.elevation || coordinates.elevation || null
          };

          setWaypoints(prev => [...prev, waypoint]);

          // Create marker
          const map = mapRef.current;
          if (map) {
            const marker = L.marker([lat, lng]).addTo(map);
            marker.on('click', function () { handleSelectWaypoint(waypointId); });
            markersRef.current[waypointId] = marker;
          }

          setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
          console.log('Start Point saved successfully');
          showSnackbar('Start Point saved', 'success');
        } catch (err) {
          console.error('Error saving Start Point:', err);
          showSnackbar('Error saving Start Point: ' + err.message, 'error');
        }
      } else {
        console.log('GPS not available after waiting');
        showSnackbar('GPS not available, Start Point not saved', 'warning');
      }
    } catch (err) {
      console.error('Error setting project to playing or saving Start Point:', err);
      showSnackbar('Error initializing project: ' + err.message, 'error');
    }

    // Clear selection so details default to current location
    setSelectedWaypointId(null);
    // Ensure markers are filtered for project mode
    setTimeout(() => refreshMapMarkers(), 50);
    // For mobile, start collapsed
    setProjectBarExpanded(isMobile ? false : true);
  };

  const handleStartSurveyContinue = (project) => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      setStartSurveyDialogOpen(false);
      return;
    }
    setActiveProject({ id: project.id, name: project.name });
    setIsProjectMode(true);
    // Clear everything before loading resumed project
    resetMapAndState();

    // Remove previously-staged single-point captures so only project points remain visible
    removePinCapturedPoints();
    setWaypointDetailsOpen(true);
    setSinglePointCaptureActive(false);
    setProjectRecording(true);
    setStartSurveyDialogOpen(false);
    showSnackbar(`Loaded project: ${project.name}`, 'info');

    // Load project tracks (GPS paths)
    loadProjectTracks(project.id);

    // Start GPS tracking for resumed project
    startGPSTracking(project.id);

    // Load project waypoints onto map (no Start Point for resumed projects)
    (async () => {
      try {
        const detail = await projectsAPI.getById(project.id);
        if (!detail || !detail.waypoints) return;
        // Populate waypoints to map and state
        loadProjectWaypointsToMap(detail, project);
        // Persist to backend that project is playing
        try {
          await projectsAPI.setStatus(project.id, 'playing');
          // start timer
          startTimerFromProject(detail.project);
        } catch (err) { console.error('Error setting project to playing:', err); }
        // Clear any previous selection so waypoint details show current location by default
        setSelectedWaypointId(null);
      } catch (err) {
        console.error('Error loading project waypoints:', err);
      }
    })();
    // After loading, ensure markers are filtered to project
    setTimeout(() => refreshMapMarkers(), 100);
    // For mobile, start collapsed
    setProjectBarExpanded(isMobile ? false : true);
  };

  const handleStopProject = () => {
    // Show themed confirmation dialog
    setEndProjectDialogOpen(true);
  };

  const confirmEndProject = async () => {
    setEndProjectDialogOpen(false);

    // Check if End Point already exists
    const hasEndPoint = waypoints.some(
      wp => wp.project_id === activeProject?.id && wp.name === 'End Point'
    );

    // Save end point for project only if it doesn't exist
    if (!hasEndPoint) {
      try {
        // Pass explicit project details to avoid race conditions with activeProject state
        await createProjectWaypoint('End Point', activeProject?.id, activeProject?.name);
      } catch (err) {
        console.error('Error saving end point:', err);
      }
    }

    // Stop GPS tracking and finalize track
    await stopGPSTracking();

    // Update backend status
    try {
      if (activeProject && activeProject.id) {
        await projectsAPI.setStatus(activeProject.id, 'ended');
      }
    } catch (err) {
      console.error('Error setting project to ended:', err);
    }
    setActiveProject(null);
    setIsProjectMode(false);
    setProjectRecording(false);
    setProjectBarExpanded(false);
    // Stop auto-recording if running
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    // Stop timer
    stopTimer();
    showSnackbar('Project ended', 'info');
    setSinglePointCaptureActive(true); // Keep UI visible for viewing
    setPreviewModeActive(true); // Enable viewing mode
  };

  const handleToggleRecording = () => {
    const newVal = !projectRecording;
    setProjectRecording(newVal);
    showSnackbar(newVal ? 'Recording started' : 'Recording paused', 'info');
  };

  const handleStartRecording = async () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    if (!isProjectMode || !activeProject) {
      showSnackbar('Start or load a project first', 'error');
      return;
    }

    // Request background location permission on Android (dynamic import to avoid build errors)
    /* try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');
          const permission = await BackgroundGeolocation.requestPermissions();
          console.log('Background location permission:', permission);

          if (permission?.location !== 'granted') {
            // Show guidance to user
            const userConfirmed = window.confirm(
              "Background location access is required for continuous tracking.\n\n" +
              "Please follow these steps:\n" +
              "1. Tap 'Settings' when prompted\n" +
              "2. Go to Permissions → Location\n" +
              "3. Select 'Allow all the time'\n\n" +
              "Tap OK to open settings, or Cancel to continue without background tracking."
            );

            if (userConfirmed) {
              showSnackbar('Please enable "Allow all the time" in location permissions', 'warning');
            } else {
              showSnackbar('Background tracking may not work without "Allow all the time" permission', 'warning');
            }
          } else {
            showSnackbar('Background location permission granted', 'success');
          }
        } catch (error) {
          console.error('Error requesting background location permission:', error);
          showSnackbar('Failed to request location permission', 'error');
        }
      }
    } catch (error) {
      // Capacitor not available (web build), continue normally
      console.log('Running on web, skipping native permission request');
    } */

    // Remove any previously marked single-point capture points (non-project pin points)
    removePinCapturedPoints();

    setProjectRecording(true);

    // Start or resume GPS tracking
    console.log('[GPS] Checking GPS tracker ref:', gpsTrackerRef.current);
    if (gpsTrackerRef.current) {
      // Resume existing track
      console.log('[GPS] Resuming existing track');
      resumeGPSTracking();
    } else {
      // Start new track
      console.log('[GPS] Starting new track for project:', activeProject.id);
      startGPSTracking(activeProject.id);
    }

    // Persist server status
    projectsAPI.setStatus(activeProject.id, 'playing')
      .then(updated => {
        // start timer from updated project info
        if (updated) startTimerFromProject(updated);
      })
      .catch(err => console.error('setStatus playing err', err));
    showSnackbar('Recording started', 'info');
    // immediate heartbeat to ensure server touches last_activity and checkpoints
    if (activeProject && activeProject.id) {
      projectsAPI.heartbeat(activeProject.id).catch(() => { });
    }
  };

  // Remove points created by single-point capture that are not associated with any project
  const removePinCapturedPoints = () => {
    if (!waypoints || waypoints.length === 0) return;
    const toRemove = waypoints.filter(wp => wp.pinCaptured && !wp.project_id).map(wp => wp.id);
    if (!toRemove.length) return;

    // Remove markers from map
    toRemove.forEach(id => {
      try {
        if (markersRef.current && markersRef.current[id]) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      } catch (e) { }
    });

    // Remove from DB id map
    setDbWaypointIds(prev => {
      const copy = { ...prev };
      toRemove.forEach(id => { delete copy[id]; });
      return copy;
    });

    // Clear selection if it was one of the removed
    if (selectedWaypointId && toRemove.includes(selectedWaypointId)) {
      setSelectedWaypointId(null);
      setWaypointDetailsOpen(false);
    }

    // Finally update waypoints state to remove them
    setWaypoints(prev => prev.filter(wp => !toRemove.includes(wp.id)));
  };

  // Helper used by continue and mount to load project's waypoints into state/map
  const loadProjectWaypointsToMap = (detail, project) => {
    try {
      if (!detail || !detail.waypoints || detail.waypoints.length === 0) return;
      const map = mapRef.current;
      const newWaypoints = [];
      const newDbMapping = {};
      const newMarkers = {};

      detail.waypoints.forEach((wp, idx) => {
        const localId = `project-${project.id}-${wp.id}`;
        newWaypoints.push({
          id: localId,
          lat: parseFloat(wp.latitude),
          lng: parseFloat(wp.longitude),
          name: wp.name || `Point ${idx + 1}`,
          notes: wp.notes || '',
          images: wp.images || [],
          project_id: wp.project_id || project.id,
          project_name: wp.project_name || project.name,
          elevation: wp.elevation
        });
        newDbMapping[localId] = wp.id;
        if (map) {
          const marker = L.marker([parseFloat(wp.latitude), parseFloat(wp.longitude)]).addTo(map);
          marker.on('click', function () { handleSelectWaypoint(localId); });
          newMarkers[localId] = marker;
        }
      });

      setDbWaypointIds((prev) => ({ ...prev, ...newDbMapping }));
      setWaypoints((prev) => {
        const existingDbIds = new Set(Object.values(dbWaypointIds));
        const filtered = newWaypoints.filter((wp) => !existingDbIds.has(newDbMapping[wp.id]));
        const updated = [...prev, ...filtered];
        waypointsRef.current = updated; // Update ref immediately to avoid marker disappearance
        return updated;
      });
      Object.assign(markersRef.current, newMarkers);
      // Fit map to loaded project waypoints
      if (map && newWaypoints.length > 0) {
        const bounds = L.latLngBounds(newWaypoints.map((w) => [w.lat, w.lng]));
        try { map.fitBounds(bounds, { padding: [50, 50] }); } catch (e) { /* ignore */ }
      }
    } catch (err) { console.error('Error populating project waypoints:', err); }
  };

  const handlePauseRecording = () => {
    setProjectRecording(false);

    // Pause GPS tracking
    pauseGPSTracking();

    // Persist server status
    if (activeProject && activeProject.id) {
      projectsAPI.setStatus(activeProject.id, 'paused')
        .then(updated => {
          if (updated) {
            // set timer to the returned elapsed_seconds and stop
            setTimerSeconds(updated.elapsed_seconds || 0);
            stopTimer();
          }
        })
        .catch(err => console.error('setStatus paused err', err));
    }
    showSnackbar('Recording paused', 'info');
  };

  // Exit survey mode locally (keep project paused/ended on server as-is)
  const exitSurveyMode = () => {
    setIsProjectMode(false);
    setActiveProject(null);
    setProjectRecording(false);
    stopTimer();

    // Clear GPS track visualization
    clearGPSTrack();

    // stop heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    // hide waypoint details and clear selection
    setWaypointDetailsOpen(false);
    setSelectedWaypointId(null);
    updateSelectedMarkerOverlay(null);
    // refresh markers so saved points remain visible and live marker stays
    setTimeout(() => refreshMapMarkers(), 10);
    setSinglePointCaptureActive(true); // Keep UI visible for viewing
    setPreviewModeActive(true); // Enable viewing mode
    showSnackbar('Exited survey mode', 'info');
  };


  // --------------------------------------------------------------------------
  // GPS & Location Tracking Logic (Foreground vs Background)
  // --------------------------------------------------------------------------

  // Shared position update handler
  const handlePositionUpdate = (latitude, longitude, accuracy, altitude) => {
    // Update coordinates
    setCoordinates({
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      accuracy: accuracy ? Math.round(accuracy) : null,
      elevation: altitude ? Math.round(altitude) : null
    });

    // Update live location marker
    if (liveLocationMarkerRef.current) {
      liveLocationMarkerRef.current.setLatLng([latitude, longitude]);
    } else if (mapRef.current) {
      liveLocationMarkerRef.current = createLiveLocationMarker([latitude, longitude]).addTo(mapRef.current);
    }

    // Update WaypointDetails if open and unselected (showing live coords)
    if (waypointDetailsOpen && !selectedWaypointId) {
      setWaypointData(prev => ({ ...prev, lat: latitude.toFixed(6), lng: longitude.toFixed(6), notes: `Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}` }));
    }

    // Update following waypoints
    const liveId = currentLocationWaypointRef.current || 'current-location';
    setWaypoints(prev => prev.map(wp => {
      if (wp.followsLive || wp.id === liveId) {
        return {
          ...wp,
          lat: latitude,
          lng: longitude,
          elevation: altitude ? Math.round(altitude) : wp.elevation,
          notes: `Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}`
        };
      }
      return wp;
    }));

    // Update live waypoint marker position in markersRef
    try {
      const liveWaypointId = currentLocationWaypointRef.current;
      if (liveWaypointId && markersRef.current[liveWaypointId]) {
        markersRef.current[liveWaypointId].setLatLng([latitude, longitude]);
      }
    } catch (e) { }

    // Update selected waypoint details if it is the live one
    if (selectedWaypointId && selectedWaypointId === currentLocationWaypointRef.current) {
      setWaypointData(prev => ({ ...prev, lat: latitude.toFixed(6), lng: longitude.toFixed(6), notes: `Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}` }));
    }
  };

  // Helper to stop current watcher (whether Web or Native)
  const stopLocationWatcher = async () => {
    if (watchPositionIdRef.current !== null) {
      if (typeof watchPositionIdRef.current === 'string') {
        // Native watcher (string ID)
        try {
          // const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');
          // await BackgroundGeolocation.removeWatcher({ id: watchPositionIdRef.current });
        } catch (e) { console.error('Error stopping native watcher:', e); }
      } else if (navigator.geolocation) {
        // Web watcher (number ID)
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
      watchPositionIdRef.current = null;
    }
  };

  // Start standard foreground tracking (Web API) - Lightweight, for map viewing
  const startForegroundTracking = async () => {
    await stopLocationWatcher(); // Clear existing

    if (navigator.geolocation) {
      // First get current position for immediate fix
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude } = position.coords;
          handlePositionUpdate(latitude, longitude, accuracy, altitude);
          setGpsActive(true);

          // Initial center if needed (only on very first load logic, but here we just ensure marker)
          // If map is empty or uninitialized, might need check.
          try {
            if (mapRef.current && !gpsActive) {
              mapRef.current.setView([latitude, longitude], 15);
            }
          } catch (e) { }

          // Watch
          watchPositionIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              handlePositionUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.altitude);
            },
            (err) => { console.error(err); setGpsActive(false); },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 1000 }
          );
        },
        (err) => {
          console.error('Foreground init error:', err);
          if (!gpsWarningShown) {
            setGpsWarningOpen(true);
            setGpsWarningShown(true);
          }
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    } else {
      if (!gpsWarningShown) {
        setGpsWarningOpen(true);
        setGpsWarningShown(true);
      }
    }
  };

  // Start heavy-duty background tracking (Native Plugin) - For Active Surveys
  const startNativeBackgroundTracking = async () => {
    await stopLocationWatcher(); // Clear existing
    startForegroundTracking();
    /* try {
      const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');

      // Check permissions gently
      try {
        const status = await BackgroundGeolocation.checkPermissions();
        if (status.location !== 'granted') {
          await BackgroundGeolocation.requestPermissions();
        }
      } catch (e) { console.warn('checkPermissions failed', e); }

      const watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Recording survey track...",
          backgroundTitle: "TerrAqua",
          requestPermissions: true,
          stale: false,
          distanceFilter: 2 // Update every 2 meters for recording
        },
        (location, error) => {
          if (error) {
            console.error('BackgroundGeolocation error:', error);
            return;
          }
          handlePositionUpdate(location.latitude, location.longitude, location.accuracy, location.altitude);
          setGpsActive(true);
        }
      );
      watchPositionIdRef.current = watcherId;
      console.log('Native Background Tracking active:', watcherId);

      // Fallback for dev mode
      startForegroundTracking();

    } catch (e) {
      console.error('Failed to start native background tracking, falling back to foreground:', e);
      startForegroundTracking();
    } */
    startForegroundTracking();
  };

  // GPS Tracking Functions (using GPSTracker class)
  const startGPSTracking = async (projectId) => {
    try {
      console.log('[GPS] Starting GPS tracking for project:', projectId);

      // If Native, switch to Background Tracking Mode
      // try {
      //   if (Capacitor.isNativePlatform()) {
      //     console.log('[GPS] Switching to Native Background Mode');
      //     await startNativeBackgroundTracking();
      //   }
      // } catch (e) { }

      console.log('[GPS] Map ref:', mapRef.current);
      gpsTrackerRef.current = new GPSTracker(mapRef.current, projectId);
      console.log('[GPS] GPSTracker instance created');
      await gpsTrackerRef.current.start();
      console.log('[GPS] ✅ GPS tracking started successfully');
      showSnackbar('GPS tracking started', 'success');
    } catch (error) {
      console.error('[GPS] ❌ Error starting GPS tracking:', error);
      showSnackbar('Failed to start GPS tracking: ' + error.message, 'error');
    }
  };

  const pauseGPSTracking = async () => {
    if (gpsTrackerRef.current) {
      await gpsTrackerRef.current.pause();
      console.log('GPS tracking paused');
    }
  };

  const resumeGPSTracking = async () => {
    if (gpsTrackerRef.current) {
      await gpsTrackerRef.current.resume();
      console.log('GPS tracking resumed');
    }
  };

  const stopGPSTracking = async () => {
    if (gpsTrackerRef.current) {
      try {
        const result = await gpsTrackerRef.current.stop();
        console.log('GPS tracking ended. Distance:', result.total_distance, 'm');

        // If Native, revert to Foreground Tracking Mode
        // try {
        //   if (Capacitor.isNativePlatform()) {
        //     console.log('[GPS] Reverting to Foreground Mode');
        //     await startForegroundTracking();
        //   }
        // } catch (e) { }

        return result;
      } catch (error) {
        console.error('Error stopping GPS tracking:', error);
      }
    }
  };

  const clearGPSTrack = () => {
    if (gpsTrackerRef.current) {
      gpsTrackerRef.current.clear();
      gpsTrackerRef.current = null;
    }

    // Clear loaded tracks
    loadedTracksRef.current.forEach(polyline => {
      try {
        polyline.remove();
      } catch (e) { }
    });
    loadedTracksRef.current = [];
  };

  const loadProjectTracks = async (projectId) => {
    try {
      // Clear previous tracks
      loadedTracksRef.current.forEach(polyline => {
        try {
          polyline.remove();
        } catch (e) { }
      });
      loadedTracksRef.current = [];

      // Load tracks using GPSTracker static method
      const result = await GPSTracker.loadTrack(mapRef.current, projectId);

      if (result && result.polyline) {
        loadedTracksRef.current.push(result.polyline);
        console.log(`Loaded track with ${result.data.points.length} points`);

        if (result.data.summary) {
          console.log('Total distance:', result.data.summary.total_distance, 'm');
        }
      }
    } catch (error) {
      console.error('Error loading project tracks:', error);
    }
  };



  const handlePinPointToProject = async () => {
    // Capture current coordinates and save as a waypoint under the active project
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    if (!activeProject || !activeProject.id) {
      showSnackbar('No active project to add point to', 'error');
      return;
    }
    // Use current GPS coordinates for pinning, not the map center
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      showSnackbar('Unable to determine current location', 'error');
      return;
    }
    // If the selected waypoint is the live-following waypoint, persist it and convert it to a pinned project point
    const selectedIsLive = selectedWaypointId && selectedWaypointId === currentLocationWaypointRef.current;
    if (selectedIsLive) {
      // find the waypoint in state
      const liveWp = waypoints.find(wp => wp.id === selectedWaypointId);
      if (!liveWp || !liveWp.lat || !liveWp.lng) {
        showSnackbar('Unable to determine current location', 'error');
        return;
      }
      const latToSave = (typeof liveWp.lat === 'number') ? liveWp.lat : parseFloat(liveWp.lat);
      const lngToSave = (typeof liveWp.lng === 'number') ? liveWp.lng : parseFloat(liveWp.lng);

      // Compute next Point name
      let nextPointName = `Point 1`;
      try {
        const projectDetail = await projectsAPI.getById(activeProject.id);
        const items = projectDetail?.waypoints || [];
        const nums = items.map(it => {
          const match = (it.name || '').match(/Point\s*(\d+)/i);
          return match ? parseInt(match[1], 10) : null;
        }).filter(Boolean);
        const maxNum = nums.length ? Math.max(...nums) : 0;
        nextPointName = `Point ${maxNum + 1}`;
      } catch (err) { }

      try {
        const saved = await waypointsAPI.create({
          name: nextPointName,
          lat: latToSave.toFixed(6),
          lng: lngToSave.toFixed(6),
          notes: `Captured live at ${new Date().toLocaleString()}`,
          project_id: activeProject.id,
          project_name: activeProject.name,
          elevation: coordinates.elevation || liveWp.elevation || null
        });
        // Update existing local waypoint to reflect saved DB values and turn off followsLive
        setWaypoints(prev => prev.map(wp => wp.id === selectedWaypointId ? ({
          ...wp,
          lat: parseFloat(saved.latitude),
          lng: parseFloat(saved.longitude),
          name: saved.name,
          notes: saved.notes,
          images: saved.images || [],
          project_id: saved.project_id,
          project_name: saved.project_name,
          followsLive: false,
          elevation: saved.elevation || coordinates.elevation || null
        }) : wp));
        setDbWaypointIds(prev => ({ ...prev, [selectedWaypointId]: saved.id }));
        // Stop following live GPS for this waypoint now that it's pinned
        setCurrentLocationWaypointId(null);
        showSnackbar('Project point added', 'success');
      } catch (err) {
        console.error('Error adding project point:', err);
        showSnackbar(err.message || 'Failed to add point to project', 'error');
      }
      return;
    }

    // Otherwise default behavior: save current live coords as a new point
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    // Compute next Point number in project
    let nextPointName = `Point 1`;
    try {
      const projectDetail = await projectsAPI.getById(activeProject.id);
      const items = projectDetail?.waypoints || [];
      // find highest numeric Point N
      const nums = items.map(it => {
        const match = (it.name || '').match(/Point\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      }).filter(Boolean);
      const maxNum = nums.length ? Math.max(...nums) : 0;
      nextPointName = `Point ${maxNum + 1}`;
    } catch (err) {
      // fallback default; keep Point 1
    }
    const newWp = {
      name: nextPointName,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      notes: `Captured live at ${new Date().toLocaleString()}`,
      images: [],
      project_id: activeProject.id,
      project_name: activeProject.name,
      elevation: coordinates.elevation || null
    };
    try {
      const saved = await waypointsAPI.create(newWp);
      // Add to map and local list
      const waypointId = `waypoint-${Date.now()}`;
      const waypoint = {
        id: waypointId,
        lat: parseFloat(saved.latitude),
        lng: parseFloat(saved.longitude),
        name: saved.name,
        notes: saved.notes,
        images: saved.images || [],
        project_id: saved.project_id,
        project_name: saved.project_name,
        elevation: saved.elevation || coordinates.elevation || null
      };
      setWaypoints(prev => [...prev, waypoint]);
      // create marker
      const marker = L.marker([waypoint.lat, waypoint.lng]).addTo(map);
      marker.on('click', function () { handleSelectWaypoint(waypointId); });
      markersRef.current[waypointId] = marker;
      setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
      showSnackbar('Project point added', 'success');
    } catch (err) {
      console.error('Error adding project point:', err);
      showSnackbar(err.message || 'Failed to add point to project', 'error');
    }
  };

  // Create and persist a waypoint for the active project with a given name
  // Accept optional overrides to avoid relying on component state during startup
  const createProjectWaypoint = async (name = 'Point', projectIdOverride = null, projectNameOverride = null) => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return null;
    }

    const projectToUse = projectIdOverride ? { id: projectIdOverride, name: projectNameOverride } : activeProject;

    if (!projectToUse || !projectToUse.id) {
      console.error('createProjectWaypoint: no active project (params)', { projectToUse, projectIdOverride });
      showSnackbar('No active project to add point to', 'error');
      return null;
    }

    const map = mapRef.current;
    // Prefer live device coordinates if available, otherwise fall back to map center
    let lat = coordinates?.lat;
    let lng = coordinates?.lng;
    try {
      if ((!lat || !lng) && map) {
        const center = map.getCenter();
        lat = center.lat;
        lng = center.lng;
      }
    } catch (e) { console.error('createProjectWaypoint: error getting map center fallback', e); }
    if (!lat || !lng) {
      showSnackbar('Unable to determine current location', 'error');
      return null;
    }

    // For regular points (not Start/End Point), check for duplicate names
    let finalName = name;
    if (name !== 'Start Point' && name !== 'End Point') {
      const projectWaypoints = waypoints.filter(wp => wp.project_id === projectToUse.id);
      let counter = 2;
      while (projectWaypoints.some(wp => wp.name === finalName)) {
        finalName = `${name} ${counter}`;
        counter++;
      }
    }

    const newWp = {
      name: finalName,
      lat: parseFloat(lat).toFixed(6),
      lng: parseFloat(lng).toFixed(6),
      notes: `${finalName} for project ${projectToUse.name || ''}`,
      images: [],
      project_id: projectToUse.id,
      project_name: projectToUse.name || null,
      elevation: coordinates?.elevation || null,
    };

    try {
      console.log('Creating project waypoint', newWp);
      const saved = await waypointsAPI.create(newWp);
      // Add to map and local list
      const waypointId = `waypoint-${Date.now()}`;
      const waypoint = {
        id: waypointId,
        lat: parseFloat(saved.latitude),
        lng: parseFloat(saved.longitude),
        name: saved.name,
        notes: saved.notes,
        images: saved.images || [],
        project_id: saved.project_id,
        project_name: saved.project_name,
        elevation: saved.elevation || coordinates?.elevation || null
      };
      setWaypoints(prev => [...prev, waypoint]);
      // create marker
      if (map) {
        const marker = L.marker([waypoint.lat, waypoint.lng]).addTo(map);
        marker.on('click', function () { handleSelectWaypoint(waypointId); });
        markersRef.current[waypointId] = marker;
      }
      setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
      showSnackbar(`${finalName} saved`, 'success');
      return saved;
    } catch (err) {
      console.error(`Error adding ${finalName} to project:`, err);
      showSnackbar(err.message || `Failed to add ${finalName}`, 'error');
      return null;
    }
  };

  // Timer helpers - wrappers for imported utilities
  const startTimerFromProjectWrapper = (project) => {
    startTimerFromProject(project, setTimerSeconds, timerIntervalRef);
  };

  const stopTimerWrapper = () => {
    stopTimer(timerIntervalRef);
  };

  // Mobile map height wrapper - passes refs and state to imported utility
  const updateMobileMapHeightWrapper = () => {
    updateMobileMapHeight(isMobile, waypointDetailsOpen, bottomSheetExpanded, { liveCoordsRef, waypointDetailsRef }, setMapDynamicHeight);
  };

  // When projectRecording toggles, start/stop timer accordingly
  useEffect(() => {
    if (projectRecording && isProjectMode && activeProject) {
      // Fetch project for latest elapsed and started_at
      projectsAPI.getById(activeProject.id).then((detail) => {
        const projectData = detail.project || detail;
        startTimerFromProjectWrapper(projectData);
      }).catch(err => console.error('getById for timer err', err));
    } else {
      stopTimerWrapper();
    }
    return () => { /* cleanup kept by stopTimer */ };
  }, [projectRecording, isProjectMode, activeProject]);

  // Heartbeat: persist playing segments periodically
  useEffect(() => {
    if (projectRecording && isProjectMode && activeProject && activeProject.id) {
      // start heartbeat interval (checkpoint every 60s)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(async () => {
        try {
          const updated = await projectsAPI.heartbeat(activeProject.id);
          if (updated) {
            let base = updated.elapsed_seconds || 0;
            if (updated.started_at && updated.status === 'playing') {
              const startedAt = new Date(updated.started_at).getTime();
              // Calculate additional time since start
              base += Math.floor((Date.now() - startedAt) / 1000);
            }
            // update timer to current correct total
            setTimerSeconds(base);
          }
        } catch (e) {
          console.error('Heartbeat failed', e);
        }
      }, 60000);
    } else {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRecording, isProjectMode, activeProject?.id]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuItemClick = (item) => {
    // Check if project mode is active for restricted actions
    // Allowed actions: 'Exit Survey' (which isn't in menu directly but handled via Stop)
    // Restricted: Single Point Capture, Start Survey (new), Saved Points, Import File
    if (isProjectMode && ['Single Point Capture', 'Start Survey', 'Saved Points', 'Import File'].includes(item)) {
      setExitProjectWarningOpen(true);
      if (isMobile) setSidebarOpen(false);
      return;
    }

    if (item === 'Single Point Capture') {
      // If waypoints exist (e.g. viewing saved points), force activation (reset & start)
      // Otherwise toggle based on current state
      const shouldActivate = !singlePointCaptureActive || waypoints.length > 0;

      if (shouldActivate) {
        setSinglePointCaptureActive(true);
        setPreviewModeActive(false);
        // Trigger reset when activating
        resetMapAndState();
      } else {
        setSinglePointCaptureActive(false);
        setPreviewModeActive(false);
        // Reset when turning off survey
        setSelectedWaypointId(null);
        setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
        updateSelectedMarkerOverlay(null);
      }
    } else if (item === 'Start Survey') {
      if (!isAuthenticated) {
        setLoginPromptOpen(true);
        return;
      }
      setStartSurveyDialogOpen(true);
    } else if (item === 'Saved Points') {
      if (!isAuthenticated) {
        setLoginPromptOpen(true);
        return;
      }
      setSavedPointsOpen(true);
    } else if (item === 'Export Data') {
      setExportDialogOpen(true);
    } else if (item === 'CRS Converter') {
      setCrsConverterOpen(true);
    } else if (item === 'Measure') {
      setMeasureActive(true);
      // Clear previous measurements when starting fresh
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
      if (measurementLabelsRef.current) {
        measurementLabelsRef.current.clearLayers();
      }
      setHasMeasureSelection(false);
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

  const handleStartMeasureArea = () => {
    if (!mapRef.current) return;
    setSinglePointCaptureActive(false);
    setLocationSelectionActive(false);
    const polygonHandler = new L.Draw.Polygon(mapRef.current, {
      shapeOptions: {
        color: '#0891B2',
        fillOpacity: 0.2,
        weight: 3
      }
    });
    polygonHandler.enable();
  };

  const handleStartMeasureDistance = () => {
    if (!mapRef.current) return;
    setSinglePointCaptureActive(false);
    setLocationSelectionActive(false);
    const polylineHandler = new L.Draw.Polyline(mapRef.current, {
      shapeOptions: {
        color: '#0891B2',
        weight: 3
      }
    });
    polylineHandler.enable();
  };

  const handleClearMeasure = () => {
    if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
    if (measurementLabelsRef.current) measurementLabelsRef.current.clearLayers();
    setHasMeasureSelection(false);
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
      const waypoint = waypoints.find(wp => wp.id === selectedWaypointId);
      if (!waypoint) return;

      // In project mode, restrict saving to only project waypoints or current location.
      if (isProjectMode && activeProject) {
        const wpIsProjectPoint = waypoint.project_id && String(waypoint.project_id) === String(activeProject.id);
        const wpIsCurrentLocation = selectedWaypointId === currentLocationWaypointId;
        const wpIsPinCreated = waypoint.createdDuringProject && !waypoint.project_id; // allow pin-created single points
        if (!wpIsProjectPoint && !wpIsCurrentLocation && !wpIsPinCreated) {
          showSnackbar('Only current location, project points, or pin-created points can be saved during survey', 'error');
          return;
        }
      }

      // Check if this is "Default Location" - if so, ensure name stays as "Default Location"
      const isDefaultLocation = waypoint.name && waypoint.name.trim().toLowerCase() === 'default location';
      // Determine default "Point N" name when in project mode
      let defaultPointName = `Point ${waypoints.findIndex(wp => wp.id === selectedWaypointId) + 1}`;
      if (isProjectMode && activeProject && activeProject.id) {
        const projectCount = waypoints.filter(wp => wp.project_id && String(wp.project_id) === String(activeProject.id)).length;
        defaultPointName = `Point ${projectCount + (dbWaypointIds[selectedWaypointId] ? 0 : 1)}`; // if editing existing, don't increment
      }
      // If in project mode and the name is the placeholder 'My Current Location', prefer default Point name
      const nameCandidates = (waypointData.name || '').trim();
      const isMyCurrentLocation = nameCandidates.toLowerCase() === 'my current location';
      const finalName = isDefaultLocation ? 'Default Location' : ((isProjectMode && (!nameCandidates || isMyCurrentLocation)) ? defaultPointName : (waypointData.name || `Point ${waypoints.findIndex(wp => wp.id === selectedWaypointId) + 1}`));

      const waypointPayload = {
        name: finalName,
        lat: waypointData.lat,
        lng: waypointData.lng,
        notes: waypointData.notes || '',
        images: waypointData.images || [], // Send images array
        project_id: (Object.prototype.hasOwnProperty.call(waypointData, 'project_id')) ? waypointData.project_id : (isProjectMode && activeProject ? activeProject.id : null),
        project_name: (Object.prototype.hasOwnProperty.call(waypointData, 'project_name')) ? waypointData.project_name : (isProjectMode && activeProject ? activeProject.name : null),
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
          ? { ...wp, ...waypointData, lat: parseFloat(waypointData.lat), lng: parseFloat(waypointData.lng), name: finalName, project_id: waypointPayload.project_id || null, project_name: waypointPayload.project_name || null }
          : { ...wp, name: `Point ${index + 1}` }
      );
      setWaypoints(updatedWaypoints);

      // Refresh map markers to ensure the saved point appears immediately
      setTimeout(() => refreshMapMarkers(), 10);

      // After saving current location as a project point, advance default name for the next unsaved save
      if (isProjectMode && selectedWaypointId === currentLocationWaypointId) {
        const projectCountNow = updatedWaypoints.filter(wp => wp.project_id && String(wp.project_id) === String(activeProject?.id)).length;
        const nextName = `Point ${projectCountNow + 1}`;
        setWaypointData(prev => ({ ...prev, name: nextName }));
      }

      // Update waypointData to ensure name is correct for default location
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

      // Close waypoint details on mobile after save
      if (isMobile) {
        setWaypointDetailsOpen(false);
        setSelectedWaypointId(null);
        setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
        updateSelectedMarkerOverlay(null);
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
      setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
      updateSelectedMarkerOverlay(null);

      // Close waypoint details on mobile after delete
      if (isMobile) {
        setWaypointDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting waypoint:', error);
      if (error.message === 'Authentication required') {
        setLoginPromptOpen(true);
      } else {
        showSnackbar(error.message || 'Failed to delete waypoint. Please try again.', 'error');
      }
    }
  };

  // Marker creation functions - now using imported utilities from mapUtils.js

  // File parsing functions - now using imported utilities from fileUtils.js

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
      if (!singlePointCaptureActive) {
        setSinglePointCaptureActive(true);
        setPreviewModeActive(false);
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
        marker.on('add', function () {
          const element = this.getElement();
          if (element) {
            element.style.zIndex = '999';
            element.style.pointerEvents = 'auto';
          }
        });

        // Add click handler
        marker.on('click', function (e) {
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
            try { map && map.fitBounds && map.fitBounds(bounds, { padding: [50, 50] }); } catch (e) { console.error('Error calling map.fitBounds after import:', e); }
          } else {
            try { map && map.setView && map.setView([newWaypoints[0].lat, newWaypoints[0].lng], 13); } catch (e) { console.error('Error calling map.setView after import:', e); }
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
          // Use ref to avoid stale closure issues
          const wp = waypointsRef.current.find(wp => wp.id === waypointId);
          const isSurveyWaypoint = wp && wp.id !== currentLocationWaypointRef.current && (!isProjectModeRef.current || (activeProjectRef.current && String(wp.project_id) === String(activeProjectRef.current.id)));

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
    // Use ref to avoid stale closure issues with waypoints state
    const waypoint = waypointsRef.current.find(wp => wp.id === waypointId);
    if (!waypoint) return;

    // Set selected waypoint
    setSelectedWaypointId(waypointId);
    setWaypointDetailsOpen(true);

    // Update red circleMarker overlay for selected waypoint
    setTimeout(() => {
      updateSelectedMarkerOverlay(waypointId);
    }, 0);

    // Ensure waypoint details show DB values, include followsLive flag if present
    setWaypointData({
      name: waypoint.name,
      lat: (typeof waypoint.lat === 'number' ? waypoint.lat.toFixed(6) : waypoint.lat),
      lng: (typeof waypoint.lng === 'number' ? waypoint.lng.toFixed(6) : waypoint.lng),
      notes: waypoint.notes || '',
      images: waypoint.images || [],
      project_id: waypoint.project_id || null,
      project_name: waypoint.project_name || null,
      followsLive: waypoint.followsLive || false,
    });
    // Center map on selection
    try {
      const map = mapRef.current;
      const marker = markersRef.current[waypointId];
      if (marker && map) {
        try { map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14)); } catch (e) { console.error('Error centering map on marker:', e); }
      }
    } catch (e) { }
  };

  // Save current live coordinates as the next project point
  const saveCurrentLocationAsProjectPoint = async () => {
    if (!isProjectMode || !activeProject) {
      showSnackbar('No active project to save to', 'error');
      return;
    }
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      showSnackbar('Unable to determine current location', 'error');
      return;
    }
    // Use createProjectWaypoint which uses current map center by default; override to use live coords
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    // Compute default Point name
    let nextPointName = `Point 1`;
    try {
      const projectDetail = await projectsAPI.getById(activeProject.id);
      const items = projectDetail?.waypoints || [];
      const nums = items.map(it => {
        const match = (it.name || '').match(/Point\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      }).filter(Boolean);
      const maxNum = nums.length ? Math.max(...nums) : 0;
      nextPointName = `Point ${maxNum + 1}`;
    } catch (err) { }

    try {
      const saved = await waypointsAPI.create({
        name: nextPointName,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        notes: `Captured live at ${new Date().toLocaleString()}`,
        project_id: activeProject.id,
        project_name: activeProject.name,
        elevation: coordinates.elevation || null,
      });
      // Add to local waypoints and refresh markers; select new point
      const waypointId = `waypoint-${Date.now()}`;
      const waypoint = {
        id: waypointId,
        lat: parseFloat(saved.latitude),
        lng: parseFloat(saved.longitude),
        name: saved.name,
        notes: saved.notes,
        images: saved.images || [],
        project_id: saved.project_id,
        project_name: saved.project_name,
        elevation: saved.elevation
      };
      setWaypoints(prev => [...prev, waypoint]);
      setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
      // Select the newly added waypoint and open details
      setSelectedWaypointId(waypointId);
      setWaypointData({ name: saved.name, lat: parseFloat(saved.latitude).toFixed(6), lng: parseFloat(saved.longitude).toFixed(6), notes: saved.notes || '', images: saved.images || [] || null, project_id: saved.project_id, project_name: saved.project_name });
      setWaypointDetailsOpen(true);
      // Refresh markers to include new project point
      setTimeout(() => refreshMapMarkers(), 10);
      showSnackbar('Current location saved to project', 'success');
      // heartbeat to update last_activity on server
      try { await projectsAPI.heartbeat(activeProject.id); } catch (e) { }
    } catch (err) {
      console.error('Error saving current location to project:', err);
      showSnackbar(err.message || 'Failed to save current location', 'error');
    }
  };

  // Toggle satellite hybrid view
  const handleToggleSatelliteHybrid = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const newMode = !satelliteHybridMode;

    // Save current map state (zoom and center)
    const currentZoom = map.getZoom();
    const currentCenter = map.getCenter();

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
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 22,
          maxNativeZoom: 19,
          minZoom: 1,
          tileSize: 256,
          zoomOffset: 0,
          errorTileUrl: '',
          crossOrigin: true
        });

        // Add satellite layer first
        satelliteLayer.addTo(map);
        tileLayerRef.current = satelliteLayer;

        // Restore view immediately after adding satellite layer
        map.setView(currentCenter, currentZoom, { animate: false });

        // Add label layer with slight delay
        setTimeout(() => {
          if (!mapRef.current) return;

          const labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 22,
            maxNativeZoom: 19,
            minZoom: 1,
            opacity: 0.7,
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

        // Restore view immediately after adding tile layer
        map.setView(currentCenter, currentZoom, { animate: false });

        showSnackbar('Map view enabled', 'success');
      }
    }, 50);
  };

  // Helper function to navigate to default location



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
          color: '#0891B2',
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

  // When entering project mode, remove any previously created single-point captures
  useEffect(() => {
    if (isProjectMode) {
      removePinCapturedPoints();
    }
  }, [isProjectMode]);

  // Polyline decoder - now using imported utility from navigationUtils.js

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

  // Keep markers in sync with project mode, active project, waypoints and live coordinates
  useEffect(() => {
    try {
      refreshMapMarkers(waypoints, isProjectMode, activeProject);
    } catch (e) { console.error('Error refreshing markers in effect:', e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectMode, activeProject?.id, waypoints, coordinates.lat, coordinates.lng]);

  // On login or mount, fetch any active project for this user
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const loadActive = async () => {
      try {
        const res = await projectsAPI.getActive();
        const projectData = res?.project || null;
        if (!projectData || cancelled) return;
        setActiveProject({ id: projectData.id, name: projectData.name, status: projectData.status });
        setIsProjectMode(true);
        setProjectRecording(projectData.status === 'playing');
        // Load and show project waypoints in UI the same way as Single Point Capture
        try {
          loadProjectWaypointsToMap({ waypoints: projectData.waypoints || [] }, projectData);
          // Open the selector UI to show points
          setSinglePointCaptureActive(true);
        } catch (err) {
          console.error('Error loading active project waypoints:', err);
        }
        // Show prompts
        if (projectData.status === 'playing') {
          showSnackbar(`Survey of "${projectData.name}" is ongoing.`, 'info');
          startTimerFromProject(projectData);
          // Auto-resume GPS tracking on mount/refresh if project is active
          startGPSTracking(projectData.id);
          // Load existing tracks for visualization
          loadProjectTracks(projectData.id);
        }
        // If the project was auto_paused due to inactivity, inform user once
        if (projectData.auto_paused && !autoPausedPromptShown) {
          showSnackbar(`Survey "${projectData.name}" has been paused due to inactivity for 6 hours.`, 'warning');
          setAutoPausedPromptShown(true);
        }
      } catch (err) {
        console.error('Error loading active project:', err);
      }
    };
    loadActive();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // When entering or updating project (survey) mode, ensure only project markers (or current location for new projects)
  // are visible. Also initialize default name for new project current location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (isProjectMode) {
      if (activeProject && activeProject.id) {
        // Remove markers not belonging to this project
        Object.keys(markersRef.current).forEach((id) => {
          const wp = waypoints.find(w => w.id === id);
          if (!wp || !wp.project_id || String(wp.project_id) !== String(activeProject.id)) {
            try { markersRef.current[id].remove(); } catch (e) { }
            delete markersRef.current[id];
          }
        });
        // Keep only project waypoints in state
        setWaypoints(prev => prev.filter(wp => wp.project_id && String(wp.project_id) === String(activeProject.id)));
        setSelectedWaypointId(null);
      } else {
        // New project: remove everything except current location marker
        Object.keys(markersRef.current).forEach((id) => {
          if (id !== currentLocationWaypointId) {
            try { markersRef.current[id].remove(); } catch (e) { }
            delete markersRef.current[id];
          }
        });
        if (currentLocationWaypointId) {
          setWaypoints(prev => prev.filter(wp => wp.id === currentLocationWaypointId));
          setSelectedWaypointId(currentLocationWaypointId);
          // Set default point name to Point 1 for the unsaved current location
          setWaypointData(prev => ({ ...prev, name: 'Point 1' }));
        } else {
          setWaypoints([]);
          setSelectedWaypointId(null);
        }
      }
      // Disable location selection when in project mode
      setLocationSelectionActive(false);
    }
  }, [isProjectMode, activeProject, currentLocationWaypointId]);

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

  // Auto-recording interval: if recording is enabled, periodically pin points to active project
  // Previously auto-recorded points while recording; this behavior was removed
  // to only save Start/End automatically and save other points only when the
  // user explicitly pins/saves them. Ensure any running interval is cleared.
  useEffect(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, [projectRecording, isProjectMode, activeProject]);

  // Cleanup on unmount: ensure any interval is cleared
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  const processUploadQueue = async () => {
    if (isProcessingQueueRef.current || uploadQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;
    setImageUploading(true);
    console.log('[Queue] Starting to process upload queue. Size:', uploadQueueRef.current.length);

    while (uploadQueueRef.current.length > 0) {
      const item = uploadQueueRef.current[0];
      const { files, targetWpId, deviceInfo } = item;

      try {
        // Process each file: Save Raw -> Watermark -> Save Watermarked -> Compress
        const processedFilesForUpload = await Promise.all(files.map(async (file) => {
          try {
            console.log(`[Queue] Processing file: ${file.name}`);

            // 1. Save Raw to Native Gallery (First safety)
            await saveToNativeGallery(file, 'TerrAqua/Raw');

            // 2. Add Watermark
            let watermarkedFile = file;
            try {
              watermarkedFile = await addWatermarkToImage(file, deviceInfo);
              console.log('[Queue] Watermark applied successfully');

              // 3. Save Watermarked to Native Gallery
              await saveToNativeGallery(watermarkedFile, 'TerrAqua/Watermarked');
            } catch (wErr) {
              console.error('[Queue] Watermarking failed, using original:', wErr);
            }

            // 4. Compress Watermarked (or raw if watermark failed) for Upload
            try {
              const imageCompression = (await import('browser-image-compression')).default;
              const compressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };
              const compressed = await imageCompression(watermarkedFile, compressionOptions);
              console.log(`[Queue] Compressed: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
              return compressed;
            } catch (cErr) {
              console.warn('[Queue] Compression failed, using watermarked file:', cErr);
              return watermarkedFile;
            }
          } catch (err) {
            console.error('[Queue] Error in file processing chain:', err);
            return file;
          }
        }));

        // Upload to Cloudinary
        const result = await uploadAPI.uploadMultipleImages(processedFilesForUpload, deviceInfo);
        console.log(`[Queue] Uploaded ${result.count} images for ${targetWpId}`);

        // Automatically save to Postgres DB
        // 1. Retry logic to wait for DB ID if the waypoint is being created in another process (e.g. bar button)
        let dbId = dbWaypointIdsRef.current[targetWpId];
        let retries = 0;
        while (!dbId && retries < 10) {
          console.log(`[Queue] DB ID for ${targetWpId} not found, retrying in 1s... (${retries + 1}/10)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          dbId = dbWaypointIdsRef.current[targetWpId];
          retries++;
        }

        // 2. If STILL missing after retries, it means the point was never auto-saved. Try to create it now.
        if (!dbId) {
          console.log(`[Queue] DB ID for ${targetWpId} still missing after retries. Attempting fallback auto-create...`);
          const wpInRef = waypointsRef.current.find(w => w.id === targetWpId);
          if (wpInRef) {
            try {
              const payload = {
                name: wpInRef.name || 'Captured Point',
                lat: wpInRef.lat,
                lng: wpInRef.lng,
                notes: wpInRef.notes || '',
                images: [],
                project_id: wpInRef.project_id || (isProjectModeRef.current && activeProjectRef.current ? activeProjectRef.current.id : null),
                project_name: wpInRef.project_name || (isProjectModeRef.current && activeProjectRef.current ? activeProjectRef.current.name : null),
                elevation: wpInRef.elevation || null
              };
              const saved = await waypointsAPI.create(payload);
              dbId = saved.id;
              setDbWaypointIds(prev => ({ ...prev, [targetWpId]: dbId }));
              console.log(`[Queue] Fallback auto-creation success: ${dbId}`);
            } catch (err) {
              console.error('[Queue] Fallback auto-creation failed:', err);
            }
          }
        }

        if (dbId) {
          // Get latest waypoint state from ref to avoid overwriting attributes like notes
          const wpInRef = waypointsRef.current.find(w => w.id === targetWpId);
          if (wpInRef) {
            const updatedImages = [...(wpInRef.images || []), ...result.images];
            const updatedWp = { ...wpInRef, images: updatedImages };

            console.log(`[Queue] Automatically saving images to DB for waypoint ${dbId}`);
            await waypointsAPI.update(dbId, updatedWp);

            // Update local state for the specific waypoint
            setWaypoints(prev => prev.map(w => w.id === targetWpId ? updatedWp : w));

            // If the user happens to have this same waypoint selected right now, update the view-model
            setSelectedWaypointId(currentId => {
              if (String(currentId) === String(targetWpId)) {
                setWaypointData(prev => ({
                  ...prev,
                  images: updatedImages
                }));
              }
              return currentId;
            });

            showSnackbar(`Images automatically saved for ${wpInRef.name || 'point'}`, 'success');
          }
        } else {
          console.warn(`[Queue] Failed to find DB ID for ${targetWpId} even after fallback. Images uploaded to Cloudinary but not linked in DB.`);
          // Still need to update local waypoints so user can manually save later
          setWaypoints(prev => prev.map(w => {
            if (w.id === targetWpId) {
              const updatedImages = [...(w.images || []), ...result.images];
              return { ...w, images: updatedImages };
            }
            return w;
          }));
        }

        // Successfully processed this item, remove from queue
        uploadQueueRef.current.shift();
      } catch (error) {
        console.error('[Queue] Error processing upload:', error);
        showSnackbar(`Upload failed for a point in background.`, 'error');
        // Remove anyway to avoid infinite loop, or move to a failed list
        uploadQueueRef.current.shift();
      }
    }

    isProcessingQueueRef.current = false;
    setImageUploading(false);
    console.log('[Queue] Upload queue empty.');
  };

  const handleImageUpload = async (event) => {
    const action = event.target.dataset?.action || 'add';
    console.log('[handleImageUpload] Action:', action, 'Files:', event.target.files?.length);

    if (action === 'delete') {
      // Handle image deletion
      const index = parseInt(event.target.dataset.index);
      const publicId = event.target.dataset.publicId;

      try {
        // Delete from Cloudinary
        if (publicId) {
          await uploadAPI.deleteImage(publicId);
        }

        // Remove from local state
        const updatedImages = (waypointData.images || []).filter((_, i) => i !== index);
        setWaypointData(prev => ({
          ...prev,
          images: updatedImages
        }));

        // Also update the waypoints array so it persists when switching waypoints
        if (selectedWaypointId) {
          setWaypoints(prev => {
            const updated = prev.map(wp =>
              wp.id === selectedWaypointId
                ? { ...wp, images: updatedImages }
                : wp
            );
            // Trigger auto-save to DB for deletion too
            const dbId = dbWaypointIdsRef.current[selectedWaypointId];
            if (dbId) {
              const targetWp = updated.find(w => w.id === selectedWaypointId);
              waypointsAPI.update(dbId, targetWp).catch(err => console.error('Auto-save failed on delete:', err));
            }
            return updated;
          });
        }

        setSnackbar({ open: true, message: 'Image deleted and changes saved', severity: 'success' });
      } catch (error) {
        console.error('Error deleting image:', error);
        setSnackbar({ open: true, message: 'Failed to delete image', severity: 'error' });
      }
    } else if (action === 'add') {
      // Handle image upload (multiple files)
      const files = Array.from(event.target.files || []);
      const targetWpId = selectedWaypointId;

      if (files.length === 0 || !targetWpId) return;

      // Basic local validation (check both current images AND ones already in the upload queue)
      const maxImages = 10;
      const currentImages = waypoints.find(w => w.id === targetWpId)?.images?.length || 0;
      const queuedImagesCount = uploadQueueRef.current
        .filter(item => item.targetWpId === targetWpId)
        .reduce((sum, item) => sum + item.files.length, 0);

      if (currentImages + queuedImagesCount + files.length > maxImages) {
        setSnackbar({
          open: true,
          message: `Maximum ${maxImages} images allowed. (${currentImages} existing, ${queuedImagesCount} in queue)`,
          severity: 'warning'
        });
        return;
      }

      // Metadata for watermark
      const deviceInfo = {
        deviceName: navigator.userAgent.includes('Mobile') ? `${navigator.platform} Mobile` : navigator.platform,
        browser: navigator.userAgent.split(' ').slice(-1)[0],
        userName: user?.name || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        location: {
          lat: waypointData.lat || 'N/A',
          lng: waypointData.lng || 'N/A'
        }
      };

      // Push to background queue
      uploadQueueRef.current.push({ files, targetWpId, deviceInfo });
      showSnackbar(`Upload started for ${files.length} image(s)...`, 'info');

      // Kick off queue processing
      processUploadQueue();
    }
  };

  useEffect(() => {
    // Keep waypoint details in sync if the selected waypoint is following live GPS
    if (!selectedWaypointId) return;
    const wp = waypoints.find(w => w.id === selectedWaypointId);
    if (!wp) return;
    if (wp.followsLive) {
      setWaypointData(prev => ({
        ...prev,
        lat: (typeof wp.lat === 'number' ? wp.lat.toFixed(6) : wp.lat),
        lng: (typeof wp.lng === 'number' ? wp.lng.toFixed(6) : wp.lng),
        notes: wp.notes || prev.notes
      }));
    }
  }, [waypoints, selectedWaypointId]);

  // Handler when GPS warning's continue is clicked
  const handleGpsWarningContinue = () => {
    // User chose to continue without GPS. Do nothing, just close dialog (handled by caller onClose)
    console.log('User continued without GPS');
  };

  const handleGpsWarningRetry = () => {
    // Retry GPS detection
    startForegroundTracking();
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
        maxZoom: 22,
        maxNativeZoom: 19,
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
            maxZoom: 22,
            maxNativeZoom: 19,
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

    // Add drawn items layer for measurements
    drawnItemsRef.current = new L.FeatureGroup();
    drawnItemsRef.current.addTo(map);

    measurementLabelsRef.current = new L.LayerGroup();
    measurementLabelsRef.current.addTo(map);

    // Handle Leaflet Draw events
    const handleDrawCreated = (e) => {
      const type = e.layerType;
      const layer = e.layer;

      console.log(`[Measure] Created: ${type}`);

      if (type === 'polygon' || type === 'polyline') {
        drawnItemsRef.current.clearLayers();
        measurementLabelsRef.current.clearLayers();
        drawnItemsRef.current.addLayer(layer);
        setHasMeasureSelection(true);

        const geojson = layer.toGeoJSON();
        let label = '';
        let centerCoords;

        if (type === 'polygon') {
          const area = turf.area(geojson);
          label = `${area.toFixed(2)} sq m`;
          // Centroid is usually better for visual center
          const centroid = turf.centroid(geojson);
          centerCoords = [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
        } else if (type === 'polyline') {
          const totalLength = turf.length(geojson, { units: 'kilometers' });
          const midpoint = turf.along(geojson, totalLength / 2);
          label = totalLength > 1
            ? `${(totalLength).toFixed(2)} km`
            : `${(totalLength * 1000).toFixed(2)} m`;
          centerCoords = [midpoint.geometry.coordinates[1], midpoint.geometry.coordinates[0]];
        }

        if (label && centerCoords) {
          console.log(`[Measure] Adding label: ${label} at ${centerCoords}`);
          const labelMarker = L.marker(centerCoords, {
            icon: L.divIcon({
              className: 'measurement-label',
              html: `<div class="measurement-label-content">${label}</div>`,
              iconSize: [200, 40],
              iconAnchor: [100, 20]
            }),
            zIndexOffset: 1000,
            interactive: false
          });
          measurementLabelsRef.current.addLayer(labelMarker);
        }
      }
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    // Initial tracking on mount (Foreground only)
    startForegroundTracking();

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
      // Stop watching position
      if (watchPositionIdRef.current !== null) {
        if (typeof watchPositionIdRef.current === 'string') {
          // Native watcher (string ID)
          // Native watcher (string ID)
          // import('@capacitor-community/background-geolocation').then(({ BackgroundGeolocation }) => {
          //   BackgroundGeolocation.removeWatcher({ id: watchPositionIdRef.current });
          // }).catch(e => console.error(e));
        } else if (navigator.geolocation) {
          // Web watcher (number ID)
          navigator.geolocation.clearWatch(watchPositionIdRef.current);
        }
        watchPositionIdRef.current = null;
        setGpsActive(false);
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
  }, [darkMode]); // Removed satelliteHybridMode - map should not reinitialize when switching layers


  // Update tile layer when dark mode changes (only if not in satellite hybrid mode)
  useEffect(() => {
    // Measure project bar widths on relevant changes
    const measure = () => {
      if (!isMobile) return;
      const infoW = infoBoxRef.current?.offsetWidth || 0;
      const optionsW = optionsRef.current?.scrollWidth || 0;
      const expandBtnW = 420; // approx icon button
      const padding = 12; // px for left/right padding
      const collapsed = Math.min(Math.max(infoW + expandBtnW + padding, 120), window.innerWidth * 0.6);
      const expanded = Math.min(optionsW + padding + expandBtnW, window.innerWidth * 0.95);
      setCollapsedWidth(collapsed);
      setExpandedWidth(expanded);
      setProjectBarWidth(projectBarExpanded ? expanded : collapsed);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (projectBarRef.current) ro.observe(projectBarRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      try { ro.disconnect(); } catch (e) { }
    };
  }, [isMobile, projectBarExpanded, waypoints.length, projectRecording]);

  // Process GPS coordinates for real-time tracking
  useEffect(() => {
    if (!projectRecording || !gpsTrackerRef.current) return;

    if (coordinates?.lat && coordinates?.lng) {
      // Process position with GPSTracker (smart saving + real-time line)
      gpsTrackerRef.current.processPosition(
        coordinates.lat,
        coordinates.lng,
        coordinates.accuracy || null,
        coordinates.elevation || null
      );
    }
  }, [coordinates, projectRecording]);

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

    if (singlePointCaptureActive) {
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
        // Prevent adding points if in preview mode
        if (previewModeActive) return;

        // When in project (survey) mode, disable creating arbitrary markers unless pin mode is active
        if (isProjectMode && !pinModeActive) return;
        // If location selection is active and a waypoint is selected, set that waypoint's coordinates to the clicked spot
        if (locationSelectionActive && selectedWaypointId) {
          const latlng = e.latlng;
          // Update waypoint data and marker
          setWaypoints(prev => prev.map(wp => wp.id === selectedWaypointId ? ({ ...wp, lat: latlng.lat, lng: latlng.lng }) : wp));
          // Update marker position if exists
          try {
            if (markersRef.current[selectedWaypointId]) {
              markersRef.current[selectedWaypointId].setLatLng([latlng.lat, latlng.lng]);
            }
          } catch (e) { }
          // Update waypointData in the details pane (so user can still edit name/notes)
          setWaypointData(prev => ({ ...prev, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }));
          // Turn off selection modes after assigning coordinates
          setLocationSelectionActive(false);
          setPinModeActive(false);
          setSinglePointCaptureActive(false);
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
          // If pin mode was active, turn it off after selection
          if (pinModeActive) {
            setPinModeActive(false);
            setLocationSelectionActive(false);
            setSinglePointCaptureActive(false);
          }
          return;
        }

        const waypointId = `waypoint-${Date.now()}`;

        // Get current waypoints count for naming
        const currentCount = waypoints.length;

        // Determine project association for this click-created point
        const isPinMode = pinModeActive || locationSelectionActive;
        const projectIdForNew = isPinMode ? null : (isProjectMode && activeProject?.id ? activeProject.id : null);

        // Create new waypoint
        const newWaypoint = {
          id: waypointId,
          lat: latlng.lat,
          lng: latlng.lng,
          name: `Point ${currentCount + 1}`,
          notes: '',
          images: [],
          elevation: coordinates.elevation,
          project_id: projectIdForNew,
          project_name: projectIdForNew ? activeProject?.name : null,
          createdDuringProject: isProjectMode ? true : false,
          pinCaptured: isPinMode ? true : false
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
          marker.on('add', function () {
            const element = this.getElement();
            if (element) {
              element.style.zIndex = '999'; // Just below overlay but still receives events
              element.style.pointerEvents = 'auto'; // Ensure it can receive clicks
            }
          });

          // Add click handler to select waypoint
          marker.on('click', function (e) {
            e.originalEvent.stopPropagation(); // Prevent map click
            handleSelectWaypoint(waypointId);
          });

          markersRef.current[waypointId] = marker;

          // If we were in pin/location-selection mode, exit it after creating the point
          if (isPinMode) {
            setPinModeActive(false);
            setLocationSelectionActive(false);
            setSinglePointCaptureActive(false);
          }

          // Set as selected waypoint with correct name and editable data (pin-created points remain unassigned to project)
          setSelectedWaypointId(waypointId);
          setWaypointDetailsOpen(true);
          if (updatedWaypoint) {
            setWaypointData({
              name: updatedWaypoint.name,
              lat: latlng.lat.toFixed(6),
              lng: latlng.lng.toFixed(6),
              notes: '',
              images: [],
              project_id: updatedWaypoint.project_id || null,
              project_name: updatedWaypoint.project_name || null
            });
          }

          // Update red circleMarker overlay since it's selected
          setTimeout(() => {
            updateSelectedMarkerOverlay(waypointId);
          }, 0);

          return renamed;
        });

        // Auto-save map click point to DB if authenticated (Side effect outside of state update)
        if (isAuthenticated) {
          const waypointPayload = {
            name: `Point ${currentCount + 1}`,
            lat: latlng.lat,
            lng: latlng.lng,
            notes: '',
            images: [],
            project_id: projectIdForNew,
            project_name: projectIdForNew ? activeProject?.name : null,
            elevation: coordinates.elevation || null
          };

          waypointsAPI.create(waypointPayload).then(saved => {
            setDbWaypointIds(prev => ({ ...prev, [waypointId]: saved.id }));
          }).catch(err => {
            console.error('Error auto-saving clicked point:', err);
          });
        }
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
      // When survey/deactivated, do not remove saved waypoints — keep them visible.
      // Only remove the red selection overlay and clear selection if not re-used.
      if (selectedMarkerOverlayRef.current) {
        selectedMarkerOverlayRef.current.remove();
        selectedMarkerOverlayRef.current = null;
      }
      setSelectedWaypointId(null);
      updateSelectedMarkerOverlay(null);
      // Refresh markers to ensure live marker and saved markers are correct
      setTimeout(() => refreshMapMarkers(), 10);
    }
  }, [singlePointCaptureActive, previewModeActive]);

  // Recalculate map size when mobile padding changes (e.g., waypoint details open)
  // On mobile with bottom sheet, only resize when FULLY EXPANDED, not during animation
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => updateMobileMapHeightWrapper();
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, selectedWaypointId, sidebarOpen, waypointDetailsOpen, bottomSheetExpanded]);

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
        // Disable manual placement while in project (survey) mode
        if (isProjectMode) {
          setLocationSelectionActive(false);
          return;
        }
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
        if (singlePointCaptureActive) {
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
        if (singlePointCaptureActive) {
          mapContainer.style.cursor = 'crosshair';
          customCursorRef.current = 'crosshair';
        } else {
          mapContainer.style.cursor = '';
          customCursorRef.current = null;
        }
      };
    } else {
      // When location selection is not active, restore cursor based on survey mode
      if (singlePointCaptureActive) {
        mapContainer.style.cursor = 'crosshair';
        customCursorRef.current = 'crosshair';
      } else {
        mapContainer.style.cursor = '';
        customCursorRef.current = null;
      }
    }
  }, [locationSelectionActive, selectedWaypointId, singlePointCaptureActive]);

  // Update live coordinates based on device type
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const updateCenterCoordinates = () => {
      const center = map.getCenter();
      setCursorCoordinates({
        lat: center.lat.toFixed(6),
        lng: center.lng.toFixed(6),
        accuracy: null
      });
    };

    if (hasCursor) {
      // Desktop: Update cursor coordinates on mouse move
      const handleMouseMove = (e) => {
        const latlng = map.mouseEventToLatLng(e.originalEvent);
        setCursorCoordinates({
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
      // Touch device: Update cursor coordinates based on map center
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
  }, [hasCursor, gpsActive]); // Re-run when hasCursor or gpsActive changes

  // Update red overlay when selected waypoint changes
  useEffect(() => {
    // Use a small delay to ensure markers are properly initialized and state is updated
    const timer = setTimeout(() => {
      updateSelectedMarkerOverlay(selectedWaypointId);
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedWaypointId, waypoints]);

  return (
    <>
      {measureActive && (
        <MeasureToolbar
          isMobile={isMobile}
          onStartMeasureArea={handleStartMeasureArea}
          onStartMeasureDistance={handleStartMeasureDistance}
          onClearMeasure={handleClearMeasure}
          onClose={() => {
            setMeasureActive(false);
            handleClearMeasure();
          }}
          hasSelection={hasMeasureSelection}
          mapDynamicHeight={mapDynamicHeight}
        />
      )}

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
            onToggleSatelliteHybrid={handleToggleSatelliteHybrid}
            satelliteHybridMode={satelliteHybridMode}
            onSidebarToggle={handleSidebarToggle}
            onSearch={handleMapSearch}
            onLocate={handleMapLocate}
          />
          <Sidebar
            sidebarOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            isMobile={isMobile}
            onMenuItemClick={handleMenuItemClick}
            satelliteHybridMode={satelliteHybridMode}
            onToggleSatelliteHybrid={handleToggleSatelliteHybrid}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
          <StartSurveyDialog
            open={startSurveyDialogOpen}
            onClose={() => setStartSurveyDialogOpen(false)}
            onStartNew={handleStartSurveyNew}
            onContinue={handleStartSurveyContinue}
            onShowSnackbar={showSnackbar}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 0,
              height: '100%',
              minHeight: '100vh',
              overflow: 'hidden',
              marginTop: { xs: '4rem', sm: '3.5rem' },
              paddingBottom: 'env(safe-area-inset-bottom)',
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

            {/* Live Coordinates card - hide on mobile when waypoint details open */}
            {(!isMobile || !waypointDetailsOpen) && (
              <LiveCoordinates coordinates={cursorCoordinates} sidebarOpen={sidebarOpen} ref={liveCoordsRef} />
            )}

            {(singlePointCaptureActive || isProjectMode) && (
              <>
                {/* Waypoint Selector - horizontal scrollable tabs */}
                <WaypointSelector
                  waypoints={selectorWaypoints}
                  selectedWaypointId={selectedWaypointId}
                  onSelectWaypoint={handleSelectWaypoint}
                />

                {/* Waypoint Details - Bottom Sheet for mobile, fixed card for desktop */}
                {isMobile ? (
                  // Mobile: Bottom Sheet with snap points
                  <BottomSheet
                    ref={bottomSheetRef}
                    isOpen={(isProjectMode || selectedWaypointId) && waypointDetailsOpen}
                    onClose={() => {
                      setWaypointDetailsOpen(false);
                      setSelectedWaypointId(null);
                      setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
                      setLocationSelectionActive(false);
                      updateSelectedMarkerOverlay(null);
                    }}
                    waypointName={waypointData.name}
                    onSave={selectedWaypointId ? handleSaveWaypoint : saveCurrentLocationAsProjectPoint}
                    onDelete={handleDeleteWaypoint}
                    onImageUpload={handleImageUpload}
                    imageUploading={imageUploading}
                    canSave={(function () {
                      if (!isProjectMode) return true;
                      if (!selectedWaypointId) return true;
                      const wp = waypoints.find(w => w.id === selectedWaypointId);
                      if (!wp) return false;
                      const isProjectPoint = wp.project_id && activeProject && String(wp.project_id) === String(activeProject.id);
                      const isCurrent = selectedWaypointId === currentLocationWaypointId;
                      const isPinCreated = wp.createdDuringProject && !wp.project_id;
                      return !!(isProjectPoint || isCurrent || isPinCreated);
                    })()}
                    onExpansionChange={setBottomSheetExpanded}
                  >
                    <WaypointDetails
                      selectedWaypointId={selectedWaypointId}
                      waypointData={waypointData}
                      setWaypointData={setWaypointData}
                      onClose={() => {
                        setWaypointDetailsOpen(false);
                        setSelectedWaypointId(null);
                        setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
                        setLocationSelectionActive(false);
                        updateSelectedMarkerOverlay(null);
                      }}
                      onSave={selectedWaypointId ? handleSaveWaypoint : saveCurrentLocationAsProjectPoint}
                      locationSelectionActive={locationSelectionActive}
                      onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
                      onDelete={handleDeleteWaypoint}
                      onImageUpload={handleImageUpload}
                      imageUploading={imageUploading}
                      savedWaypoints={savedWaypointsList}
                      onNavigate={handleNavigate}
                      sidebarOpen={sidebarOpen}
                      isProjectMode={isProjectMode}
                      activeProjectId={activeProject?.id}
                      currentLocationId={currentLocationWaypointId}
                      currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng, elevation: coordinates.elevation } : null}
                      canSaveDuringProject={(function () {
                        if (!isProjectMode) return true;
                        if (!selectedWaypointId) return true;
                        const wp = waypoints.find(w => w.id === selectedWaypointId);
                        if (!wp) return false;
                        const isProjectPoint = wp.project_id && activeProject && String(wp.project_id) === String(activeProject.id);
                        const isCurrent = selectedWaypointId === currentLocationWaypointId;
                        const isPinCreated = wp.createdDuringProject && !wp.project_id;
                        return !!(isProjectPoint || isCurrent || isPinCreated);
                      })()}
                      onCollapseBottomSheet={() => bottomSheetRef.current?.collapse()}
                      ref={waypointDetailsRef}
                    />
                  </BottomSheet>
                ) : (
                  // Desktop: Original fixed card
                  (isProjectMode || selectedWaypointId) && waypointDetailsOpen && (
                    <WaypointDetails
                      selectedWaypointId={selectedWaypointId}
                      waypointData={waypointData}
                      setWaypointData={setWaypointData}
                      onClose={() => {
                        setWaypointDetailsOpen(false);
                        setSelectedWaypointId(null);
                        setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
                        setLocationSelectionActive(false);
                        updateSelectedMarkerOverlay(null);
                      }}
                      onSave={selectedWaypointId ? handleSaveWaypoint : saveCurrentLocationAsProjectPoint}
                      locationSelectionActive={locationSelectionActive}
                      onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
                      onDelete={handleDeleteWaypoint}
                      onImageUpload={handleImageUpload}
                      imageUploading={imageUploading}
                      savedWaypoints={savedWaypointsList}
                      onNavigate={handleNavigate}
                      sidebarOpen={sidebarOpen}
                      isProjectMode={isProjectMode}
                      activeProjectId={activeProject?.id}
                      currentLocationId={currentLocationWaypointId}
                      currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng, elevation: coordinates.elevation } : null}
                      canSaveDuringProject={(function () {
                        if (!isProjectMode) return true;
                        if (!selectedWaypointId) return true;
                        const wp = waypoints.find(w => w.id === selectedWaypointId);
                        if (!wp) return false;
                        const isProjectPoint = wp.project_id && activeProject && String(wp.project_id) === String(activeProject.id);
                        const isCurrent = selectedWaypointId === currentLocationWaypointId;
                        const isPinCreated = wp.createdDuringProject && !wp.project_id;
                        return !!(isProjectPoint || isCurrent || isPinCreated);
                      })()}
                      ref={waypointDetailsRef}
                    />
                  )
                )}
              </>
            )}

            {/* Desktop waypoint details - fixed position */}
            {(isProjectMode || selectedWaypointId) && waypointDetailsOpen && !isMobile && (
              <WaypointDetails
                selectedWaypointId={selectedWaypointId}
                waypointData={waypointData}
                setWaypointData={setWaypointData}
                onClose={() => {
                  setWaypointDetailsOpen(false);
                  setSelectedWaypointId(null);
                  setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
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
                onSave={selectedWaypointId ? handleSaveWaypoint : saveCurrentLocationAsProjectPoint}
                locationSelectionActive={locationSelectionActive}
                onToggleLocationSelection={() => setLocationSelectionActive(prev => !prev)}
                onDelete={handleDeleteWaypoint}
                onImageUpload={handleImageUpload}
                imageUploading={imageUploading}
                savedWaypoints={savedWaypointsList}
                onNavigate={handleNavigate}
                currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng, elevation: coordinates.elevation } : null}
                sidebarOpen={sidebarOpen}
                isProjectMode={isProjectMode}
              />
            )}

            {/* Waypoint Details - also show when default location is selected (even if survey not active) */}
            {selectedWaypointId && !singlePointCaptureActive && currentLocationWaypointId === selectedWaypointId && (
              <WaypointDetails
                selectedWaypointId={selectedWaypointId}
                waypointData={waypointData}
                setWaypointData={setWaypointData}
                onClose={() => {
                  setSelectedWaypointId(null);
                  setWaypointData({ name: '', lat: '', lng: '', notes: '', images: [] });
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
                currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng, elevation: coordinates.elevation } : null}
                sidebarOpen={sidebarOpen}
                isProjectMode={isProjectMode}
              />
            )}

            {/* Saved Points Dialog */}
            <SavedPoints
              open={savedPointsOpen}
              onClose={() => setSavedPointsOpen(false)}
              onShowSnackbar={showSnackbar}
              onSelectWaypoint={(waypoint) => {
                // Clear current map/state before showing the selected saved point
                resetMapAndState();
                setSinglePointCaptureActive(false);
                setIsProjectMode(false); // Ensure we're out of project mode when viewing a saved point

                const waypointId = `saved-${waypoint.id}`;
                const latFormatted = (typeof waypoint.lat === 'number' ? waypoint.lat.toFixed(6) : waypoint.lat);
                const lngFormatted = (typeof waypoint.lng === 'number' ? waypoint.lng.toFixed(6) : waypoint.lng);

                // 1. Prepare waypoint data
                const newWaypoint = {
                  id: waypointId,
                  lat: waypoint.lat,
                  lng: waypoint.lng,
                  name: waypoint.name,
                  notes: waypoint.notes || '',
                  images: waypoint.images || [],
                  project_id: waypoint.project_id || null,
                  project_name: waypoint.project_name || null
                };

                // 2. Set all necessary states to open details panel and show point
                setWaypoints([newWaypoint]);
                waypointsRef.current = [newWaypoint]; // Update ref immediately
                setDbWaypointIds({ [waypointId]: waypoint.id });
                setSelectedWaypointId(waypointId);
                setSinglePointCaptureActive(true); // Enable UI for viewing
                setPreviewModeActive(true); // In viewing mode
                setWaypointData({
                  name: waypoint.name,
                  lat: latFormatted,
                  lng: lngFormatted,
                  notes: waypoint.notes || '',
                  images: waypoint.images || [],
                  project_id: waypoint.project_id || null,
                  project_name: waypoint.project_name || null
                });
                setWaypointDetailsOpen(true);

                // Update coordinates for the live display bar
                setCoordinates({
                  lat: latFormatted,
                  lng: lngFormatted
                });

                // 3. Update map view and markers
                setTimeout(() => {
                  const map = mapRef.current;
                  if (!map) return;

                  const latlng = [waypoint.lat, waypoint.lng];
                  map.setView(latlng, 15);

                  const marker = L.marker(latlng).addTo(map);
                  marker.on('click', (e) => {
                    e.originalEvent?.stopPropagation?.();
                    handleSelectWaypoint(waypointId);
                  });
                  markersRef.current[waypointId] = marker;

                  // Sync the selected overlay (red circle)
                  updateSelectedMarkerOverlay(waypointId);
                }, 100);

                setSavedPointsOpen(false);
              }}
              onPreviewProject={(project) => {
                if (isProjectMode) {
                  if (String(activeProject?.id) === String(project.project_id)) {
                    showSnackbar('Project is already active', 'info');
                    return;
                  }
                  showSnackbar('Please exit current project to preview another project', 'warning');
                  return;
                }

                if (project.items && project.items.length > 0) {
                  // Clear existing waypoints (except the live blue marker which is separate)
                  resetMapAndState();

                  // Small timeout to allow state clear to process before adding new ones
                  setTimeout(() => {
                    loadProjectWaypointsToMap({ waypoints: project.items }, { id: project.project_id, name: project.project_name });

                    // Load GPS tracks for this project
                    loadProjectTracks(project.project_id);

                    setSinglePointCaptureActive(true);
                    setPreviewModeActive(true);
                    showSnackbar(`Loaded points from ${project.project_name}`, 'success');
                  }, 50);

                } else {
                  showSnackbar('Project has no points', 'info');
                }
              }}
            />

            {/* Export Dialog */}
            <ExportDialog
              open={exportDialogOpen}
              onClose={() => setExportDialogOpen(false)}
              onShowSnackbar={showSnackbar}
            />

            {/* CRS Converter Dialog */}
            <CRSConverterDialog
              open={crsConverterOpen}
              onClose={() => setCrsConverterOpen(false)}
              currentLocation={coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : null}
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
              onContinue={handleGpsWarningContinue}
              onRetry={handleGpsWarningRetry}
              requireGPS={gpsRequiredForSurvey}
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

          {/* Floating bottom bar for project controls */}
          {isProjectMode && (
            <>
              {/* Exit button - separate floating button for both mobile and desktop */}
              {!projectRecording && (
                <Paper
                  elevation={8}
                  sx={{
                    position: 'fixed',
                    ...(isMobile ? {
                      right: '0.75rem',
                      top: mapDynamicHeight ? `calc(${mapDynamicHeight / 2}px - 13.5rem + 4.5rem)` : 'calc(50% - 13.5rem + 4.5rem)',
                      display: 'flex',
                      flexDirection: 'column',
                    } : {
                      bottom: 32,
                      left: 'calc(50% - 280px)',
                      display: 'flex',
                      flexDirection: 'row',
                    }),
                    zIndex: theme.zIndex.drawer + 30,
                    gap: 0.75,
                    p: 0.75,
                    borderRadius: 4,
                    backgroundColor: theme.palette.background.paper,
                    opacity: 0.65
                  }}
                >
                  <IconButton
                    aria-label="exit"
                    title="Exit survey"
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '3.5rem',
                      height: '3.5rem',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: isMobile ? '2rem' : '1.25rem'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      exitSurveyMode();
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Paper>
              )}

              <Paper ref={projectBarRef} elevation={8} sx={{
                position: 'fixed',
                top: isMobile ? '5rem' : 'auto',
                bottom: isMobile ? 'auto' : 32,
                left: '50%',
                transform: 'translateX(-50%)',
                width: isMobile ? 'auto' : 'fit-content',
                maxWidth: { xs: '90%', sm: 'min(95%, 900px)', md: 'min(90%, 1000px)' },
                zIndex: { xs: theme.zIndex.drawer + 3, sm: theme.zIndex.drawer + 30 },
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: isMobile ? 0.5 : 1,
                px: { xs: 2, sm: 2, md: 3 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: 4,
                cursor: 'default',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' }}>
                  <Box ref={infoBoxRef} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%' }}>
                    <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '120px' : '180px' }}>{activeProject ? activeProject.name : 'Project'}</Typography>
                    <Typography sx={{ ml: 1, mr: 1, fontWeight: 600, color: theme.palette.text.primary, flexShrink: 0 }}>{formatTime(timerSeconds)}</Typography>
                    {isMobile && (
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: projectRecording ? '#0891B2' : 'red', ml: 1 }} />
                    )}
                  </Box>
                </Box>

                {!isMobile && (
                  <Box ref={optionsRef} sx={{ display: 'flex', gap: { xs: 0.5, sm: 1.5, md: 2 }, width: 'auto', flexWrap: 'nowrap', justifyContent: 'center', overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
                    <IconButton aria-label="add-current" title="Add point (live coords)" sx={{ flex: 'initial', display: 'flex', justifyContent: 'center' }} onClick={async (e) => {
                      e.stopPropagation();

                      // Check authentication first
                      if (!isAuthenticated) {
                        setLoginPromptOpen(true);
                        return;
                      }

                      const map = mapRef.current;
                      if (!coordinates || !coordinates.lat || !coordinates.lng) {
                        showSnackbar('Unable to determine current live location (GPS).', 'error');
                        return;
                      }

                      const waypointId = `waypoint-${Date.now()}`;
                      const latNum = parseFloat(coordinates.lat);
                      const lngNum = parseFloat(coordinates.lng);

                      const newWp = {
                        id: waypointId,
                        lat: latNum,
                        lng: lngNum,
                        name: `Point ${(waypoints.filter(w => w.project_id && String(w.project_id) === String(activeProject?.id)).length) + 1}`,
                        notes: coordinates.accuracy ? `Accuracy: ±${coordinates.accuracy}m` : '',
                        images: [],
                        project_id: activeProject?.id || null,
                        project_name: activeProject?.name || null,
                        elevation: coordinates.elevation,
                        followsLive: false,
                        createdDuringProject: isProjectMode ? true : false
                      };

                      // Move map to live location
                      try { map && map.panTo([latNum, lngNum]); } catch (e) { }

                      // Ensure only one live-following waypoint at a time
                      setWaypoints(prev => prev.map(w => ({ ...w, followsLive: false })).concat([newWp]));
                      // DO NOT set currentLocationWaypointId here so the point remains fixed after saving
                      // setCurrentLocationWaypointId(waypointId);

                      if (map) {
                        const marker = L.marker([latNum, lngNum]).addTo(map);
                        marker.on('click', function () { handleSelectWaypoint(waypointId); });
                        markersRef.current[waypointId] = marker;
                      }

                      // Auto-save the waypoint to database
                      try {
                        const waypointPayload = {
                          name: newWp.name,
                          lat: latNum,
                          lng: lngNum,
                          notes: newWp.notes || '',
                          images: [],
                          elevation: newWp.elevation,
                          project_id: newWp.project_id,
                          project_name: newWp.project_name,
                        };

                        const savedWaypoint = await waypointsAPI.create(waypointPayload);
                        setDbWaypointIds(prev => ({ ...prev, [waypointId]: savedWaypoint.id }));
                        showSnackbar('Point saved! You can add more details.', 'success');
                      } catch (error) {
                        console.error('Error auto-saving waypoint:', error);
                        if (error.message === 'Authentication required') {
                          setLoginPromptOpen(true);
                          return;
                        }
                        showSnackbar('Point created locally. Save again to update.', 'warning');
                      }

                      // Select the waypoint and open details for editing
                      setSelectedWaypointId(waypointId);
                      setWaypointDetailsOpen(true);
                      setWaypointData({
                        name: newWp.name,
                        lat: latNum.toFixed(6),
                        lng: lngNum.toFixed(6),
                        notes: newWp.notes,
                        images: [],
                        project_id: newWp.project_id,
                        project_name: newWp.project_name,
                        elevation: newWp.elevation,
                        followsLive: false
                      });
                    }}>
                      <AddLocation />
                    </IconButton>

                    <IconButton aria-label="start" title="Start" sx={{ flex: 'initial', display: 'flex', justifyContent: 'center', bgcolor: projectRecording ? 'transparent' : '#0891B2', color: projectRecording ? 'inherit' : 'white', borderRadius: '50%', transition: 'all 0.25s ease', '&:hover': { bgcolor: projectRecording ? undefined : '#0E7490' } }} onClick={(e) => { e.stopPropagation(); handleStartRecording(); }} disabled={projectRecording}>
                      <PlayArrowOutlinedIcon />
                    </IconButton>

                    <IconButton aria-label="pause" title="Pause" sx={{ flex: 'initial', display: 'flex', justifyContent: 'center', transition: 'all 0.25s ease' }} onClick={(e) => { e.stopPropagation(); handlePauseRecording(); }} disabled={!projectRecording}>
                      <PauseOutlinedIcon />
                    </IconButton>

                    <IconButton aria-label="stop" title="End" sx={{ flex: 'initial', display: 'flex', justifyContent: 'center', transition: 'all 0.25s ease' }} color="error" onClick={(e) => { e.stopPropagation(); handleStopProject(); }}>
                      <StopCircleOutlinedIcon />
                    </IconButton>
                  </Box>
                )}
              </Paper>

              {isMobile && (
                <Paper elevation={8} sx={{
                  position: 'fixed',
                  right: '0.75rem',
                  top: mapDynamicHeight ? `calc(${mapDynamicHeight / 2}px + 4.5rem)` : 'calc(50% + 4.5rem)',
                  transform: 'translateY(-50%)',
                  zIndex: theme.zIndex.drawer + 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  p: 0.75,
                  borderRadius: 4,
                  backgroundColor: theme.palette.background.paper,
                  opacity: 0.85
                }}>
                  <IconButton aria-label="add-current" title="Add point (live coords)" sx={{ display: 'flex', justifyContent: 'center', width: '3.5rem', height: '3.5rem', '& .MuiSvgIcon-root': { fontSize: '2rem' } }} onClick={async (e) => {
                    e.stopPropagation();

                    if (!isAuthenticated) {
                      setLoginPromptOpen(true);
                      return;
                    }

                    const map = mapRef.current;
                    if (!coordinates || !coordinates.lat || !coordinates.lng) {
                      showSnackbar('Unable to determine current live location (GPS).', 'error');
                      return;
                    }

                    const waypointId = `waypoint-${Date.now()}`;
                    const latNum = parseFloat(coordinates.lat);
                    const lngNum = parseFloat(coordinates.lng);

                    const newWp = {
                      id: waypointId,
                      lat: latNum,
                      lng: lngNum,
                      name: `Point ${(waypoints.filter(w => w.project_id && String(w.project_id) === String(activeProject?.id)).length) + 1}`,
                      notes: coordinates.accuracy ? `Accuracy: ±${coordinates.accuracy}m` : '',
                      images: [],
                      project_id: activeProject?.id || null,
                      project_name: activeProject?.name || null,
                      elevation: coordinates.elevation,
                      followsLive: false,
                      createdDuringProject: isProjectMode ? true : false
                    };

                    try { map && map.panTo([latNum, lngNum]); } catch (e) { }

                    setWaypoints(prev => prev.map(w => ({ ...w, followsLive: false })).concat([newWp]));
                    // DO NOT set currentLocationWaypointId here so the point remains fixed after saving
                    // setCurrentLocationWaypointId(waypointId);

                    if (map) {
                      const marker = L.marker([latNum, lngNum]).addTo(map);
                      marker.on('click', function () { handleSelectWaypoint(waypointId); });
                      markersRef.current[waypointId] = marker;
                    }

                    try {
                      const waypointPayload = {
                        name: newWp.name,
                        lat: latNum,
                        lng: lngNum,
                        notes: newWp.notes || '',
                        images: [],
                        project_id: newWp.project_id,
                        project_name: newWp.project_name,
                        elevation: coordinates.elevation || null
                      };

                      const savedWaypoint = await waypointsAPI.create(waypointPayload);
                      setDbWaypointIds(prev => ({ ...prev, [waypointId]: savedWaypoint.id }));
                      showSnackbar('Point saved! You can add more details.', 'success');
                    } catch (error) {
                      console.error('Error auto-saving waypoint:', error);
                      if (error.message === 'Authentication required') {
                        setLoginPromptOpen(true);
                        return;
                      }
                      showSnackbar('Point created locally. Save again to update.', 'warning');
                    }

                    setSelectedWaypointId(waypointId);
                    setWaypointDetailsOpen(true);
                    setWaypointData({
                      name: newWp.name,
                      lat: latNum.toFixed(6),
                      lng: lngNum.toFixed(6),
                      notes: newWp.notes,
                      images: [],
                      project_id: newWp.project_id,
                      project_name: newWp.project_name,
                      elevation: newWp.elevation,
                      followsLive: false
                    });

                    // Expand bottom sheet on mobile
                    if (isMobile && bottomSheetRef.current) {
                      setTimeout(() => {
                        bottomSheetRef.current.expand();
                      }, 100);
                    }
                  }}>
                    <AddLocation />
                  </IconButton>

                  <IconButton aria-label="start" title="Start" sx={{ display: 'flex', justifyContent: 'center', bgcolor: projectRecording ? 'transparent' : '#0891B2', color: projectRecording ? 'inherit' : 'white', borderRadius: '50%', width: '3.5rem', height: '3.5rem', transition: 'all 0.25s ease', '&:hover': { bgcolor: projectRecording ? undefined : '#0E7490' }, '& .MuiSvgIcon-root': { fontSize: '2rem' } }} onClick={(e) => { e.stopPropagation(); handleStartRecording(); }} disabled={projectRecording}>
                    <PlayArrowOutlinedIcon />
                  </IconButton>

                  <IconButton aria-label="pause" title="Pause" sx={{ display: 'flex', justifyContent: 'center', width: '3.5rem', height: '3.5rem', transition: 'all 0.25s ease', '& .MuiSvgIcon-root': { fontSize: '2rem' } }} onClick={(e) => { e.stopPropagation(); handlePauseRecording(); }} disabled={!projectRecording}>
                    <PauseOutlinedIcon />
                  </IconButton>

                  <IconButton aria-label="stop" title="End" sx={{ display: 'flex', justifyContent: 'center', width: '3.5rem', height: '3.5rem', transition: 'all 0.25s ease', '& .MuiSvgIcon-root': { fontSize: '2rem' } }} color="error" onClick={(e) => { e.stopPropagation(); handleStopProject(); }}>
                    <StopCircleOutlinedIcon />
                  </IconButton>
                </Paper>
              )}
            </>
          )}

          {/* End Project Confirmation Dialog */}
          <Dialog
            open={endProjectDialogOpen}
            onClose={() => setEndProjectDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                p: 1
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>
              End Project
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to end this project? You will not be able to add more waypoints to this project.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setEndProjectDialogOpen(false)}
                variant="text"
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmEndProject}
                variant="contained"
                color="error"
                sx={{ textTransform: 'none', boxShadow: 1 }}
              >
                End Project
              </Button>
            </DialogActions>
          </Dialog>
          {/* Exit Project Warning Dialog */}
          <Dialog
            open={exitProjectWarningOpen}
            onClose={() => setExitProjectWarningOpen(false)}
            PaperProps={{
              sx: { borderRadius: 3, p: 1 }
            }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>
              Project in Progress
            </DialogTitle>
            <DialogContent>
              <Typography>
                You need to exit the current survey project before accessing this feature.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setExitProjectWarningOpen(false)}
                variant="contained"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ThemeProvider>
    </>
  );
}

export default App;
