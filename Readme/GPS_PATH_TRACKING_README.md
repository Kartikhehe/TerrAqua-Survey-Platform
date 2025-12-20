# GPS Path Tracking & Real-Time Plotting Implementation (PostGIS)

This document explains the technical implementation of the high-performance GPS tracking system using **PostGIS**, upgraded on 2025-12-18.

## 1. Database Schema (PostgreSQL + PostGIS)

The system transitioned from JSONB storage to dedicated PostGIS spatial tables for improved performance and geometric accuracy.

### `track_points` Table
Stores individual GPS coordinates as native PostGIS geography points.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary key. |
| `project_id` | `INTEGER` | Reference to projects. |
| `user_id` | `INTEGER` | Reference to owner. |
| `location` | `GEOGRAPHY(Point, 4326)` | High-precision spatial point (Long/Lat). |
| `accuracy` | `DECIMAL(10, 2)` | GPS accuracy in meters. |
| `elevation` | `DECIMAL(10, 2)` | Elevation in meters (optional). |
| `recorded_at` | `TIMESTAMPTZ` | capture timestamp. |

### `tracks_summary` Table
Tracks session metadata and aggregates.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL` | Primary key. |
| `project_id` | `INTEGER` | Reference to project. |
| `user_id` | `INTEGER` | Reference to user. |
| `total_distance` | `DECIMAL` | Total distance in meters (PostGIS ST_Distance). |
| `point_count` | `INTEGER` | Number of points in track. |
| `is_active` | `BOOLEAN` | Active recording status. |
| `started_at` | `TIMESTAMPTZ` | Start of session. |
| `ended_at` | `TIMESTAMPTZ` | End of session. |

---

## 2. Frontend Logic: `GPSTracker` Class

The tracking logic in `src/utils/gpsTracker.js` manages filtering and visualization.

### Real-Time Visualization
- **Path Style**: Green dotted line (`dashArray: '2, 12'`) for active recording.
- **Smart Plotting**: The visual line updates **only** when a point is saved to the buffer, ensuring a clean, jitter-free path.

### Intelligent Point Saving
The tracker uses a **5-5-50 rule** to maintain data quality:
1.  **Time**: Save if >= 5 seconds since last point.
2.  **Distance**: Save if >= 5 meters moved (calculated via Leaflet `map.distance`).
3.  **Accuracy**: Only save if GPS accuracy is <= **50 meters**.

---

## 3. How the Data Flows

1.  **Capture**: `MapApp.jsx` uses `navigator.geolocation.watchPosition` to get raw coordinates.
2.  **Process**: `gpsTracker.processPosition()` filters noisy data.
3.  **Plot**: Leaflet Polyline updates instantly for points that pass the filter.
4.  **Buffer**: Points are locally cached in a buffer of 5.
5.  **Batch Sync**: Buffer is sent to `/api/tracks/points/batch` every 15s or when full.
6.  **Backend Save**: PostGIS triggers/queries update `total_distance` using `ST_Distance`.

---

## 4. Setup & Verification

### Step 1: Migration
Run `server/database/migrations/2025-12-18-postgis-gps-tracking.sql`.

### Step 2: Verify Schema
```sql
-- Check track_points (spatial storage)
\d track_points

-- Check tracks_summary (session metadata)
\d tracks_summary
```

### Step 3: API Endpoints (src/services/api.js)
- `tracksAPI.start(projectId)`
- `tracksAPI.addPointsBatch(projectId, points)`
- `tracksAPI.endTrack(projectId)`
