import React, { useRef } from 'react';
import { Box, IconButton, Typography, useTheme, Button } from '@mui/material';
import { Close as CloseIcon, CloudUpload } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

/**
 * ImageGallery Component
 * Displays uploaded images as small preview boxes with delete buttons
 * Shows a full-width "Add Image" button below the previews
 * 
 * Props:
 * - images: Array of image objects [{url, public_id, uploaded_at}]
 * - onImageClick: Function called when an image is clicked (for full-size view)
 * - onImageDelete: Function called when delete button is clicked
 * - onImageAdd: Function called when add button is clicked
 * - maxImages: Maximum number of images allowed (default: 10)
 * - disabled: Whether the gallery is disabled (read-only mode)
 */
const ImageGallery = ({
    images = [],
    onImageClick,
    onImageDelete,
    onImageAdd,
    maxImages = 10,
    disabled = false
}) => {
    const theme = useTheme();
    const fileInputRef = useRef(null);

    const handleAddClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0 && onImageAdd) {
            onImageAdd(files);
        }
        // Reset input so same file can be selected again
        event.target.value = '';
    };

    const canAddMore = images.length < maxImages;

    return (
        <Box>
            {/* Image Previews - Only show if there are images */}
            {images.length > 0 && (
                <>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 1,
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        Images ({images.length}/{maxImages})
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            pb: 1,
                            mb: 1.5,
                            '&::-webkit-scrollbar': {
                                height: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                borderRadius: '3px',
                                '&:hover': {
                                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                },
                            },
                        }}
                    >
                        {images.map((image, index) => (
                            <Box
                                key={image.public_id || image.url || index}
                                sx={{
                                    position: 'relative',
                                    flexShrink: 0,
                                    width: 80,
                                    height: 80,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: `2px solid ${theme.palette.divider}`,
                                    cursor: onImageClick ? 'pointer' : 'default',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': onImageClick ? {
                                        transform: 'scale(1.05)',
                                        boxShadow: theme.shadows[4],
                                    } : {},
                                }}
                                onClick={() => onImageClick && onImageClick(index)}
                            >
                                <img
                                    src={image.url}
                                    alt={`Image ${index + 1}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />

                                {/* Delete button - top right corner */}
                                {!disabled && onImageDelete && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onImageDelete(index, image);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                                            color: 'white',
                                            padding: '2px',
                                            width: 20,
                                            height: 20,
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 0, 0, 0.8)',
                                            },
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                    </Box>
                </>
            )}


            {/* Add Image Button - Full width, same style as before */}
            {canAddMore && (
                <>
                    <input
                        key={images.length}
                        capture="environment"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                        disabled={disabled}
                    />
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={disabled ? <CircularProgress color="inherit" size={16} /> : <CloudUpload />}
                        fullWidth
                        onClick={handleAddClick}
                        disabled={disabled}
                        sx={{
                            py: 1.5,
                            borderRadius: { xs: '0.65625rem', sm: '0.765625rem', md: '0.875rem' },
                            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary,
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: disabled ? undefined : (theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0'),
                                borderColor: disabled ? undefined : '#9E9E9E',
                            },
                        }}
                    >
                        {disabled ? 'Uploading...' : (images.length > 0 ? 'Add More Images' : 'Upload Image')}
                    </Button>
                </>
            )}

            {/* Message when max images reached */}
            {!disabled && !canAddMore && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: theme.palette.text.secondary,
                        mt: 1,
                    }}
                >
                    Maximum {maxImages} images reached
                </Typography>
            )}

            {/* Empty state for disabled/read-only mode */}
            {images.length === 0 && disabled && (
                <Typography
                    variant="body2"
                    sx={{
                        textAlign: 'center',
                        color: theme.palette.text.disabled,
                        py: 2,
                    }}
                >
                    No images
                </Typography>
            )}
        </Box>
    );
};

export default ImageGallery;
