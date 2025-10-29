-- Create page_sessions table for time-on-page tracking
CREATE TABLE IF NOT EXISTS page_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE page_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_sessions
CREATE POLICY "Users can view own page sessions"
  ON page_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = page_sessions.page_id 
    AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert sessions"
  ON page_sessions FOR INSERT
  WITH CHECK (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_sessions_page_id ON page_sessions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sessions_session_id ON page_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_page_analytics_user_agent ON page_analytics(user_agent);
CREATE INDEX IF NOT EXISTS idx_page_analytics_referrer ON page_analytics(referrer);