import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { CloudUpload, Save, Delete, Close, ArrowOutwardOutlined as ArrowOutwardOutlinedIcon, MyLocation as MyLocationIcon, LocationSearching as LocationSearchingIcon } from '@mui/icons-material';
import { useState } from 'react';

// Default location to use when GPS is unavailable
const DEFAULT_LOCATION = {
  lat: 26.516654,
  lng: 80.231507
};

function WaypointDetails({
  selectedWaypointId,
  waypointData,
  setWaypointData,
  onClose,
  onSave,
  onDelete,
  onImageUpload,
  savedWaypoints = [],
  onNavigate,
  currentLocation = null, // { lat: number, lng: number } or null
  locationSelectionActive = false,
  onToggleLocationSelection,
  sidebarOpen = false,
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleNavigateClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNavigateClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateSelect = (fromWaypoint) => {
    if (onNavigate && fromWaypoint) {
      onNavigate(fromWaypoint);
    }
    handleNavigateClose();
  };

  const handleCurrentLocationSelect = () => {
    if (!onNavigate) {
      handleNavigateClose();
      return;
    }

    // Get fresh location from browser when user selects "Current Location"
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Create a waypoint object in the format expected by handleNavigate
          const currentLocationWaypoint = {
            id: 'current-location',
            name: 'Current Location',
            latitude: latitude,
            longitude: longitude,
          };
          onNavigate(currentLocationWaypoint);
          handleNavigateClose();
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Fallback to using passed currentLocation if available, otherwise use default location
          let fallbackLat, fallbackLng;
          if (currentLocation && currentLocation.lat && currentLocation.lng) {
            fallbackLat = parseFloat(currentLocation.lat);
            fallbackLng = parseFloat(currentLocation.lng);
          } else {
            // Use default location when GPS fails and no currentLocation is available
            fallbackLat = DEFAULT_LOCATION.lat;
            fallbackLng = DEFAULT_LOCATION.lng;
          }
          
          const currentLocationWaypoint = {
            id: 'current-location',
            name: 'Current Location',
            latitude: fallbackLat,
            longitude: fallbackLng,
          };
          onNavigate(currentLocationWaypoint);
          handleNavigateClose();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Don't use cached location, get fresh one
        }
      );
    } else {
      // Fallback if geolocation is not available
      let fallbackLat, fallbackLng;
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        fallbackLat = parseFloat(currentLocation.lat);
        fallbackLng = parseFloat(currentLocation.lng);
      } else {
        // Use default location when geolocation is not available
        fallbackLat = DEFAULT_LOCATION.lat;
        fallbackLng = DEFAULT_LOCATION.lng;
      }
      
      const currentLocationWaypoint = {
        id: 'current-location',
        name: 'Current Location',
        latitude: fallbackLat,
        longitude: fallbackLng,
      };
      onNavigate(currentLocationWaypoint);
      handleNavigateClose();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        right: { xs: '1rem', sm: '1.5rem' },
        bottom: { xs: '8rem', sm: '10rem', md: '10rem' },
        left: { 
          xs: sidebarOpen ? 'calc(14rem + 1rem)' : '1rem', // 14rem sidebar width + 1rem margin
          sm: 'auto' 
        },
        width: { 
          xs: sidebarOpen 
            ? 'calc(100% - 14rem - 2rem)' // Account for sidebar + margins
            : 'calc(100% - 1.75rem)', 
          sm: '19.25rem', 
          md: '22.96875rem' 
        },
        maxWidth: { xs: '100%', sm: '90vw', md: '22.96875rem' },
        maxHeight: { xs: '35vh', sm: 'calc(100vh - 10.5rem)', md: 'calc(100vh - 13.125rem)' },
        p: { xs: 1.3125, sm: 1.75, md: 2.625 },
        borderRadius: { xs: '0.65625rem', sm: '0.875rem' },
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)' 
          : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 3,
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, sm: 2 },
        overflow: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'transform',
        transition: theme.transitions.create(['transform', 'opacity', 'box-shadow'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '0.83125rem', sm: '0.875rem', md: '0.9625rem' },
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Waypoint Details
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ 
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '50%',
            width: { xs: '1.53125rem', sm: '1.75rem' },
            height: { xs: '1.53125rem', sm: '1.75rem' },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <TextField
          label="Name"
          value={waypointData.name}
          onChange={(e) => setWaypointData(prev => ({ ...prev, name: e.target.value }))}
          fullWidth
          size="small"
          placeholder="Enter waypoint name"
          disabled={waypointData.name && waypointData.name.trim().toLowerCase() === 'default location'}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.text.secondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4CAF50',
              },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.5, md: 2 }, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <TextField
            label="Latitude"
            value={waypointData.lat}
            onChange={(e) => setWaypointData(prev => ({ ...prev, lat: e.target.value }))}
            size="small"
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.text.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4CAF50',
                },
                '& input': {
                  color: theme.palette.text.primary,
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
              },
            }}
          />
          <TextField
            label="Longitude"
            value={waypointData.lng}
            onChange={(e) => setWaypointData(prev => ({ ...prev, lng: e.target.value }))}
            size="small"
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.text.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4CAF50',
                },
                '& input': {
                  color: theme.palette.text.primary,
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
              },
            }}
          />
          <IconButton
            onClick={onToggleLocationSelection}
            sx={{
              mt: 0.5,
              flexShrink: 0,
              backgroundColor: locationSelectionActive 
                ? theme.palette.primary.main 
                : (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'),
              color: locationSelectionActive ? 'white' : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: locationSelectionActive 
                  ? theme.palette.primary.dark 
                  : (theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0'),
              },
              borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
              width: { xs: '1.96875rem', sm: '2.1875rem' },
              height: { xs: '1.96875rem', sm: '2.1875rem' },
            }}
            title={locationSelectionActive ? 'Click on map to set location' : 'Select location from map'}
          >
            <LocationSearchingIcon />
          </IconButton>
        </Box>

        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={onImageUpload}
          />
          <label htmlFor="image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
                  borderColor: '#9E9E9E',
                },
              }}
            >
              {waypointData.image ? 'Change Image' : 'Upload Image'}
            </Button>
          </label>
          {waypointData.image && (
            <Box
              component="img"
              src={waypointData.image}
              alt="Uploaded"
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 2,
                mt: 1.5,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
        </Box>

        <TextField
          label="Notes"
          multiline
          rows={3}
          value={waypointData.notes}
          onChange={(e) => setWaypointData(prev => ({ ...prev, notes: e.target.value }))}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.text.secondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4CAF50',
              },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5, md: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={onSave}
              sx={{
                flex: 1,
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                backgroundColor: '#4CAF50',
                textTransform: 'none',
                fontSize: { xs: '0.765625rem', sm: '0.7875rem', md: '0.875rem' },
                boxShadow: '0 0.109375rem 0.4375rem rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  backgroundColor: '#45a049',
                  boxShadow: '0 0.25rem 0.75rem rgba(76, 175, 80, 0.4)',
                },
              }}
            >
              Save WayPoint
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowOutwardOutlinedIcon />}
              onClick={handleNavigateClick}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                minWidth: { xs: '5rem', sm: '7.5rem' },
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                fontSize: { xs: '0.765625rem', sm: '0.7875rem', md: '0.875rem' },
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.text.secondary,
                  backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
                },
              }}
            >
              Navigate
            </Button>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={onDelete}
            disabled={waypointData.name && waypointData.name.trim().toLowerCase() === 'default location'}
            fullWidth
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
              fontSize: { xs: '0.765625rem', sm: '0.7875rem', md: '0.875rem' },
              borderColor: '#9E9E9E',
              color: '#616161',
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#757575',
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
              },
              '&.Mui-disabled': {
                borderColor: theme.palette.divider,
                color: theme.palette.text.disabled,
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f0f0f0',
              },
            }}
          >
            Delete
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleNavigateClose}
            PaperProps={{
              sx: {
                maxHeight: 300,
                width: '280px',
                borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.5)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
                overflow: 'auto',
              },
            }}
            MenuListProps={{
              sx: {
                overflow: 'auto',
                maxHeight: 300,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.85rem',
                fontWeight: 500,
                opacity: 0.7,
                position: 'sticky',
                top: 0,
                backgroundColor: theme.palette.background.paper,
                zIndex: 1,
              }}
            >
              Navigate from
            </MenuItem>
            {/* Current Location option - always available */}
            {currentLocation && (
              <>
                <MenuItem
                  onClick={handleCurrentLocationSelect}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MyLocationIcon sx={{ color: '#2196f3', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Current Location"
                    secondary={currentLocation.lat && currentLocation.lng 
                      ? `${parseFloat(currentLocation.lat).toFixed(6)}, ${parseFloat(currentLocation.lng).toFixed(6)}`
                      : 'Getting location...'}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: theme.palette.text.secondary,
                    }}
                  />
                </MenuItem>
                {savedWaypoints.length > 0 && <Divider />}
              </>
            )}
            {/* Saved waypoints */}
            {savedWaypoints.length === 0 ? (
              !currentLocation && (
                <MenuItem disabled sx={{ color: theme.palette.text.secondary }}>
                  No saved waypoints available
                </MenuItem>
              )
            ) : (
              savedWaypoints.map((waypoint) => (
                <MenuItem
                  key={waypoint.id}
                  onClick={() => handleNavigateSelect(waypoint)}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText
                    primary={waypoint.name}
                    secondary={`${parseFloat(waypoint.latitude).toFixed(6)}, ${parseFloat(waypoint.longitude).toFixed(6)}`}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      color: theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: theme.palette.text.secondary,
                    }}
                  />
                </MenuItem>
              ))
            )}
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
}

export default WaypointDetails;

