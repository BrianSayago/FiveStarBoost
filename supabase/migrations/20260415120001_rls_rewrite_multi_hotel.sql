-- =============================================
-- Migration: RLS Rewrite for Multi-Hotel Support
-- Date: 2026-04-15
--
-- BREAKING CHANGE: Replaces JWT hotel_id-based policies with
-- hotel_users table lookups, enabling multi-hotel per user.
-- =============================================

-- =============================================
-- DROP all old JWT-based policies
-- =============================================
DROP POLICY IF EXISTS "Staff can view their hotel info"              ON hotels;
DROP POLICY IF EXISTS "Staff can edit their hotel info"              ON hotels;
DROP POLICY IF EXISTS "Staff can view and edit their hotel's guests" ON guests;
DROP POLICY IF EXISTS "Staff can view and edit their hotel's stays"  ON guest_stays;
DROP POLICY IF EXISTS "Staff can view their hotel's survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Staff can view and edit their hotel's alerts"       ON alerts;
DROP POLICY IF EXISTS "Staff can view and edit their hotel's email events" ON email_events;

-- =============================================
-- HOTELS: accessible to members, regardless of subscription
-- (hotel owners must be able to see billing status even when expired)
-- =============================================
CREATE POLICY "Members can view their hotels"
ON hotels FOR SELECT
USING (user_belongs_to_hotel(id));

CREATE POLICY "Members can update their hotels"
ON hotels FOR UPDATE
USING (user_belongs_to_hotel(id));

-- =============================================
-- HOTEL_USERS: members can view their own memberships
-- =============================================
CREATE POLICY "Members can view hotel memberships"
ON hotel_users FOR SELECT
USING (user_belongs_to_hotel(hotel_id));

-- =============================================
-- SENSITIVE DATA: requires membership AND active access
-- If trial is expired AND not subscribed → RLS returns 0 rows
-- This is the database-level paywall enforcement
-- =============================================
CREATE POLICY "Active members can access guests"
ON guests FOR ALL
USING (
  user_belongs_to_hotel(hotel_id)
  AND hotel_has_active_access(hotel_id)
);

CREATE POLICY "Active members can access stays"
ON guest_stays FOR ALL
USING (
  user_belongs_to_hotel(hotel_id)
  AND hotel_has_active_access(hotel_id)
);

CREATE POLICY "Active members can view survey responses"
ON survey_responses FOR SELECT
USING (
  user_belongs_to_hotel(hotel_id)
  AND hotel_has_active_access(hotel_id)
);

CREATE POLICY "Active members can access alerts"
ON alerts FOR ALL
USING (
  user_belongs_to_hotel(hotel_id)
  AND hotel_has_active_access(hotel_id)
);

CREATE POLICY "Active members can access email events"
ON email_events FOR ALL
USING (
  user_belongs_to_hotel(hotel_id)
  AND hotel_has_active_access(hotel_id)
);
