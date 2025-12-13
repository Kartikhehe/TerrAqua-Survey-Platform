import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, List, ListItem, ListItemText, IconButton, Box, useTheme } from '@mui/material';
import { ArrowBack, Folder as FolderIcon } from '@mui/icons-material';
import { projectsAPI } from '../services/api';

function StartSurveyDialog({ open, onClose, onStartNew, onContinue }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsAPI.getAll();
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    if (tab === 1 && open) loadProjects();
  }, [tab, open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const project = await projectsAPI.create({ name: name.trim() });
      if (onStartNew) onStartNew(project);
      setName('');
      onClose();
    } catch (err) {
      console.error('Create project error:', err);
      // TODO: show snackbar via parent
    }
    setLoading(false);
  };

  const handleContinue = () => {
    const p = projects.find(p => p.id === selectedProjectId);
    if (!p) return;
    if (onContinue) onContinue(p);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Start Survey</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Add New" />
          <Tab label="Continue Previous" />
        </Tabs>
        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            <TextField fullWidth label="Project Name" value={name} onChange={(e) => setName(e.target.value)} />
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <List>
              {projects.map((p) => (
                <ListItem key={p.id} onClick={() => setSelectedProjectId(p.id)} button selected={selectedProjectId === p.id}>
                  <FolderIcon sx={{ mr: 1 }} />
                  <ListItemText primary={p.name} secondary={new Date(p.created_at).toLocaleString()} />
                </ListItem>
              ))}
              {projects.length === 0 && <ListItem><ListItemText primary="No projects found" /></ListItem>}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {tab === 0 && <Button onClick={handleCreate} variant="contained" disabled={loading || !name.trim()}>Start</Button>}
        {tab === 1 && <Button onClick={handleContinue} variant="contained" disabled={!selectedProjectId}>Continue</Button>}
      </DialogActions>
    </Dialog>
  );
}

export default StartSurveyDialog;
