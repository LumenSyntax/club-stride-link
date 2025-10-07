-- Fix security issue: Restrict access to event registrations

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_registrations;

-- Create policy for users to view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for admins to view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Apply the same fix for class_registrations if it has the same issue
DROP POLICY IF EXISTS "Anyone can view class registrations" ON public.class_registrations;

-- Create policy for users to view their own class registrations
CREATE POLICY "Users can view own class registrations"
ON public.class_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for admins to view all class registrations
CREATE POLICY "Admins can view all class registrations"
ON public.class_registrations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));