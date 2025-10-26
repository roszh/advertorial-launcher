-- Add cta_style column to pages table
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS cta_style TEXT DEFAULT 'ctaAmazon';

COMMENT ON COLUMN public.pages.cta_style IS 'CTA button style variant (ctaAmazon, ctaUrgent, ctaPremium, ctaTrust)';