import React from 'react';
import { Box, Typography, Link, Container, Button } from "@mui/material";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { Link as RouterLink } from 'react-router-dom';
import terraquaLogo from "../../assets/terraqua logo.png";

const GuideHeader = () => {
    return (
        <Box
            component="header"
            sx={{
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}0d 0%, ${theme.palette.background.paper} 50%, ${theme.palette.secondary.main}1a 100%)`,
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: { xs: 4, md: 6 }
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{ mb: 4 }}>
                    <Button
                        component={RouterLink}
                        to="/"
                        startIcon={<ArrowLeft />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Back to Map
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 4 }}>
                    <Box
                        component={RouterLink}
                        to="/"
                        sx={{ textDecoration: 'none' }}
                    >
                        <Box
                            component="img"
                            src={terraquaLogo}
                            alt="TerrAqua UAV Logo"
                            sx={{ width: { xs: 96, md: 128 }, height: { xs: 96, md: 128 }, objectFit: 'contain' }}
                        />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem', lg: '3rem' }, fontWeight: 800, mb: 1 }}>
                            Survey<Box component="span" sx={{ color: 'primary.main' }}>Zest</Box> User Guide
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            Developed by <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>TerrAqua UAV Pvt. Ltd.</Box>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 3 }}>
                            <Link
                                href="https://terraquauav.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                            >
                                terraquauav.com
                                <ExternalLink size={16} />
                            </Link>
                            <Link
                                href="https://mapzest.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                            >
                                mapzest.com
                                <ExternalLink size={16} />
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default GuideHeader;
