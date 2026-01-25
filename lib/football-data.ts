// Football-Data.org API client
// Docs: https://www.football-data.org/documentation/api

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_KEY!;

// Simple in-memory cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for general data
const LIVE_CACHE_TTL = 30 * 1000; // 30 seconds cache for live match data

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6500; // 6.5 seconds between requests (safe for 10/min limit)

// Competition codes for leagues and international competitions
export const COMPETITION_CODES = {
  // Original 5 European leagues
  premier: 'PL',
  laliga: 'PD',
  seriea: 'SA',
  bundesliga: 'BL1',
  ligue1: 'FL1',
  // Additional domestic leagues
  brasileirao: 'BSA',
  eredivisie: 'DED',
  primeiraliga: 'PPL',
  championship: 'ELC',
  // International competitions
  championsleague: 'CL',
  copalibertadores: 'CLI',
} as const;

export type LeagueId = keyof typeof COMPETITION_CODES;

// Types from Football-Data.org API
export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Match {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';
  minute: number | null;
  matchday: number;
  stage: string;
  venue: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: string;
    fullTime: Score;
    halfTime: Score;
  };
  competition: {
    id: number;
    name: string;
    code: string;
    emblem: string;
  };
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsResponse {
  competition: { id: number; name: string; code: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday: number };
  standings: Array<{
    stage: string;
    type: string;
    table: Standing[];
  }>;
}

export interface MatchesResponse {
  matches: Match[];
  resultSet: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
}

export interface MatchResponse {
  id: number;
  utcDate: string;
  status: string;
  minute: number | null;
  venue: string | null;
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: string | null;
    duration: string;
    fullTime: Score;
    halfTime: Score;
  };
  competition: {
    id: number;
    name: string;
    code: string;
  };
  head2head?: {
    numberOfMatches: number;
    totalGoals: number;
    homeTeam: { wins: number; draws: number; losses: number };
    awayTeam: { wins: number; draws: number; losses: number };
  };
}

