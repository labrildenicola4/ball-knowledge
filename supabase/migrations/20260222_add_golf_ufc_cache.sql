-- Golf Events Cache
CREATE TABLE IF NOT EXISTS golf_events_cache (
  id TEXT PRIMARY KEY,
  tour_slug TEXT NOT NULL,
  espn_event_id TEXT NOT NULL,
  event_name TEXT,
  event_date TEXT,
  status TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golf_events_tour_status ON golf_events_cache (tour_slug, status);
CREATE INDEX IF NOT EXISTS idx_golf_events_tour_date ON golf_events_cache (tour_slug, event_date);

-- Golf Standings Cache (rankings, leaders, schedule per tour)
CREATE TABLE IF NOT EXISTS golf_standings_cache (
  id TEXT PRIMARY KEY,
  tour_slug TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UFC Events Cache
CREATE TABLE IF NOT EXISTS ufc_events_cache (
  id TEXT PRIMARY KEY,
  espn_event_id TEXT NOT NULL,
  event_name TEXT,
  event_date TEXT,
  status TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ufc_events_status ON ufc_events_cache (status);
CREATE INDEX IF NOT EXISTS idx_ufc_events_date ON ufc_events_cache (event_date);
