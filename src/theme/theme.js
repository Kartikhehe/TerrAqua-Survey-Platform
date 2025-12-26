import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#0891B2', // Cyan-600
        light: '#22D3EE', // Cyan-400
        dark: '#0E7490', // Cyan-700
      },
      secondary: {
        main: '#FFC107',
      },
      background: {
        default: isDark ? '#121212' : '#f5f5f5',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#333333',
        secondary: isDark ? '#b0b0b0' : '#666666',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5',
        selected: isDark ? 'rgba(8, 145, 178, 0.16)' : '#ECFEFF',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            borderRadius: '16px',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            textTransform: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '12px',
            },
          },
        },
      },
    },
  });
};

