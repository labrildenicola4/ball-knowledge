-- Chat queries table for tracking AI assistant usage
CREATE TABLE IF NOT EXISTS chat_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  response_text TEXT,
  tools_used TEXT[] DEFAULT '{}',
  token_count_input INTEGER,
  token_count_output INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast daily count queries per user
CREATE INDEX idx_chat_queries_user_day
  ON chat_queries (user_id, created_at);

-- Enable RLS
ALTER TABLE chat_queries ENABLE ROW LEVEL SECURITY;

-- Users can only read their own queries
CREATE POLICY "Users can read own chat queries"
  ON chat_queries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own queries
CREATE POLICY "Users can insert own chat queries"
  ON chat_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert on behalf of users (for API route)
CREATE POLICY "Service role can insert chat queries"
  ON chat_queries FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read chat queries"
  ON chat_queries FOR SELECT
  TO service_role
  USING (true);

-- Add subscription columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Helper function: count today's queries for a user (Eastern Time day boundary)
CREATE OR REPLACE FUNCTION get_daily_query_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM chat_queries
  WHERE user_id = p_user_id
    AND created_at >= (NOW() AT TIME ZONE 'America/New_York')::DATE
    AND created_at < ((NOW() AT TIME ZONE 'America/New_York')::DATE + INTERVAL '1 day');
$$ LANGUAGE SQL SECURITY DEFINER;
