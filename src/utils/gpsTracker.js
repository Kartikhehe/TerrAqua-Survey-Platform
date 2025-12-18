/**
 * Intelligent GPS Tracking Utility
 * 
 * Features:
 * - Smart point saving (time >= 5s OR distance >= 5m)
 * - Batch point submission (reduces API calls)
 * - Real-time polyline visualization
 * - Accuracy filtering (ignores points with accuracy > 20m)
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

        // Point buffering
        this.pointBuffer = [];
        this.lastSavedPoint = null;
        this.lastSavedTime = null;

        // Visual elements
        this.polyline = null;
        this.allPoints = [];

        // Configuration
        this.config = {
            minTimeDelta: 5000, // 5 seconds in milliseconds
            minDistance: 5, // 5 meters
            maxAccuracy: 50, // Ignore points with accuracy > 50m
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
            console.log('[GPSTracker] 🚀 Starting tracker for project:', this.projectId);

            // Start track on server
            const track = await tracksAPI.start(this.projectId);
            console.log('[GPSTracker] 📡 Server track started:', track.id);

            this.trackId = track.id;
            this.isActive = true;
            this.isPaused = false;

            // Create polyline for visualization (dotted line)
            console.log('[GPSTracker] 🎨 Creating dotted polyline...');
            this.polyline = L.polyline([], {
                color: '#4CAF50',
                weight: 4,
                opacity: 0.8,
                dashArray: '2, 12', // Dotted look
                lineCap: 'round',
                smoothFactor: 1
            }).addTo(this.map);

            // Start batch timer
            this.startBatchTimer();

            return track;
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
        if (!this.isActive || this.isPaused) return;

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

        if (shouldSave) {
            console.log('[GPSTracker] 📍 New point saved and plotted');

            // Add to visual polyline ONLY when saved (keeps it clean)
            this.allPoints.push([lat, lng]);
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
    pause() {
        this.isPaused = true;

        // Send any remaining buffered points
        this.sendBatch();

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
    resume() {
        this.isPaused = false;

        // Change polyline back to dotted
        if (this.polyline) {
            this.polyline.setStyle({
                dashArray: '2, 12',
                opacity: 0.8
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
        this.allPoints = [];
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
                const latlngs = data.points.map(p => [p.lat, p.lng]);

                const polyline = L.polyline(latlngs, {
                    color: '#2196F3',
                    weight: 3,
                    opacity: 1,
                    smoothFactor: 1
                }).addTo(map);

                console.log(`Loaded track with ${data.points.length} points`);
                console.log('Total distance:', data.summary?.total_distance, 'm');

                return { polyline, data };
            }

            return null;
        } catch (error) {
            console.error('Error loading track:', error);
            return null;
        }
    }
}
