-- Fix critical security issues: Restrict public access to sensitive user data

-- Drop existing overly permissive policy on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restricted policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Drop existing overly permissive policy on user_roles table
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create restricted policy: users can only view their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);