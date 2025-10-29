-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tracking_script_sets table for Country Setups
CREATE TABLE public.tracking_script_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  google_analytics_id text,
  facebook_pixel_id text,
  triplewhale_token text,
  microsoft_clarity_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.tracking_script_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own script sets"
  ON public.tracking_script_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own script sets"
  ON public.tracking_script_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own script sets"
  ON public.tracking_script_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own script sets"
  ON public.tracking_script_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_tracking_script_sets
  BEFORE UPDATE ON public.tracking_script_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_column();

-- Migrate existing profile tracking scripts to default Country Setup
INSERT INTO public.tracking_script_sets (user_id, name, google_analytics_id, facebook_pixel_id, triplewhale_token, microsoft_clarity_id)
SELECT 
  id as user_id,
  'Default' as name,
  google_analytics_id,
  facebook_pixel_id,
  triplewhale_token,
  microsoft_clarity_id
FROM public.profiles
WHERE google_analytics_id IS NOT NULL 
   OR facebook_pixel_id IS NOT NULL 
   OR triplewhale_token IS NOT NULL 
   OR microsoft_clarity_id IS NOT NULL;

-- Add tracking_script_set_id to pages table (nullable first for migration)
ALTER TABLE public.pages 
ADD COLUMN tracking_script_set_id uuid REFERENCES public.tracking_script_sets(id) ON DELETE RESTRICT;

-- Assign existing pages to their user's default script set
UPDATE public.pages p
SET tracking_script_set_id = ts.id
FROM public.tracking_script_sets ts
WHERE p.user_id = ts.user_id 
  AND ts.name = 'Default'
  AND p.tracking_script_set_id IS NULL;

-- Create minimal default for users who had no tracking scripts
INSERT INTO public.tracking_script_sets (user_id, name)
SELECT DISTINCT p.user_id, 'Default'
FROM public.pages p
WHERE p.tracking_script_set_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tracking_script_sets ts 
    WHERE ts.user_id = p.user_id AND ts.name = 'Default'
  );

-- Assign remaining pages to the default
UPDATE public.pages p
SET tracking_script_set_id = ts.id
FROM public.tracking_script_sets ts
WHERE p.user_id = ts.user_id 
  AND ts.name = 'Default'
  AND p.tracking_script_set_id IS NULL;

-- Update published_pages view to include tracking script data
DROP VIEW IF EXISTS public.published_pages;

CREATE VIEW public.published_pages AS
SELECT 
  p.id,
  p.user_id,
  p.title,
  p.slug,
  p.status,
  p.created_at,
  p.updated_at,
  p.published_at,
  p.content,
  p.cta_text,
  p.cta_url,
  p.cta_style,
  p.image_url,
  p.template,
  p.headline,
  p.subtitle,
  p.sticky_cta_threshold,
  ts.google_analytics_id,
  ts.facebook_pixel_id,
  ts.triplewhale_token,
  ts.microsoft_clarity_id,
  ts.name as tracking_script_set_name
FROM public.pages p
LEFT JOIN public.tracking_script_sets ts ON p.tracking_script_set_id = ts.id
WHERE p.status = 'published';