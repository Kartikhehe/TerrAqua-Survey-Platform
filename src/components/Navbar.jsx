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
  InputBase,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  LocationOn as LocationOnIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/SurveyZest logo.png';

const drawerWidth = 260;
const drawerCollapsedWidth = 64;

function Navbar({
  sidebarOpen,
  isMobile,
  darkMode,
  onToggleDarkMode,
  onToggleSatelliteHybrid,
  satelliteHybridMode,
  onSidebarToggle,
  onSearch,
  onLocate
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Get user data from auth context
  const userName = isAuthenticated ? (user?.full_name || 'User') : 'Guest User';
  const userFirstName = userName && userName.split(' ')[0];
  const userEmail = isAuthenticated ? (user?.email || '') : 'Not Logged in';

  // Generate avatar initials from full name
  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    if (name === 'Guest User') return 'GU';
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

  const handleLogin = () => {
    navigate('/login');
    handleClose();
  };

  const handleDarkModeToggle = () => {
    onToggleDarkMode();
    handleClose();
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
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
      <Toolbar sx={{
        px: { xs: '0.875rem', sm: '1.3125rem', md: '1.75rem' },
        minHeight: { xs: '4rem', sm: '3.5rem' },
        display: 'flex',
        gap: { xs: 0.5, sm: 1 },
      }}>
        {/* Left Section: Hamburger (mobile) + Logo (desktop/tablet) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Hamburger Menu - Only on mobile, in navbar */}
          {isMobile && (
            <IconButton
              onClick={onSidebarToggle}
              sx={{
                width: { xs: '3.5rem', sm: '32px' },
                height: { xs: '3.5rem', sm: '32px' },
                backgroundColor: 'transparent',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '2rem', sm: '1.25rem' },
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo - Hidden on mobile */}
          {!isMobile && (
            <img
              src={logo}
              alt="SurveyZest"
              style={{
                height: '1.8rem',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>

        {/* Center/Left Section: Search Bar + Map Buttons */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', md: 'center' },
          maxWidth: { xs: '100%', md: '800px' },
          mx: { xs: 0, md: 'auto' },
          gap: { xs: 0.5, sm: 1 },
        }}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: { xs: '140px', sm: '220px', md: '300px' },
            }}
          >
            {!isMobile && (
              <SearchIcon
                sx={{
                  position: 'absolute',
                  left: '10px',
                  color: theme.palette.text.secondary,
                  fontSize: '1rem',
                  pointerEvents: 'none',
                  opacity: 0.6,
                  zIndex: 1,
                }}
              />
            )}
            <InputBase
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              sx={{
                width: '100%',
                pl: isMobile ? '12px' : '32px',
                pr: '12px',
                bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f5f9',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0'}`,
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                color: theme.palette.text.primary,
                transition: 'all 0.2s ease',
                height: '32px',
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                  borderColor: theme.palette.mode === 'dark' ? '#444' : '#cbd5e1',
                },
                '&.Mui-focused': {
                  ring: 2,
                  borderColor: '#0891B2',
                  bgcolor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                },
              }}
            />
          </Box>

          {/* Map Context Buttons next to searchbar */}
          <Box sx={{
            display: 'flex',
            gap: 0.5,
            ml: isMobile ? 'auto' : 0 // Right align on mobile
          }}>
            {!isMobile && (
              <IconButton
                onClick={handleSearchSubmit}
                title="Search Location"
                sx={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f5f9',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e7ff',
                    borderColor: '#0891B2',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem',
                    color: '#0891B2',
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            )}

            <IconButton
              onClick={onLocate}
              title="My Location"
              sx={{
                width: '32px',
                height: '32px',
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f5f9',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0'}`,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e7ff',
                  borderColor: '#0891B2',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem',
                  color: '#0891B2',
                },
              }}
            >
              <MyLocationIcon />
            </IconButton>

            {isMobile && (
              <IconButton
                onClick={() => window.location.href = '/'}
                title="Refresh App"
                sx={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f5f9',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e7ff',
                    borderColor: '#0891B2',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem',
                    color: '#0891B2',
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Right Section: Avatar */}
        {!isMobile && (
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              ml: { xs: 0, sm: 1 },
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f5f9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e2e8f0',
              },
            }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar
              sx={{
                width: { xs: 34, sm: 32 },
                height: { xs: 34, sm: 32 },
                bgcolor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
                fontSize: { xs: '1.125rem', sm: '1rem' },
              }}
              alt="User Avatar"
            >
              {getAvatarInitials(userName)}
            </Avatar>
          </IconButton>
        )}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          MenuListProps={{
            dense: true,
            sx: { py: { xs: 0.25, sm: 0.5 } },
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 0.125rem 0.5rem rgba(0,0,0,0.1))',
              mt: 1.5,
              minWidth: { xs: '10.5rem', sm: '12.03125rem' },
              maxWidth: { xs: '90vw', sm: '17.5rem' },
              borderRadius: '0.65625rem',
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
              '& .MuiAvatar-root': {
                width: { xs: '1.53125rem', sm: '1.75rem' },
                height: { xs: '1.53125rem', sm: '1.75rem' },
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: { xs: '0.65625rem', sm: '0.765625rem' },
                width: { xs: '0.4375rem', sm: '0.546875rem' },
                height: { xs: '0.4375rem', sm: '0.546875rem' },
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
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '0.8rem', sm: '0.8rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  {userName}
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.7rem', sm: '0.7rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDarkModeToggle} sx={{ py: { xs: 0.85, sm: 1.1 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isDark ? (
                  <DarkMode sx={{ fontSize: { xs: '0.9625rem', sm: '1.09375rem' }, color: 'text.secondary' }} />
                ) : (
                  <LightMode sx={{ fontSize: { xs: '0.9625rem', sm: '1.09375rem' }, color: 'text.secondary' }} />
                )}
                <Typography sx={{
                  color: 'text.primary',
                  fontSize: { xs: '0.85rem', sm: '0.85rem' }
                }}>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </Typography>
              </Box>
              <Switch
                checked={isDark}
                onChange={handleDarkModeToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0891B2',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#0891B2',
                  },
                }}
              />
            </Box>
          </MenuItem>

          <Divider />
          {isAuthenticated ? (
            <MenuItem
              onClick={handleLogout}
              sx={{ color: '#d32f2f', py: { xs: 0.85, sm: 1.1 } }}
            >
              Logout
            </MenuItem>
          ) : (
            <MenuItem onClick={handleLogin} sx={{ py: { xs: 0.85, sm: 1.1 } }}>
              <Typography sx={{
                color: 'text.primary',
                fontSize: { xs: '0.85rem', sm: '0.85rem' }
              }}>
                Login
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

