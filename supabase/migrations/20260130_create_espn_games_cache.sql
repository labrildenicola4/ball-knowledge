-- ESPN Games Cache Table
-- Stores cached game data from ESPN API for all sports
-- This enables scalable reads from Supabase instead of direct ESPN API calls

CREATE TABLE IF NOT EXISTS espn_games_cache (
  -- Primary key: composite of sport_type and ESPN game ID
  id TEXT PRIMARY KEY,
  sport_type TEXT NOT NULL,
  espn_game_id TEXT NOT NULL,

  -- Date/Time (all in Eastern Time)
  game_date DATE NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,

  -- Game status
  status TEXT NOT NULL DEFAULT 'scheduled',
  status_detail TEXT,
  period INTEGER,
  clock TEXT,

  -- Home team
  home_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  home_team_abbrev TEXT NOT NULL,
  home_team_logo TEXT,
  home_team_color TEXT,
  home_team_record TEXT,
  home_team_rank INTEGER,
  home_score INTEGER,

  -- Away team
  away_team_id TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  away_team_abbrev TEXT NOT NULL,
  away_team_logo TEXT,
  away_team_color TEXT,
  away_team_record TEXT,
  away_team_rank INTEGER,
  away_score INTEGER,

  -- Additional info
  venue TEXT,
  broadcast TEXT,
  conference_game BOOLEAN DEFAULT FALSE,
  neutral_site BOOLEAN DEFAULT FALSE,

  -- Sport-specific data stored as JSON
  extra_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_espn_games_sport_date
  ON espn_games_cache (sport_type, game_date);

CREATE INDEX IF NOT EXISTS idx_espn_games_date
  ON espn_games_cache (game_date);

CREATE INDEX IF NOT EXISTS idx_espn_games_status
  ON espn_games_cache (status);

CREATE INDEX IF NOT EXISTS idx_espn_games_sport_status
  ON espn_games_cache (sport_type, status);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_espn_games_unique
  ON espn_games_cache (sport_type, espn_game_id);

-- Enable Row Level Security (optional, for public read access)
ALTER TABLE espn_games_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to espn_games_cache"
  ON espn_games_cache FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete
CREATE POLICY "Allow service role full access to espn_games_cache"
  ON espn_games_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_espn_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS espn_games_updated_at ON espn_games_cache;
CREATE TRIGGER espn_games_updated_at
  BEFORE UPDATE ON espn_games_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_espn_games_updated_at();

-- Enable realtime subscriptions for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE espn_games_cache;

-- Add comment for documentation
COMMENT ON TABLE espn_games_cache IS 'Cached ESPN game data for all sports. Populated by /api/sync/espn cron job.';
