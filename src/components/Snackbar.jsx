import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

function CustomSnackbar({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        bottom: '100px !important', // Above the Live Coordinates card
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          borderRadius: '12px',
          backgroundColor: severity === 'success' ? '#4CAF50' : severity === 'error' ? '#f44336' : severity === 'info' ? '#2196F3' : '#616161',
          color: '#fff',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: '300px',
          '& .MuiAlert-icon': {
            color: '#fff',
          },
          '& .MuiAlert-action': {
            paddingTop: 0,
            alignItems: 'center',
          },
          '& .MuiIconButton-root': {
            color: '#fff',
            padding: '4px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
            },
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
            sx={{
              borderRadius: '50%',
              width: 28,
              height: 28,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default CustomSnackbar;

