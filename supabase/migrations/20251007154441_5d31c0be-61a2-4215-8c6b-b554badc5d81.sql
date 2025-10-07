-- Fix critical security issue: Prevent unauthorized privilege escalation

-- Only admins can manage user roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));