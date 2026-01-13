-- Ball Knowledge Database Schema
-- Run this in Supabase SQL Editor to set up your tables

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id SERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  logo VARCHAR(500),
  flag VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(10),
  logo VARCHAR(500),
  league_id INTEGER REFERENCES leagues(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  league_id INTEGER REFERENCES leagues(id),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'NS',
  kickoff TIMESTAMPTZ NOT NULL,
  venue VARCHAR(200),
  attendance INTEGER,
  round VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id),
  team_id INTEGER REFERENCES teams(id),
  season INTEGER NOT NULL,
  position INTEGER NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  form VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, team_id, season)
);

-- Match events table
CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id),
  player_name VARCHAR(200),
  event_type VARCHAR(20) NOT NULL,
  minute INTEGER NOT NULL,
  extra_minute INTEGER,
  assist_name VARCHAR(200),
  detail VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lineups table
CREATE TABLE IF NOT EXISTS lineups (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id),
  player_name VARCHAR(200) NOT NULL,
  player_number INTEGER,
  position VARCHAR(10),
  is_starter BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match stats table
CREATE TABLE IF NOT EXISTS match_stats (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id),
  stat_type VARCHAR(50) NOT NULL,
  stat_value VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_standings_league_season ON standings(league_id, season);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_standings_updated_at
  BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert initial leagues
INSERT INTO leagues (api_id, name, country, flag) VALUES
  (140, 'LaLiga', 'Spain', '🇪🇸'),
  (39, 'Premier League', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  (135, 'Serie A', 'Italy', '🇮🇹'),
  (78, 'Bundesliga', 'Germany', '🇩🇪'),
  (61, 'Ligue 1', 'France', '🇫🇷')
ON CONFLICT (api_id) DO NOTHING;

-- Row Level Security (optional - for multi-user scenarios)
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Public read access policy
-- CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON standings FOR SELECT USING (true);
