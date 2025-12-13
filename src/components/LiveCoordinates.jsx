import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';

const LiveCoordinates = React.forwardRef(function LiveCoordinates({ coordinates, sidebarOpen = false }, ref) {
  const theme = useTheme();

  return (
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: { xs: '0', sm: '1.5rem' },
          right: { xs: 0, sm: '1.5rem' },
          left: { 
            xs: 0,
            sm: 'auto' 
          },
          width: { 
            xs: '100%', 
            sm: '19.25rem', 
            md: '22.96875rem' 
          },
          maxWidth: { xs: '100%', sm: '90vw', md: '22.96875rem' },
          p: { xs: 1, sm: 1.75, md: 2.625 },
          borderRadius: { xs: 0, sm: '0.875rem' },
          backgroundColor: theme.palette.background.paper,
          boxShadow: {
            xs: theme.palette.mode === 'dark'
              ? '0 -6px 12px rgba(0, 0, 0, 0.35)'
              : '0 -6px 12px rgba(0, 0, 0, 0.18)',
            sm: theme.palette.mode === 'dark' 
              ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)' 
              : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)',
          },
          border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
          zIndex: {
            xs: theme.zIndex.drawer + 4, // above waypoint details so shadow falls on it
            sm: theme.zIndex.drawer + 2,
          },
          transform: 'translateZ(0)',
          willChange: 'transform',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        ref={ref}
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
            Live Coordinates
          </Typography>
        </Box>

        {/* Inline low-accuracy alert removed — use snackbar from parent instead */}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1.5, md: 2 }, 
          alignItems: 'flex-start',
          flexWrap: 'nowrap'
        }}>
          <Box sx={{ flex: { xs: '1 1 calc(33.33% - 0.33rem)', sm: 1 }, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: { xs: '0.3px', sm: '0.5px' },
                mb: 0.5,
                display: 'block',
              }}
            >
              Latitude
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.74375rem', md: '0.7875rem' },
                fontWeight: 500,
                color: '#4CAF50',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {coordinates.lat}°
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 calc(33.33% - 0.33rem)', sm: 1 }, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: { xs: '0.3px', sm: '0.5px' },
                mb: 0.5,
                display: 'block',
              }}
            >
              Longitude
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.74375rem', md: '0.7875rem' },
                fontWeight: 500,
                color: '#4CAF50',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {coordinates.lng}°
            </Typography>
          </Box>
          {coordinates.accuracy !== null && (
            <Box sx={{ flex: { xs: '1 1 calc(33.33% - 0.33rem)', sm: 1 }, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: { xs: '0.3px', sm: '0.5px' },
                  mb: 0.5,
                  display: 'block',
                }}
              >
                Accuracy
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.74375rem', md: '0.7875rem' },
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
      </Box>
    </Paper>
  );
});

export default LiveCoordinates;