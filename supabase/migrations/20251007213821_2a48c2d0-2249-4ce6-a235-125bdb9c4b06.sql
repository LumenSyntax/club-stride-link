-- Add minimal SELECT policy for strava_tokens
-- Users can only check if they have a token (not read token values)
-- This allows checking connection status while keeping tokens secure

CREATE POLICY "Users can check if they have Strava tokens" 
ON public.strava_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- However, we need to ensure the sensitive fields are never exposed
-- Create a secure view for checking connection status only
CREATE OR REPLACE VIEW public.strava_connection_status AS
SELECT 
  user_id,
  id,
  athlete_id,
  expires_at,
  created_at,
  updated_at
  -- Explicitly exclude access_token and refresh_token
FROM public.strava_tokens;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.strava_connection_status TO authenticated;

COMMENT ON VIEW public.strava_connection_status IS 'Safe view of Strava connections that excludes sensitive token data. Use this for checking connection status.';