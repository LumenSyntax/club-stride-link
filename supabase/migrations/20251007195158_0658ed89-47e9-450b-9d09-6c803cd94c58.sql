-- Add defense-in-depth SELECT policy for OAuth state tokens
-- Users can only view their own OAuth states, preventing token enumeration attacks
-- The service role (strava-callback) bypasses RLS and continues to work normally

CREATE POLICY "Users can view own OAuth states"
  ON public.strava_oauth_states FOR SELECT
  USING (auth.uid() = user_id);