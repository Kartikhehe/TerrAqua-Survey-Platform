import React from 'react';
import { Box, Typography, Link, Container } from "@mui/material";
import { ExternalLink } from "lucide-react";
import terraquaLogo from "../../assets/terraqua logo.png";

const GuideFooter = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'text.primary',
                color: 'background.paper',
                py: 8,
                mt: 8
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Box
                        component="img"
                        src={terraquaLogo}
                        alt="TerrAqua UAV Logo"
                        sx={{ width: 80, height: 80, objectFit: 'contain', mb: 2, filter: 'brightness(0) invert(1)' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        TerrAqua UAV Pvt. Ltd.
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'primary.main', fontStyle: 'italic', mb: 4, fontWeight: 500 }}>
                        "Survey with precision. Survey with Zest."
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, mb: 4 }}>
                        <Link
                            href="https://terraquauav.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                        >
                            terraquauav.com
                            <ExternalLink size={16} />
                        </Link>
                        <Link
                            href="https://mapzest.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                        >
                            mapzest.com
                            <ExternalLink size={16} />
                        </Link>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        © {new Date().getFullYear()} TerrAqua UAV Pvt. Ltd. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default GuideFooter;
