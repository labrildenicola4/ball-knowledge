// API-Football client
// Docs: https://www.api-football.com/documentation-v3

import { LEAGUE_IDS, LEAGUE_ID_TO_KEY } from './constants/leagues';

// Re-export for backward compatibility
export { LEAGUE_IDS, LEAGUE_ID_TO_KEY };

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute for general data
const LIVE_CACHE_TTL = 15 * 1000; // 15 seconds for live data

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

async function fetchApi<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  isLive = false
): Promise<T[]> {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();

  const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const cacheKey = url;
  const cacheTTL = isLive ? LIVE_CACHE_TTL : CACHE_TTL;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    console.log(`[API-Football] Cache hit: ${endpoint}`);
    return cached.data as T[];
  }

  console.log(`[API-Football] Fetching: ${url}`);
  console.log(`[API-Football] Using API key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': API_KEY,
    },
    cache: isLive ? 'no-store' : 'default',
  });

  if (!response.ok) {
    console.error(`[API-Football] HTTP Error: ${response.status}`);
    throw new Error(`API Error: ${response.status}`);
  }

  const data: ApiResponse<T> = await response.json();

  console.log(`[API-Football] Response results: ${data.results}, errors: ${JSON.stringify(data.errors)}`);

  // Check for API errors
  const hasErrors = Array.isArray(data.errors)
    ? data.errors.length > 0
    : Object.keys(data.errors || {}).length > 0;

  if (hasErrors) {
    const errorMsg = JSON.stringify(data.errors);
    console.error(`[API-Football] API Error: ${errorMsg}`);
    throw new Error(`API returned errors: ${errorMsg}`);
  }

  // Cache the response
  cache.set(cacheKey, { data: data.response, timestamp: Date.now() });

  return data.response;
}

// Types
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: Team & { winner: boolean | null };
    away: Team & { winner: boolean | null };
  };
  goals: Goals;
  score: {
    halftime: Goals;
    fulltime: Goals;
    extratime: Goals;
    penalty: Goals;
  };
}

export interface FixtureStatistic {
  team: Team;
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
}

export interface LineupCoach {
  id: number;
  name: string;
  photo: string;
}

export interface FixtureLineup {
  team: Team;
  formation: string;
  startXI: Array<{ player: LineupPlayer }>;
  substitutes: Array<{ player: LineupPlayer }>;
  coach: LineupCoach;
}

export interface StandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: Standing[][];
  };
}

// Helper to get current season year
function getSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // If before August, use previous year as season start
  return month < 7 ? year - 1 : year;
}

// API Functions

export async function getFixturesByDate(date: string, leagueId?: number): Promise<Fixture[]> {
  const params: Record<string, string | number> = { date };
  if (leagueId) {
    params.league = leagueId;
    params.season = getSeason();
  }
  return fetchApi<Fixture>('/fixtures', params);
}

export async function getLiveFixtures(leagueId?: number): Promise<Fixture[]> {
  const params: Record<string, string | number> = { live: 'all' };
  if (leagueId) {
    params.league = leagueId;
  }
  return fetchApi<Fixture>('/fixtures', params, true);
}

export async function getFixture(fixtureId: number): Promise<Fixture | null> {
  const fixtures = await fetchApi<Fixture>('/fixtures', { id: fixtureId }, true);
  return fixtures[0] || null;
}

export async function getFixtureStatistics(fixtureId: number): Promise<FixtureStatistic[]> {
  return fetchApi<FixtureStatistic>('/fixtures/statistics', { fixture: fixtureId }, true);
}

export async function getFixtureLineups(fixtureId: number): Promise<FixtureLineup[]> {
  return fetchApi<FixtureLineup>('/fixtures/lineups', { fixture: fixtureId });
}

// Common team name aliases for better matching
const TEAM_ALIASES: Record<string, string[]> = {
  'barcelona': ['barca', 'fcbarcelona', 'fcb', 'barça'],
  'realmadrid': ['madrid', 'rmadrid', 'real'],
  'atleticomadrid': ['atletico', 'atleti', 'atm', 'atleticodemadrid', 'atléticomadrid', 'atlético'],
  'mallorca': ['realmallorca', 'rcdmallorca'],
  'manchesterunited': ['manutd', 'manunited', 'mufc'],
  'manchestercity': ['mancity', 'mcfc'],
  'bayern': ['bayernmunich', 'bayernmunchen', 'fcbayern'],
  'psg': ['parissaintgermain', 'paris'],
  'juventus': ['juve'],
  'inter': ['intermilan', 'internazionale'],
  'milan': ['acmilan'],
  'realoviedo': ['oviedo'],
  'realsociedad': ['sociedad', 'lasreal'],
  'realbetis': ['betis'],
  'athleticbilbao': ['athletic', 'bilbao'],
  'villarreal': ['villarrealcf', 'yellowsubmarine'],
  'sevilla': ['sevillafc'],
  'valencia': ['valenciacf'],
};

// Find API-Football fixture ID by searching for a match on a specific date
// between two teams (using team names to match)
export async function findFixtureByTeams(
  leagueId: number,
  date: string, // YYYY-MM-DD format
  homeTeamName: string,
  awayTeamName: string
): Promise<number | null> {
  try {
    const fixtures = await fetchApi<Fixture>('/fixtures', {
      league: leagueId,
      date,
      season: getSeason(),
    });

    // Normalize team name for comparison
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

    // Get all possible names for a team (including aliases)
    const getTeamVariants = (name: string): string[] => {
      const norm = normalize(name);
      const variants = [norm];

      // Add aliases
      for (const [key, aliases] of Object.entries(TEAM_ALIASES)) {
        if (norm.includes(key) || aliases.some(a => norm.includes(a))) {
          variants.push(key, ...aliases);
        }
      }

      // Add first word (common for teams like "Real Oviedo" -> "oviedo")
      const words = name.toLowerCase().split(/\s+/);
      if (words.length > 1) {
        variants.push(normalize(words[words.length - 1])); // Last word
        variants.push(normalize(words[0])); // First word
      }

      return Array.from(new Set(variants));
    };

    const homeVariants = getTeamVariants(homeTeamName);
    const awayVariants = getTeamVariants(awayTeamName);

    // Find matching fixture
    const match = fixtures.find((f) => {
      const fHome = normalize(f.teams.home.name);
      const fAway = normalize(f.teams.away.name);
      const fHomeVariants = getTeamVariants(f.teams.home.name);
      const fAwayVariants = getTeamVariants(f.teams.away.name);

      // Check if any variant matches
      const homeMatch = homeVariants.some(h =>
        fHomeVariants.some(fh => fh.includes(h) || h.includes(fh))
      );
      const awayMatch = awayVariants.some(a =>
        fAwayVariants.some(fa => fa.includes(a) || a.includes(fa))
      );

      return homeMatch && awayMatch;
    });

    if (match) {
      console.log(`[API-Football] Found fixture: ${match.teams.home.name} vs ${match.teams.away.name}`);
    }

    return match?.fixture.id || null;
  } catch (error) {
    console.error('[API-Football] Error finding fixture:', error);
    return null;
  }
}

// Find fixture ID with date fallback
async function findFixtureWithFallback(
  leagueId: number,
  date: string,
  homeTeamName: string,
  awayTeamName: string
): Promise<number | null> {
  // Try the exact date first
  let fixtureId = await findFixtureByTeams(leagueId, date, homeTeamName, awayTeamName);

  // If not found, try day before and after (timezone issues)
  if (!fixtureId) {
    const dateObj = new Date(date);

    // Try day before
    const dayBefore = new Date(dateObj);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = dayBefore.toISOString().split('T')[0];
    console.log(`[API-Football] Not found on ${date}, trying ${dayBeforeStr}...`);
    fixtureId = await findFixtureByTeams(leagueId, dayBeforeStr, homeTeamName, awayTeamName);

    // Try day after
    if (!fixtureId) {
      const dayAfter = new Date(dateObj);
      dayAfter.setDate(dayAfter.getDate() + 1);
      const dayAfterStr = dayAfter.toISOString().split('T')[0];
      console.log(`[API-Football] Not found on ${dayBeforeStr}, trying ${dayAfterStr}...`);
      fixtureId = await findFixtureByTeams(leagueId, dayAfterStr, homeTeamName, awayTeamName);
    }
  }

  return fixtureId;
}

// Get lineups by looking up the fixture first
export async function getLineupsForMatch(
  leagueKey: string,
  date: string,
  homeTeamName: string,
  awayTeamName: string
): Promise<FixtureLineup[]> {
  const leagueId = LEAGUE_IDS[leagueKey];
  if (!leagueId) {
    console.log(`[API-Football] Unknown league: ${leagueKey}`);
    return [];
  }

  console.log(`[API-Football] Looking for ${homeTeamName} vs ${awayTeamName} in league ${leagueKey} (${leagueId}) on ${date}`);

  const fixtureId = await findFixtureWithFallback(leagueId, date, homeTeamName, awayTeamName);

  if (!fixtureId) {
    console.log(`[API-Football] Fixture not found for ${homeTeamName} vs ${awayTeamName} around ${date}`);
    return [];
  }

  console.log(`[API-Football] Found fixture ${fixtureId}, fetching lineups...`);
  const lineups = await getFixtureLineups(fixtureId);
  console.log(`[API-Football] Got ${lineups.length} team lineups`);
  return lineups;
}

// Combined data response type
export interface MatchDataFromApiFootball {
  lineups: FixtureLineup[];
  statistics: FixtureStatistic[];
  fixtureId: number | null;
}

// Get both lineups and statistics in one call (more efficient)
export async function getMatchDataForFixture(
  leagueKey: string,
  date: string,
  homeTeamName: string,
  awayTeamName: string
): Promise<MatchDataFromApiFootball> {
  const leagueId = LEAGUE_IDS[leagueKey];
  if (!leagueId) {
    console.log(`[API-Football] Unknown league: ${leagueKey}`);
    return { lineups: [], statistics: [], fixtureId: null };
  }

  console.log(`[API-Football] Looking for ${homeTeamName} vs ${awayTeamName} in league ${leagueKey} (${leagueId}) on ${date}`);

  const fixtureId = await findFixtureWithFallback(leagueId, date, homeTeamName, awayTeamName);

  if (!fixtureId) {
    console.log(`[API-Football] Fixture not found for ${homeTeamName} vs ${awayTeamName} around ${date}`);
    return { lineups: [], statistics: [], fixtureId: null };
  }

  console.log(`[API-Football] Found fixture ${fixtureId}, fetching lineups and statistics...`);

  // Fetch lineups and statistics in parallel
  const [lineups, statistics] = await Promise.all([
    getFixtureLineups(fixtureId).catch((err) => {
      console.error('[API-Football] Error fetching lineups:', err);
      return [];
    }),
    getFixtureStatistics(fixtureId).catch((err) => {
      console.error('[API-Football] Error fetching statistics:', err);
      return [];
    }),
  ]);

  console.log(`[API-Football] Got ${lineups.length} team lineups, ${statistics.length} team stats`);
  return { lineups, statistics, fixtureId };
}

export async function getHeadToHead(
  team1Id: number,
  team2Id: number,
  last: number = 10
): Promise<Fixture[]> {
  return fetchApi<Fixture>('/fixtures/headtohead', {
    h2h: `${team1Id}-${team2Id}`,
    last,
  });
}

export async function getStandings(leagueId: number, season?: number): Promise<Standing[]> {
  const response = await fetchApi<StandingsResponse>('/standings', {
    league: leagueId,
    season: season || getSeason(),
  });
  return response[0]?.league?.standings?.[0] || [];
}

export async function getTeamForm(teamId: number, last: number = 5): Promise<string[]> {
  const fixtures = await fetchApi<Fixture>('/fixtures', {
    team: teamId,
    last,
    status: 'FT',
  });

  return fixtures
    .map((f) => {
      const isHome = f.teams.home.id === teamId;
      const teamGoals = isHome ? f.goals.home : f.goals.away;
      const oppGoals = isHome ? f.goals.away : f.goals.home;

      if (teamGoals === null || oppGoals === null) return 'D';
      if (teamGoals > oppGoals) return 'W';
      if (teamGoals < oppGoals) return 'L';
      return 'D';
    })
    .reverse();
}

// Map API-Football status to our display format
export function mapStatus(
  status: string,
  elapsed: number | null
): { status: string; time: string } {
  switch (status) {
    case 'TBD':
    case 'NS':
      return { status: 'NS', time: 'NS' };
    case '1H':
      return { status: '1H', time: elapsed ? `${elapsed}'` : '1H' };
    case 'HT':
      return { status: 'HT', time: 'HT' };
    case '2H':
      return { status: '2H', time: elapsed ? `${elapsed}'` : '2H' };
    case 'ET':
      return { status: 'ET', time: elapsed ? `${elapsed}'` : 'ET' };
    case 'P':
      return { status: 'PEN', time: 'PEN' };
    case 'FT':
    case 'AET':
    case 'PEN':
      return { status: 'FT', time: 'FT' };
    case 'BT':
      return { status: 'BT', time: 'Break' };
    case 'SUSP':
      return { status: 'SUSP', time: 'SUSP' };
    case 'INT':
      return { status: 'INT', time: 'INT' };
    case 'PST':
      return { status: 'PST', time: 'PST' };
    case 'CANC':
      return { status: 'CAN', time: 'CAN' };
    case 'ABD':
      return { status: 'ABD', time: 'ABD' };
    case 'LIVE':
      return { status: 'LIVE', time: elapsed ? `${elapsed}'` : 'LIVE' };
    default:
      return { status, time: status };
  }
}

