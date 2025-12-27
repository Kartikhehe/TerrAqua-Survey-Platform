import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    IconButton,
    Grid,
    Paper,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Close as CloseIcon,
    SwapHoriz as SwapIcon,
    MyLocation as MyLocationIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import proj4 from 'proj4';

// Define common CRS
proj4.defs([
    ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
    ["EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"],
    ["EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"],
    ["EPSG:32644", "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs"],
    ["EPSG:32645", "+proj=utm +zone=45 +datum=WGS84 +units=m +no_defs"],
    ["EPSG:32642", "+proj=utm +zone=42 +datum=WGS84 +units=m +no_defs"],
    ["EPSG:32646", "+proj=utm +zone=46 +datum=WGS84 +units=m +no_defs"],
    ["EPSG:4326-DMS", "+proj=longlat +datum=WGS84 +no_defs"] // Helper for DMS
]);

const commonCRS = [
    { code: 'EPSG:4326', name: 'WGS 84 (Decimal Degrees)' },
    { code: 'EPSG:3857', name: 'Web Mercator (Meters)' },
    { code: 'EPSG:32643', name: 'WGS 84 / UTM zone 43N' },
    { code: 'EPSG:32644', name: 'WGS 84 / UTM zone 44N' },
    { code: 'EPSG:32645', name: 'WGS 84 / UTM zone 45N' },
    { code: 'EPSG:32642', name: 'WGS 84 / UTM zone 42N' },
    { code: 'EPSG:32646', name: 'WGS 84 / UTM zone 46N' },
];

const CRSConverterDialog = ({ open, onClose, currentLocation, onShowSnackbar }) => {
    const [fromCRS, setFromCRS] = useState('EPSG:4326');
    const [toCRS, setToCRS] = useState('EPSG:3857');
    const [inputX, setInputX] = useState('');
    const [inputY, setInputY] = useState('');
    const [resultX, setResultX] = useState('');
    const [resultY, setResultY] = useState('');
    const [copied, setCopied] = useState(false);

    const handleConvert = () => {
        if (!inputX || !inputY) {
            onShowSnackbar('Please enter valid coordinates', 'warning');
            return;
        }

        try {
            const x = parseFloat(inputX);
            const y = parseFloat(inputY);

            if (isNaN(x) || isNaN(y)) {
                onShowSnackbar('Invalid numbers', 'error');
                return;
            }

            // proj4 takes [x, y] which is [lng, lat] for 4326
            const result = proj4(fromCRS, toCRS, [x, y]);

            setResultX(result[0].toFixed(fromCRS.includes('4326') ? 4 : 6));
            setResultY(result[1].toFixed(fromCRS.includes('4326') ? 4 : 6));
        } catch (error) {
            console.error('Conversion error:', error);
            onShowSnackbar('Conversion failed: ' + error.message, 'error');
        }
    };

    const handleSwap = () => {
        setFromCRS(toCRS);
        setToCRS(fromCRS);
        setInputX(resultX);
        setInputY(resultY);
        setResultX('');
        setResultY('');
    };

    const handleUseCurrentLocation = () => {
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
            setFromCRS('EPSG:4326');
            setInputX(currentLocation.lng.toString());
            setInputY(currentLocation.lat.toString());
            onShowSnackbar('Current location loaded', 'success');
        } else {
            onShowSnackbar('Current location not available', 'error');
        }
    };

    const handleCopy = () => {
        if (!resultX || !resultY) return;
        const textToCopy = `${resultX}, ${resultY}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onShowSnackbar('Coordinates copied to clipboard', 'success');
        });
    };

    // Auto convert when inputs change
    useEffect(() => {
        if (inputX && inputY && !isNaN(parseFloat(inputX)) && !isNaN(parseFloat(inputY))) {
            const x = parseFloat(inputX);
            const y = parseFloat(inputY);
            try {
                const result = proj4(fromCRS, toCRS, [x, y]);

                // Adjust decimal places based on unit (meters vs degrees)
                const isDegree = toCRS === 'EPSG:4326';
                setResultX(result[0].toFixed(isDegree ? 6 : 3));
                setResultY(result[1].toFixed(isDegree ? 6 : 3));
            } catch (e) {
                setResultX('Error');
                setResultY('Error');
            }
        } else {
            setResultX('');
            setResultY('');
        }
    }, [inputX, inputY, fromCRS, toCRS]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: 3, p: 1 }
            }}
        >
            <DialogTitle sx={{
                m: 0, p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 600
            }}>
                CRS Coordinate Converter
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ py: 1 }}>
                    <Grid container spacing={2}>
                        {/* From Section */}
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                                FROM
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Source CRS</InputLabel>
                                <Select
                                    value={fromCRS}
                                    label="Source CRS"
                                    onChange={(e) => setFromCRS(e.target.value)}
                                >
                                    {commonCRS.map(crs => (
                                        <MenuItem key={crs.code} value={crs.code}>
                                            {crs.code} - {crs.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label={fromCRS.includes('4326') ? "Longitude (X)" : "Easting (X)"}
                                fullWidth
                                size="small"
                                value={inputX}
                                onChange={(e) => setInputX(e.target.value)}
                                placeholder="Enter X..."
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label={fromCRS.includes('4326') ? "Latitude (Y)" : "Northing (Y)"}
                                fullWidth
                                size="small"
                                value={inputY}
                                onChange={(e) => setInputY(e.target.value)}
                                placeholder="Enter Y..."
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<MyLocationIcon />}
                                onClick={handleUseCurrentLocation}
                                size="small"
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Use Current Location
                            </Button>
                        </Grid>

                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 1 }}>
                            <IconButton onClick={handleSwap} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <SwapIcon />
                            </IconButton>
                        </Box>

                        {/* To Section */}
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                                TO
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Target CRS</InputLabel>
                                <Select
                                    value={toCRS}
                                    label="Target CRS"
                                    onChange={(e) => setToCRS(e.target.value)}
                                >
                                    {commonCRS.map(crs => (
                                        <MenuItem key={crs.code} value={crs.code}>
                                            {crs.code} - {crs.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', position: 'relative' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">RESULT</Typography>
                                    {resultX && (
                                        <Tooltip title={copied ? "Copied!" : "Copy Result"}>
                                            <IconButton size="small" onClick={handleCopy}>
                                                {copied ? <CheckIcon size={16} color="success" /> : <CopyIcon size={16} />}
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            {toCRS.includes('4326') ? "Longitude (X)" : "Easting (X)"}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {resultX || '---'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            {toCRS.includes('4326') ? "Latitude (Y)" : "Northing (Y)"}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {resultY || '---'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
                <Button
                    variant="contained"
                    onClick={handleConvert}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                >
                    Convert
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CRSConverterDialog;
