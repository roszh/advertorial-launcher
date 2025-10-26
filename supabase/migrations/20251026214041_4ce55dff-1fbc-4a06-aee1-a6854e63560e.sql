-- Add subtitle field to pages table for storing template category/subtitle text
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT 'Featured Story';

-- Add comment for clarity
COMMENT ON COLUMN public.pages.subtitle IS 'Subtitle/category text shown above the hero heading (e.g., "Featured Story", "Breaking News", "Expert Insights")';