-- =====================================================
-- FIX SECURITY WARNINGS: Set search_path on existing functions
-- =====================================================

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$function$;

-- Fix has_role function (already has search_path, but recreating for consistency)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$function$;

-- Fix user_has_class_access function
CREATE OR REPLACE FUNCTION public.user_has_class_access(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix get_user_strava_token function
CREATE OR REPLACE FUNCTION public.get_user_strava_token(_user_id uuid)
RETURNS TABLE(access_token text, refresh_token text, expires_at timestamp with time zone, athlete_id bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    access_token,
    refresh_token,
    expires_at,
    athlete_id
  FROM public.strava_tokens
  WHERE user_id = _user_id
  LIMIT 1;
$function$;

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;