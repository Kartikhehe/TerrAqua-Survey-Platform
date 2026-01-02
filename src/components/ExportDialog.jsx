import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Button,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import { Close, Download, Map, ExpandMore, Search, FolderOpen, SortOutlined, SortByAlphaRounded, SwapVertRounded } from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { waypointsAPI, projectsAPI, tracksAPI } from '../services/api';

function ExportDialog({ open, onClose, onShowSnackbar }) {
  const theme = useTheme();
  const [exportFormat, setExportFormat] = useState(null); // 'geojson' or 'kml'
  const [projects, setProjects] = useState([]);
  const [individualPoints, setIndividualPoints] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && exportFormat) {
      loadData();
    }
  }, [open, exportFormat]);

  const loadData = async () => {
    setLoading(true);
    try {
      const waypointsData = await waypointsAPI.getAll();

      // Group waypoints by project
      const projectsGrouped = waypointsData.reduce((acc, wp) => {
        const pid = wp.project_id || null;
        if (pid) {
          if (!acc[pid]) {
            acc[pid] = {
              project_id: pid,
              project_name: wp.project_name || 'Project',
              waypoints: [],
              created_at: wp.created_at,
              tracks: [] // Initialize tracks array
            };
          }
          acc[pid].waypoints.push(wp);
        }
        return acc;
      }, {});

      // Fetch tracks for each project
      const projectsWithTracks = await Promise.all(
        Object.values(projectsGrouped).map(async (project) => {
          try {
            const trackData = await tracksAPI.getByProject(project.project_id);
            console.log(`Track data for project ${project.project_id}:`, trackData);

            // Backend returns: { points: [...], summary: {...}, total_points: N }
            // Convert points array to track format
            let tracks = [];
            if (trackData && trackData.points && trackData.points.length > 0) {
              // Convert points to coordinates array [[lng, lat], ...]
              const coordinates = trackData.points.map(point => [
                parseFloat(point.lng),
                parseFloat(point.lat)
              ]);

              tracks = [{
                id: trackData.summary?.id || null,
                coordinates: coordinates,
                started_at: trackData.summary?.started_at || null,
                ended_at: trackData.summary?.ended_at || null,
                total_distance: trackData.summary?.total_distance || null,
                total_duration: trackData.summary?.total_duration || null,
                point_count: trackData.total_points || coordinates.length
              }];
            }

            return { ...project, tracks };
          } catch (error) {
            console.error(`Error fetching tracks for project ${project.project_id}:`, error);
            return { ...project, tracks: [] };
          }
        })
      );

      // Separate individual points (no project)
      const individual = waypointsData.filter(wp => !wp.project_id);

      setProjects(projectsWithTracks);
      setIndividualPoints(individual);
    } catch (error) {
      console.error('Error loading data:', error);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to load waypoints', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFormat = (format) => {
    setExportFormat(format);
    setSelectedItems(new Set());
  };

  const handleBack = () => {
    setExportFormat(null);
    setSelectedItems(new Set());
    setSearchQuery('');
  };

  const handleToggleItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleProject = (project) => {
    const newSelected = new Set(selectedItems);
    const allSelected = project.waypoints.every(wp => newSelected.has(`wp-${wp.id}`));

    if (allSelected) {
      // Deselect all waypoints in this project
      project.waypoints.forEach(wp => newSelected.delete(`wp-${wp.id}`));
    } else {
      // Select all waypoints in this project
      project.waypoints.forEach(wp => newSelected.add(`wp-${wp.id}`));
    }
    setSelectedItems(newSelected);
  };

  const getSelectedWaypoints = () => {
    const selected = [];
    const selectedTracks = [];

    // Get selected individual points
    individualPoints.forEach(wp => {
      if (selectedItems.has(`wp-${wp.id}`)) {
        selected.push(wp);
      }
    });

    // Get selected project points and their tracks
    projects.forEach(project => {
      const projectWaypoints = project.waypoints.filter(wp => selectedItems.has(`wp-${wp.id}`));

      // If any waypoints from this project are selected, add them and the project's tracks
      if (projectWaypoints.length > 0) {
        selected.push(...projectWaypoints);

        // Add tracks for this project
        if (project.tracks && project.tracks.length > 0) {
          project.tracks.forEach(track => {
            selectedTracks.push({
              ...track,
              project_id: project.project_id,
              project_name: project.project_name
            });
          });
        }
      }
    });

    return { waypoints: selected, tracks: selectedTracks };
  };

  const exportToGeoJSON = (waypoints, tracks = []) => {
    const features = [];

    // Add waypoint features (Points)
    waypoints.forEach(wp => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(wp.longitude), parseFloat(wp.latitude)]
        },
        properties: {
          name: wp.name || 'Unnamed Point',
          description: wp.notes || '',
          image: wp.image_url || null,
          project_id: wp.project_id || null,
          project_name: wp.project_name || null,
          created_at: wp.created_at || null,
          updated_at: wp.updated_at || null
        }
      });
    });

    // Add track features (LineStrings)
    tracks.forEach(track => {
      if (track.coordinates && track.coordinates.length > 0) {
        // Coordinates are already in the correct format: [[lng, lat], ...]
        const lineCoords = track.coordinates;

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lineCoords
          },
          properties: {
            name: `Track for ${track.project_name || 'Project'}`,
            description: 'GPS Track',
            track_id: track.id || null,
            project_id: track.project_id || null,
            project_name: track.project_name || null,
            started_at: track.started_at || null,
            ended_at: track.ended_at || null
          }
        });
      }
    });

    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    const jsonString = JSON.stringify(geoJSON, null, 2);
    const blob = new Blob([jsonString], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToKML = (waypoints, tracks = []) => {
    let kmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    kmlString += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
    kmlString += '  <Document>\n';
    kmlString += `    <name>Waypoints Export ${new Date().toISOString().split('T')[0]}</name>\n`;
    kmlString += `    <description>Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}${tracks.length > 0 ? ` and ${tracks.length} track${tracks.length !== 1 ? 's' : ''}` : ''}</description>\n`;

    // Add waypoint placemarks
    waypoints.forEach(wp => {
      const latitude = parseFloat(wp.latitude);
      const longitude = parseFloat(wp.longitude);
      const name = wp.name || 'Unnamed Point';
      const notes = wp.notes || '';
      const imageUrl = wp.image_url || '';

      let description = notes;
      if (imageUrl) {
        description += (notes ? '\n\n' : '') + `Image: ${imageUrl}`;
      }

      kmlString += '    <Placemark>\n';
      kmlString += `      <name><![CDATA[${name}]]></name>\n`;
      if (description) {
        kmlString += `      <description><![CDATA[${description}]]></description>\n`;
      }

      // Add extended data for additional properties
      kmlString += '      <ExtendedData>\n';
      if (wp.project_id) {
        kmlString += `        <Data name="project_id"><value>${wp.project_id}</value></Data>\n`;
      }
      if (wp.project_name) {
        kmlString += `        <Data name="project_name"><value><![CDATA[${wp.project_name}]]></value></Data>\n`;
      }
      if (imageUrl) {
        kmlString += `        <Data name="image_url"><value>${imageUrl}</value></Data>\n`;
      }
      kmlString += '      </ExtendedData>\n';

      kmlString += '      <Point>\n';
      kmlString += `        <coordinates>${longitude},${latitude},0</coordinates>\n`;
      kmlString += '      </Point>\n';
      kmlString += '    </Placemark>\n';
    });

    // Add track placemarks (LineStrings)
    tracks.forEach(track => {
      if (track.coordinates && track.coordinates.length > 0) {
        // Coordinates are already in the correct format: [[lng, lat], ...]
        const lineCoords = track.coordinates;

        // Convert coordinates to KML format (lng,lat,alt lng,lat,alt ...)
        const kmlCoords = lineCoords.map(coord => `${coord[0]},${coord[1]},0`).join(' ');

        kmlString += '    <Placemark>\n';
        kmlString += `      <name><![CDATA[Track for ${track.project_name || 'Project'}]]></name>\n`;
        kmlString += `      <description><![CDATA[GPS Track]]></description>\n`;

        // Add extended data
        kmlString += '      <ExtendedData>\n';
        if (track.id) {
          kmlString += `        <Data name="track_id"><value>${track.id}</value></Data>\n`;
        }
        if (track.project_id) {
          kmlString += `        <Data name="project_id"><value>${track.project_id}</value></Data>\n`;
        }
        if (track.project_name) {
          kmlString += `        <Data name="project_name"><value><![CDATA[${track.project_name}]]></value></Data>\n`;
        }
        if (track.started_at) {
          kmlString += `        <Data name="started_at"><value>${track.started_at}</value></Data>\n`;
        }
        if (track.ended_at) {
          kmlString += `        <Data name="ended_at"><value>${track.ended_at}</value></Data>\n`;
        }
        kmlString += '      </ExtendedData>\n';

        kmlString += '      <LineString>\n';
        kmlString += `        <coordinates>${kmlCoords}</coordinates>\n`;
        kmlString += '      </LineString>\n';
        kmlString += '    </Placemark>\n';
      }
    });

    kmlString += '  </Document>\n';
    kmlString += '</kml>';

    const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `waypoints_export_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const { waypoints, tracks } = getSelectedWaypoints();

    if (waypoints.length === 0 && tracks.length === 0) {
      if (onShowSnackbar) {
        onShowSnackbar('Please select at least one waypoint or track to export', 'warning');
      }
      return;
    }

    try {
      if (exportFormat === 'geojson') {
        exportToGeoJSON(waypoints, tracks);
      } else if (exportFormat === 'kml') {
        exportToKML(waypoints, tracks);
      }

      if (onShowSnackbar) {
        const message = `Exported ${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}${tracks.length > 0 ? ` and ${tracks.length} track${tracks.length !== 1 ? 's' : ''}` : ''} to ${exportFormat.toUpperCase()}`;
        onShowSnackbar(message, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to export data. Please try again.', 'error');
      }
    }
  };

  // Process data with search and sort
  const processedData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter and sort individual points
    let filteredSingles = individualPoints.filter(wp =>
      !q || wp.name?.toLowerCase().includes(q)
    );

    filteredSingles.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      switch (sortOption) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'az': return nameA.localeCompare(nameB);
        case 'za': return nameB.localeCompare(nameA);
        default: return 0;
      }
    });

    // 2. Filter and sort projects
    let filteredProjects = projects.map(project => {
      const matchingWaypoints = project.waypoints.filter(wp =>
        !q || wp.name?.toLowerCase().includes(q) || project.project_name?.toLowerCase().includes(q)
      );

      return {
        ...project,
        waypoints: matchingWaypoints
      };
    }).filter(project => project.waypoints.length > 0);

    filteredProjects.sort((a, b) => {
      const nameA = (a.project_name || '').toLowerCase();
      const nameB = (b.project_name || '').toLowerCase();
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      switch (sortOption) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'az': return nameA.localeCompare(nameB);
        case 'za': return nameB.localeCompare(nameA);
        default: return 0;
      }
    });

    return { projects: filteredProjects, singles: filteredSingles };
  }, [projects, individualPoints, searchQuery, sortOption]);


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '0.5625rem', sm: '0.75rem' },
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0.1875rem 0.5625rem rgba(0, 0, 0, 0.5)'
            : '0 0.1875rem 0.5625rem rgba(0, 0, 0, 0.1)',
          margin: { xs: '0.75rem', sm: 'auto' },
          maxHeight: { xs: '90vh', sm: '80vh' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: { xs: 1.5, sm: 2 },
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            {exportFormat ? `Select Points to Export (${exportFormat.toUpperCase()})` : 'Export Data'}
          </Typography>
        </Box>
        <IconButton
          onClick={exportFormat ? handleBack : onClose}
          sx={{
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '50%',
            width: { xs: '1.3125rem', sm: '1.5rem' },
            height: { xs: '1.3125rem', sm: '1.5rem' },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        {!exportFormat ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: { xs: 0.75, sm: 1 },
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
              }}
            >
              Choose an export format:
            </Typography>

            <Button
              variant="contained"
              startIcon={<Map />}
              onClick={() => handleSelectFormat('geojson')}
              fullWidth
              sx={{
                py: { xs: 1.5, sm: 2 },
                borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                backgroundColor: '#0891B2',
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.15rem' },
                fontWeight: 500,
                boxShadow: '0 0.125rem 0.5rem rgba(8, 145, 178, 0.3)',
                '&:hover': {
                  backgroundColor: '#0E7490',
                  boxShadow: '0 0.25rem 0.75rem rgba(8, 145, 178, 0.4)',
                },
              }}
            >
              Export to GeoJSON
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleSelectFormat('kml')}
              fullWidth
              sx={{
                py: { xs: 1.5, sm: 2 },
                borderRadius: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.15rem' },
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#0891B2',
                  backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0',
                },
              }}
            >
              Export to KML
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Search waypoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.75rem',
                    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  },
                }}
              />
              <IconButton
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '0.75rem',
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'
                }}
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

            <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {/* Individual Points */}
              {processedData.singles.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary, mt: 1, fontSize: '0.9rem' }}>
                    Individual Points ({processedData.singles.length})
                  </Typography>
                  <List dense>
                    {processedData.singles.map(wp => (
                      <ListItem
                        key={`wp-${wp.id}`}
                        button
                        onClick={() => handleToggleItem(`wp-${wp.id}`)}
                        sx={{
                          borderRadius: '0.5rem',
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Checkbox
                          checked={selectedItems.has(`wp-${wp.id}`)}
                          sx={{ mr: 1 }}
                        />
                        <ListItemText
                          primary={wp.name || 'Unnamed Point'}
                          secondary={`${parseFloat(wp.latitude).toFixed(6)}, ${parseFloat(wp.longitude).toFixed(6)}`}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: { xs: '1.05rem', sm: '1.1rem' },
                              fontWeight: 600
                            }
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              fontSize: { xs: '0.9rem', sm: '0.95rem' }
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Projects */}
              {processedData.projects.map(project => (
                <Accordion
                  key={project.id}
                  sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '0.5rem !important',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                      onClick={(e) => {
                        // Only toggle if not clicking the expand icon
                        if (!e.target.closest('.MuiAccordionSummary-expandIconWrapper')) {
                          e.stopPropagation();
                          handleToggleProject(project);
                        }
                      }}
                    >
                      <Checkbox
                        checked={project.waypoints.every(wp => selectedItems.has(`wp-${wp.id}`))}
                        indeterminate={
                          project.waypoints.some(wp => selectedItems.has(`wp-${wp.id}`)) &&
                          !project.waypoints.every(wp => selectedItems.has(`wp-${wp.id}`))
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleProject(project);
                        }}
                        sx={{ mr: 1 }}
                      />
                      <FolderOpen sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="subtitle2" sx={{ fontSize: { xs: '1.05rem', sm: '1.1rem' }, fontWeight: 700 }}>
                        {project.project_name} ({project.waypoints.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {project.waypoints.map(wp => (
                        <ListItem
                          key={`wp-${wp.id}`}
                          button
                          onClick={() => handleToggleItem(`wp-${wp.id}`)}
                          sx={{
                            borderRadius: '0.5rem',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Checkbox
                            checked={selectedItems.has(`wp-${wp.id}`)}
                            sx={{ mr: 1 }}
                          />
                          <ListItemText
                            primary={wp.name || 'Unnamed Point'}
                            secondary={`${parseFloat(wp.latitude).toFixed(6)}, ${parseFloat(wp.longitude).toFixed(6)}`}
                            primaryTypographyProps={{
                              sx: {
                                fontSize: { xs: '1.05rem', sm: '1.1rem' },
                                fontWeight: 600
                              }
                            }}
                            secondaryTypographyProps={{
                              sx: {
                                fontSize: { xs: '0.9rem', sm: '0.95rem' }
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}

              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                  <CircularProgress size={40} sx={{ color: '#0891B2' }} />
                  <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>Loading data points...</Typography>
                </Box>
              ) : (processedData.projects.length === 0 && processedData.singles.length === 0) ? (
                <Typography variant="body2" sx={{ textAlign: 'center', color: theme.palette.text.secondary, py: 4, fontSize: '1rem' }}>
                  No waypoints found
                </Typography>
              ) : null}
            </Box>

            <Button
              variant="contained"
              onClick={handleExport}
              fullWidth
              disabled={selectedItems.size === 0}
              sx={{
                py: 1.5,
                borderRadius: '0.75rem',
                backgroundColor: '#0891B2',
                textTransform: 'none',
                fontSize: { xs: '1.05rem', sm: '1.1rem' },
                fontWeight: 700,
                '&:hover': {
                  backgroundColor: '#0E7490',
                },
              }}
            >
              Export {selectedItems.size} Selected Point{selectedItems.size !== 1 ? 's' : ''}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
