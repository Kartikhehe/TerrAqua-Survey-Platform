import React from 'react';
import {
    Paper,
    Box,
    IconButton,
    Button,
    Typography,
    useTheme,
    Tooltip
} from '@mui/material';
import {
    PolylineOutlined as PolylineIcon,
    DeleteOutline as DeleteIcon,
    Close as CloseIcon,
    SquareFoot as MeasureIcon,
    Straighten as DistanceIcon
} from '@mui/icons-material';

const MeasureToolbar = ({
    isMobile,
    onStartMeasureArea,
    onStartMeasureDistance,
    onClearMeasure,
    onClose,
    hasSelection,
    mapDynamicHeight
}) => {
    const theme = useTheme();

    if (isMobile) {
        return (
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
                opacity: 0.95
            }}>
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

                {hasSelection && (
                    <Tooltip title="Clear Measurements" placement="left">
                        <IconButton
                            onClick={onClearMeasure}
                            color="error"
                            sx={{ width: '3.5rem', height: '3.5rem', '& .MuiSvgIcon-root': { fontSize: '2rem' } }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
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
