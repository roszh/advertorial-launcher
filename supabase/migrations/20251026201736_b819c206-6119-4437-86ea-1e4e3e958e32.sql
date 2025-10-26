-- Fix 1: Ensure profiles table RLS is properly enforced
-- Add explicit policy to deny unauthenticated access to profiles
CREATE POLICY "Deny unauthenticated access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix 2: Add complete RLS protection for user_roles table
-- Prevent any INSERT operations (roles should only be created by triggers/functions)
CREATE POLICY "Prevent direct role insertion"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Prevent any UPDATE operations (roles should not be modified directly)
CREATE POLICY "Prevent role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Prevent any DELETE operations (roles should not be deleted directly)
CREATE POLICY "Prevent role deletion"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Add system-level policies (for service role only)
-- These allow the system to manage roles via triggers/functions
CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "System can update roles"
ON public.user_roles
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "System can delete roles"
ON public.user_roles
FOR DELETE
TO service_role
USING (true);