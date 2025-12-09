import { Box, Paper, Typography, useTheme } from '@mui/material';

function LiveCoordinates({ coordinates }) {
  const theme = useTheme();

  return (
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 420,
          p: 2.5,
          borderRadius: '16px',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 2,
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 1,
          }}
        >
          Live Coordinates
        </Typography>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.5,
              display: 'block',
            }}
          >
            Latitude
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#4CAF50',
              fontFamily: 'monospace',
            }}
          >
            {coordinates.lat}°
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.5,
              display: 'block',
            }}
          >
            Longitude
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#4CAF50',
              fontFamily: 'monospace',
            }}
          >
            {coordinates.lng}°
          </Typography>
        </Box>
        {coordinates.accuracy !== null && (
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 0.5,
                display: 'block',
              }}
            >
              Accuracy
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#4CAF50',
                fontFamily: 'monospace',
              }}
            >
              ±{coordinates.accuracy}m
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default LiveCoordinates;

