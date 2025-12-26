/**
 * Intelligent GPS Tracking Utility
 * 
 * Features:
 * - Smart point saving (time >= 5s OR distance >= 5m)
 * - Batch point submission (reduces API calls)
 * - Real-time polyline visualization (live dotted path while moving)
 * - Accuracy filtering (ignores points with accuracy > configured threshold)
 * - Battery optimization
 */

import L from 'leaflet';
import { tracksAPI } from '../services/api';

export class GPSTracker {
    constructor(map, projectId) {
        this.map = map;
        this.projectId = projectId;

        // Tracking state
        this.isActive = false;
        this.isPaused = false;
        this.trackId = null;
        this.isInitializing = false; // New state to prevent points before trackId is ready

        // Point buffering
        this.pointBuffer = [];
        this.lastSavedPoint = null;
        this.lastSavedTime = null;

        // Visual elements
        this.polyline = null;
        this.allPoints = [[]]; // Array of segments (each segment is an array of [lat, lng])

        // Configuration
        this.config = {
            minTimeDelta: 5000, // 5 seconds in milliseconds
            minDistance: 5, // 5 meters
            maxAccuracy: 200, // Ignore points with accuracy > 200m (looser due to unreliable devices)
            batchSize: 5, // Send batch when buffer reaches this size
            batchInterval: 15000, // Or send every 15 seconds
        };

        // Batch timer
        this.batchTimer = null;
    }

    /**
     * Start GPS tracking
     */
    async start() {
        try {
            this.isActive = true;
            this.isPaused = false;

            // Create polyline for visualization (dotted line)
            console.log('[GPSTracker] 🎨 Creating dotted polyline...');
            this.polyline = L.polyline([], {
                color: '#0891B2',
                weight: 5,
                opacity: 0.9,
                dashArray: '1, 15', // True dotted look (short dots, wide gaps)
                lineCap: 'round',
                smoothFactor: 1
            }).addTo(this.map);

            // Start track on server
            try {
                this.isInitializing = true;
                const track = await tracksAPI.start(this.projectId);
                console.log('[GPSTracker] 📡 Server track started:', track.id);
                this.trackId = track.id;
                this.isInitializing = false;
                return track;
            } catch (error) {
                console.warn('[GPSTracker] 📡 Server track start delayed/failed:', error.message);
                // We continue local tracking even if server start fails initially
                // Buffering will handle it once tracksAPI.start is successful or retried
            }

            // Start batch timer
            this.startBatchTimer();
        } catch (error) {
            console.error('[GPSTracker] ❌ Error starting GPS tracking:', error);
            throw error;
        }
    }


    /**
     * Process new GPS position
     * Called whenever GPS coordinates change
     */
    processPosition(latIn, lngIn, accuracy, elevation = null) {
        if (!this.isActive || this.isPaused || this.isInitializing || !this.trackId) {
            // Uncomment for debugging if needed
            // console.log(`[GPSTracker] Skipping point: active=${this.isActive}, paused=${this.isPaused}, init=${this.isInitializing}, hasId=${!!this.trackId}`);
            return;
        }

        // Ensure numbers
        const lat = parseFloat(latIn);
        const lng = parseFloat(lngIn);
        const now = Date.now();

        // Filter out inaccurate points
        if (accuracy && accuracy > this.config.maxAccuracy) {
            console.log(`[GPSTracker] ⚠️ Ignoring inaccurate point: ${accuracy}m > ${this.config.maxAccuracy}m`);
            return;
        }

        // Decide whether to save this point
        const shouldSave = this.shouldSavePoint(lat, lng, now);

        // Update visual polyline immediately (shows dotted live path even before it is buffered)
        if (this.polyline) {
            try {
                // Ensure polyline is still on map (in case it was removed by MapApp's refresh)
                if (!this.map.hasLayer(this.polyline)) {
                    this.polyline.addTo(this.map);
                }

                // Temporary tail shows movement within the CURRENT segment
                const currentSegment = [...this.allPoints[this.allPoints.length - 1], [lat, lng]];
                const segmentsToDraw = [...this.allPoints.slice(0, -1), currentSegment];
                this.polyline.setLatLngs(segmentsToDraw);
            } catch (e) {
                console.error('[GPSTracker] Error updating live polyline:', e);
            }
        }

        if (shouldSave) {
            console.log('[GPSTracker] 📍 New point saved and plotted');

            // Add to visual polyline permanently when saved (to the CURRENT segment)
            this.allPoints[this.allPoints.length - 1].push([lat, lng]);
            if (this.polyline) {
                this.polyline.setLatLngs(this.allPoints);
            }

            // Buffer for server upload
            this.bufferPoint(lat, lng, accuracy, elevation, now);
        }
    }

