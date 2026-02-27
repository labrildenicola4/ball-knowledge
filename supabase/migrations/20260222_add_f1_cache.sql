-- F1 Events Cache
-- Stores full F1Event objects as JSONB since F1 data is structurally different
-- from team sports (sessions, not home/away games).
CREATE TABLE IF NOT EXISTS f1_events_cache (
  id TEXT PRIMARY KEY,
  espn_event_id TEXT UNIQUE NOT NULL,
  event_name TEXT,
  short_name TEXT,
  event_date TEXT,
  start_date TEXT,
  status TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_f1_events_event_date ON f1_events_cache (event_date);
CREATE INDEX IF NOT EXISTS idx_f1_events_status ON f1_events_cache (status);

-- F1 Standings Cache
-- Single row (id='current') storing both driver and constructor standings as JSONB.
CREATE TABLE IF NOT EXISTS f1_standings_cache (
  id TEXT PRIMARY KEY DEFAULT 'current',
  season INTEGER,
  driver_standings JSONB NOT NULL DEFAULT '[]'::jsonb,
  constructor_standings JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single standings row
INSERT INTO f1_standings_cache (id, season, driver_standings, constructor_standings)
VALUES ('current', EXTRACT(YEAR FROM now())::INTEGER, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
