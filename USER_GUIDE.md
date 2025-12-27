# SurveyZest: The Definitive User Guide 🚀
## Developed by TerrAqua UAV Pvt. Ltd.

Welcome to **SurveyZest**, a state-of-the-art geospatial platform designed for precision mapping, professional field surveys, and real-time asset tracking. Whether you are conducting a site inspection, mapping agricultural land, or tracking delivery routes, SurveyZest provides the tools you need to capture, visualize, and export data with mathematical accuracy.

🔗 **Visit Our Parent Website**: [TerrAqua UAV Pvt. Ltd.](https://www.terraquauav.com/)  
🔗 **Explore Our Ecosystem**: [MapZest Platform](https://mapzest.com/)

---

## 📖 Table of Contents
1. [Account Management & Security](#1-account-management--security)
2. [Interface Overview](#2-interface-overview)
3. [Mastering the Map](#3-mastering-the-map)
4. [Capture Mode 1: Single Point Capture](#4-capture-mode-1-single-point-capture)
5. [Capture Mode 2: Start Survey (Project Mode)](#5-capture-mode-2-start-survey-project-mode)
6. [Managing Waypoints & Data Entry](#6-managing-waypoints--data-entry)
7. [Viewing & Organizing Saved Data](#7-viewing--organizing-saved-data)
8. [Exporting & Importing Data](#8-exporting--importing-data)
9. [Mobile App Specific Features](#9-mobile-app-specific-features)

---

## 1. Account Management & Security

SurveyZest uses a secure, cloud-based authentication system to ensure your survey data is encrypted and accessible only to you.

### Getting Started
- **Sign Up**: Navigate to the Signup page and enter your full name, email, and a secure password.
- **OTP Verification**: To prevent unauthorized access, we send a **One-Time Password (OTP)** to your email. You must enter this code to activate your account.
- **Lost Password?**: Use the "Forgot Password" link on the login page to receive a reset OTP and regain access to your account.

### ❓ FAQs: Account & Security
- **Q: Can I use the app without logging in?**  
  *A: No. Data integrity and legal accountability require all survey actions to be linked to a verified user profile.*
- **Q: I didn't receive my OTP. What should I do?**  
  *A: Check your Spam/Junk folder. If it's still missing, click "Resend OTP" on the verification page. Ensure you entered your email correctly.*
- **Q: Can multiple people log into the same account?**  
  *A: While possible, it is not recommended as it may cause synchronization issues if two people edit the same survey simultaneously.*

---

## 2. Interface Overview

The UI is designed to stay out of your way while providing instant access to vital tools.

- **The Navbar (Top Bar)**: Contains the Sidebar toggle (Logo), Search Bar, "Refresh" button (mobile), and the "My Location" button.
- **The Sidebar**: Accessible via the Menu icon. This is your command center for switching modes, viewing saved data, and managing settings.
- **Live Coordinates Bar**: Fixed at the bottom-right. It shows the real-time position of the crosshair (on mobile) or the mouse cursor (on desktop).

### ❓ FAQs: Interface
- **Q: Why are some icons missing on my mobile screen vs my laptop?**  
  *A: We use "Adaptive UI." On mobile, we hide secondary icons (like the Search icon or Profile Avatar) to make more room for the map and core buttons.*
- **Q: How do I close the Sidebar on mobile?**  
  *A: You can tap the "Arrow" icon at the top of the sidebar or simply tap anywhere on the map background.*

---

## 3. Mastering the Map

SurveyZest offers premium mapping layers designed for high-resolution clarity.

### Map Modes
1. **Satellite Mode (Default)**: Uses high-resolution imagery. We have optimized it so you can **zoom in up to 22x**. Even when raw satellite data ends at 19x, our system upscales the view so you don't lose sight of your pins.
2. **OpenStreet Mode**: A standard map view that follows your system's light/dark mode. Recommended for urban navigation or areas with poor internet connectivity.

### Navigating the Map
- **Find Me**: Tap the "Location Arrow" in the navbar. The map will perform a smooth **fly-to animation** to your current GPS coordinates.
- **Crosshair Mapping**: On mobile, a fixed crosshair appears in the center. Move the map under it to select exact locations.

### ❓ FAQs: Map
- **Q: The map is just a grey grid. What's wrong?**  
  *A: This usually means you have lost internet connection or the map tile server is temporarily unreachable. Try switching from Satellite to OpenStreet mode.*
- **Q: Can I change the map rotation?**  
  *A: On touch devices, use two fingers to rotate. On desktops, use right-click + drag to tilt and rotate the view.*

---

## 4. Capture Mode 1: Single Point Capture

Use this when you need to mark a location quickly (e.g., a broken pipe, a sample site, or a waypoint of interest).

- **How to Capture**: Select "Single Point Capture" from the Sidebar. A new pin will appear at your current location or the map center.
- **Location Selection**: If "Location Selection" is active, you can tap anywhere on the map to "drop" your pin precisely where you want it.

### ❓ FAQs: Single Point Capture
- **Q: Does a Single Point Capture count as a "Survey"?**  
  *A: No. Single points are individual records. They do not have a tracked path or a "Start/End" lifecycle.*
- **Q: Can I move a pin after I've saved it?**  
  *A: No. To maintain data accuracy, coordinates cannot be manually edited once saved. If you made a mistake, delete the point and capture a new one.*

---

## 5. Capture Mode 2: Start Survey (Project Mode)

This is the professional workflow for multi-point inspections and movement tracking.

### Lifecycle of a Survey
1. **Initiation**: Give your survey a descriptive name (e.g., "North Gate Inspection"). The app captures your **Start Point** coordinates immediately.
2. **Recording Path**: Toggle the "Recording" switch. The app will now track your movement and draw a blue line behind you.
3. **Auto-Pause Logic**: Our intelligent tracker pauses recording if you remain stationary, preventing "GPS noise" and saving battery.
4. **End Survey**: Once you reach your destination, click "End Survey." This captures the **End Point** and saves the final path.

### ❓ FAQs: Surveys
- **Q: Can I add points for a particular survey after the survey is ended?**  
  *A: **No.** Once a survey is finalized, it is locked into a read-only historical state. For urgent corrections, you must contact your organization's administrator.*
- **Q: What happens if my battery dies during a survey?**  
  *A: The points you manually saved are safe. However, the continuous path tracking might be interrupted or "jump" once you restart the app.*
- **Q: Can I run two surveys at the same time?**  
  *A: No. The system allows only one active "Project Mode" at a time to ensure coordinate accuracy.*

---

## 6. Managing Waypoints & Data Entry

Every pin (waypoint) on the map can hold rich metadata.

### The Details Panel
When you select a point, a panel (or bottom sheet on mobile) opens:
- **Naming**: Every point should have a unique name.
- **Notes**: Provide detailed descriptions of the site conditions.
- **Dynamic Images**: Tap the "Capture" button. You can take a photo directly or upload from your gallery. We support up to **10 images** per waypoint.
- **Navigation**: Click "Navigate" to get a calculated route from your current position to that specific waypoint.

### ❓ FAQs: Data Entry
- **Q: Why can't I edit the Latitude and Longitude fields?**  
  *A: These fields are read-only to prevent "fudging" of survey data. The coordinates are locked to the sensor's reading at the time of capture.*
- **Q: Is there a limit to how much text I can put in "Notes"?**  
  *A: While there is no strict character limit, we recommend keeping notes concise for easier reading in exported GeoJSON/KML files.*

---

## 7. Viewing & Organizing Saved Data

Access your history via "View Saved Points" in the Sidebar.

- **Search**: Use the search bar in the dialog to find waypoints or project names almost instantly.
- **Sorting**: You can sort by **Newest First, Oldest First, or Alphabetically (A-Z / Z-A)**.
- **Batch Management**: In the "Export Data" menu, you can see these points grouped by their respective surveys.

### ❓ FAQs: Saved Data
- **Q: I deleted a point by accident. Can I get it back?**  
  *A: No. Deletion is permanent. Always double-check the configuration before confirming a deletion.*
- **Q: Why can't I see points from other users?**  
  *A: SurveyZest maintains strict user privacy. You can only see data captured by your own account.*

---

## 8. Exporting & Importing Data

Share your work with CAD software, Google Earth, or other GIS tools.

### Formats
- **GeoJSON**: Best for web developers and modern GIS software like QGIS.
- **KML**: The standard for **Google Earth**. If you want to see your survey in 3D on a globe, use this.

### Importing
- You can drag and drop (on desktop) or select GeoJSON/KML files to overlay them on the map. This is useful for comparing your current survey with old site maps.

### ❓ FAQs: Export/Import
- **Q: Do I need a special license to export my data?**  
  *A: No. Exporting your own data is a core feature of the platform.*
- **Q: My KML file won't open in Google Earth. What's wrong?**  
  *A: Ensure you have selected at least one waypoint or survey before clicking export. An empty file will not open.*

---

## 9. Mobile App Specific Features

If you are using the native application (built with Capacitor):

- **Background Geolocation**: The survey recording will continue even if you lock your screen or put the phone in your pocket.
- **Keyboard Handling**: We have optimized the input fields so that the keyboard **shrinks the view** instead of covering what you are typing.
- **Battery Optimization**: Use the Sidebar "Settings" to toggle Dark Mode, which can significantly save battery on OLED screens during long field days.

### ❓ FAQs: Mobile App
- **Q: The app asks for "Always Allow" location permission. Why?**  
  *A: For "Survey Mode" to work while your screen is off, the OS needs permission to access location in the background.*
- **Q: Can I use the app offline?**  
  *A: You can capture points, but without an internet connection, the satellite imagery won't load and you won't be able to sync data to the cloud until you are back online.*

---

## 🛠️ Contact & Support

**SurveyZest** is a product of **TerrAqua UAV Pvt. Ltd.**

For corporate licensing, custom feature requests, or technical support, please visit:
- **Main Website**: [www.terraquauav.com](https://www.terraquauav.com/)
- **Technical Platform**: [mapzest.com](https://mapzest.com/)

*Survey with precision. Survey with Zest.*
