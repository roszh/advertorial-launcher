-- Add UTM tracking columns to page_analytics table
ALTER TABLE page_analytics 
ADD COLUMN utm_source text,
ADD COLUMN utm_medium text,
ADD COLUMN utm_campaign text,
ADD COLUMN utm_term text,
ADD COLUMN utm_content text,
ADD COLUMN landing_page_url text;

-- Add UTM tracking columns to page_sessions table
ALTER TABLE page_sessions 
ADD COLUMN utm_source text,
ADD COLUMN utm_medium text,
ADD COLUMN utm_campaign text,
ADD COLUMN utm_term text,
ADD COLUMN utm_content text,
ADD COLUMN landing_page_url text;

-- Create index on utm_source and utm_campaign for faster queries
CREATE INDEX idx_page_analytics_utm_source ON page_analytics(utm_source);
CREATE INDEX idx_page_analytics_utm_campaign ON page_analytics(utm_campaign);
CREATE INDEX idx_page_sessions_utm_source ON page_sessions(utm_source);
CREATE INDEX idx_page_sessions_utm_campaign ON page_sessions(utm_campaign);