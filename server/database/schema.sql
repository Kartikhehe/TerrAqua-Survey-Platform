-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE navigation_tracking;

-- Create waypoints table
CREATE TABLE IF NOT EXISTS waypoints (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on coordinates for faster queries
CREATE INDEX IF NOT EXISTS idx_waypoints_coordinates ON waypoints(latitude, longitude);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waypoints_created_at ON waypoints(created_at DESC);

