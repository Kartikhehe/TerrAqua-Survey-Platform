import React from 'react';
import { Box, Typography, Link, List, ListItem } from "@mui/material";

const TableOfContents = ({ items }) => {
    const handleClick = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Box
            component="nav"
            sx={{
                bgcolor: 'action.hover',
                borderRadius: 3,
                p: 4,
                mb: 8,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Table of Contents</Typography>
            <List component="ol" sx={{ p: 0 }}>
                {items.map((item) => (
                    <ListItem
                        key={item.id}
                        sx={{ p: 0, mb: 1.5 }}
                    >
                        <Link
                            href={`#${item.id}`}
                            onClick={(e) => handleClick(e, item.id)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                color: 'text.secondary',
                                textDecoration: 'none',
                                fontWeight: 500,
                                '&:hover': { color: 'primary.main' },
                                transition: 'color 0.2s'
                            }}
                        >
                            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 700, minWidth: '24px' }}>
                                {item.number}.
                            </Typography>
                            <Typography component="span">{item.title}</Typography>
                        </Link>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default TableOfContents;
