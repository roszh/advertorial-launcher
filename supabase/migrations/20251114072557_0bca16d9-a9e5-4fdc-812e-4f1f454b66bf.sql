-- Add scroll_depth column to page_analytics for funnel tracking
ALTER TABLE public.page_analytics 
ADD COLUMN scroll_depth INTEGER;

-- Create index for better query performance on scroll depth
CREATE INDEX idx_page_analytics_scroll_depth ON public.page_analytics(page_id, event_type, scroll_depth) 
WHERE scroll_depth IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.page_analytics.scroll_depth IS 'Scroll depth percentage (0-100) when event was triggered';