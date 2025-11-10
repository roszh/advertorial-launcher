-- Add tags column to snippets table to store tag information
ALTER TABLE public.snippets ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Add index for faster tag filtering
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON public.snippets USING gin(tags);