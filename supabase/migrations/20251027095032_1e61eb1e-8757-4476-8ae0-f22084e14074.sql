-- Add element_id column to page_analytics table to track which specific button/link was clicked
ALTER TABLE public.page_analytics 
ADD COLUMN element_id TEXT;