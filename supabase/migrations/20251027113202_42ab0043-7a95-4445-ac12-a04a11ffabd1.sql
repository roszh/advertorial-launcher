-- Drop existing published_pages view
DROP VIEW IF EXISTS public.published_pages;

-- Recreate published_pages view with headline column
CREATE OR REPLACE VIEW public.published_pages AS
SELECT 
  p.id,
  p.user_id,
  p.slug,
  p.title,
  p.headline,
  p.subtitle,
  p.content,
  p.cta_text,
  p.cta_url,
  p.cta_style,
  p.template,
  p.image_url,
  p.status,
  p.published_at,
  p.sticky_cta_threshold,
  p.created_at,
  p.updated_at,
  prof.google_analytics_id,
  prof.facebook_pixel_id,
  prof.triplewhale_token,
  prof.microsoft_clarity_id
FROM public.pages p
LEFT JOIN public.profiles prof ON p.user_id = prof.id
WHERE p.status = 'published';