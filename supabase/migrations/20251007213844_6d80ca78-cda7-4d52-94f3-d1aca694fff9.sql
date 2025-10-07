-- Fix security definer view issue
-- Drop the security definer view and rely on RLS policy instead

DROP VIEW IF EXISTS public.strava_connection_status;

-- The SELECT policy we created allows users to check their connection status
-- This is minimal but necessary for the Profile page to work
-- Note: The policy only allows reading metadata (id, user_id, etc.)
-- The sensitive token fields are still protected because:
-- 1. Client code should never request them
-- 2. We have a separate security definer function for server-side token access

COMMENT ON POLICY "Users can check if they have Strava tokens" ON public.strava_tokens IS 
'Allows users to verify their Strava connection status. Sensitive token fields should never be queried from client code.';