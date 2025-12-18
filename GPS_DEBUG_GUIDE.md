# 🐛 GPS Tracking Debug Guide

## Current Status
- ✅ Database tables created (`track_points`, `tracks_summary`)
- ✅ Backend API ready
- ✅ Frontend code integrated
- ✅ Debug logging added throughout
- ⚠️ Testing in progress

## What to Look For in Console

When you start a survey, you should see these logs **in order**:

### 1. When Starting Recording
```
[GPS] Checking GPS tracker ref: null
[GPS] Starting new track for project: <ID>
[GPS] Starting GPS tracking for project: <ID>
[GPS] Map ref: <Map object>
[GPSTracker] 🚀 Starting tracker for project: <ID>
[GPSTracker] Map instance: <Map object>
[GPSTracker] 📡 Calling tracksAPI.start...
[GPSTracker] 📡 Server response: { id: X, project_id: Y, ... }
[GPSTracker] State updated - isActive: true
[GPSTracker] 🎨 Creating polyline...
[GPSTracker] 🎨 Polyline created and added to map
[GPSTracker] ⏰ Batch timer started
[GPSTracker] ✅ GPS tracking started successfully for project: <ID>
[GPS] ✅ GPS tracking started successfully
```

### 2. When GPS Coordinates Update
```
[GPSTracker] processPosition called: { lat: X, lng: Y, accuracy: Z, isActive: true, isPaused: false }
[GPSTracker] ✅ Point accepted, adding to polyline
[GPSTracker] 📍 Polyline updated, total points: 1
[GPSTracker] Should save point? true
[GPSTracker] 💾 Buffered point. Buffer size: 1/5
```

### 3. When Moving (every 5 seconds OR 5 meters)
```
[GPSTracker] processPosition called: { lat: X, lng: Y, accuracy: Z, isActive: true, isPaused: false }
[GPSTracker] ✅ Point accepted, adding to polyline
[GPSTracker] 📍 Polyline updated, total points: 2
[GPSTracker] Should save point? true
[GPSTracker] 💾 Buffered point. Buffer size: 2/5
```

### 4. When Buffer is Full (5 points)
```
[GPSTracker] 💾 Buffered point. Buffer size: 5/5
[GPSTracker] 📤 Buffer full, sending batch now...
[GPSTracker] 🚀 Sending batch of 5 points to server...
[GPSTracker] ✅ Successfully sent batch of 5 points
```

### 5. Every 15 Seconds (Timer)
```
[GPSTracker] 🚀 Sending batch of 3 points to server...
[GPSTracker] ✅ Successfully sent batch of 3 points
```

## What You Should See on Map

1. **Green Dotted Line** appears immediately when you start recording
2. **Line grows in real-time** as you move (even if not saving)
3. **Line is smooth** and follows your movement
4. **No markers** on the line (only waypoints have markers)

## Current Configuration

### Accuracy Threshold
```javascript
maxAccuracy: 2000m  // TEMPORARY - normally 20m
```
**Note**: Set to 2000m for testing. Change back to 20m for production.

### Point Saving Rules
```javascript
Save if: (time >= 5 seconds) OR (distance >= 5 meters)
```

### Batch Settings
```javascript
batchSize: 5 points
batchInterval: 15 seconds
```

## Troubleshooting

### Issue: No logs appear
**Check:**
- Did you click "Start Recording"?
- Is `projectRecording` true?
- Open browser DevTools (F12) → Console tab

### Issue: "Skipping - not active or paused"
**Cause**: `isActive` is false
**Fix**: GPS tracker didn't start. Check for errors in start method.

### Issue: "Ignoring inaccurate point: Xm"
**Cause**: GPS accuracy > 2000m (very poor signal)
**Fix**: 
- Try outdoors
- Wait for GPS to stabilize
- Check device GPS settings

### Issue: Points buffered but not sent
**Check:**
- Network tab in DevTools
- Look for POST `/api/tracks/points/batch`
- Check for 500 errors (backend issue)
- Check console for API errors

### Issue: Line doesn't appear
**Possible causes:**
1. Map not initialized (`mapRef.current` is null)
2. Polyline creation failed
3. Leaflet issue

**Check:**
- Console for "[GPSTracker] 🎨 Polyline created"
- Browser errors in console

### Issue: Database tables still empty
**Check:**
1. Did batch send succeed? Look for ✅ log
2. Check Network tab for 200 response
3. Query database:
```sql
SELECT COUNT(*) FROM track_points;
SELECT COUNT(*) FROM tracks_summary;
```

### Issue: Points are saved but total distance is 0
**Cause**: Need at least 2 points to calculate distance
**Fix**: Wait for more points or move around

## Testing Steps

### Test 1: Indoor (Stationary)
1. Start survey
2. Wait 30 seconds
3. **Expected**: See console logs, polyline on map, ~2 batches sent

### Test 2: Indoor (Moving)
1. Start survey
2. Walk around room
3. **Expected**: Line follows you, points saved when moved 5m

### Test 3: Outdoor (Best)
1. Start survey
2. Walk 20-30 meters
3. **Expected**: Accurate line, regular point batches

## Quick Database Check

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'track%';

-- Check recent points
SELECT 
  id,
  ST_Y(location::geometry) as lat,
  ST_X(location::geometry) as lng,
  accuracy,
  recorded_at
FROM track_points
ORDER BY recorded_at DESC
LIMIT 10;

-- Check active tracks
SELECT 
  id,
  project_id,
  point_count,
  total_distance,
  is_active
FROM tracks_summary
WHERE is_active = true;
```

## Expected Network Calls

### 1. Start Track
```
POST /api/tracks/start
Body: { project_id: X }
Response: { id: Y, project_id: X, is_active: true, ... }
```

### 2. Add Points (Batch)
```
POST /api/tracks/points/batch
Body: { 
  project_id: X,
  points: [
    { lat: 26.xx, lng: 80.xx, accuracy: 10, timestamp: "..." },
    { lat: 26.xx, lng: 80.xx, accuracy: 12, timestamp: "..." },
    ...
  ]
}
Response: { success: true, points_saved: 5, points: [...] }
```

### 3. End Track
```
PUT /api/tracks/end
Body: { project_id: X }
Response: { 
  id: Y,
  total_distance: 123.45,
  total_duration: 60,
  point_count: 12,
  ...
}
```

## Success Criteria

✅ Console shows all expected logs  
✅ Green dotted line appears on map  
✅ Line updates in real-time  
✅ Batches sent successfully (200 status)  
✅ Points appear in `track_points` table  
✅ Summary created in `tracks_summary` table  
✅ Total distance calculated when ending  

## Next Steps

1. **Start a survey** and watch the console
2. **Share the console logs** if something doesn't work
3. **Check the Network tab** for API errors
4. **Query the database** to see if points are saved

---

**Remember**: Console logs prefixed with `[GPS]` or `[GPSTracker]` are the ones we added for debugging!
