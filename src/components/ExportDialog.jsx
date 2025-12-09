import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import { Close, Download, Map } from '@mui/icons-material';
import { waypointsAPI } from '../services/api';

function ExportDialog({ open, onClose, onShowSnackbar }) {
  const theme = useTheme();

  const handleExportGeoJSON = async () => {
    try {
      const waypoints = await waypointsAPI.getAll();
      
      // Format waypoints as GeoJSON FeatureCollection
      const geoJSON = {
        type: 'FeatureCollection',
        features: waypoints.map(wp => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(wp.longitude), parseFloat(wp.latitude)]
          },
          properties: {
            id: wp.id,
            name: wp.name,
            notes: wp.notes || '',
            image_url: wp.image_url || null,
            created_at: wp.created_at,
            updated_at: wp.updated_at,
          }
        }))
      };

      // Create GeoJSON blob
      const jsonString = JSON.stringify(geoJSON, null, 2);
      const blob = new Blob([jsonString], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.geojson`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onShowSnackbar) {
        onShowSnackbar(`Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''} to GeoJSON`, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error exporting to GeoJSON:', error);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to export data. Please try again.', 'error');
      }
    }
  };

  const handleExportKML = async () => {
    try {
      const waypoints = await waypointsAPI.getAll();
      
      // Create KML structure
      let kmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
      kmlString += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
      kmlString += '  <Document>\n';
      kmlString += `    <name>Waypoints Export ${new Date().toISOString().split('T')[0]}</name>\n`;
      kmlString += `    <description>Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}</description>\n`;
      
      waypoints.forEach(wp => {
        const latitude = parseFloat(wp.latitude);
        const longitude = parseFloat(wp.longitude);
        const name = wp.name || 'Unnamed Waypoint';
        const notes = wp.notes || '';
        const description = notes ? `<![CDATA[${notes}]]>` : '';
        
        kmlString += '    <Placemark>\n';
        kmlString += `      <name><![CDATA[${name}]]></name>\n`;
        if (description) {
          kmlString += `      <description>${description}</description>\n`;
        }
        kmlString += '      <Point>\n';
        kmlString += `        <coordinates>${longitude},${latitude},0</coordinates>\n`;
        kmlString += '      </Point>\n';
        kmlString += '    </Placemark>\n';
      });
      
      kmlString += '  </Document>\n';
      kmlString += '</kml>';
      
      // Create KML blob
      const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.kml`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onShowSnackbar) {
        onShowSnackbar(`Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''} to KML`, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error exporting to KML:', error);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to export data. Please try again.', 'error');
      }
    }
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
        },
      }}
    >
      <DialogTitle
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
          variant="h6"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.825rem', md: '0.9rem' },
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Export Data
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
      <DialogContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.85rem', sm: '0.875rem', md: '1rem' },
            }}
          >
            Choose an export format to download all saved waypoints:
          </Typography>

          <Button
            variant="contained"
            startIcon={<Map />}
            onClick={handleExportGeoJSON}
            fullWidth
            sx={{
              py: { xs: 1.125, sm: 1.5 },
              borderRadius: { xs: '0.5625rem', sm: '0.65625rem', md: '0.75rem' },
              backgroundColor: '#4CAF50',
              textTransform: 'none',
              fontSize: { xs: '0.65625rem', sm: '0.675rem', md: '0.75rem' },
              fontWeight: 500,
              boxShadow: '0 0.125rem 0.5rem rgba(76, 175, 80, 0.3)',
              '&:hover': {
                backgroundColor: '#45a049',
                boxShadow: '0 0.25rem 0.75rem rgba(76, 175, 80, 0.4)',
              },
            }}
          >
            Export to GeoJSON
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportKML}
            fullWidth
            sx={{
              py: { xs: 1.5, sm: 2 },
              borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
              fontWeight: 500,
              '&:hover': {
                borderColor: '#4CAF50',
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
              },
            }}
          >
            Export to KML
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;

