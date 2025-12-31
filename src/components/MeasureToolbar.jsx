import React, { useState } from 'react';
import {
    Paper,
    Box,
    IconButton,
    Button,
    Typography,
    useTheme,
    Tooltip,
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip
} from '@mui/material';
import {
    PolylineOutlined as PolylineIcon,
    DeleteOutline as DeleteIcon,
    Close as CloseIcon,
    SquareFoot as MeasureIcon,
    Straighten as DistanceIcon,
    AddLocation as AddPointIcon,
    Check as FinishIcon,
    InfoOutlined as InfoOutlineIcon
} from '@mui/icons-material';

const MeasureToolbar = ({
    isMobile,
    onStartMeasureArea,
    onStartMeasureDistance,
    onClearMeasure,
    onClose,
    onAddPoint,
    onFinish,
    hasSelection,
    activeMode,
    mapDynamicHeight
}) => {
    const theme = useTheme();
    const [showHelp, setShowHelp] = useState(false);
    const [helpDialog, setHelpDialog] = useState(null);

    const helpContent = {
        area: {
            title: 'Measure Area (Polygon)',
            description: 'Measure the area of any polygon shape on the map.',
            instructions: [
                '• Tap anywhere on the map to add measurement points',
                '• Or use the + button to add points at the crosshair (map center)',
                '• Add at least 3 points to create a polygon',
                '• The area will be calculated in square meters',
                '• Each edge of the polygon will show its length',
                '• Tap the ✓ (Finish) button to complete the measurement'
            ]
        },
        distance: {
            title: 'Measure Distance (Line)',
            description: 'Measure the linear distance between points.',
            instructions: [
                '• Tap anywhere on the map to add measurement points',
                '• Or use the + button to add points at the crosshair (map center)',
                '• Add at least 2 points to measure distance',
                '• The total distance will be displayed in meters or kilometers',
                '• Tap the ✓ (Finish) button to complete the measurement'
            ]
        },
        clear: {
            title: 'Clear Measurement',
            description: 'Remove the current measurement from the map.',
            instructions: [
                '• Tap this button to delete the current measurement',
                '• All measurement lines, markers, and labels will be removed',
                '• You can start a new measurement after clearing'
            ]
        },
        addPoint: {
            title: 'Add Point',
            description: 'Add a measurement point at the crosshair location.',
            instructions: [
                '• Position the map so the crosshair is where you want to add a point',
                '• Tap this button to add a vertex at the map center',
                '• This is useful for precise point placement',
                '• Alternative to tapping directly on the map'
            ]
        },
        finish: {
            title: 'Finish Measurement',
            description: 'Complete the measurement and display results.',
            instructions: [
                '• Tap this button when you have added all your points',
                '• The measurement will be finalized and results displayed',
                '• For area: Shows total area and individual edge lengths',
                '• For distance: Shows total linear distance',
                '• You can then start a new measurement or clear this one'
            ]
        }
    };

    if (isMobile) {
        return (
            <>
                <Paper elevation={8} sx={{
                    position: 'fixed',
                    right: '0.75rem',
                    top: mapDynamicHeight ? `calc(${mapDynamicHeight / 2}px + 4.5rem)` : 'calc(50% + 4.5rem)',
                    transform: 'translateY(-50%)',
                    zIndex: theme.zIndex.drawer + 40,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    p: 0.75,
                    borderRadius: 4,
                    backgroundColor: theme.palette.background.paper,
                    opacity: 0.85
                }}>
                    {/* Info Button */}
                    <Tooltip title={showHelp ? "Hide Help" : "Show Help"} placement="left">
                        <IconButton
                            onClick={() => setShowHelp(!showHelp)}
                            sx={{
                                width: '3.5rem',
                                height: '3.5rem',
                                color: showHelp ? '#4CAF50' : theme.palette.text.secondary,
                                backgroundColor: showHelp ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                '& .MuiSvgIcon-root': { fontSize: '2rem' }
                            }}
                        >
                            <InfoOutlineIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Measure Area Button */}
                    <Box sx={{ position: 'relative' }}>
                        <Tooltip title="Measure Area (Polygon)" placement="left">
                            <IconButton
                                onClick={onStartMeasureArea}
                                sx={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    color: '#0891B2',
                                    '& .MuiSvgIcon-root': { fontSize: '2rem' }
                                }}
                            >
                                <MeasureIcon />
                            </IconButton>
                        </Tooltip>
                        <Fade in={showHelp}>
                            <Chip
                                label="Measure Area"
                                onClick={() => setHelpDialog('area')}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    right: '4.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: showHelp ? 'flex' : 'none',
                                    backgroundColor: theme.palette.background.paper,
                                    border: '2px solid #0891B2',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'none',
                                    '& .MuiChip-label': {
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(8, 145, 178, 0.1)'
                                    }
                                }}
                            />
                        </Fade>
                    </Box>

                    {/* Measure Distance Button */}
                    <Box sx={{ position: 'relative' }}>
                        <Tooltip title="Measure Distance (Line)" placement="left">
                            <IconButton
                                onClick={onStartMeasureDistance}
                                sx={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    color: '#0891B2',
                                    '& .MuiSvgIcon-root': { fontSize: '2rem' }
                                }}
                            >
                                <DistanceIcon />
                            </IconButton>
                        </Tooltip>
                        <Fade in={showHelp}>
                            <Chip
                                label="Measure Distance"
                                onClick={() => setHelpDialog('distance')}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    right: '4.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: showHelp ? 'flex' : 'none',
                                    backgroundColor: theme.palette.background.paper,
                                    border: '2px solid #0891B2',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'none',
                                    '& .MuiChip-label': {
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(8, 145, 178, 0.1)'
                                    }
                                }}
                            />
                        </Fade>
                    </Box>

                    {hasSelection && (
                        <Box sx={{ position: 'relative' }}>
                            <Tooltip title="Clear Measurements" placement="left">
                                <IconButton
                                    onClick={onClearMeasure}
                                    color="error"
                                    sx={{ width: '3.5rem', height: '3.5rem', '& .MuiSvgIcon-root': { fontSize: '2rem' } }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                            <Fade in={showHelp}>
                                <Chip
                                    label="Clear"
                                    onClick={() => setHelpDialog('clear')}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        right: '4.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        display: showHelp ? 'flex' : 'none',
                                        backgroundColor: theme.palette.background.paper,
                                        border: `2px solid ${theme.palette.error.main}`,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 'none',
                                        '& .MuiChip-label': {
                                            overflow: 'visible',
                                            textOverflow: 'clip'
                                        },
                                        '&:hover': {
                                            backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                        }
                                    }}
                                />
                            </Fade>
                        </Box>
                    )}

                    {activeMode && (
                        <>
                            <Box sx={{ position: 'relative' }}>
                                <Tooltip title="Add Point at center" placement="left">
                                    <IconButton
                                        onClick={onAddPoint}
                                        sx={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            backgroundColor: 'rgba(8, 145, 178, 0.1)',
                                            color: '#0891B2',
                                            '& .MuiSvgIcon-root': { fontSize: '2rem' }
                                        }}
                                    >
                                        <AddPointIcon />
                                    </IconButton>
                                </Tooltip>
                                <Fade in={showHelp}>
                                    <Chip
                                        label="Add Point"
                                        onClick={() => setHelpDialog('addPoint')}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            right: '4.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: showHelp ? 'flex' : 'none',
                                            backgroundColor: theme.palette.background.paper,
                                            border: '2px solid #0891B2',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 'none',
                                            '& .MuiChip-label': {
                                                overflow: 'visible',
                                                textOverflow: 'clip'
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(8, 145, 178, 0.1)'
                                            }
                                        }}
                                    />
                                </Fade>
                            </Box>

                            <Box sx={{ position: 'relative' }}>
                                <Tooltip title="Finish Measurement" placement="left">
                                    <IconButton
                                        onClick={onFinish}
                                        sx={{
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                            color: '#4CAF50',
                                            '& .MuiSvgIcon-root': { fontSize: '2rem' }
                                        }}
                                    >
                                        <FinishIcon />
                                    </IconButton>
                                </Tooltip>
                                <Fade in={showHelp}>
                                    <Chip
                                        label="Finish"
                                        onClick={() => setHelpDialog('finish')}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            right: '4.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: showHelp ? 'flex' : 'none',
                                            backgroundColor: theme.palette.background.paper,
                                            border: '2px solid #4CAF50',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 'none',
                                            '& .MuiChip-label': {
                                                overflow: 'visible',
                                                textOverflow: 'clip'
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                            }
                                        }}
                                    />
                                </Fade>
                            </Box>
                        </>
                    )}

                    <Tooltip title="Close Toolbar" placement="left">
                        <IconButton
                            onClick={onClose}
                            sx={{ width: '3.5rem', height: '3.5rem', '& .MuiSvgIcon-root': { fontSize: '2rem' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Paper>

                {/* Help Dialog */}
                {helpDialog && helpContent[helpDialog] && (
                    <Dialog
                        open={Boolean(helpDialog)}
                        onClose={() => setHelpDialog(null)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{
                            fontWeight: 600,
                            color: helpDialog === 'clear' ? theme.palette.error.main :
                                helpDialog === 'finish' ? '#4CAF50' : '#0891B2'
                        }}>
                            {helpContent[helpDialog].title}
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                                {helpContent[helpDialog].description}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                How to use:
                            </Typography>
                            {helpContent[helpDialog].instructions.map((instruction, index) => (
                                <Typography
                                    key={index}
                                    variant="body2"
                                    sx={{ mb: 0.5, pl: 1 }}
                                >
                                    {instruction}
                                </Typography>
                            ))}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setHelpDialog(null)} sx={{ fontWeight: 600 }}>
                                Got it!
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </>
        );
    }

    // Desktop version - Bottom Bar
    return (
        <Paper elevation={8} sx={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: theme.zIndex.drawer + 30,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 1.5,
            borderRadius: 4,
            backgroundColor: theme.palette.background.paper,
            minWidth: '450px'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
                <MeasureIcon sx={{ color: '#0891B2' }} />
                <Typography sx={{ fontWeight: 600 }}>Measurement Mode</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant="outlined"
                    startIcon={<MeasureIcon />}
                    onClick={onStartMeasureArea}
                    sx={{ borderRadius: 2, textTransform: 'none', color: '#0891B2', borderColor: '#0891B2' }}
                >
                    Measure Area
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<DistanceIcon />}
                    onClick={onStartMeasureDistance}
                    sx={{ borderRadius: 2, textTransform: 'none', color: '#0891B2', borderColor: '#0891B2' }}
                >
                    Measure Distance
                </Button>

                {hasSelection && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={onClearMeasure}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Clear
                    </Button>
                )}

                <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
                    <CloseIcon />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default MeasureToolbar;
