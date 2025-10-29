-- Phase 1 Optimization: Remove JOIN from published_pages view for faster loading
-- Tracking scripts will be fetched separately on the client side

DROP VIEW IF EXISTS public.published_pages;

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
  p.updated_at
FROM public.pages p
WHERE p.status = 'published';

-- Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug) WHERE status = 'published';