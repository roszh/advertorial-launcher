-- Add tracking scripts columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS triplewhale_token TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.google_analytics_id IS 'Google Analytics tracking ID (e.g., G-XXXXXXXXXX)';
COMMENT ON COLUMN public.profiles.facebook_pixel_id IS 'Facebook Pixel ID';
COMMENT ON COLUMN public.profiles.triplewhale_token IS 'Triple Whale tracking token';