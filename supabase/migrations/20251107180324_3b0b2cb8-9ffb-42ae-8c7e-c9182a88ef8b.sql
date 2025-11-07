-- Create a SECURITY DEFINER function to fetch published pages with tracking scripts
-- This bypasses RLS on tracking_script_sets to ensure scripts always load for public pages
CREATE OR REPLACE FUNCTION public.get_published_page_with_scripts(p_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  headline text,
  subtitle text,
  content jsonb,
  cta_text text,
  cta_url text,
  cta_style text,
  sticky_cta_threshold integer,
  image_url text,
  template varchar,
  user_id uuid,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  tracking_set_name text,
  google_analytics_id text,
  facebook_pixel_id text,
  triplewhale_token text,
  microsoft_clarity_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.slug,
    p.headline,
    p.subtitle,
    p.content,
    p.cta_text,
    p.cta_url,
    p.cta_style,
    p.sticky_cta_threshold,
    p.image_url,
    p.template,
    p.user_id,
    p.published_at,
    p.created_at,
    p.updated_at,
    p.status,
    t.name as tracking_set_name,
    t.google_analytics_id,
    t.facebook_pixel_id,
    t.triplewhale_token,
    t.microsoft_clarity_id
  FROM public.pages p
  LEFT JOIN public.tracking_script_sets t ON t.id = p.tracking_script_set_id
  WHERE p.slug = p_slug AND p.status = 'published'
  LIMIT 1;
$$;

-- Revoke default public access and grant to anon and authenticated users
REVOKE ALL ON FUNCTION public.get_published_page_with_scripts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_page_with_scripts(text) TO anon, authenticated;