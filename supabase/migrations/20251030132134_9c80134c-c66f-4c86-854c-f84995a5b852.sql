-- Remove legacy tracking token columns from profiles table
-- These are now managed in the tracking_script_sets table with proper RLS
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS facebook_pixel_id,
  DROP COLUMN IF EXISTS google_analytics_id,
  DROP COLUMN IF EXISTS triplewhale_token,
  DROP COLUMN IF EXISTS microsoft_clarity_id;