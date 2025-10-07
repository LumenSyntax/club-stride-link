-- Drop existing policies on strava_tokens to recreate them with explicit restrictions
DROP POLICY IF EXISTS "Users can view own Strava tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can insert own Strava tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can update own Strava tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can delete own Strava tokens" ON public.strava_tokens;

-- Recreate policies with more explicit security checks
-- Only allow viewing own tokens when authenticated
CREATE POLICY "Users can view only their own Strava tokens" 
ON public.strava_tokens 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Only allow inserting tokens for authenticated user's own account
CREATE POLICY "Users can insert only their own Strava tokens" 
ON public.strava_tokens 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only allow updating own tokens when authenticated
CREATE POLICY "Users can update only their own Strava tokens" 
ON public.strava_tokens 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only allow deleting own tokens when authenticated
CREATE POLICY "Users can delete only their own Strava tokens" 
ON public.strava_tokens 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure no anon or public role can access this table
REVOKE ALL ON public.strava_tokens FROM anon;
REVOKE ALL ON public.strava_tokens FROM public;