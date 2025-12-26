import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  Button
} from '@mui/material';
import { Close, LocationOn, Folder as FolderIcon, ArrowBack, ArrowOutwardOutlined, DeleteOutlined, SortOutlined, SearchOutlined, SortByAlphaRounded, SwapVertRounded } from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { waypointsAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SavedPoints({ open, onClose, onSelectWaypoint, onShowSnackbar, onPreviewProject }) {
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewProjectId, setViewProjectId] = useState(null);

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);

  // Delete confirmation for points (simple yes/no)
  const [deletePointId, setDeletePointId] = useState(null);
  const [deletePointDialogOpen, setDeletePointDialogOpen] = useState(false);

  // Delete confirmation for projects (requires name typing)
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);

  // Load waypoints when dialog opens and reset to root view
  useEffect(() => {
    if (open) {
      setViewProjectId(null); // Reset to root view
      if (!isAuthenticated) {
        setError('Authentication required. Please log in to view saved waypoints.');
        setLoading(false);
        return;
      }
      setError(null);
      loadWaypoints();
    } else {
      setError(null);
      setWaypoints([]);
      setLoading(false);
      setSearchQuery('');
      setSortOption('newest');
    }
  }, [open, isAuthenticated]);

  const loadWaypoints = async () => {
    setLoading(true);
    try {
      const data = await waypointsAPI.getAll();
      setWaypoints(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading waypoints:', err);
      setError(err.message || 'Failed to load waypoints');
      setWaypoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWaypointClick = (waypoint) => {
    if (onSelectWaypoint) {
      onSelectWaypoint({
        id: waypoint.id,
        lat: parseFloat(waypoint.latitude),
        lng: parseFloat(waypoint.longitude),
        name: waypoint.name,
        notes: waypoint.notes || '',
        images: waypoint.images || (waypoint.image_url ? [{ url: waypoint.image_url, public_id: 'legacy' }] : []),
        project_id: waypoint.project_id,
        project_name: waypoint.project_name
      });
    }
    onClose();
  };

  const handleDeleteClick = (waypointId, e) => {
    e.stopPropagation();
    setDeletePointId(waypointId);
    setDeletePointDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePointId) return;

    try {
      await waypointsAPI.delete(deletePointId);
      setWaypoints(prev => prev.filter(w => w.id !== deletePointId));
      setDeletePointDialogOpen(false);
      setDeletePointId(null);
      if (onShowSnackbar) {
        onShowSnackbar('Point deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Error deleting waypoint:', err);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to delete point', 'error');
      }
    }
  };

  const handleDeleteProjectClick = (projectId, projectName, e) => {
    e.stopPropagation();
    setDeleteProjectId(projectId);
    setDeleteProjectName('');
    setDeleteProjectDialogOpen(true);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!deleteProjectId) return;

    const project = processedData.projects.find(p => p.project_id === deleteProjectId);
    if (!project || deleteProjectName !== project.project_name) {
      return;
    }

    try {
      // Delete the project from backend
      await projectsAPI.delete(deleteProjectId);

      // Remove all waypoints belonging to this project from local state
      setWaypoints(prev => prev.filter(w => w.project_id !== deleteProjectId));

      setDeleteProjectDialogOpen(false);
      setDeleteProjectId(null);
      setDeleteProjectName('');

      if (onShowSnackbar) {
        onShowSnackbar('Project and all its points deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to delete project', 'error');
      }
    }
  };

  const handleViewClick = (waypoint, e) => {
    e.stopPropagation();
    handleWaypointClick(waypoint);
  };

  const handlePreviewProject = (project, e) => {
    e.stopPropagation();
    if (onPreviewProject) {
      onPreviewProject(project);
    }
    onClose();
  };

  // Process data with search and sort
  const processedData = useMemo(() => {
    let filtered = [...waypoints];

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(wp =>
        wp.name.toLowerCase().includes(q) ||
        (wp.project_name && wp.project_name.toLowerCase().includes(q))
      );
    }

    // Group into projects and singles
    const projectsGrouped = filtered.reduce((acc, wp) => {
      const pid = wp.project_id || null;
      if (pid) {
        if (!acc[pid]) {
          acc[pid] = {
            project_id: pid,
            project_name: wp.project_name || 'Project',
            items: [],
            created_at: wp.created_at
          };
        }
        acc[pid].items.push(wp);
      }
      return acc;
    }, {});

    const singles = filtered.filter(wp => !wp.project_id);

    // Sort projects
    const projectsArray = Object.values(projectsGrouped);
    projectsArray.sort((a, b) => {
      const nameA = a.project_name.toLowerCase();
      const nameB = b.project_name.toLowerCase();
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      switch (sortOption) {
        case 'oldest': return dateA - dateB;
        case 'newest': return dateB - dateA;
        case 'az': return nameA.localeCompare(nameB);
        case 'za': return nameB.localeCompare(nameA);
        default: return 0;
      }
    });

    // Sort singles
    singles.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      switch (sortOption) {
        case 'oldest': return dateA - dateB;
        case 'newest': return dateB - dateA;
        case 'az': return nameA.localeCompare(nameB);
        case 'za': return nameB.localeCompare(nameA);
        default: return 0;
      }
    });

    return { projects: projectsArray, singles };
  }, [waypoints, searchQuery, sortOption]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '0.75rem', sm: '1rem' },
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)'
              : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)',
            margin: { xs: '1rem', sm: 'auto' },
            maxHeight: { xs: '80vh', sm: '90vh' },
            width: { xs: 'calc(100% - 2rem)', sm: 'auto' } // Ensure it doesn't touch edges on mobile
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: { xs: 1.5, sm: 2 },
            pt: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewProjectId !== null && (
              <IconButton
                onClick={() => setViewProjectId(null)}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.15rem', sm: '1.25rem' } }}>
              {viewProjectId !== null ? 'Project Points' : 'Saved Points'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {viewProjectId !== null && (
              <Button
                onClick={(e) => {
                  const project = processedData.projects.find(p => p.project_id === viewProjectId);
                  if (project) {
                    handlePreviewProject(project, e);
                  }
                }}
                size="small"
                endIcon={<ArrowOutwardOutlined />}
                sx={{
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  '&:hover': { backgroundColor: theme.palette.action.hover },
                  mr: 0.5,
                }}
              >
                See all
              </Button>
            )}
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': { backgroundColor: theme.palette.action.hover },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Search and Sort Toolbar */}
        {!loading && !error && waypoints.length > 0 && viewProjectId === null && (
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              <SortOutlined />
            </IconButton>
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setSortOption('newest'); setSortMenuAnchor(null); }} selected={sortOption === 'newest'}>
                <ListItemIcon><SwapVertRounded fontSize="small" /></ListItemIcon>
                <ListItemText>Newest First</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('oldest'); setSortMenuAnchor(null); }} selected={sortOption === 'oldest'}>
                <ListItemIcon><SwapVertRounded fontSize="small" /></ListItemIcon>
                <ListItemText>Oldest First</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('az'); setSortMenuAnchor(null); }} selected={sortOption === 'az'}>
                <ListItemIcon><SortByAlphaRounded fontSize="small" /></ListItemIcon>
                <ListItemText>Name (A-Z)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('za'); setSortMenuAnchor(null); }} selected={sortOption === 'za'}>
                <ListItemIcon><SortByAlphaRounded fontSize="small" /></ListItemIcon>
                <ListItemText>Name (Z-A)</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        )}

        <DialogContent sx={{ p: 0, maxHeight: { xs: '55vh', sm: '60vh' }, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 3, sm: 4 } }}>
              <CircularProgress sx={{ color: '#0891B2' }} />
            </Box>
          ) : error ? (
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Alert severity="error" sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>{error}</Alert>
              {error?.includes('Authentication required') && (
                <Box sx={{ mt: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{
                    color: 'text.secondary',
                    mb: 1,
                    fontSize: { xs: '1rem', sm: '0.95rem' }
                  }}>
                    Please log in and try again.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : waypoints.length === 0 ? (
            <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '1.05rem', sm: '1.05rem' }
              }}>
                No saved waypoints found
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {viewProjectId === null ? (
                // Root view: list projects and singles
                <>
                  {processedData.projects.map((p) => (
                    <ListItem key={`project-${p.project_id}`} disablePadding>
                      <ListItemButton
                        onClick={() => setViewProjectId(p.project_id)}
                        sx={{
                          mx: { xs: 0.75, sm: 1 },
                          my: { xs: 0.5, sm: 0.5 },
                          borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                          minHeight: { xs: '3.5rem', sm: 'auto' },
                          py: { xs: 1, sm: 0.5 },
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: { xs: '2.5rem', sm: '2.5rem' }, height: { xs: '2.5rem', sm: '2.5rem' }, mr: { xs: 1.5, sm: 2 } }}>
                          <FolderIcon sx={{ color: '#0891B2', fontSize: { xs: '1.75rem', sm: '1.5rem' } }} />
                        </Box>
                        <ListItemText
                          primary={`${p.project_name} (${p.items.length})`}
                          secondary={'Project'}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: { xs: '1.05rem', sm: '1rem' } }}
                          secondaryTypographyProps={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteProjectClick(p.project_id, p.project_name, e)}
                            color="error"
                            title="Delete project"
                          >
                            <DeleteOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handlePreviewProject(p, e)}
                            title="See all points"
                          >
                            <ArrowOutwardOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                          </IconButton>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {processedData.singles.map((waypoint) => (
                    <ListItem key={waypoint.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleWaypointClick(waypoint)}
                        sx={{
                          mx: { xs: 0.75, sm: 1 },
                          my: { xs: 0.5, sm: 0.5 },
                          borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                          minHeight: { xs: '3.5rem', sm: 'auto' },
                          py: { xs: 1, sm: 0.5 },
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: { xs: '2.5rem', sm: '2.5rem' }, height: { xs: '2.5rem', sm: '2.5rem' }, mr: { xs: 1.5, sm: 2 } }}>
                          <LocationOn sx={{ color: '#2196F3', fontSize: { xs: '1.75rem', sm: '1.5rem' } }} />
                        </Box>
                        <ListItemText
                          primary={waypoint.name}
                          secondary={waypoint.notes || 'No description'}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: { xs: '1.05rem', sm: '1rem' } }}
                          secondaryTypographyProps={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteClick(waypoint.id, e)}
                            color="error"
                            title="Delete point"
                          >
                            <DeleteOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleViewClick(waypoint, e)}
                            title="Locate on map"
                          >
                            <ArrowOutwardOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                          </IconButton>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              ) : (
                // Project detail view
                <>
                  {waypoints
                    .filter(wp => wp.project_id === viewProjectId)
                    .map((waypoint) => (
                      <ListItem key={waypoint.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleWaypointClick(waypoint)}
                          sx={{
                            mx: { xs: 0.75, sm: 1 },
                            my: { xs: 0.5, sm: 0.5 },
                            borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                            minHeight: { xs: '3.5rem', sm: 'auto' },
                            py: { xs: 1, sm: 0.5 },
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: { xs: '2.5rem', sm: '2.5rem' }, height: { xs: '2.5rem', sm: '2.5rem' }, mr: { xs: 1.5, sm: 2 } }}>
                            <LocationOn sx={{ color: '#2196F3', fontSize: { xs: '1.75rem', sm: '1.5rem' } }} />
                          </Box>
                          <ListItemText
                            primary={waypoint.name}
                            secondary={waypoint.notes || 'No description'}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: { xs: '1.05rem', sm: '1rem' } }}
                            secondaryTypographyProps={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteClick(waypoint.id, e)}
                              color="error"
                              title="Delete point"
                            >
                              <DeleteOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => handleViewClick(waypoint, e)}
                              title="Locate on map"
                            >
                              <ArrowOutwardOutlined sx={{ fontSize: { xs: '1.4rem', sm: '1.25rem' } }} />
                            </IconButton>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                </>
              )}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletePointDialogOpen}
        onClose={() => setDeletePointDialogOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleDeleteConfirm();
          } else if (e.key === 'Escape') {
            setDeletePointDialogOpen(false);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Delete Point
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this point? This can't be restored.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeletePointDialogOpen(false)}
            variant="text"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', boxShadow: 1 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Confirmation Dialog - Requires Name */}
      <Dialog
        open={deleteProjectDialogOpen}
        onClose={() => setDeleteProjectDialogOpen(false)}
        onKeyDown={(e) => {
          const project = processedData.projects.find(p => p.project_id === deleteProjectId);
          if (e.key === 'Enter' && deleteProjectName === project?.project_name) {
            handleDeleteProjectConfirm();
          } else if (e.key === 'Escape') {
            setDeleteProjectDialogOpen(false);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will delete the project and all its waypoints. Type the project name to confirm:
          </Typography>
          <Typography sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>
            {processedData.projects.find(p => p.project_id === deleteProjectId)?.project_name}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            value={deleteProjectName}
            onChange={(e) => setDeleteProjectName(e.target.value)}
            placeholder="Type project name"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteProjectDialogOpen(false)}
            variant="text"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProjectConfirm}
            variant="contained"
            color="error"
            disabled={deleteProjectName !== processedData.projects.find(p => p.project_id === deleteProjectId)?.project_name}
            sx={{ textTransform: 'none', boxShadow: 1 }}
          >
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SavedPoints;
