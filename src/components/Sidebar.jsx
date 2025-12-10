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
  InputOutlined as InputOutlinedIcon,
  ChevronLeft, 
  ChevronRight 
} from '@mui/icons-material';

// Responsive drawer widths (87.5% of original)
const drawerWidth = { xs: '14rem', sm: '14.21875rem', md: '15.3125rem' };
const drawerCollapsedWidth = { xs: '3.0625rem', sm: '3.5rem' };

function Sidebar({ sidebarOpen, onToggle, isMobile, onMenuItemClick }) {
  const theme = useTheme();
  const menuItems = [
    { text: 'Start Survey', icon: <AddLocationAltOutlinedIcon />, action: () => onMenuItemClick('Start Survey') },
    { text: 'View Saved Points', icon: <BookmarkAddedOutlinedIcon />, action: () => onMenuItemClick('Saved Points') },
    { text: 'Import File', icon: <InputOutlinedIcon />, action: () => onMenuItemClick('Import File') },
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
          width: sidebarOpen 
            ? { xs: drawerWidth.xs, sm: drawerWidth.sm, md: drawerWidth.md }
            : { xs: drawerCollapsedWidth.xs, sm: drawerCollapsedWidth.sm },
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: sidebarOpen 
              ? { xs: drawerWidth.xs, sm: drawerWidth.sm, md: drawerWidth.md }
              : { xs: drawerCollapsedWidth.xs, sm: drawerCollapsedWidth.sm },
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: { xs: '0 0.75rem 0.75rem 0', sm: '0 1rem 1rem 0' },
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            top: { xs: '3.0625rem', sm: '3.5rem' },
            height: { xs: 'calc(100vh - 3.0625rem)', sm: 'calc(100vh - 3.5rem)' },
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
          padding: { xs: theme.spacing(0, 0.65625), sm: theme.spacing(0, 0.875) },
          minHeight: { xs: '3.0625rem', sm: '3.5rem' },
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
            width: { xs: '1.75rem', sm: '2.1875rem' },
            height: { xs: '1.75rem', sm: '2.1875rem' },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }} 
          size="small"
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      <List sx={{ pt: { xs: '3.9375rem', sm: '4.375rem' } }}>
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
                  mx: { xs: 0.65625, sm: 0.875 },
                  borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  minHeight: { xs: '2.40625rem', sm: '2.625rem' },
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
                    minWidth: sidebarOpen ? { xs: '1.75rem', sm: '2.1875rem' } : 'auto',
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
                      fontSize: { xs: '0.74375rem', sm: '0.7875rem', md: '0.83125rem' },
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

