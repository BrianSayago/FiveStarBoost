-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE stay_status AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE survey_rating AS ENUM ('EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'HELP_NEEDED');
CREATE TYPE alert_status AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE alert_type AS ENUM ('NEGATIVE_FEEDBACK', 'IMMEDIATE_HELP');
CREATE TYPE email_type AS ENUM ('WELCOME', 'STAY_CHECK', 'NEGATIVE_FOLLOW_UP', 'REVIEW_REQUEST');
CREATE TYPE email_status AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'FAILED');

-- Tables
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'UTC',
    google_review_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, email)
);

CREATE TABLE guest_stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    check_in_date TIMESTAMPTZ NOT NULL,
    check_out_date TIMESTAMPTZ NOT NULL,
    status stay_status DEFAULT 'SCHEDULED',
    survey_token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    stay_id UUID NOT NULL REFERENCES guest_stays(id) ON DELETE CASCADE,
    rating survey_rating NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stay_id) -- Ensures only one response per stay
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    stay_id UUID NOT NULL REFERENCES guest_stays(id) ON DELETE CASCADE,
    response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    status alert_status DEFAULT 'OPEN',
    message TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    stay_id UUID NOT NULL REFERENCES guest_stays(id) ON DELETE CASCADE,
    type email_type NOT NULL,
    status email_status DEFAULT 'PENDING',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    brevo_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and n8n query optimizations
CREATE INDEX idx_guests_hotel_id ON guests(hotel_id);
CREATE INDEX idx_guest_stays_hotel_id ON guest_stays(hotel_id);
CREATE INDEX idx_survey_responses_hotel_id ON survey_responses(hotel_id);
CREATE INDEX idx_alerts_hotel_id ON alerts(hotel_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_email_events_hotel_id ON email_events(hotel_id);
CREATE INDEX idx_email_events_pending_scheduled ON email_events(status, scheduled_for)
WHERE status IN ('PENDING', 'SCHEDULED');

-- Row Level Security (RLS) policies 
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view and edit their hotel's guests" 
ON guests FOR ALL USING ( hotel_id::text = (auth.jwt() ->> 'hotel_id') );

CREATE POLICY "Staff can view and edit their hotel's stays" 
ON guest_stays FOR ALL USING ( hotel_id::text = (auth.jwt() ->> 'hotel_id') );

CREATE POLICY "Staff can view their hotel's survey responses" 
ON survey_responses FOR SELECT USING ( hotel_id::text = (auth.jwt() ->> 'hotel_id') );

CREATE POLICY "Staff can view and edit their hotel's alerts" 
ON alerts FOR ALL USING ( hotel_id::text = (auth.jwt() ->> 'hotel_id') );

CREATE POLICY "Staff can view and edit their hotel's email events" 
ON email_events FOR ALL USING ( hotel_id::text = (auth.jwt() ->> 'hotel_id') );

-- ==========================================
-- Triggers and Functions
-- ==========================================

-- Trigger 1: schedule_guest_emails
CREATE OR REPLACE FUNCTION schedule_guest_emails()
RETURNS TRIGGER AS $$
BEGIN
    -- Welcome Email: 2 hours after check-in
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'WELCOME', 'PENDING', 
        NEW.check_in_date + INTERVAL '2 hours'
    );

    -- Stay Satisfaction Check: Next day at 11:00 AM (approximated UTC)
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'STAY_CHECK', 'PENDING', 
        date_trunc('day', NEW.check_in_date) + INTERVAL '1 day 11 hours'
    );

    -- Post-Stay Review Request: 3 hours after check-out
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'REVIEW_REQUEST', 'PENDING', 
        NEW.check_out_date + INTERVAL '3 hours'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schedule_guest_emails
AFTER INSERT ON guest_stays
FOR EACH ROW
EXECUTE FUNCTION schedule_guest_emails();

-- Trigger 2: handle_survey_response
CREATE OR REPLACE FUNCTION handle_survey_response()
RETURNS TRIGGER AS $$
BEGIN
    -- If response is 'NEEDS_IMPROVEMENT'
    IF NEW.rating = 'NEEDS_IMPROVEMENT' THEN
        INSERT INTO alerts (hotel_id, stay_id, response_id, type, message)
        VALUES (NEW.hotel_id, NEW.stay_id, NEW.id, 'NEGATIVE_FEEDBACK', 'Guest indicated their stay could be better.');
        
        INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
        VALUES (NEW.hotel_id, NEW.stay_id, 'NEGATIVE_FOLLOW_UP', 'PENDING', NOW() + INTERVAL '5 minutes');
    END IF;

    -- If response is 'HELP_NEEDED'
    IF NEW.rating = 'HELP_NEEDED' THEN
        INSERT INTO alerts (hotel_id, stay_id, response_id, type, message)
        VALUES (NEW.hotel_id, NEW.stay_id, NEW.id, 'IMMEDIATE_HELP', 'URGENT: Guest requested immediate assistance.');
        
        INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
        VALUES (NEW.hotel_id, NEW.stay_id, 'NEGATIVE_FOLLOW_UP', 'PENDING', NOW() + INTERVAL '5 minutes');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_survey_response
AFTER INSERT ON survey_responses
FOR EACH ROW
EXECUTE FUNCTION handle_survey_response();
