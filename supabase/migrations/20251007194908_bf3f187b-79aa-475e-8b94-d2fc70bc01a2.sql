-- Fix critical security issue: Remove public read access to OAuth state tokens
-- The service role (used in strava-callback) bypasses RLS, so this policy is unnecessary and dangerous

DROP POLICY IF EXISTS "Service role can read OAuth states" ON public.strava_oauth_states;

-- Users should never directly read OAuth states - they're internal temporary tokens
-- The INSERT and DELETE policies for users are sufficient and secure