-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.published_pages;

-- Recreate the view with user_id and tracking scripts included
CREATE VIEW public.published_pages AS
SELECT 
  p.id,
  p.title,
  p.subtitle,
  p.slug,
  p.content,
  p.cta_text,
  p.cta_url,
  p.cta_style,
  p.sticky_cta_threshold,
  p.image_url,
  p.template,
  p.status,
  p.created_at,
  p.updated_at,
  p.published_at,
  p.user_id,
  pr.google_analytics_id,
  pr.facebook_pixel_id,
  pr.triplewhale_token,
  pr.microsoft_clarity_id
FROM public.pages p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
WHERE p.status = 'published';

-- Grant SELECT permission to anonymous and authenticated users
GRANT SELECT ON public.published_pages TO anon;
GRANT SELECT ON public.published_pages TO authenticated;