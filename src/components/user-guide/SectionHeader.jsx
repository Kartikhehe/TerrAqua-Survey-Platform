import React from 'react';
import { Box, Typography } from "@mui/material";

const SectionHeader = ({ id, icon: Icon, title, number }) => {
    return (
        <Box
            id={id}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                scrollMt: '100px',
                pt: 4
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(8, 145, 178, 0.1)'
                }}
            >
                <Icon size={24} style={{ color: '#0891B2' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                <Box component="span" sx={{ color: 'primary.main' }}>{number}.</Box> {title}
            </Typography>
        </Box>
    );
};

export default SectionHeader;
