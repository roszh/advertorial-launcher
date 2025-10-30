-- Drop and recreate the published_pages view without sensitive tracking tokens
-- These tokens should only be accessed server-side when rendering pages
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
  ts.name AS tracking_script_set_name
FROM pages p
LEFT JOIN tracking_script_sets ts ON p.tracking_script_set_id = ts.id
WHERE p.status = 'published';