async function fetchApi<T>(endpoint: string, retries = 2, customCacheTTL?: number): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const cacheKey = endpoint;
  const cacheTTL = customCacheTTL ?? CACHE_TTL;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    console.log(`[Football-Data] Cache hit: ${endpoint}`);
    return cached.data as T;
  }

  // Rate limiting - wait if needed
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Football-Data] Rate limiting, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  console.log(`[Football-Data] Fetching: ${url}`);

  const revalidateTime = customCacheTTL ? Math.floor(customCacheTTL / 1000) : 300;
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
    },
    next: { revalidate: revalidateTime },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Football-Data] HTTP Error: ${response.status} - ${errorText}`);

    // Handle rate limiting with retry
    if (response.status === 429 && retries > 0) {
      // Parse wait time from response if available
      let waitTime = 60000; // Default 60 seconds
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message && errorJson.message.includes('Wait')) {
          const match = errorJson.message.match(/Wait (\d+) seconds/);
          if (match) {
            waitTime = (parseInt(match[1]) + 1) * 1000;
          }
        }
      } catch {}

      console.log(`[Football-Data] Rate limited, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchApi<T>(endpoint, retries - 1, customCacheTTL);
    }

    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Football-Data] Success`);

  // Store in cache
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

// Get all matches for a competition (optionally filtered by date range)
export async function getMatches(
  competitionCode: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Match[]> {
  let endpoint = `/competitions/${competitionCode}/matches`;
  const params: string[] = [];

  if (dateFrom) params.push(`dateFrom=${dateFrom}`);
  if (dateTo) params.push(`dateTo=${dateTo}`);

  if (params.length > 0) {
    endpoint += `?${params.join('&')}`;
  }

  const data = await fetchApi<MatchesResponse>(endpoint);
  return data.matches;
}

// Get matches for today
export async function getTodayMatches(competitionCode?: string): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0];

  if (competitionCode) {
    return getMatches(competitionCode, today, today);
  }

  // Get matches from all competitions
  const endpoint = `/matches?date=${today}`;
  const data = await fetchApi<MatchesResponse>(endpoint);
  return data.matches;
}

// Get live matches
export async function getLiveMatches(): Promise<Match[]> {
  const data = await fetchApi<MatchesResponse>('/matches?status=LIVE');
  return data.matches;
}

// Get standings for a competition
export async function getStandings(competitionCode: string): Promise<Standing[]> {
  const data = await fetchApi<StandingsResponse>(`/competitions/${competitionCode}/standings`);

  // Get the TOTAL standings (not home/away splits)
  const totalStandings = data.standings.find(s => s.type === 'TOTAL');
  return totalStandings?.table || [];
}

// Get a single match with details (uses shorter cache for live updates)
export async function getMatch(matchId: number): Promise<MatchResponse> {
  return fetchApi<MatchResponse>(`/matches/${matchId}`, 2, LIVE_CACHE_TTL);
}

// Get head-to-head for a match
export async function getHeadToHead(matchId: number, limit: number = 10): Promise<Match[]> {
  const data = await fetchApi<{ aggregates: object; matches: Match[] }>(
    `/matches/${matchId}/head2head?limit=${limit}`
  );
  return data.matches;
}

// Get a team's recent matches to compute form
export async function getTeamForm(teamId: number, limit: number = 5): Promise<string[]> {
  try {
    const data = await fetchApi<MatchesResponse>(
      `/teams/${teamId}/matches?status=FINISHED&limit=${limit}`
    );

    // Compute form from recent matches (most recent first)
    const form: string[] = [];
    const matches = data.matches.slice(-limit).reverse(); // Get last N matches, most recent first

    for (const match of matches) {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
      const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;

      if (teamScore === null || opponentScore === null) continue;

      if (teamScore > opponentScore) {
        form.push('W');
      } else if (teamScore < opponentScore) {
        form.push('L');
      } else {
        form.push('D');
      }
    }

    return form;
  } catch (error) {
    console.error(`Error fetching form for team ${teamId}:`, error);
    return [];
  }
}

// Team details response type
export interface TeamDetails {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  runningCompetitions: Array<{
    id: number;
    name: string;
    code: string;
    emblem: string;
  }>;
  coach: {
    id: number;
    name: string;
    nationality: string;
  } | null;
  squad: Array<{
    id: number;
    name: string;
    position: string;
    nationality: string;
    shirtNumber?: number;
    dateOfBirth?: string;
  }>;
}

// Get team details
export async function getTeamDetails(teamId: number): Promise<TeamDetails> {
  return fetchApi<TeamDetails>(`/teams/${teamId}`);
}

// Get team's matches (recent and upcoming)
export async function getTeamMatches(teamId: number, status?: 'SCHEDULED' | 'FINISHED', limit: number = 10): Promise<Match[]> {
  let endpoint = `/teams/${teamId}/matches?limit=${limit}`;
  if (status) {
    endpoint += `&status=${status}`;
  }
  const data = await fetchApi<MatchesResponse>(endpoint);
  return data.matches;
}

// Map status codes to display format
export function mapStatus(status: string, minute: number | null): { status: string; time: string } {
  switch (status) {
    case 'FINISHED':
      return { status: 'FT', time: 'FT' };
    case 'IN_PLAY':
      // Determine which half based on minute (if available)
      if (typeof minute === 'number') {
        const half = minute <= 45 ? '1H' : '2H';
        return { status: half, time: `${minute}'` };
      }
      // Minute not available from API - just show LIVE
      return { status: 'LIVE', time: '' };
    case 'PAUSED':
      return { status: 'HT', time: 'HT' };
    case 'SCHEDULED':
    case 'TIMED':
      return { status: 'NS', time: 'NS' };
    case 'POSTPONED':
      return { status: 'PST', time: 'PST' };
    case 'CANCELLED':
      return { status: 'CAN', time: 'CAN' };
    default:
      return { status: status, time: status };
  }
}
