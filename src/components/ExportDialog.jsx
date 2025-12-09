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
import { Close, Download, Code } from '@mui/icons-material';
import { waypointsAPI } from '../services/api';

function ExportDialog({ open, onClose, onShowSnackbar }) {
  const theme = useTheme();

  const handleExportJSON = async () => {
    try {
      const waypoints = await waypointsAPI.getAll();
      
      // Format waypoints for export
      const exportData = {
        exportDate: new Date().toISOString(),
        totalWaypoints: waypoints.length,
        waypoints: waypoints.map(wp => ({
          id: wp.id,
          name: wp.name,
          latitude: parseFloat(wp.latitude),
          longitude: parseFloat(wp.longitude),
          notes: wp.notes || '',
          image_url: wp.image_url || null,
          created_at: wp.created_at,
          updated_at: wp.updated_at,
        })),
      };

      // Create JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onShowSnackbar) {
        onShowSnackbar(`Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''} to JSON`, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to export data. Please try again.', 'error');
      }
    }
  };

  const handleExportXML = async () => {
    try {
      const waypoints = await waypointsAPI.getAll();
      
      // Create XML structure
      let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlString += '<waypoints>\n';
      xmlString += `  <exportDate>${new Date().toISOString()}</exportDate>\n`;
      xmlString += `  <totalWaypoints>${waypoints.length}</totalWaypoints>\n`;
      xmlString += '  <waypointList>\n';
      
      waypoints.forEach(wp => {
        xmlString += '    <waypoint>\n';
        xmlString += `      <id>${wp.id}</id>\n`;
        xmlString += `      <name><![CDATA[${wp.name}]]></name>\n`;
        xmlString += `      <latitude>${parseFloat(wp.latitude)}</latitude>\n`;
        xmlString += `      <longitude>${parseFloat(wp.longitude)}</longitude>\n`;
        xmlString += `      <notes><![CDATA[${wp.notes || ''}]]></notes>\n`;
        xmlString += `      <image_url><![CDATA[${wp.image_url || ''}]]></image_url>\n`;
        xmlString += `      <created_at>${wp.created_at}</created_at>\n`;
        xmlString += `      <updated_at>${wp.updated_at}</updated_at>\n`;
        xmlString += '    </waypoint>\n';
      });
      
      xmlString += '  </waypointList>\n';
      xmlString += '</waypoints>';
      
      // Create XML blob
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onShowSnackbar) {
        onShowSnackbar(`Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''} to XML`, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error exporting to XML:', error);
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
          Export Data
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
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 1,
            }}
          >
            Choose an export format to download all saved waypoints:
          </Typography>

          <Button
            variant="contained"
            startIcon={<Code />}
            onClick={handleExportJSON}
            fullWidth
            sx={{
              py: 2,
              borderRadius: '12px',
              backgroundColor: '#4CAF50',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                backgroundColor: '#45a049',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
              },
            }}
          >
            Export to JSON
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportXML}
            fullWidth
            sx={{
              py: 2,
              borderRadius: '12px',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#4CAF50',
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
              },
            }}
          >
            Export to XML
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;

