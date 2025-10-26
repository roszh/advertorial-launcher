-- Update the published_pages view to include subtitle
DROP VIEW IF EXISTS public.published_pages;

CREATE VIEW public.published_pages AS
SELECT 
  id,
  title,
  subtitle,
  slug,
  content,
  cta_text,
  cta_url,
  cta_style,
  image_url,
  template,
  status,
  sticky_cta_threshold,
  published_at,
  created_at,
  updated_at
FROM public.pages
WHERE status = 'published';