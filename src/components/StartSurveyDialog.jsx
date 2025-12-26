import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, TextField, List, ListItem, ListItemText, ListItemIcon, IconButton, Box, useTheme, CircularProgress, Typography, InputAdornment, Menu, MenuItem, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Folder as FolderIcon, Search, Sort, Add, History, SortByAlphaRounded, SwapVertRounded } from '@mui/icons-material';
import { projectsAPI } from '../services/api';

function StartSurveyDialog({ open, onClose, onStartNew, onContinue, onShowSnackbar }) {
  const theme = useTheme();
  const [mode, setMode] = useState('new'); // 'new' or 'resume'
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [nameError, setNameError] = useState(''); // Error message for duplicate names

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const data = await projectsAPI.getAll();
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    // Load projects whenever dialog opens (needed for duplicate name checking in both modes)
    if (open) loadProjects();
  }, [open]);

  // Filter and Sort Projects
  const processedProjects = React.useMemo(() => {
    let filtered = [...projects];

    // Only show paused projects (filter out ended projects)
    filtered = filtered.filter(p => p.status === 'paused');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
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

    return filtered;
  }, [projects, searchQuery, sortOption]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    // Check for duplicate project name
    const duplicateProject = projects.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicateProject) {
      setNameError('Project name already exists');
      return;
    }

    setLoading(true);
    setNameError('');
    try {
      const project = await projectsAPI.create({ name: name.trim() });
      if (onStartNew) onStartNew(project);
      setName('');
      onClose();
    } catch (err) {
      console.error('Create project error:', err);
      if (err.response?.data?.error) {
        setNameError(err.response.data.error);
      }
    }
    setLoading(false);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const handleProjectClick = (project) => {
    if (project.status === 'ended') {
      if (onShowSnackbar) {
        onShowSnackbar('Project Ended. Please contact the administrator if it wasn\'t you!', 'warning');
      }
      return;
    }
    setSelectedProjectId(project.id);
  };

  const handleContinue = () => {
    const p = projects.find(p => p.id === selectedProjectId);
    if (!p) return;
    if (onContinue) onContinue(p);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2, fontWeight: 600 }}>Start Survey</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, width: '100%' }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            aria-label="survey mode"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderRadius: '50px',
              padding: '4px',
              border: 'none',
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none',
                '&:not(:first-of-type)': {
                  marginLeft: '4px',
                  borderRadius: '50px',
                },
                '&:first-of-type': {
                  borderRadius: '50px',
                },
              },
              '& .MuiToggleButton-root': {
                flex: 1,
                py: 1,
                px: 3,
                border: 'none',
                borderRadius: '50px',
                color: theme.palette.text.secondary,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main,
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main,
                  }
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                }
              }
            }}
          >
            <ToggleButton value="new">
              <Add sx={{ mr: 0.5, fontSize: 18 }} />
              New
            </ToggleButton>
            <ToggleButton value="resume">
              <History sx={{ mr: 0.5, fontSize: 18 }} />
              Resume
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mode === 'new' && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(''); // Clear error when user types
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleCreate();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              placeholder="Enter a descriptive name"
              variant="outlined"
              error={!!nameError}
              sx={{ mb: nameError ? 1 : 3 }}
            />
            {nameError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2, fontSize: '0.75rem' }}>
                {nameError}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={onClose}
                variant="text"
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                variant="contained"
                disabled={loading || !name.trim()}
                sx={{ textTransform: 'none', boxShadow: 1 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Start Survey'}
              </Button>
            </Box>
          </Box>
        )}

        {mode === 'resume' && (
          <Box sx={{ mt: 1 }}>

            {/* Search and Sort Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{ minWidth: 40, px: 0, borderColor: theme.palette.divider }}
              >
                <Sort />
              </Button>
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

            {projectsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ maxHeight: '40vh', overflow: 'auto', mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                {processedProjects.map((p) => (
                  <ListItem key={p.id} disablePadding>
                    <Box
                      onClick={() => handleProjectClick(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (selectedProjectId === p.id) {
                            handleContinue();
                          } else {
                            handleProjectClick(p);
                          }
                        }
                      }}
                      tabIndex={0}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        cursor: 'pointer',
                        backgroundColor: selectedProjectId === p.id ? theme.palette.action.selected : 'transparent',
                        '&:hover': { backgroundColor: theme.palette.action.hover },
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <FolderIcon sx={{ mr: 2, color: '#0891B2' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(p.created_at).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
                {processedProjects.length === 0 && !projectsLoading && (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography>No projects found</Typography>
                  </Box>
                )}
              </List>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={onClose}
                variant="text"
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                variant="contained"
                disabled={!selectedProjectId}
                sx={{ textTransform: 'none', boxShadow: 1 }}
              >
                Resume Survey
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StartSurveyDialog;
