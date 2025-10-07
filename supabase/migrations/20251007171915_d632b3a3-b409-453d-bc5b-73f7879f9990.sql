-- First, let's restructure the database
-- Live classes will now be events with type 'live_class'
-- Classes table will be for recorded video collections
-- Create a new table for class parts/segments

-- Drop the old classes table and recreate it for video collections
DROP TABLE IF EXISTS class_registrations CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Create new classes table for video collections
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  upload_date DATE NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_parts table for individual video segments
CREATE TABLE public.class_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  part_order INTEGER NOT NULL,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, part_order)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_parts ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Anyone can view classes"
  ON public.classes FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert classes"
  ON public.classes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update classes"
  ON public.classes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete classes"
  ON public.classes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for class_parts
CREATE POLICY "Anyone can view class parts"
  ON public.class_parts FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert class parts"
  ON public.class_parts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update class parts"
  ON public.class_parts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete class parts"
  ON public.class_parts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_class_parts_updated_at
  BEFORE UPDATE ON public.class_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update events table to include live classes
-- Add a new event type constraint that includes live_class
ALTER TABLE public.events 
  DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE public.events 
  ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('running', 'hiit', 'strength', 'social', 'live_class'));