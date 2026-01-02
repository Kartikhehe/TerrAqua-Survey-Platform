# GPS Track Export Implementation

## Changes Made

### 1. Backend Track Data Format
The backend `/api/tracks/project/:projectId` endpoint returns:
```json
{
  "points": [
    { "lat": 12.34, "lng": 56.78, "recorded_at": "...", "track_id": 1, ... },
    ...
  ],
  "summary": {
    "id": 1,
    "started_at": "...",
    "ended_at": "...",
    "total_distance": 1234.56,
    "total_duration": 3600,
    "point_count": 100
  },
  "total_points": 100
}
```

### 2. Frontend Conversion (ExportDialog.jsx)

**Updated `loadData()` function** to convert track points into coordinates array format:
- Fetches track data for each project using `tracksAPI.getByProject(project_id)`
- Converts individual GPS points into a coordinates array: `[[lng, lat], [lng, lat], ...]`
- Stores track metadata (id, timestamps, distance, duration, point_count)

**Updated `getSelectedWaypoints()` function**:
- Returns both `waypoints` and `tracks` when any project waypoints are selected
- Automatically includes all project tracks when exporting project waypoints

**Updated `exportToGeoJSON()` function**:
- Accepts both waypoints and tracks
- Creates Point features for waypoints
- Creates LineString features for GPS tracks
- Includes track metadata in properties

**Updated `exportToKML()` function**:
- Accepts both waypoints and tracks
- Creates Point placemarks for waypoints  
- Creates LineString placemarks for GPS tracks
- Formats coordinates as KML format: `lng,lat,0 lng,lat,0 ...`

**Updated `handleExport()` function**:
- Destructures both waypoints and tracks from `getSelectedWaypoints()`
- Passes both to export functions
- Shows count of tracks exported in success message

## How It Works

1. **When Export Dialog Opens**:
   - Loads all waypoints grouped by project
   - For each project, fetches GPS track data
   - Converts track points into LineString coordinates

2. **When User Selects Project Points**:
   - Any selected waypoints from a project automatically include that project's tracks
   - Tracks are exported alongside waypoints

3. **Export Formats**:
   - **GeoJSON**: Tracks as LineString features with full metadata
   - **KML**: Tracks as LineString placemarks viewable in Google Earth

## Testing

1. **Start a project** and record some GPS track data
2. **End the project**
3. **Open Export Dialog** and select GeoJSON or KML format
4. **Select waypoints** from the project
5. **Click Export** - the file should include both waypoints (Points) and tracks (LineStrings)

## Console Logging

Added console.log in `loadData()` to show fetched track data:
```javascript
console.log(`Track data for project ${project.project_id}:`, trackData);
```

Check browser console to verify track data is being fetched correctly.

## Known Issues to Check

If tracks are not appearing:
1. Check browser console for track data logs
2. Verify the project actually has GPS track data in the database
3. Check `/api/tracks/project/:projectId` endpoint response in Network tab
4. Ensure track points exist in `track_points` table for the project

## Database Query to Check Tracks

```sql
SELECT p.id, p.name, COUNT(tp.id) as track_points
FROM projects p
LEFT JOIN track_points tp ON tp.project_id = p.id
GROUP BY p.id, p.name
ORDER BY p.created_at DESC;
```
