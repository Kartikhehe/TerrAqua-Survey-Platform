import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  useTheme,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { NearMeOutlined as NearMeOutlinedIcon, DarkMode, LightMode } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 260;
const drawerCollapsedWidth = 64;

function Navbar({ sidebarOpen, isMobile, darkMode, onToggleDarkMode }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get user data from auth context
  const userName = user?.full_name || 'User';
  const userEmail = user?.email || '';
  
  // Generate avatar initials from full name
  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleClose();
  };

  const handleDarkModeToggle = () => {
    onToggleDarkMode();
    handleClose();
  };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={(theme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        color: theme.palette.text.primary,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 2px 8px rgba(0,0,0,0.3)' 
          : '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: '0 0 0 0',
        zIndex: theme.zIndex.drawer + 1,
        width: '100%',
        marginLeft: 0,
      })}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
        <NearMeOutlinedIcon sx={{ fontSize: 28, color: '#4CAF50', mr: 1.5, transform: 'scaleX(-1)' }} />
        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            letterSpacing: '0.5px',
            fontSize: { xs: '1.1rem', sm: '1.5rem' },
            color: 'text.primary',
          }}
        >
          GPS-based Survey App
        </Typography>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            ml: 2,
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderRadius: '50%',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar 
            src={user ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(userName)}&size=40` : undefined}
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
            }}
            alt="User Avatar"
          >
            {getAvatarInitials(userName)}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              minWidth: 220,
              borderRadius: '12px',
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleClose}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar 
                src={user ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(userName)}&size=32` : undefined}
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {getAvatarInitials(userName)}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {userName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDarkModeToggle} sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isDark ? (
                  <DarkMode sx={{ fontSize: 20, color: 'text.secondary' }} />
                ) : (
                  <LightMode sx={{ fontSize: 20, color: 'text.secondary' }} />
                )}
                <Typography sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              </Box>
              <Switch
                checked={isDark}
                onChange={handleDarkModeToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4CAF50',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4CAF50',
                  },
                }}
              />
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

