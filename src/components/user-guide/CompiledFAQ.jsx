import React from 'react';
import { Box, Typography, Paper } from "@mui/material";
import FAQAccordion from "./FAQAccordion";
import { getAllFAQs } from "../../data/userGuideContent";

const CompiledFAQ = () => {
    const allFAQs = getAllFAQs();

    return (
        <Box id="all-faqs" sx={{ mb: 8, pt: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(8, 145, 178, 0.1)',
                        fontSize: '1.5rem'
                    }}
                >
                    ❓
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    All Frequently Asked Questions
                </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Browse all FAQs organized by category for quick reference.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {allFAQs.map((category, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                            {category.category}
                        </Typography>
                        <FAQAccordion faqs={category.faqs} />
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default CompiledFAQ;