// Map fixture statistics to our LiveStats format
export function mapStatistics(
  stats: FixtureStatistic[]
): { all: Array<{ label: string; home: number; away: number; type?: 'decimal' }> } | null {
  if (!stats || stats.length < 2) return null;

  const homeStats = stats[0]?.statistics || [];
  const awayStats = stats[1]?.statistics || [];

  const getStatValue = (
    statistics: typeof homeStats,
    type: string
  ): number => {
    const stat = statistics.find((s) => s.type === type);
    if (!stat || stat.value === null) return 0;
    if (typeof stat.value === 'string') {
      return parseFloat(stat.value.replace('%', '')) || 0;
    }
    return stat.value;
  };

  const statMappings = [
    { apiType: 'expected_goals', label: 'Expected goals (xG)', type: 'decimal' as const },
    { apiType: 'Ball Possession', label: 'Possession %' },
    { apiType: 'Total Shots', label: 'Total shots' },
    { apiType: 'Shots on Goal', label: 'Shots on target' },
    { apiType: 'Shots off Goal', label: 'Shots off target' },
    { apiType: 'Corner Kicks', label: 'Corner kicks' },
    { apiType: 'Fouls', label: 'Fouls' },
    { apiType: 'Yellow Cards', label: 'Yellow cards' },
    { apiType: 'Red Cards', label: 'Red cards' },
    { apiType: 'Offsides', label: 'Offsides' },
    { apiType: 'Goalkeeper Saves', label: 'Saves' },
    { apiType: 'Total passes', label: 'Passes' },
    { apiType: 'Passes accurate', label: 'Accurate passes' },
  ];

  const mappedStats = statMappings
    .map((mapping) => ({
      label: mapping.label,
      home: getStatValue(homeStats, mapping.apiType),
      away: getStatValue(awayStats, mapping.apiType),
      ...(mapping.type && { type: mapping.type }),
    }))
    .filter((s) => s.home !== 0 || s.away !== 0);

  if (mappedStats.length === 0) return null;

  return { all: mappedStats };
}

