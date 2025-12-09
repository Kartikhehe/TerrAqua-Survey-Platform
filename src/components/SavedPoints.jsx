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

  useEffect(() => {
    if (open) {
      if (!isAuthenticated) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      loadWaypoints();
    }
  }, [open, isAuthenticated]);

  const loadWaypoints = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
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
      if (err.message === 'Authentication required') {
        errorMsg = 'Authentication required. Please log in to view saved waypoints.';
        setError(errorMsg);
        // Close dialog and navigate to login after a short delay
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      } else {
        setError(errorMsg);
      }
      console.error(err);
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
          borderRadius: '16px',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.2rem',
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
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#4CAF50' }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
            {error === 'Authentication required' && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Redirecting to login page...
                </Typography>
              </Box>
            )}
          </Box>
        ) : waypoints.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: theme.palette.text.secondary }}>No saved waypoints found</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {waypoints.map((waypoint, index) => (
              <ListItem key={waypoint.id} disablePadding>
                <ListItemButton
                  onClick={() => handleWaypointClick(waypoint)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: '12px',
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
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#E8F5E9',
                      color: '#4CAF50',
                      mr: 2,
                    }}
                  >
                    <LocationOn />
                  </Box>
                  <ListItemText
                    primary={waypoint.name}
                    secondary={`${parseFloat(waypoint.latitude).toFixed(6)}, ${parseFloat(waypoint.longitude).toFixed(6)}`}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem',
                    }}
                    secondaryTypographyProps={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                    }}
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

