// Unified ESPN sync configuration for all sports
// This replaces direct API calls with a cached Supabase approach

export const ESPN_SPORTS = {
  basketball: {
    sportType: 'basketball',
    displayName: 'NCAA Basketball',
    emoji: '🏀',
    espnPath: 'basketball/mens-college-basketball',
    groups: '50', // NCAA D1 group ID
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
  mlb: {
    sportType: 'baseball',
    displayName: 'MLB Baseball',
    emoji: '⚾',
    espnPath: 'baseball/mlb',
    groups: null,
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
  nba: {
    sportType: 'basketball_nba',
    displayName: 'NBA Basketball',
    emoji: '🏀',
    espnPath: 'basketball/nba',
    groups: null,
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
  nfl: {
    sportType: 'football_nfl',
    displayName: 'NFL Football',
    emoji: '🏈',
    espnPath: 'football/nfl',
    groups: null,
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
  nhl: {
    sportType: 'hockey_nhl',
    displayName: 'NHL Hockey',
    emoji: '🏒',
    espnPath: 'hockey/nhl',
    groups: null,
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
  cfb: {
    sportType: 'football_college',
    displayName: 'College Football',
    emoji: '🏈',
    espnPath: 'football/college-football',
    groups: '80', // FBS group
    syncDaysBack: 7,
    syncDaysAhead: 14,
    liveRefreshSeconds: 15,
    defaultRefreshSeconds: 60,
  },
} as const;

export type ESPNSportKey = keyof typeof ESPN_SPORTS;
export type ESPNSportConfig = typeof ESPN_SPORTS[ESPNSportKey];

// ESPN API base URLs
export const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
export const ESPN_API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports';

// Status mappings for all sports
export const GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed'> = {
  // General statuses
  'STATUS_SCHEDULED': 'scheduled',
  'STATUS_IN_PROGRESS': 'in_progress',
  'STATUS_HALFTIME': 'in_progress',
  'STATUS_END_PERIOD': 'in_progress',
  'STATUS_FINAL': 'final',
  'STATUS_FINAL_OT': 'final',
  'STATUS_POSTPONED': 'postponed',
  'STATUS_CANCELED': 'final',
  'STATUS_DELAYED': 'delayed',
  'STATUS_RAIN_DELAY': 'delayed',
  'STATUS_SUSPENDED': 'delayed',
  // Pre-game
  'pre': 'scheduled',
  'scheduled': 'scheduled',
  // In-progress
  'in': 'in_progress',
  'halftime': 'in_progress',
  // Post-game
  'post': 'final',
  'final': 'final',
};

// Helper to get Eastern Time date string
export function getEasternDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Helper to format time in Eastern Time
export function formatEasternTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Helper to format date in Eastern Time
export function formatEasternDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Generate date range for syncing
export function getSyncDateRange(daysBack: number, daysAhead: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = -daysBack; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(getEasternDateString(date));
  }

  return dates;
}

// Supabase table name for ESPN games cache
export const ESPN_GAMES_TABLE = 'espn_games_cache';

// Database schema for ESPN games cache
export interface ESPNGameRecord {
  id: string; // Composite: {sport_type}_{espn_game_id}
  sport_type: string;
  espn_game_id: string;
  game_date: string; // YYYY-MM-DD in Eastern Time
  kickoff: string; // ISO timestamp
  status: string;
  status_detail: string;
  period: number | null;
  clock: string | null;

  // Home team
  home_team_id: string;
  home_team_name: string;
  home_team_abbrev: string;
  home_team_logo: string | null;
  home_team_color: string | null;
  home_team_record: string | null;
  home_team_rank: number | null;
  home_score: number | null;

  // Away team
  away_team_id: string;
  away_team_name: string;
  away_team_abbrev: string;
  away_team_logo: string | null;
  away_team_color: string | null;
  away_team_record: string | null;
  away_team_rank: number | null;
  away_score: number | null;

  // Additional info
  venue: string | null;
  broadcast: string | null;
  conference_game: boolean;
  neutral_site: boolean;

  // Sport-specific data (JSON)
  extra_data: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}
