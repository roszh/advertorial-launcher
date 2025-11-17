-- Add session_id column to page_analytics for better tracking accuracy
ALTER TABLE page_analytics 
ADD COLUMN session_id TEXT;

-- Create index for performance on session_id queries
CREATE INDEX idx_page_analytics_session_id ON page_analytics(session_id);

-- Create index to improve session-based CTR calculations
CREATE INDEX idx_page_analytics_page_session ON page_analytics(page_id, session_id);

COMMENT ON COLUMN page_analytics.session_id IS 'Links analytics events to unique visitor sessions for accurate metrics';