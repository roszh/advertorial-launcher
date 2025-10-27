-- Drop and recreate page_analytics_summary view with SECURITY INVOKER
DROP VIEW IF EXISTS page_analytics_summary;

CREATE VIEW page_analytics_summary 
WITH (security_invoker = true)
AS
SELECT 
  p.id AS page_id,
  p.title,
  p.slug,
  p.user_id,
  COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END) AS total_views,
  COUNT(CASE WHEN pa.event_type = 'click' THEN 1 END) AS total_clicks,
  CASE 
    WHEN COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END) > 0 
    THEN (COUNT(CASE WHEN pa.event_type = 'click' THEN 1 END)::float / 
          COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END)::float * 100)
    ELSE 0
  END AS ctr_percentage
FROM pages p
LEFT JOIN page_analytics pa ON p.id = pa.page_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.slug, p.user_id;

-- Drop and recreate published_pages view with SECURITY INVOKER
DROP VIEW IF EXISTS published_pages;

CREATE VIEW published_pages
WITH (security_invoker = true)
AS
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
FROM pages
WHERE status = 'published';