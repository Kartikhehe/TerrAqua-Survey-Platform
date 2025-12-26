import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { LocationOff as LocationOffIcon } from '@mui/icons-material';

function GPSWarningDialog({ open, onClose, onContinue, onRetry, requireGPS = false }) {
  const theme = useTheme();

  const handleContinue = () => {
    if (requireGPS) {
      // Don't allow continue if GPS is required
      return;
    }
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    // Don't close if GPS is required - let retry attempt handle it
    if (!requireGPS) {
      onClose();
    }
  };

  const handleDialogClose = (event, reason) => {
    // Prevent closing by clicking outside or pressing ESC if GPS is required
    if (requireGPS && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown={requireGPS}
      PaperProps={{
        sx: {
          borderRadius: { xs: '0.75rem', sm: '1rem' },
          minWidth: { xs: 'calc(100% - 1.5rem)', sm: '20rem' },
          maxWidth: { xs: '90vw', sm: '24rem' },
          width: { xs: 'calc(100% - 1.5rem)', sm: 'auto' },
          margin: { xs: '0.75rem', sm: 'auto' },
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)'
            : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <Box
            sx={{
              width: { xs: '2.5rem', sm: '3rem' },
              height: { xs: '2.5rem', sm: '3rem' },
              borderRadius: { xs: '0.65rem', sm: '0.8rem', md: '0.85rem' },
              background: `linear-gradient(135deg, ${theme.palette.warning.main || '#ff9800'}, ${theme.palette.warning.dark || '#f57c00'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LocationOffIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.25rem', sm: '1.35rem' },
            lineHeight: 1.3
          }}>
            GPS Not Detected
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="body1" sx={{
          color: theme.palette.text.secondary,
          mb: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1.125rem', sm: '1.15rem' },
          lineHeight: 1.5
        }}>
          {requireGPS
            ? 'GPS is required to start a survey. Please enable location services and allow location access for this website.'
            : 'Please enable location services and allow location access for this website. Low GPS accuracy may also affect detection.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 0.5, sm: 1 }, gap: { xs: 1, sm: 1.5 } }}>
        <Button
          onClick={handleRetry}
          sx={{
            color: theme.palette.text.secondary,
            fontSize: { xs: '1rem', sm: '1rem' },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          Retry
        </Button>
        <Button
          onClick={handleContinue}
          variant="contained"
          disabled={requireGPS}
          sx={{
            background: requireGPS
              ? theme.palette.action.disabledBackground
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: requireGPS ? theme.palette.action.disabled : 'white',
            fontSize: { xs: '1rem', sm: '1rem' },
            '&:hover': {
              background: requireGPS
                ? theme.palette.action.disabledBackground
                : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
            '&.Mui-disabled': {
              color: theme.palette.action.disabled,
            }
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GPSWarningDialog;