// Extract matchday/round number from round string
export function parseRound(round: string): number {
  const match = round.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

// Team-related types
export interface TeamInfo {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
  };
}

export interface SquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string;
  photo: string;
}

export interface TeamSquad {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: SquadPlayer[];
}

// Get team info
export async function getTeamInfo(teamId: number): Promise<TeamInfo | null> {
  const teams = await fetchApi<TeamInfo>('/teams', { id: teamId });
  return teams[0] || null;
}

// Get team squad
export async function getTeamSquad(teamId: number): Promise<SquadPlayer[]> {
  const squads = await fetchApi<TeamSquad>('/players/squads', { team: teamId });
  return squads[0]?.players || [];
}

// Get team fixtures (past and upcoming)
export async function getTeamFixtures(
  teamId: number,
  season?: number,
  last?: number,
  next?: number
): Promise<Fixture[]> {
  const params: Record<string, string | number> = { team: teamId };
  if (season) params.season = season;
  if (last) params.last = last;
  if (next) params.next = next;
  return fetchApi<Fixture>('/fixtures', params);
}

// Get team statistics for a league/season
export interface TeamStatistics {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number } };
    against: { total: { home: number; away: number; total: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  biggest: {
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
  };
}

export async function getTeamStatistics(
  teamId: number,
  leagueId: number,
  season?: number
): Promise<TeamStatistics | null> {
  const params: Record<string, string | number> = {
    team: teamId,
    league: leagueId,
    season: season || getSeason(),
  };
  const stats = await fetchApi<TeamStatistics>('/teams/statistics', params);
  return stats[0] || null;
}

// Get all leagues a team participates in
export interface TeamLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

export async function getTeamLeagues(teamId: number): Promise<TeamLeague[]> {
  return fetchApi<TeamLeague>('/leagues', { team: teamId });
}

// Player statistics with season data
export interface PlayerWithStats {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; season: number };
    games: {
      appearances: number | null;
      lineups: number | null;
      minutes: number | null;
      position: string | null;
      number: number | null;
    };
    substitutes: { in: number | null; out: number | null; bench: number | null };
    shots: { total: number | null; on: number | null };
    goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null; past: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number | null; yellowred: number | null; red: number | null };
    penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
  }>;
}

