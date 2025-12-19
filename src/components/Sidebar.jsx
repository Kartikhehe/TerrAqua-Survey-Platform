import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  IconButton,
  Backdrop,
  useTheme,
  Avatar,
  Typography,
  Divider,
  Button,
  Menu,
  MenuItem,
  Switch,
} from '@mui/material';
import {
  AddLocationAltOutlined as AddLocationAltOutlinedIcon,
  BookmarkAddedOutlined as BookmarkAddedOutlinedIcon,
  IosShareOutlined as IosShareOutlinedIcon,
  InputOutlined as InputOutlinedIcon,
  ChevronLeft,
  ChevronRight,
  SatelliteAlt as SatelliteAltIcon,
  Map as MapIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  DarkMode,
  LightMode,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Responsive drawer widths (87.5% of original, increased for mobile)
const drawerWidth = { xs: '18rem', sm: '14.21875rem', md: '15.3125rem' };
const drawerCollapsedWidth = { xs: '3.0625rem', sm: '3.5rem' };

function Sidebar({ sidebarOpen, onToggle, isMobile, onMenuItemClick, satelliteHybridMode, onToggleSatelliteHybrid, darkMode, onToggleDarkMode, onSetDefaultLocation }) {
  const theme = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const settingsOpen = Boolean(settingsAnchorEl);
  const isDark = theme.palette.mode === 'dark';

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleDarkModeToggle = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    }
    handleSettingsClose();
  };

  const handleSetDefaultLocation = () => {
    if (onSetDefaultLocation) {
      onSetDefaultLocation();
    }
    handleSettingsClose();
  };

  const menuItems = [
    { text: 'Single Point Capture', icon: <LocationOnOutlinedIcon />, action: () => onMenuItemClick('Single Point Capture') },
    { text: 'Start Survey', icon: <AddLocationAltOutlinedIcon />, action: () => onMenuItemClick('Start Survey') },
    { text: 'View Saved Points', icon: <BookmarkAddedOutlinedIcon />, action: () => onMenuItemClick('Saved Points') },
    { text: 'Export Data', icon: <IosShareOutlinedIcon />, action: () => onMenuItemClick('Export Data') },
    {
      text: satelliteHybridMode ? 'OpenStreet Mode' : 'Satellite Mode',
      icon: satelliteHybridMode ? <MapIcon /> : <SatelliteAltIcon />,
      action: () => {
        if (onToggleSatelliteHybrid) {
          onToggleSatelliteHybrid();
        }
      }
    },
    { text: 'Import File', icon: <InputOutlinedIcon />, action: () => onMenuItemClick('Import File') },
  ];

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? sidebarOpen : true}
        onClose={isMobile ? onToggle : undefined}
        ModalProps={{
          keepMounted: true,
          BackdropProps: {
            sx: { zIndex: (theme) => theme.zIndex.modal + 18 },
          },
          sx: { zIndex: (theme) => theme.zIndex.modal + 20 },
        }}
        PaperProps={{
          square: true,
          sx: {
            zIndex: (theme) => (isMobile ? theme.zIndex.modal + 21 : theme.zIndex.drawer),
            borderRadius: 0,
          },
        }}
        sx={(theme) => ({
          width: sidebarOpen
            ? { xs: drawerWidth.xs, sm: drawerWidth.sm, md: drawerWidth.md }
            : { xs: drawerCollapsedWidth.xs, sm: drawerCollapsedWidth.sm },
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: isMobile
              ? drawerWidth.xs
              : sidebarOpen
                ? { xs: drawerWidth.xs, sm: drawerWidth.sm, md: drawerWidth.md }
                : { xs: drawerCollapsedWidth.xs, sm: drawerCollapsedWidth.sm },
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            top: { xs: '4rem', sm: '3.5rem' },
            height: { xs: 'calc(100vh - 4rem)', sm: 'calc(100vh - 3.5rem)' },
            position: 'fixed',
            left: 0,
            zIndex: isMobile ? theme.zIndex.drawer + 20 : theme.zIndex.drawer,
            display: 'flex',
            flexDirection: 'column',
          },
        })}
      >
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-end' : 'center',
            padding: { xs: theme.spacing(0, 0.65625), sm: theme.spacing(0, 0.875) },
            minHeight: { xs: '4rem', sm: '3.5rem' },
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <IconButton
            onClick={onToggle}
            sx={{
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.action.hover,
              borderRadius: '50%',
              width: { xs: '3.5rem', sm: '2.1875rem' },
              height: { xs: '3.5rem', sm: '2.1875rem' },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '2rem', sm: '1.25rem' },
              },
            }}
            size="small"
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Box>

        {/* Menu Items - with flex:1 to push user section to bottom */}
        <List sx={{ pt: { xs: '3.9375rem', sm: '4.375rem' }, flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={item.text}
                placement="right"
                arrow
                disableHoverListener={sidebarOpen}
              >
                <ListItemButton
                  onClick={() => {
                    item.action();
                    if (isMobile) {
                      onToggle();
                    }
                  }}
                  sx={{
                    mx: { xs: 0.65625, sm: 0.875 },
                    borderRadius: { xs: 0, sm: '0.765625rem', md: '0.875rem' },
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: { xs: '3.75rem', sm: '2.625rem' },
                    py: { xs: 1.25, sm: 0.5 },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(76, 175, 80, 0.24)'
                          : '#C8E6C9',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: sidebarOpen ? '#4CAF50' : theme.palette.text.secondary,
                      minWidth: sidebarOpen ? { xs: '2.75rem', sm: '2.1875rem' } : 'auto',
                      justifyContent: 'center',
                      '& .Mui-selected': {
                        color: '#4CAF50',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: { xs: '1.75rem', sm: '1.25rem' },
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1.125rem', sm: '0.8rem', md: '0.83125rem' },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        {/* User Section at Bottom */}
        {sidebarOpen && (
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              p: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={`https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(userFirstName)}&size=32`}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {getAvatarInitials(userName)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleSettingsClick}
                    sx={{
                      padding: 0.25,
                      '& .MuiSvgIcon-root': {
                        fontSize: '1rem',
                      },
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Box>
            {isAuthenticated && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 0.75,
                  fontSize: '0.875rem',
                }}
              >
                Logout
              </Button>
            )}
          </Box>
        )}

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsAnchorEl}
          open={settingsOpen}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              borderRadius: 2,
              mt: -1,
            },
          }}
        >
          <MenuItem onClick={handleDarkModeToggle} sx={{ py: 1.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isDark ? (
                  <DarkMode sx={{ fontSize: '1.09375rem', color: 'text.secondary' }} />
                ) : (
                  <LightMode sx={{ fontSize: '1.09375rem', color: 'text.secondary' }} />
                )}
                <Typography sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              </Box>
              <Switch
                checked={isDark}
                onChange={handleDarkModeToggle}
                size="small"
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
          <MenuItem onClick={handleSetDefaultLocation} sx={{ py: 1.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3125 }}>
              <LocationOnIcon sx={{ fontSize: '1.09375rem', color: 'text.secondary' }} />
              <Typography sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                Set Default Location
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Drawer>
    </>
  );
}

export default Sidebar;