    /**
     * Determine if point should be saved
     * Logic: (time >= 5s) OR (distance >= 5m)
     */
    shouldSavePoint(lat, lng, time) {
        // Always save first point
        if (!this.lastSavedPoint) {
            return true;
        }

        // Check time delta
        const timeDelta = time - this.lastSavedTime;
        if (timeDelta >= this.config.minTimeDelta) {
            return true;
        }

        // Check distance
        const distance = this.calculateDistance(
            [this.lastSavedPoint.lat, this.lastSavedPoint.lng],
            [lat, lng]
        );

        if (distance >= this.config.minDistance) {
            return true;
        }

        return false;
    }

    /**
     * Add point to buffer for batch sending
     */
    bufferPoint(lat, lng, accuracy, elevation, time) {
        const point = {
            lat,
            lng,
            accuracy,
            elevation,
            track_id: this.trackId, // Tag point with the specific session ID
            timestamp: new Date(time).toISOString()
        };

        this.pointBuffer.push(point);
        this.lastSavedPoint = { lat, lng };
        this.lastSavedTime = time;

        console.log(`[GPSTracker] 💾 Buffered point. Buffer size: ${this.pointBuffer.length}/${this.config.batchSize}`);

        // Send batch if buffer is full
        if (this.pointBuffer.length >= this.config.batchSize) {
            console.log('[GPSTracker] 📤 Buffer full, sending batch now...');
            this.sendBatch();
        }
    }

    /**
     * Send buffered points to server
     */
    async sendBatch() {
        if (this.pointBuffer.length === 0) {
            console.log('[GPSTracker] No points to send');
            return;
        }

        const pointsToSend = [...this.pointBuffer];
        this.pointBuffer = [];

        console.log(`[GPSTracker] 🚀 Sending batch of ${pointsToSend.length} points to server...`);

        try {
            await tracksAPI.addPointsBatch(this.projectId, pointsToSend);
            console.log(`[GPSTracker] ✅ Successfully sent batch of ${pointsToSend.length} points`);
        } catch (error) {
            console.error('[GPSTracker] ❌ Error sending batch:', error);
            // Re-add points to buffer on error
            this.pointBuffer = [...pointsToSend, ...this.pointBuffer];
            console.log('[GPSTracker] 🔄 Re-added points to buffer for retry');
        }
    }

    /**
     * Start batch timer to send points periodically
     */
    startBatchTimer() {
        this.batchTimer = setInterval(() => {
            this.sendBatch();
        }, this.config.batchInterval);
    }

