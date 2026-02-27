CREATE TABLE IF NOT EXISTS player_cache (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT,
  team_name TEXT,
  player_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_cache_sport_id ON player_cache (sport, player_id);
CREATE INDEX IF NOT EXISTS idx_player_cache_sport ON player_cache (sport);
CREATE INDEX IF NOT EXISTS idx_player_cache_updated ON player_cache (updated_at);
