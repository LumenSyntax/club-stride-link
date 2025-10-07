-- Create table for temporary OAuth state storage
CREATE TABLE public.strava_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Index for efficient cleanup of expired states
CREATE INDEX idx_strava_oauth_states_expires ON public.strava_oauth_states(expires_at);

-- Enable Row Level Security
ALTER TABLE public.strava_oauth_states ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own OAuth states
CREATE POLICY "Users can insert own OAuth states"
  ON public.strava_oauth_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to read OAuth states (needed for callback)
CREATE POLICY "Service role can read OAuth states"
  ON public.strava_oauth_states FOR SELECT
  USING (true);

-- Allow users to delete their own expired states
CREATE POLICY "Users can delete own OAuth states"
  ON public.strava_oauth_states FOR DELETE
  USING (auth.uid() = user_id);