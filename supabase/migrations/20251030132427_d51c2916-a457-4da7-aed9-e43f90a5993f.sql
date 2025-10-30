-- Fix Security Definer View issue by setting published_pages to SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user, not the view creator
ALTER VIEW public.published_pages SET (security_invoker = true);