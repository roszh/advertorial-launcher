-- Update published_pages view to include cta_style
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