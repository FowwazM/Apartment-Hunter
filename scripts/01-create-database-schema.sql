-- Apartment Hunting AI Database Schema
-- This script creates the complete database structure for the application

-- Users table for authentication and preferences
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search sessions to track user queries and results
CREATE TABLE IF NOT EXISTS search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    processed_criteria JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties discovered by the AI research
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type VARCHAR(50),
    building_amenities JSONB DEFAULT '[]',
    neighborhood_data JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual units within properties
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    rent_amount DECIMAL(10,2),
    availability_date DATE,
    unit_amenities JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    floor_plan_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search results linking sessions to scored properties
CREATE TABLE IF NOT EXISTS search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES search_sessions(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    ai_score DECIMAL(5,2),
    score_breakdown JSONB DEFAULT '{}',
    ranking INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice agent calls made to properties
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES search_sessions(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    call_status VARCHAR(50) DEFAULT 'pending',
    call_duration INTEGER,
    transcript TEXT,
    call_summary JSONB DEFAULT '{}',
    questions_asked JSONB DEFAULT '[]',
    answers_received JSONB DEFAULT '[]',
    vapi_call_id VARCHAR(255),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tours scheduled through the voice agent
CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    tour_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    special_instructions TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    confirmation_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itineraries for organizing multiple tours
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    search_session_id UUID REFERENCES search_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tour_date DATE NOT NULL,
    optimized_route JSONB DEFAULT '[]',
    total_duration_minutes INTEGER,
    transportation_mode VARCHAR(50) DEFAULT 'driving',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for tours in itineraries
CREATE TABLE IF NOT EXISTS itinerary_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    travel_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback and ratings
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    feedback_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_availability ON units(available, availability_date);
CREATE INDEX IF NOT EXISTS idx_search_results_session ON search_results(search_session_id, ranking);
CREATE INDEX IF NOT EXISTS idx_calls_session ON calls(search_session_id);
CREATE INDEX IF NOT EXISTS idx_tours_user_date ON tours(user_id, tour_date);
CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries(user_id, tour_date);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own search sessions" ON search_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create search sessions" ON search_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own search sessions" ON search_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own search results" ON search_results 
FOR SELECT USING (auth.uid() = (SELECT user_id FROM search_sessions WHERE id = search_session_id));

CREATE POLICY "Users can view own calls" ON calls 
FOR SELECT USING (auth.uid() = (SELECT user_id FROM search_sessions WHERE id = search_session_id));

CREATE POLICY "Users can view own tours" ON tours FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tours" ON tours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tours" ON tours FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own itineraries" ON itineraries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create itineraries" ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itineraries" ON itineraries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own itinerary tours" ON itinerary_tours 
FOR SELECT USING (auth.uid() = (SELECT user_id FROM itineraries WHERE id = itinerary_id));

CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
