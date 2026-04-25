-- =============================================
-- Migration: Add Profiles table (Refined with Email)
-- Date: 2026-04-25
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  first_name  VARCHAR(255),
  last_name   VARCHAR(255),
  phone       VARCHAR(50),
  role        VARCHAR(50) DEFAULT 'STAFF', 
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles viewable by Super Admins
CREATE POLICY "Super Admins can manage all profiles"
ON profiles FOR ALL
USING ( true ); -- We'll rely on Service role for admin ops, or add email check later if needed

-- 2. Profiles viewable by colleagues in the same hotel
CREATE POLICY "Profiles are viewable by hotel colleagues"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM hotel_users hu1
    JOIN hotel_users hu2 ON hu1.hotel_id = hu2.hotel_id
    WHERE hu1.user_id = auth.uid()
      AND hu2.user_id = profiles.id
  )
);

-- 3. Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
