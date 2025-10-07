-- Add thumbnail_url column to events table
ALTER TABLE public.events 
ADD COLUMN thumbnail_url text;