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
} from '@mui/material';
import { 
  AddLocationAltOutlined as AddLocationAltOutlinedIcon,
  BookmarkAddedOutlined as BookmarkAddedOutlinedIcon,
  IosShareOutlined as IosShareOutlinedIcon,
  ChevronLeft, 
  ChevronRight 
} from '@mui/icons-material';

const drawerWidth = 260;
const drawerCollapsedWidth = 64;

function Sidebar({ sidebarOpen, onToggle, isMobile, onMenuItemClick }) {
  const theme = useTheme();
  const menuItems = [
    { text: 'Start Survey', icon: <AddLocationAltOutlinedIcon />, action: () => onMenuItemClick('Start Survey') },
    { text: 'View Saved Points', icon: <BookmarkAddedOutlinedIcon />, action: () => onMenuItemClick('Saved Points') },
    { text: 'Export Data', icon: <IosShareOutlinedIcon />, action: () => onMenuItemClick('Export Data') },
  ];

  return (
    <>
      <Backdrop
        open={sidebarOpen}
        onClick={onToggle}
        sx={(theme) => ({
          zIndex: theme.zIndex.drawer - 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        })}
      />
      <Drawer
        variant="persistent"
        open={true}
        sx={(theme) => ({
          width: sidebarOpen ? drawerWidth : drawerCollapsedWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? drawerWidth : drawerCollapsedWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: '0 16px 16px 0',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            top: '64px',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            zIndex: theme.zIndex.drawer,
          },
        })}
      >
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-end' : 'center',
          padding: theme.spacing(0, 1),
          minHeight: '64px',
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
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }} 
          size="small"
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      <List sx={{ pt: '80px' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip
              title={item.text}
              placement="right"
              arrow
              disableHoverListener={sidebarOpen}
            >
              <ListItemButton
                onClick={item.action}
                sx={{
                  mx: 1,
                  borderRadius: '12px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  minHeight: 48,
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
                    minWidth: sidebarOpen ? 40 : 'auto',
                    justifyContent: 'center',
                    '& .Mui-selected': {
                      color: '#4CAF50',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
    </>
  );
}

export default Sidebar;

