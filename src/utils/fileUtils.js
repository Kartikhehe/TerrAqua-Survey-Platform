/**
 * Parse GeoJSON file content
 * @param {string} text - GeoJSON file content
 * @returns {Object} Object with points and tracks arrays: { points: [...], tracks: [...] }
 */
export const parseGeoJSON = (text) => {
    try {
        const geoJSON = JSON.parse(text);
        const result = { points: [], tracks: [] };
        
        if (geoJSON.type === 'FeatureCollection' && Array.isArray(geoJSON.features)) {
            geoJSON.features.forEach(feature => {
                if (feature.type !== 'Feature' || !feature.geometry) return;
                
                const props = feature.properties || {};
                
                // Parse Point features (waypoints)
                if (feature.geometry.type === 'Point') {
                    const [lng, lat, elevation] = feature.geometry.coordinates;
                    result.points.push({
                        lat,
                        lng,
                        elevation: elevation !== undefined ? elevation : (props.elevation || null),
                        name: props.name || 'Imported Point',
                        notes: props.notes || props.description || '',
                        image: props.image_url || null
                    });
                }
                
                // Parse LineString features (GPS tracks)
                else if (feature.geometry.type === 'LineString') {
                    const coordinates = feature.geometry.coordinates; // [[lng, lat], ...]
                    if (coordinates && coordinates.length > 0) {
                        result.tracks.push({
                            name: props.name || 'Imported Track',
                            description: props.description || 'GPS Track',
                            coordinates: coordinates, // Keep in [lng, lat] format
                            project_name: props.project_name || null
                        });
                    }
                }
            });
        }
        
        return result;
    } catch (error) {
        console.error('Error parsing GeoJSON:', error);
        throw new Error('Invalid GeoJSON file format');
    }
};

/**
 * Parse KML file content
 * @param {string} text - KML file content
 * @returns {Object} Object with points and tracks arrays: { points: [...], tracks: [...] }
 */
export const parseKML = (text) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid KML file format');
        }

        const placemarks = xmlDoc.querySelectorAll('Placemark');
        const result = { points: [], tracks: [] };

        placemarks.forEach(placemark => {
            const nameElement = placemark.querySelector('name');
            const descriptionElement = placemark.querySelector('description');
            const pointElement = placemark.querySelector('Point');
            const lineStringElement = placemark.querySelector('LineString');

            // Parse Point placemarks (waypoints)
            if (pointElement) {
                const coordinatesElement = pointElement.querySelector('coordinates');
                if (coordinatesElement) {
                    const coords = coordinatesElement.textContent.trim().split(',');
                    const lng = parseFloat(coords[0]);
                    const lat = parseFloat(coords[1]);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const name = nameElement ? nameElement.textContent.trim() : 'Imported Point';
                        const notes = descriptionElement ? descriptionElement.textContent.trim() : '';
                        const elevation = coords.length >= 3 ? parseFloat(coords[2]) : null;

                        result.points.push({
                            lat,
                            lng,
                            elevation: isNaN(elevation) ? null : elevation,
                            name,
                            notes,
                            image: null
                        });
                    }
                }
            }
            
            // Parse LineString placemarks (GPS tracks)
            else if (lineStringElement) {
                const coordinatesElement = lineStringElement.querySelector('coordinates');
                if (coordinatesElement) {
                    const coordText = coordinatesElement.textContent.trim();
                    // KML format: "lng,lat,alt lng,lat,alt ..." (space-separated)
                    const coordPairs = coordText.split(/\s+/).filter(s => s.length > 0);
                    const coordinates = [];
                    
                    coordPairs.forEach(pair => {
                        const parts = pair.split(',');
                        const lng = parseFloat(parts[0]);
                        const lat = parseFloat(parts[1]);
                        if (!isNaN(lng) && !isNaN(lat)) {
                            coordinates.push([lng, lat]);
                        }
                    });
                    
                    if (coordinates.length > 0) {
                        const name = nameElement ? nameElement.textContent.trim() : 'Imported Track';
                        const description = descriptionElement ? descriptionElement.textContent.trim() : 'GPS Track';
                        
                        result.tracks.push({
                            name,
                            description,
                            coordinates: coordinates
                        });
                    }
                }
            }
        });

        return result;
    } catch (error) {
        console.error('Error parsing KML:', error);
        throw new Error('Invalid KML file format');
    }
};
