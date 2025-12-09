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

function GPSWarningDialog({ open, onClose, onContinue }) {
  const theme = useTheme();

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: { xs: '0.5625rem', sm: '0.75rem' },
          minWidth: { xs: 'calc(100% - 1.5rem)', sm: '15rem' },
          maxWidth: { xs: '90vw', sm: '18.75rem' },
          width: { xs: 'calc(100% - 1.5rem)', sm: 'auto' },
          margin: { xs: '0.75rem', sm: 'auto' },
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)' 
            : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <Box
            sx={{
              width: { xs: '1.875rem', sm: '2.25rem' },
              height: { xs: '1.875rem', sm: '2.25rem' },
              borderRadius: { xs: '0.5625rem', sm: '0.65625rem', md: '0.75rem' },
              background: `linear-gradient(135deg, ${theme.palette.warning.main || '#ff9800'}, ${theme.palette.warning.dark || '#f57c00'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocationOffIcon sx={{ fontSize: { xs: '0.9375rem', sm: '1.125rem' }, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            fontSize: { xs: '0.75rem', sm: '0.9375rem' }
          }}>
            GPS Not Detected
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1.125, sm: 1.5 }, pb: { xs: 0.75, sm: 1.125 } }}>
        <Typography variant="body1" sx={{ 
          color: theme.palette.text.secondary, 
          mb: { xs: 1.125, sm: 1.5 },
          fontSize: { xs: '0.65625rem', sm: '0.75rem' }
        }}>
          GPS not detected. Make sure it is turned on.
        </Typography>
        <Typography variant="body2" sx={{ 
          color: theme.palette.text.secondary, 
          opacity: 0.8,
          fontSize: { xs: '0.6rem', sm: '0.65625rem' }
        }}>
          The app will use the default location instead.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 1.125, sm: 1.5 }, pt: { xs: 0.375, sm: 0.75 }, gap: { xs: 0.75, sm: 1.125 } }}>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          Continue with Default Location
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GPSWarningDialog;

