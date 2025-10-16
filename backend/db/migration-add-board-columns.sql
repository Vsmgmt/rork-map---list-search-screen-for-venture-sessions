-- Migration: Add missing columns to boards table
-- Run this in Supabase SQL Editor to add missing columns

-- Add new location columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS location_country TEXT;

-- Add new price columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_sale DECIMAL(10,2);

-- Add board details columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS dimensions_detail TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS volume_l DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS pickup_spot TEXT;

-- Add geolocation columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS lat DECIMAL(10,6);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS lon DECIMAL(10,6);

-- Add delivery columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10,2);

-- Add availability date columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS availability_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS availability_end TIMESTAMP WITH TIME ZONE;

-- Make location column nullable (if it was NOT NULL before)
ALTER TABLE boards ALTER COLUMN location DROP NOT NULL;
ALTER TABLE boards ALTER COLUMN board_type DROP NOT NULL;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_boards_location_city ON boards(location_city);
CREATE INDEX IF NOT EXISTS idx_boards_lat_lon ON boards(lat, lon);

COMMENT ON COLUMN boards.lat IS 'Latitude for board pickup location';
COMMENT ON COLUMN boards.lon IS 'Longitude for board pickup location';
COMMENT ON COLUMN boards.location_city IS 'City name for the board location';
COMMENT ON COLUMN boards.location_country IS 'Country name for the board location';
