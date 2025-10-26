-- Remove the public read policy from pages table
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.pages;

-- Create a view for public pages that excludes user_id
CREATE OR REPLACE VIEW public.published_pages AS
SELECT 
  id,
  title,
  content,
  created_at,
  updated_at,
  published_at,
  slug,
  status,
  image_url,
  cta_text,
  cta_url,
  template
FROM public.pages
WHERE status = 'published';

-- Enable RLS on the view (Postgres 15+ feature)
ALTER VIEW public.published_pages SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.published_pages TO anon;
GRANT SELECT ON public.published_pages TO authenticated;