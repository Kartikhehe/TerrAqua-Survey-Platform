import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';

/**
 * ImageViewerDialog Component
 * Full-screen image viewer with navigation between multiple images
 * 
 * Props:
 * - open: Boolean to control dialog visibility
 * - onClose: Function called when dialog is closed
 * - images: Array of image objects [{url, public_id, uploaded_at}]
 * - initialIndex: Index of the image to show first (default: 0)
 */
const ImageViewerDialog = ({ open, onClose, images = [], initialIndex = 0 }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Update current index when initialIndex changes
    React.useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleDownload = async () => {
        const currentImage = images[currentIndex];
        if (!currentImage) return;

        try {
            const response = await fetch(currentImage.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image-${currentIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowLeft') {
            handlePrevious();
        } else if (event.key === 'ArrowRight') {
            handleNext();
        } else if (event.key === 'Escape') {
            onClose();
        }
    };

    React.useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, currentIndex]);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullScreen
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.95)',
                },
            }}
        >
            <DialogContent
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Close button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        color: 'white',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                        zIndex: 2,
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* Download button */}
                <IconButton
                    onClick={handleDownload}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 72,
                        color: 'white',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                        zIndex: 2,
                    }}
                >
                    <DownloadIcon />
                </IconButton>

                {/* Image counter */}
                {images.length > 1 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            zIndex: 2,
                        }}
                    >
                        <Typography variant="body2">
                            {currentIndex + 1} / {images.length}
                        </Typography>
                    </Box>
                )}

                {/* Previous button */}
                {images.length > 1 && (
                    <IconButton
                        onClick={handlePrevious}
                        sx={{
                            position: 'absolute',
                            left: isMobile ? 8 : 32,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            zIndex: 2,
                        }}
                    >
                        <ChevronLeftIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                )}

                {/* Next button */}
                {images.length > 1 && (
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: isMobile ? 8 : 32,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            zIndex: 2,
                        }}
                    >
                        <ChevronRightIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                )}

                {/* Main image */}
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 2, sm: 4 },
                    }}
                >
                    <img
                        src={currentImage?.url}
                        alt={`Image ${currentIndex + 1}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            userSelect: 'none',
                        }}
                    />
                </Box>

                {/* Image info */}
                {currentImage?.uploaded_at && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            zIndex: 2,
                        }}
                    >
                        <Typography variant="caption">
                            Uploaded: {new Date(currentImage.uploaded_at).toLocaleDateString()}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ImageViewerDialog;
