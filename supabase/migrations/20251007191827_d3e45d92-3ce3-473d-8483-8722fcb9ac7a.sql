-- Create table for storing Strava OAuth tokens
CREATE TABLE public.strava_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  athlete_id bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own Strava tokens"
  ON public.strava_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Strava tokens"
  ON public.strava_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Strava tokens"
  ON public.strava_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Strava tokens"
  ON public.strava_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add strava_activity_id to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS strava_activity_id bigint UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activities_strava_id 
  ON public.activities(strava_activity_id);

CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id 
  ON public.strava_tokens(user_id);