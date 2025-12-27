export const sections = [
    {
        id: "account-management",
        title: "Account Management & Security",
        content: [
            "SurveyZest prioritizes your data security with robust account management features. Your account serves as the gateway to all your survey projects, saved data, and preferences.",
            "Create your account using a valid email address and a strong password. We recommend using a combination of letters, numbers, and special characters for maximum security.",
            "Two-factor authentication (2FA) is available for enhanced protection. Once enabled, you'll need to verify your identity using a secondary method when logging in from new devices."
        ],
        features: [
            "Secure email-based registration and login",
            "Password recovery via email verification",
            "Optional two-factor authentication",
            "Session management across multiple devices",
            "Account activity logging"
        ],
        faqs: [
            {
                question: "How do I reset my password?",
                answer: "Tap 'Forgot Password' on the login screen, enter your registered email, and follow the reset link sent to your inbox. The link expires after 24 hours for security."
            },
            {
                question: "Can I use SurveyZest on multiple devices?",
                answer: "Yes! Your account syncs across all devices. Simply log in with your credentials on any supported device to access your projects and data."
            },
            {
                question: "How is my data protected?",
                answer: "We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your survey data is stored securely on our servers with regular backups."
            }
        ]
    },
    {
        id: "interface-overview",
        title: "Interface Overview",
        content: [
            "The SurveyZest interface is designed for efficiency in the field. Every element is positioned for quick access while maintaining a clean, distraction-free workspace.",
            "The main screen displays your map view with intuitive controls along the edges. The bottom navigation bar provides instant access to core functions: Home, Projects, Capture, Data, and Settings.",
            "Gesture controls allow for seamless map interaction. Pinch to zoom, two-finger rotate, and tap-and-hold for quick actions are all supported."
        ],
        features: [
            "Clean, intuitive map-centric design",
            "Bottom navigation for thumb-friendly access",
            "Quick action floating buttons",
            "Dark mode for field work in low light",
            "Customizable toolbar layout"
        ],
        faqs: [
            {
                question: "Can I customize the interface layout?",
                answer: "Yes, go to Settings > Interface to rearrange toolbar items, change button sizes, and toggle between compact and expanded views based on your preference."
            },
            {
                question: "How do I enable dark mode?",
                answer: "Navigate to Settings > Display > Theme and select 'Dark'. You can also set it to 'Auto' to follow your device's system theme."
            },
            {
                question: "What do the different status icons mean?",
                answer: "Green indicates GPS lock, yellow means acquiring signal, and red shows no GPS. The satellite icon displays the number of connected satellites for accuracy reference."
            }
        ]
    },
    {
        id: "mastering-the-map",
        title: "Mastering the Map",
        content: [
            "The map is your primary canvas in SurveyZest. Understanding its features will dramatically improve your surveying efficiency and accuracy.",
            "Multiple basemap options are available including satellite imagery, topographic maps, and street maps. Switch between them based on your current survey requirements and visibility conditions.",
            "Layer controls let you toggle visibility of waypoints, survey boundaries, imported data, and reference markers. Use the layer panel to organize complex projects with multiple data types."
        ],
        features: [
            "Multiple basemap options (satellite, topo, street)",
            "Offline map caching for remote areas",
            "Custom coordinate display formats",
            "Distance and area measurement tools",
            "North-up or course-up orientation"
        ],
        faqs: [
            {
                question: "How do I download maps for offline use?",
                answer: "Go to Settings > Offline Maps, select your region by drawing a rectangle on the map, choose the zoom levels needed, and tap Download. Maps are stored locally on your device."
            },
            {
                question: "Can I change the coordinate format displayed?",
                answer: "Yes! Navigate to Settings > Units > Coordinates and choose from Decimal Degrees, Degrees Minutes Seconds, UTM, or other formats based on your project requirements."
            },
            {
                question: "Why is my map slow to load?",
                answer: "This usually indicates a weak network connection. Consider downloading offline maps for your work area, or switch to a lower-resolution basemap option temporarily."
            }
        ]
    },
    {
        id: "single-point-capture",
        title: "Single Point Capture",
        content: [
            "Single Point Capture is ideal for collecting individual features, landmarks, or reference points. This mode provides quick, one-tap data collection with automatic coordinate logging.",
            "When capturing a point, SurveyZest records your current GPS coordinates along with timestamp, accuracy metrics, and any attached attributes or photos.",
            "Each captured point can include custom fields defined in your project template. Add notes, select categories, attach photos, and record audio notes for comprehensive documentation."
        ],
        features: [
            "One-tap point capture at current location",
            "Manual coordinate entry option",
            "Photo and audio attachment",
            "Custom attribute forms",
            "Accuracy indicator display"
        ],
        faqs: [
            {
                question: "What accuracy can I expect from GPS captures?",
                answer: "Standard GPS accuracy is typically 3-5 meters. For higher precision, enable SBAS in settings or connect an external GNSS receiver for sub-meter accuracy."
            },
            {
                question: "Can I capture a point at a different location than where I'm standing?",
                answer: "Yes! Use the 'Manual Entry' option or long-press on the map at your desired location and select 'Capture Point Here' from the context menu."
            },
            {
                question: "How many photos can I attach to a single point?",
                answer: "You can attach up to 10 photos per point. Each photo is geotagged with its own coordinates, which may differ from the point location if taken from a distance."
            }
        ]
    },
    {
        id: "project-mode",
        title: "Start Survey - Project Mode",
        content: [
            "Project Mode is designed for systematic survey campaigns. Create a project to organize related waypoints, define data collection templates, and maintain consistency across your team.",
            "When starting a new project, you'll define the project name, description, coordinate system, and data schema. Templates can be saved and reused for recurring survey types.",
            "Projects support collaboration features. Share project links with team members, assign areas, and sync data in real-time when connected to the network."
        ],
        features: [
            "Project templates for recurring surveys",
            "Custom data schemas and forms",
            "Team collaboration and sharing",
            "Progress tracking dashboard",
            "Quality control checkpoints"
        ],
        faqs: [
            {
                question: "How do I create a new project?",
                answer: "Tap the Projects tab, then the '+' button. Enter your project details, select or create a template, define your area of interest, and tap Create. You can start surveying immediately."
            },
            {
                question: "Can multiple team members work on the same project?",
                answer: "Yes! Share your project via the Share button in project settings. Team members can join using the link or code, and all data syncs automatically when online."
            },
            {
                question: "What happens to my data if I lose connection during a survey?",
                answer: "All data is saved locally first, then synced when connection is restored. You'll see a sync indicator showing pending uploads. No data is ever lost due to connectivity issues."
            }
        ]
    },
    {
        id: "managing-waypoints",
        title: "Managing Waypoints & Data Entry",
        content: [
            "Efficient waypoint management is crucial for large surveys. SurveyZest provides powerful tools for organizing, editing, and reviewing your collected data.",
            "The waypoint list view shows all captured points with sortable columns for name, timestamp, accuracy, and custom fields. Filter by date range, category, or sync status to find specific records.",
            "Bulk editing allows you to update multiple waypoints simultaneously. Select waypoints on the map or from the list, then apply changes to categories, attributes, or status."
        ],
        features: [
            "Sortable and filterable waypoint list",
            "Bulk selection and editing",
            "Undo/redo for recent changes",
            "Duplicate detection alerts",
            "Quality flags and validation"
        ],
        faqs: [
            {
                question: "How do I edit a waypoint after capturing it?",
                answer: "Tap on the waypoint marker on the map or select it from the Data list. The detail view lets you modify all attributes, update photos, adjust coordinates, or delete the point."
            },
            {
                question: "Can I move a waypoint to a different location?",
                answer: "Yes, in edit mode, enable 'Relocate' and drag the marker to the correct position, or enter new coordinates manually. The original location is preserved in the history."
            },
            {
                question: "How do I delete multiple waypoints at once?",
                answer: "Use the multi-select mode (long-press on any waypoint), then tap additional waypoints to select them. The delete button appears in the action bar to remove all selected points."
            }
        ]
    },
    {
        id: "viewing-organizing-data",
        title: "Viewing & Organizing Saved Data",
        content: [
            "Your survey data is organized hierarchically by projects, then by survey sessions, and finally individual waypoints. This structure helps maintain order even in complex, long-running surveys.",
            "The Data tab provides multiple views: Map view for spatial context, List view for detailed records, and Gallery view for photo-based browsing. Switch between them based on your current task.",
            "Folders and tags offer additional organization options. Create custom folders to group related projects, and apply tags for cross-project categorization and quick filtering."
        ],
        features: [
            "Multiple view modes (Map, List, Gallery)",
            "Custom folders and tagging system",
            "Advanced search with filters",
            "Data statistics and summaries",
            "Archive for completed projects"
        ],
        faqs: [
            {
                question: "How do I search for specific waypoints?",
                answer: "Use the search bar at the top of the Data tab. Search by name, notes, coordinates, or any custom attribute. Advanced filters let you combine multiple criteria."
            },
            {
                question: "Can I archive old projects without deleting them?",
                answer: "Yes, open the project settings and select 'Archive'. Archived projects move to the Archive folder and don't appear in main views, but all data is preserved and accessible."
            },
            {
                question: "How do I view statistics for my survey data?",
                answer: "Open any project and tap the Stats icon. You'll see counts, area covered, capture timeline, accuracy distribution, and other metrics visualized in charts and summaries."
            }
        ]
    },
    {
        id: "exporting-importing",
        title: "Exporting & Importing Data",
        content: [
            "SurveyZest supports multiple data formats for seamless integration with GIS software, CAD applications, and other surveying tools. Export your data in the format that best fits your workflow.",
            "Supported export formats include GeoJSON, KML, Shapefile, CSV, and GPX. Each format preserves relevant attributes, though some may have limitations on certain data types.",
            "Import functionality allows you to bring in reference data, previous surveys, or planned waypoints. Supported import formats match export options, plus additional formats like DXF."
        ],
        features: [
            "Multiple export formats (GeoJSON, KML, SHP, CSV, GPX)",
            "Selective export by filter or selection",
            "Automatic coordinate transformation",
            "Import from various GIS formats",
            "Cloud integration (Google Drive, Dropbox)"
        ],
        faqs: [
            {
                question: "How do I export my survey data?",
                answer: "Open your project, tap the Export icon, select the desired format, choose which waypoints to include, and confirm. The file is saved to your device and optionally shared via email or cloud storage."
            },
            {
                question: "Can I export to a specific coordinate system?",
                answer: "Yes! In the export dialog, tap 'Coordinate System' to choose from common projections or enter a custom EPSG code. Your data will be transformed during export."
            },
            {
                question: "What's the best format for use in QGIS or ArcGIS?",
                answer: "GeoJSON works universally and preserves all attributes. For ArcGIS specifically, Shapefile format ensures maximum compatibility with all geometry types and attribute tables."
            }
        ]
    },
    {
        id: "mobile-features",
        title: "Mobile App Features",
        content: [
            "SurveyZest is optimized for mobile field work with features designed for outdoor conditions and one-handed operation. The app works in portrait or landscape mode with adaptive layouts.",
            "Battery optimization modes extend field time by reducing GPS polling frequency, dimming the screen during inactive periods, and pausing background sync until charging.",
            "Offline capability ensures you can work anywhere. Downloaded maps, cached project data, and local storage keep you productive even in remote areas without connectivity."
        ],
        features: [
            "Battery optimization modes",
            "Offline maps and data",
            "External GPS/GNSS receiver support",
            "Voice commands for hands-free operation",
            "Glove-friendly large touch targets"
        ],
        faqs: [
            {
                question: "How long does the battery last during active surveying?",
                answer: "With continuous GPS at normal accuracy, expect 6-8 hours on a typical smartphone. Enable Power Saver mode in settings to extend this to 10-12 hours with slight accuracy trade-offs."
            },
            {
                question: "Can I connect a Bluetooth GPS receiver?",
                answer: "Yes! Go to Settings > GPS > External Device, enable Bluetooth GPS, and pair your receiver. SurveyZest will automatically use the external device for higher accuracy."
            },
            {
                question: "Is SurveyZest available for iOS and Android?",
                answer: "Yes, SurveyZest is available on both platforms with feature parity. Download from the App Store or Google Play Store. Your account and data sync across both platforms."
            }
        ]
    }
];

export const getAllFAQs = () => {
    return sections.map((section) => ({
        category: section.title,
        faqs: section.faqs
    }));
};
