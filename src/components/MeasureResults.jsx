import React from 'react';
import {
    Paper,
    Box,
    Typography,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    Divider
} from '@mui/material';
import { Close as CloseIcon, Straighten, SquareFoot } from '@mui/icons-material';

const MeasureResults = ({
    summary,
    units,
    onUnitsChange,
    onClose,
    isMobile,
    sidebarOpen
}) => {
    const theme = useTheme();

    if (!summary) return null;

    const convertLength = (km, unit) => {
        switch (unit) {
            case 'meters': return (km * 1000).toFixed(2);
            case 'kilometers': return km.toFixed(3);
            case 'feet': return (km * 3280.84).toFixed(2);
            case 'miles': return (km * 0.621371).toFixed(3);
            case 'inches': return (km * 39370.1).toFixed(2);
            default: return (km * 1000).toFixed(2);
        }
    };

    const convertArea = (sqm, unit) => {
        switch (unit) {
            case 'sqm': return sqm.toFixed(2);
            case 'sqkm': return (sqm / 1000000).toFixed(4);
            case 'hectares': return (sqm / 10000).toFixed(3);
            case 'acres': return (sqm / 4046.86).toFixed(3);
            case 'sqft': return (sqm * 10.7639).toFixed(2);
            default: return sqm.toFixed(2);
        }
    };

    const lengthUnitLabels = {
        meters: 'm',
        kilometers: 'km',
        feet: 'ft',
        miles: 'mi',
        inches: 'in'
    };

    const areaUnitLabels = {
        sqm: 'sq m',
        sqkm: 'sq km',
        hectares: 'ha',
        acres: 'ac',
        sqft: 'sq ft'
    };

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'fixed',
                bottom: isMobile ? '5.5rem' : '9.5rem',
                right: isMobile ? '0.75rem' : '2.0rem',
                width: 'fit-content',
                minWidth: '220px',
                maxWidth: isMobile ? 'calc(100% - 1.5rem)' : '320px',
                p: 1.5,
                borderRadius: 4,
                backgroundColor: theme.palette.background.paper,
                zIndex: theme.zIndex.drawer + 5,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                transition: 'all 0.3s ease'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {summary.mode === 'polygon' ? (
                        <SquareFoot sx={{ color: '#0891B2', fontSize: '1.25rem' }} />
                    ) : (
                        <Straighten sx={{ color: '#0891B2', fontSize: '1.25rem' }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {summary.mode === 'polygon' ? 'Area Result' : 'Distance Result'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
                {summary.mode === 'polyline' ? (
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                            Total Length
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0891B2' }}>
                                {convertLength(summary.length, units.length)}
                            </Typography>
                            <FormControl variant="standard" size="small">
                                <Select
                                    value={units.length}
                                    onChange={(e) => onUnitsChange({ ...units, length: e.target.value })}
                                    sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: theme.palette.text.secondary,
                                        '&:before, &:after': { display: 'none' },
                                        '& .MuiSelect-select': { py: 0, pr: '20px !important' }
                                    }}
                                >
                                    <MenuItem value="meters">m</MenuItem>
                                    <MenuItem value="kilometers">km</MenuItem>
                                    <MenuItem value="feet">ft</MenuItem>
                                    <MenuItem value="miles">mi</MenuItem>
                                    <MenuItem value="inches">in</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                ) : (
                    <>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                                Total Area
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0891B2' }}>
                                    {convertArea(summary.area, units.area)}
                                </Typography>
                                <FormControl variant="standard" size="small">
                                    <Select
                                        value={units.area}
                                        onChange={(e) => onUnitsChange({ ...units, area: e.target.value })}
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            '&:before, &:after': { display: 'none' },
                                            '& .MuiSelect-select': { py: 0, pr: '20px !important' }
                                        }}
                                    >
                                        <MenuItem value="sqm">sq m</MenuItem>
                                        <MenuItem value="sqkm">sq km</MenuItem>
                                        <MenuItem value="hectares">ha</MenuItem>
                                        <MenuItem value="acres">ac</MenuItem>
                                        <MenuItem value="sqft">sq ft</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                                Perimeter
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                                    {convertLength(summary.perimeter, units.length)}
                                </Typography>
                                <FormControl variant="standard" size="small">
                                    <Select
                                        value={units.length}
                                        onChange={(e) => onUnitsChange({ ...units, length: e.target.value })}
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            '&:before, &:after': { display: 'none' },
                                            '& .MuiSelect-select': { py: 0, pr: '20px !important' }
                                        }}
                                    >
                                        <MenuItem value="meters">m</MenuItem>
                                        <MenuItem value="kilometers">km</MenuItem>
                                        <MenuItem value="feet">ft</MenuItem>
                                        <MenuItem value="miles">mi</MenuItem>
                                        <MenuItem value="inches">in</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default MeasureResults;
