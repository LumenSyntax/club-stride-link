-- Fix video_access_logs security vulnerability
-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert access logs" ON public.video_access_logs;

-- Create a secure INSERT policy that requires authentication
-- Users can only insert logs for their own user_id
CREATE POLICY "Authenticated users can log their own video access"
  ON public.video_access_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);