// Get all players with statistics for a team in a season (handles pagination)
export async function getTeamPlayers(
  teamId: number,
  season?: number
): Promise<PlayerWithStats[]> {
  const allPlayers: PlayerWithStats[] = [];
  let currentPage = 1;
  let totalPages = 1;
  const seasonYear = season || getSeason();

  do {
    const queryString = new URLSearchParams({
      team: String(teamId),
      season: String(seasonYear),
      page: String(currentPage),
    }).toString();

    const url = `${API_BASE}/players?${queryString}`;
    const cacheKey = url;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[API-Football] Cache hit: /players page ${currentPage}`);
      const cachedData = cached.data as { response: PlayerWithStats[]; paging: { total: number } };
      allPlayers.push(...cachedData.response);
      totalPages = cachedData.paging.total;
    } else {
      console.log(`[API-Football] Fetching: ${url}`);

      const response = await fetch(url, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });

      if (!response.ok) {
        console.error(`[API-Football] HTTP Error: ${response.status}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      const hasErrors = Array.isArray(data.errors)
        ? data.errors.length > 0
        : Object.keys(data.errors || {}).length > 0;

      if (hasErrors) {
        console.error(`[API-Football] API Error: ${JSON.stringify(data.errors)}`);
        break;
      }

      console.log(`[API-Football] Players page ${currentPage}/${data.paging.total}, got ${data.results} players`);

      // Cache this page
      cache.set(cacheKey, { data: { response: data.response, paging: data.paging }, timestamp: Date.now() });

      allPlayers.push(...data.response);
      totalPages = data.paging.total;
    }

    currentPage++;
  } while (currentPage <= totalPages);

  console.log(`[API-Football] Total players fetched: ${allPlayers.length}`);
  return allPlayers;
}

