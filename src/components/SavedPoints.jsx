import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close, LocationOn } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { waypointsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SavedPoints({ open, onClose, onSelectWaypoint, onShowSnackbar }) {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load waypoints when dialog opens
  useEffect(() => {
    if (open) {
      if (!isAuthenticated) {
        setError('Authentication required. Please log in to view saved waypoints.');
        setLoading(false);
        return;
      }
      // Reset error state when dialog opens
      setError(null);
      loadWaypoints();
    } else {
      // Reset state when dialog closes
      setError(null);
      setWaypoints([]);
      setLoading(false);
    }
  }, [open, isAuthenticated]);

  const loadWaypoints = async () => {
    if (!isAuthenticated) {
      setError('Authentication required. Please log in to view saved waypoints.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await waypointsAPI.getAll();
      setWaypoints(data);
      if (onShowSnackbar && data.length > 0) {
        onShowSnackbar(`Loaded ${data.length} saved waypoint${data.length > 1 ? 's' : ''}`, 'success');
      }
    } catch (err) {
      let errorMsg = 'Failed to load saved waypoints';
      console.error('Error loading waypoints:', err);
      console.error('Error details:', {
        message: err.message,
        isAuthenticated,
        error: err
      });
      
      if (err.message === 'Authentication required' || err.message?.includes('Authentication')) {
        // Show a simple error message without trying to verify session
        errorMsg = 'Unable to load saved waypoints. Please ensure you are logged in and try again.';
        setError(errorMsg);
      } else {
        errorMsg = err.message || 'Failed to load saved waypoints. Please try again.';
        setError(errorMsg);
      }
      
      if (onShowSnackbar) {
        onShowSnackbar(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWaypointClick = (waypoint) => {
    if (onSelectWaypoint) {
      onSelectWaypoint({
        id: waypoint.id, // Database ID
        lat: parseFloat(waypoint.latitude),
        lng: parseFloat(waypoint.longitude),
        name: waypoint.name,
        notes: waypoint.notes || '',
        image: waypoint.image_url || null,
      });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '0.5625rem', sm: '0.75rem' },
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 0.1875rem 0.5625rem rgba(0, 0, 0, 0.5)' 
            : '0 0.1875rem 0.5625rem rgba(0, 0, 0, 0.1)',
          margin: { xs: '0.75rem', sm: 'auto' },
          maxHeight: { xs: 'calc(100vh - 1.5rem)', sm: '90vh' },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: { xs: 1.5, sm: 2 },
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
        }}
      >
        <Typography
          component="span"
          variant="h6"
          sx={{
            fontSize: { xs: '0.9rem', sm: '0.9rem', md: '0.95rem' },
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Saved Points
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '50%',
            width: { xs: '1.3125rem', sm: '1.5rem' },
            height: { xs: '1.3125rem', sm: '1.5rem' },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, maxHeight: { xs: 'calc(100vh - 8rem)', sm: '60vh' }, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 3, sm: 4 } }}>
            <CircularProgress sx={{ color: '#4CAF50' }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Alert severity="error" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{error}</Alert>
            {error?.includes('Authentication required') && (
              <Box sx={{ mt: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary', 
                  mb: 1,
                  fontSize: { xs: '0.9rem', sm: '0.95rem' }
                }}>
                  Please log in and try again.
                </Typography>
              </Box>
            )}
          </Box>
        ) : waypoints.length === 0 ? (
          <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography sx={{ 
              color: theme.palette.text.secondary,
              fontSize: { xs: '1rem', sm: '1.05rem' }
            }}>
              No saved waypoints found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {waypoints.map((waypoint, index) => (
              <ListItem key={waypoint.id} disablePadding>
                <ListItemButton
                  onClick={() => handleWaypointClick(waypoint)}
                  sx={{
                    mx: { xs: 0.75, sm: 1 },
                    my: { xs: 0.25, sm: 0.5 },
                    borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: '2rem', sm: '2.5rem' },
                      height: { xs: '2rem', sm: '2.5rem' },
                      borderRadius: '50%',
                      backgroundColor: '#E8F5E9',
                      color: '#4CAF50',
                      mr: { xs: 1.5, sm: 2 },
                      flexShrink: 0,
                    }}
                  >
                    <LocationOn sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Box>
                  <ListItemText
                    primary={waypoint.name}
                    secondary={`${parseFloat(waypoint.latitude).toFixed(6)}, ${parseFloat(waypoint.longitude).toFixed(6)}`}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.8rem', sm: '0.825rem', md: '0.875rem' },
                    }}
                    secondaryTypographyProps={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.775rem' },
                    }}
                    sx={{ minWidth: 0, flex: 1 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SavedPoints;

