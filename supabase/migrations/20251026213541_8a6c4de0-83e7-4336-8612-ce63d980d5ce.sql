-- Create page_analytics table to track clicks and views
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

-- Add index for faster queries
CREATE INDEX idx_page_analytics_page_id ON public.page_analytics(page_id);
CREATE INDEX idx_page_analytics_created_at ON public.page_analytics(created_at);
CREATE INDEX idx_page_analytics_event_type ON public.page_analytics(event_type);

-- Enable RLS
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics events (for public pages)
CREATE POLICY "Anyone can insert analytics events"
ON public.page_analytics
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view analytics for their own pages
CREATE POLICY "Users can view own page analytics"
ON public.page_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = page_analytics.page_id
    AND pages.user_id = auth.uid()
  )
);

-- Create a view for aggregated analytics
CREATE OR REPLACE VIEW public.page_analytics_summary AS
SELECT 
  p.id as page_id,
  p.title,
  p.slug,
  p.user_id,
  COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END) as total_views,
  COUNT(CASE WHEN pa.event_type = 'click' THEN 1 END) as total_clicks,
  CASE 
    WHEN COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END) > 0 
    THEN (COUNT(CASE WHEN pa.event_type = 'click' THEN 1 END)::FLOAT / 
          COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END)::FLOAT * 100)
    ELSE 0 
  END as ctr_percentage
FROM public.pages p
LEFT JOIN public.page_analytics pa ON p.id = pa.page_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.slug, p.user_id;