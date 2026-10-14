-- AI Gravity: Annamacharya University Smart Campus Navigator
-- Relational Database Schema (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Campus Table
CREATE TABLE IF NOT EXISTS campus (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    default_zoom INTEGER DEFAULT 17,
    boundary_geom GEOMETRY(Polygon, 4326),
    official_website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Places Table
CREATE TABLE IF NOT EXISTS places (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campus(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    normalized_name TEXT NOT NULL,
    code VARCHAR(64),
    category VARCHAR(64) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    building_id VARCHAR(64),
    floor_info TEXT,
    facilities TEXT[],
    verification_status VARCHAR(32) DEFAULT 'AWAITING_VERIFICATION', -- 'VERIFIED', 'AWAITING_VERIFICATION', 'DEMO_BENCHMARK'
    publication_status VARCHAR(32) DEFAULT 'PUBLISHED',           -- 'PUBLISHED', 'DRAFT'
    aliases TEXT[],
    tags TEXT[],
    opening_hours VARCHAR(255),
    wheelchair_accessible BOOLEAN DEFAULT TRUE,
    contact_phone VARCHAR(64),
    entrance_node_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_places_geom ON places USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_places_category ON places (category);
CREATE INDEX IF NOT EXISTS idx_places_verification ON places (verification_status);

-- 3. Path Nodes Table
CREATE TABLE IF NOT EXISTS path_nodes (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campus(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    node_type VARCHAR(32) NOT NULL, -- 'ENTRANCE', 'JUNCTION', 'WALKWAY', 'LANDMARK'
    verification_status VARCHAR(32) DEFAULT 'AWAITING_VERIFICATION',
    connected_place_id VARCHAR(64) REFERENCES places(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_path_nodes_geom ON path_nodes USING GIST (geom);

-- 4. Path Segments Table
CREATE TABLE IF NOT EXISTS path_segments (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campus(id) ON DELETE CASCADE,
    start_node_id VARCHAR(64) REFERENCES path_nodes(id) ON DELETE CASCADE,
    end_node_id VARCHAR(64) REFERENCES path_nodes(id) ON DELETE CASCADE,
    distance_meters DOUBLE PRECISION NOT NULL,
    is_accessible BOOLEAN DEFAULT TRUE,
    access_status VARCHAR(32) DEFAULT 'OPEN', -- 'OPEN', 'TEMPORARILY_CLOSED', 'RESTRICTED'
    way_type VARCHAR(32) DEFAULT 'PAVED_WALKWAY', -- 'PAVED_WALKWAY', 'MAIN_ROAD', 'CORRIDOR', 'RAMP', 'STAIRS'
    verification_status VARCHAR(32) DEFAULT 'AWAITING_VERIFICATION',
    instruction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_segments_start ON path_segments (start_node_id);
CREATE INDEX IF NOT EXISTS idx_segments_end ON path_segments (end_node_id);

-- 5. Route Issue Reports Table
CREATE TABLE IF NOT EXISTS route_issues (
    id VARCHAR(64) PRIMARY KEY,
    place_id VARCHAR(64) REFERENCES places(id) ON DELETE SET NULL,
    path_segment_id VARCHAR(64) REFERENCES path_segments(id) ON DELETE SET NULL,
    place_name VARCHAR(255),
    issue_type VARCHAR(64) NOT NULL, -- 'INCORRECT_POSITION', 'MISSING_LOCATION', 'INCORRECT_NAME', 'BLOCKED_WALKWAY', 'WRONG_DIRECTIONS', 'OTHER'
    description TEXT NOT NULL,
    user_contact VARCHAR(255),
    status VARCHAR(32) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_route_issues_status ON route_issues (status);

-- 6. Administrator Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'ADMIN', -- 'ADMIN', 'EDITOR', 'SURVEYOR'
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);