// Coach types
export interface Coach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  photo: string;
  career: {
    team: { id: number; name: string; logo: string };
    start: string;
    end: string | null;
  }[];
}

// Get current coach for a team
export async function getTeamCoach(teamId: number): Promise<Coach | null> {
  const coaches = await fetchApi<Coach>('/coachs', { team: teamId });
  // Return the coach with a current position (end is null)
  const currentCoach = coaches.find(c => c.career.some(job => job.team.id === teamId && job.end === null));
  return currentCoach || coaches[0] || null;
}

// Trophy types
export interface Trophy {
  league: string;
  country: string;
  season: string;
  place: string;
}

// Get trophies for a team (via coach - API-Football doesn't have team trophies directly)
// This returns trophies won by the team through its players/coaches
export async function getTeamTrophies(teamId: number): Promise<{ name: string; count: number }[]> {
  // API-Football doesn't have a direct team trophies endpoint
  // We'll need to aggregate from available data or use a static mapping
  // For now, return empty - this would need a different data source
  return [];
}

// Top Scorers types
export interface TopScorer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; season: number };
    games: {
      appearances: number | null;
      lineups: number | null;
      minutes: number | null;
      position: string | null;
    };
    goals: { total: number | null; assists: number | null };
    penalty: { scored: number | null; missed: number | null };
  }>;
}

