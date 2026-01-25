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

-- Profiles table (for authenticated users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Public can READ everything (except profiles)
CREATE POLICY "Public read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Public read events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Public read lineups" ON lineups FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON match_stats FOR SELECT USING (true);

-- Policies: Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies: Service Role/Admin (Implicitly full access, but here for clarity if needed later)
-- Note: Queries using the SERVICE_ROLE_KEY bypass RLS automatically.

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USER FAVORITES (Protected - per user)
-- Supports: teams, leagues, tournaments
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  favorite_type VARCHAR(20) NOT NULL CHECK (favorite_type IN ('team', 'league', 'tournament')),
  favorite_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorite_type, favorite_id)
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only add their own favorites
CREATE POLICY "Users can add own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(user_id, favorite_type);

-- ============================================
-- FIXTURES CACHE (Denormalized for fast reads)
-- This is a cache table - data is synced from external APIs
-- Supports multiple sports via sport_type column
-- ============================================
CREATE TABLE IF NOT EXISTS fixtures_cache (
  id SERIAL PRIMARY KEY,
  api_id INTEGER NOT NULL,
  sport_type VARCHAR(20) NOT NULL DEFAULT 'soccer',

  -- Match info
  match_date DATE NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'NS',
  minute INTEGER,
  venue VARCHAR(200),
  matchday INTEGER,
  stage VARCHAR(100),

  -- League info (denormalized)
  league_name VARCHAR(200) NOT NULL,
  league_code VARCHAR(20) NOT NULL,
  league_logo VARCHAR(500),

  -- Home team (denormalized)
  home_team_id INTEGER NOT NULL,
  home_team_name VARCHAR(200) NOT NULL,
  home_team_short VARCHAR(10),
  home_team_logo VARCHAR(500),
  home_score INTEGER,

  -- Away team (denormalized)
  away_team_id INTEGER NOT NULL,
  away_team_name VARCHAR(200) NOT NULL,
  away_team_short VARCHAR(10),
  away_team_logo VARCHAR(500),
  away_score INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one entry per API match ID and sport
  UNIQUE(api_id, sport_type)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_fixtures_cache_date ON fixtures_cache(match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_cache_sport_date ON fixtures_cache(sport_type, match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_cache_status ON fixtures_cache(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_cache_kickoff ON fixtures_cache(kickoff);

-- Enable RLS
ALTER TABLE fixtures_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (this is cached public data)
CREATE POLICY "Public read fixtures cache" ON fixtures_cache FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_fixtures_cache_updated_at
  BEFORE UPDATE ON fixtures_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SYNC LOG (Track sync operations)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  sport_type VARCHAR(20) NOT NULL DEFAULT 'soccer',
  records_synced INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for recent syncs
CREATE INDEX IF NOT EXISTS idx_sync_log_type_time ON sync_log(sync_type, started_at DESC);
