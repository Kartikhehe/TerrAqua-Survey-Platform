import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';

const FAQAccordion = ({ faqs, sx = {} }) => {
    return (
        <Box sx={sx}>
            {faqs.map((faq, index) => (
                <Accordion
                    key={index}
                    sx={{
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:before': { display: 'none' },
                        '&.Mui-expanded': { margin: 0 }
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                        sx={{
                            px: 0,
                            '&:hover .MuiTypography-root': { color: 'primary.main' },
                            transition: 'color 0.2s'
                        }}
                    >
                        <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {faq.answer}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default FAQAccordion;
