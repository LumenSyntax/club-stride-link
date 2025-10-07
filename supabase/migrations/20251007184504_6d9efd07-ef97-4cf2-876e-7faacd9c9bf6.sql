-- Create activity_type enum for different workout types
CREATE TYPE public.activity_type AS ENUM (
  'running',
  'cycling',
  'swimming',
  'hiit',
  'strength',
  'yoga',
  'walking',
  'other'
);

-- Create activities table to track user workouts
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type public.activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- duration in minutes
  distance DECIMAL(10,2), -- distance in kilometers
  calories INTEGER,
  activity_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view own activities"
ON public.activities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON public.activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
ON public.activities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON public.activities
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all activities for analytics
CREATE POLICY "Admins can view all activities"
ON public.activities
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_activity_date ON public.activities(activity_date);
CREATE INDEX idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, activity_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.activities IS 'Stores user activity logs including runs, workouts, and training sessions';