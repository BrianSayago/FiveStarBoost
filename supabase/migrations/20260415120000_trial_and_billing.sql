-- =============================================
-- Migration: Free Trial + Stripe Billing
-- Date: 2026-04-15
-- =============================================

-- =============================================
-- 1. Add subscription + trial fields to hotels
-- =============================================
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'TRIAL'
    CHECK (subscription_status IN ('TRIAL', 'SUBSCRIBED', 'CANCELED')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  VARCHAR(255);

-- =============================================
-- 2. hotel_users: multi-hotel per user relationship
-- =============================================
CREATE TABLE IF NOT EXISTS hotel_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       VARCHAR(50) DEFAULT 'OWNER'
    CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, user_id)
);

ALTER TABLE hotel_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hotel_users_user_id   ON hotel_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_users_hotel_id  ON hotel_users(hotel_id);

-- =============================================
-- 3. Helper Functions (SECURITY DEFINER = runs as DB owner, safe for RLS)
-- =============================================

-- Returns TRUE if auth.uid() belongs to the given hotel
CREATE OR REPLACE FUNCTION user_belongs_to_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hotel_users
    WHERE hotel_id = p_hotel_id
      AND user_id  = auth.uid()
  );
$$;

-- Returns TRUE if the hotel has active access (trial within date range OR active subscription).
-- This is evaluated in REAL TIME — no cron job needed.
CREATE OR REPLACE FUNCTION hotel_has_active_access(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hotels
    WHERE id = p_hotel_id
      AND (
        -- Active paid subscription
        subscription_status = 'SUBSCRIBED'
        OR
        -- Trial valid in real-time (trial_ends_at is evaluated against NOW() — no cron needed)
        (subscription_status = 'TRIAL' AND trial_ends_at IS NOT NULL AND trial_ends_at >= NOW())
      )
  );
$$;

-- Initializes the 14-day trial for a hotel.
-- Idempotent: only sets trial dates if trial_started_at IS NULL.
-- Called from backend on first user login — never from client.
CREATE OR REPLACE FUNCTION initialize_hotel_trial(p_hotel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE hotels
  SET
    trial_started_at = NOW(),
    trial_ends_at    = NOW() + INTERVAL '14 days'
  WHERE id = p_hotel_id
    AND trial_started_at IS NULL;
END;
$$;
