import { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

function WaypointSelector({ waypoints, selectedWaypointId, onSelectWaypoint }) {
  const theme = useTheme();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [waypoints]);

  if (waypoints.length === 0) return null;

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 150;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        px: 1,
        py: 1,
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 2px 8px rgba(0, 0, 0, 0.5)' 
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 2,
        maxWidth: '25vw',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {showLeftArrow && (
        <IconButton
          onClick={() => scroll('left')}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '50%',
            width: 32,
            height: 32,
            mr: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}
      
      <Box
        ref={scrollContainerRef}

        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          overflowX: 'hidden',
          overflowY: 'hidden',
          flex: 1,
        }}
      >
        {waypoints.map((waypoint, index) => {
          const isSelected = waypoint.id === selectedWaypointId;
          return (
            <Box
              key={waypoint.id}
              onClick={() => onSelectWaypoint(waypoint.id)}
              sx={{
                px: 2.5,
                py: 1,
                borderRadius: '8px',
                backgroundColor: isSelected ? theme.palette.action.hover : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                border: isSelected ? `1px solid ${theme.palette.divider}` : '1px solid transparent',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: theme.palette.text.primary,
                }}
              >
                {`Point ${index + 1}`}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {showRightArrow && (
        <IconButton
          onClick={() => scroll('right')}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '50%',
            width: 32,
            height: 32,
            ml: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <ChevronRight />
        </IconButton>
      )}
    </Paper>
  );
}

export default WaypointSelector;