// Get top scorers for a league
export async function getTopScorers(leagueId: number, season?: number): Promise<TopScorer[]> {
  return fetchApi<TopScorer>('/players/topscorers', {
    league: leagueId,
    season: season || getSeason(),
  });
}

// Get top assists for a league
export async function getTopAssists(leagueId: number, season?: number): Promise<TopScorer[]> {
  return fetchApi<TopScorer>('/players/topassists', {
    league: leagueId,
    season: season || getSeason(),
  });
}

// Get top yellow cards for a league
export async function getTopYellowCards(leagueId: number, season?: number): Promise<PlayerWithStats[]> {
  return fetchApi<PlayerWithStats>('/players/topyellowcards', {
    league: leagueId,
    season: season || getSeason(),
  });
}

// Get top red cards for a league
export async function getTopRedCards(leagueId: number, season?: number): Promise<PlayerWithStats[]> {
  return fetchApi<PlayerWithStats>('/players/topredcards', {
    league: leagueId,
    season: season || getSeason(),
  });
}

// Get all players with statistics for a league (handles pagination)
export async function getLeaguePlayers(
  leagueId: number,
  season?: number,
  maxPages: number = 10 // Limit pages to avoid too many API calls
): Promise<PlayerWithStats[]> {
  const allPlayers: PlayerWithStats[] = [];
  let currentPage = 1;
  let totalPages = 1;
  const seasonYear = season || getSeason();

  do {
    const queryString = new URLSearchParams({
      league: String(leagueId),
      season: String(seasonYear),
      page: String(currentPage),
    }).toString();

    const url = `${API_BASE}/players?${queryString}`;
    const cacheKey = url;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[API-Football] Cache hit: /players (league) page ${currentPage}`);
      const cachedData = cached.data as { response: PlayerWithStats[]; paging: { total: number } };
      allPlayers.push(...cachedData.response);
      totalPages = Math.min(cachedData.paging.total, maxPages);
    } else {
      console.log(`[API-Football] Fetching: ${url}`);

      const response = await fetch(url, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });

      if (!response.ok) {
        console.error(`[API-Football] HTTP Error: ${response.status}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      const hasErrors = Array.isArray(data.errors)
        ? data.errors.length > 0
        : Object.keys(data.errors || {}).length > 0;
      if (hasErrors) {
        console.error('[API-Football] API returned errors:', data.errors);
        break;
      }

      // Cache the response
      cache.set(cacheKey, { data, timestamp: Date.now() });

      allPlayers.push(...(data.response || []));
      totalPages = Math.min(data.paging?.total || 1, maxPages);
    }

    currentPage++;
  } while (currentPage <= totalPages);

  console.log(`[API-Football] Fetched ${allPlayers.length} players for league ${leagueId}`);
  return allPlayers;
}

// Get team statistics for all teams in a league
export async function getLeagueTeamStatistics(
  leagueId: number,
  teamIds: number[],
  season?: number
): Promise<TeamStatistics[]> {
  const seasonYear = season || getSeason();
  const results: TeamStatistics[] = [];

  // Fetch in batches of 5 to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < teamIds.length; i += batchSize) {
    const batch = teamIds.slice(i, i + batchSize);
    const promises = batch.map(teamId =>
      getTeamStatistics(teamId, leagueId, seasonYear).catch(err => {
        console.error(`[API-Football] Failed to fetch stats for team ${teamId}:`, err);
        return null;
      })
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter((r): r is TeamStatistics => r !== null));
  }

  return results;
}

// Get league fixtures (upcoming and recent)
export async function getLeagueFixtures(
  leagueId: number,
  options?: {
    next?: number;
    last?: number;
    from?: string;
    to?: string;
    round?: string;
  }
): Promise<Fixture[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season: getSeason(),
  };

  if (options?.next) params.next = options.next;
  if (options?.last) params.last = options.last;
  if (options?.from) params.from = options.from;
  if (options?.to) params.to = options.to;
  if (options?.round) params.round = options.round;

  return fetchApi<Fixture>('/fixtures', params);
}
