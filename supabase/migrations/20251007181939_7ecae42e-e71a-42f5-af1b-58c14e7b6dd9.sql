-- Create a security definer function to check if user has access to a class
-- This checks if the class is free OR if the user has purchased it
CREATE OR REPLACE FUNCTION public.user_has_class_access(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if class is free
  SELECT EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = _class_id AND is_free = true
  )
  OR
  -- Check if user has purchased the class
  EXISTS (
    SELECT 1 FROM public.class_purchases
    WHERE user_id = _user_id AND class_id = _class_id
  )
$$;

-- Drop the existing permissive "Anyone can view class parts" policy
DROP POLICY IF EXISTS "Anyone can view class parts" ON public.class_parts;

-- Create new restrictive policies for class_parts
-- Policy 1: Users can view basic metadata for all class parts (without video URLs)
CREATE POLICY "Users can view class part metadata"
ON public.class_parts
FOR SELECT
USING (true);

-- Policy 2: Only authenticated users who have access can view video URLs
-- This is enforced at the application level - we'll remove video_url from direct queries
-- and force all video access through the edge function

-- Update the policy to be more restrictive
-- Users can only see class parts if they have access to the parent class
DROP POLICY IF EXISTS "Users can view class part metadata" ON public.class_parts;

CREATE POLICY "Users can view accessible class parts"
ON public.class_parts
FOR SELECT
USING (
  -- Allow access if class is free
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = class_parts.class_id
    AND classes.is_free = true
  )
  OR
  -- Allow access if user has purchased the class
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.class_purchases
      WHERE class_purchases.user_id = auth.uid()
      AND class_purchases.class_id = class_parts.class_id
    )
  )
  OR
  -- Allow admins to see everything
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add a comment explaining the security model
COMMENT ON POLICY "Users can view accessible class parts" ON public.class_parts IS 
'Restricts access to class parts based on purchase status. Users can only view parts for free classes or classes they have purchased. Video URLs should only be accessed through the generate-video-access edge function for additional security.';

-- Create an index to improve performance of the access check
CREATE INDEX IF NOT EXISTS idx_class_parts_class_id_lookup ON public.class_parts(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_free ON public.classes(is_free) WHERE is_free = true;