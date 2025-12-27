import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import FAQAccordion from "./FAQAccordion";
import SectionHeader from "./SectionHeader";

const GuideSection = ({
    id,
    icon,
    title,
    number,
    content,
    features,
    faqs
}) => {
    return (
        <Box component="section" sx={{ mb: 8 }}>
            <SectionHeader id={id} icon={icon} title={title} number={number} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                {content.map((paragraph, index) => (
                    <Typography key={index} color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                        {paragraph}
                    </Typography>
                ))}
            </Box>

            {features && features.length > 0 && (
                <Box
                    sx={{
                        bgcolor: 'action.hover',
                        borderRadius: 3,
                        p: 3,
                        mb: 4,
                        border: '1px dashed',
                        borderColor: 'divider'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Key Features:</Typography>
                    <List sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                        {features.map((feature, index) => (
                            <ListItem key={index} sx={{ p: 0, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={feature}
                                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', sx: { lineHeight: 1.5 } }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {faqs && faqs.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Frequently Asked Questions:</Typography>
                    <FAQAccordion faqs={faqs} />
                </Box>
            )}
        </Box>
    );
};

export default GuideSection;
