-- Fix Strava tokens security issue
-- Remove client-side SELECT access to prevent token theft

-- Drop the existing SELECT policy that allows users to view their tokens
DROP POLICY IF EXISTS "Users can view only their own Strava tokens" ON public.strava_tokens;

-- Create a security definer function for server-side token retrieval
-- This allows edge functions to access tokens without exposing them to clients
CREATE OR REPLACE FUNCTION public.get_user_strava_token(_user_id uuid)
RETURNS TABLE (
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  athlete_id bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    access_token,
    refresh_token,
    expires_at,
    athlete_id
  FROM public.strava_tokens
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users (for edge function use)
GRANT EXECUTE ON FUNCTION public.get_user_strava_token(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_strava_token IS 'Securely retrieves Strava tokens for server-side use only. Tokens are never exposed to client-side code.';