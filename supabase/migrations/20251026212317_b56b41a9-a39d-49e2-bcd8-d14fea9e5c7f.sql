-- Add sticky_cta_threshold column to pages table
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS sticky_cta_threshold INTEGER DEFAULT 20;

COMMENT ON COLUMN public.pages.sticky_cta_threshold IS 'Scroll percentage (0-100) at which sticky CTA button appears';

-- Update published_pages view to include sticky_cta_threshold
DROP VIEW IF EXISTS public.published_pages;

CREATE VIEW public.published_pages AS
SELECT 
  id,
  title,
  slug,
  content,
  cta_text,
  cta_url,
  cta_style,
  sticky_cta_threshold,
  image_url,
  template,
  status,
  published_at,
  created_at,
  updated_at
FROM public.pages
WHERE status = 'published';

-- Grant access to the view
GRANT SELECT ON public.published_pages TO anon, authenticated;