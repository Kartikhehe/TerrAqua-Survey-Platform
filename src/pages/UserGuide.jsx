import React from 'react';
import { Container, Box } from "@mui/material";
import {
    Shield,
    Layout,
    Map,
    MapPin,
    Navigation,
    FileText,
    FolderOpen,
    Download,
    Smartphone
} from "lucide-react";
import GuideHeader from "../components/user-guide/GuideHeader";
import GuideFooter from "../components/user-guide/GuideFooter";
import GuideSection from "../components/user-guide/GuideSection";
import TableOfContents from "../components/user-guide/TableOfContents";
import CompiledFAQ from "../components/user-guide/CompiledFAQ";
import { sections } from "../data/userGuideContent";

const sectionIcons = [
    Shield,
    Layout,
    Map,
    MapPin,
    Navigation,
    FileText,
    FolderOpen,
    Download,
    Smartphone
];

const UserGuide = () => {
    const tocItems = sections.map((section, index) => ({
        id: section.id,
        title: section.title,
        number: index + 1
    }));

    // Add compiled FAQ to TOC
    const tocItemsWithFAQ = [
        ...tocItems,
        { id: "all-faqs", title: "All Frequently Asked Questions", number: 10 }
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <GuideHeader />

            <Container maxWidth="lg" sx={{ py: 8 }}>
                <TableOfContents items={tocItemsWithFAQ} />

                {sections.map((section, index) => (
                    <GuideSection
                        key={section.id}
                        id={section.id}
                        icon={sectionIcons[index]}
                        title={section.title}
                        number={index + 1}
                        content={section.content}
                        features={section.features}
                        faqs={section.faqs}
                    />
                ))}

                <CompiledFAQ />
            </Container>

            <GuideFooter />
        </Box>
    );
};

export default UserGuide;
