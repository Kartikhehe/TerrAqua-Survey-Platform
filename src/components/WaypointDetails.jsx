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
} from '@mui/material';
import { CloudUpload, Save, Delete, Close, ArrowOutwardOutlined as ArrowOutwardOutlinedIcon } from '@mui/icons-material';
import { useState } from 'react';

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

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        right: 24,
        bottom: 160,
        width: 420,
        maxHeight: 'calc(100vh - 240px)',
        p: 3,
        borderRadius: '16px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
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
            fontSize: '1.1rem',
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
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <TextField
          label="Name"
          value={waypointData.name}
          onChange={(e) => setWaypointData(prev => ({ ...prev, name: e.target.value }))}
          fullWidth
          size="small"
          placeholder="Enter waypoint name"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '12px',
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Latitude"
            value={waypointData.lat}
            onChange={(e) => setWaypointData(prev => ({ ...prev, lat: e.target.value }))}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                borderRadius: '12px',
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
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                borderRadius: '12px',
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
                borderRadius: '12px',
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
          rows={6}
          value={waypointData.notes}
          onChange={(e) => setWaypointData(prev => ({ ...prev, notes: e.target.value }))}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '12px',
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

        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={onSave}
              sx={{
                flex: 1,
                py: 1.5,
                borderRadius: '12px',
                backgroundColor: '#4CAF50',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  backgroundColor: '#45a049',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
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
                py: 1.5,
                minWidth: 120,
                borderRadius: '12px',
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
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: '12px',
              borderColor: '#9E9E9E',
              color: '#616161',
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#757575',
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
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
                borderRadius: '12px',
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
            {savedWaypoints.length === 0 ? (
              <MenuItem disabled sx={{ color: theme.palette.text.secondary }}>
                No saved waypoints available
              </MenuItem>
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