    /**
     * Stop batch timer
     */
    stopBatchTimer() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
    }

    /**
     * Pause tracking
     */
    async pause() {
        this.isPaused = true;
        this.stopBatchTimer(); // Stop timer while paused

        // Send any remaining buffered points
        await this.sendBatch();

        // Finalize segment on server
        try {
            await tracksAPI.endTrack(this.projectId);
            console.log('[GPSTracker] 📡 Track segment finalized on pause');
        } catch (error) {
            console.error('[GPSTracker] ❌ Failed to finalize track segment on pause:', error);
        }

        // Reset point saving thresholds to ensure fresh start on resume
        this.lastSavedPoint = null;
        this.lastSavedTime = null;

        // Change polyline to solid
        if (this.polyline) {
            this.polyline.setStyle({
                dashArray: '1, 1', // Very fine dashes to show "paused"
                opacity: 0.5
            });
        }

        console.log('GPS tracking paused');
    }

    /**
     * Resume tracking
     */
    async resume() {
        if (!this.isActive) return;

        this.isInitializing = true;
        this.isPaused = false;

        // Start a new segment in local visualization
        if (this.allPoints[this.allPoints.length - 1].length > 0) {
            this.allPoints.push([]);
        }

        // Start a new segment on the server
        try {
            const track = await tracksAPI.start(this.projectId);
            console.log('[GPSTracker] 📡 New track segment started:', track.id);
            this.trackId = track.id;
            this.isInitializing = false;
            this.startBatchTimer(); // Restart timer
        } catch (error) {
            console.error('[GPSTracker] ❌ Failed to start new track segment on resume:', error);
            // Even if server fails, we'll try to continue locally
            this.isInitializing = false;
        }

        // Change polyline back to dotted
        if (this.polyline) {
            this.polyline.setStyle({
                dashArray: '1, 15',
                opacity: 0.9
            });
        }

        console.log('GPS tracking resumed');
    }

    /**
     * Stop and finalize tracking
     */
    async stop() {
        this.isActive = false;
        this.stopBatchTimer();

        // Send any remaining buffered points
        await this.sendBatch();

        // End track on server (calculates distance)
        try {
            const result = await tracksAPI.endTrack(this.projectId);
            console.log('GPS tracking ended. Total distance:', result.total_distance, 'm');

            // Change polyline to final state
            if (this.polyline) {
                this.polyline.setStyle({
                    dashArray: null, // Solid line for finished track
                    opacity: 1,
                    color: '#2196F3'
                });
            }

            return result;
        } catch (error) {
            console.error('Error ending track:', error);
            throw error;
        }
    }

    /**
     * Clear visualization
     */
    clear() {
        if (this.polyline) {
            this.polyline.remove();
            this.polyline = null;
        }
        this.allPoints = [[]];
        this.pointBuffer = [];
        this.lastSavedPoint = null;
        this.lastSavedTime = null;
    }

    /**
     * Calculate distance between two points using Leaflet
     */
    calculateDistance(point1, point2) {
        return this.map.distance(point1, point2);
    }

    /**
     * Load and display saved track
     */
    static async loadTrack(map, projectId) {
        try {
            const data = await tracksAPI.getByProject(projectId);

            if (data.points && data.points.length > 0) {
                // Group points by track_id (session) with time-gap fallback for legacy data
                const segments = [];
                let currentSegment = [];
                let lastPointTime = null;
                let lastTrackId = null;

                data.points.forEach(p => {
                    const time = new Date(p.recorded_at).getTime();
                    const tid = p.track_id;

                    // Split if: 
                    // 1. track_id changed
                    // 2. OR track_id is null AND time gap is > 5 minutes
                    const timeGapLimit = 5 * 60 * 1000; // 5 minutes
                    const isNewTrackId = tid !== lastTrackId && lastTrackId !== null;
                    const isTimeGap = !tid && lastPointTime && (time - lastPointTime > timeGapLimit);

                    if (isNewTrackId || isTimeGap) {
                        if (currentSegment.length >= 2) {
                            segments.push(currentSegment);
                        }
                        currentSegment = [];
                    }

                    currentSegment.push([p.lat, p.lng]);
                    lastPointTime = time;
                    lastTrackId = tid;
                });

                // Add last segment
                if (currentSegment.length >= 2) {
                    segments.push(currentSegment);
                }

                // Create a LayerGroup to hold all segment polylines
                const layerGroup = L.layerGroup().addTo(map);

                segments.forEach(latlngs => {
                    const segment = L.polyline(latlngs, {
                        color: '#2196F3', // Blue for saved tracks
                        weight: 4,
                        opacity: 0.8,
                        lineCap: 'round',
                        smoothFactor: 1
                    });

                    segment.isTrackSegment = true; // Mark for preservation in MapApp
                    segment.addTo(layerGroup);
                });

                console.log(`Loaded track with ${data.points.length} points across ${segments.length} segments`);

                // Return the layerGroup as "polyline" so MapApp's cleanup still works
                return { polyline: layerGroup, data };
            }

            return null;
        } catch (error) {
            console.error('Error loading track:', error);
            return null;
        }
    }
}
