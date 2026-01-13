// API-Football client
// Docs: https://www.api-football.com/documentation-v3

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  response: T;
}

async function fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data: ApiResponse<T> = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
  }

  return data.response;
}

// League IDs for top 5 European leagues
export const LEAGUE_IDS = {
  laliga: 140,
  premier: 39,
  seriea: 135,
  bundesliga: 78,
  ligue1: 61,
} as const;

// Current season
export const CURRENT_SEASON = 2024;

// Types from API-Football
export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: {
      name: string;
      city: string;
    };
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    round: string;
  };
  teams: {
    home: ApiTeam & { winner: boolean | null };
    away: ApiTeam & { winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiStanding {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: ApiTeam;
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

export interface ApiLineup {
  team: ApiTeam;
  formation: string;
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
  coach: { id: number; name: string };
}

// API Functions

export async function getFixtures(leagueId: number, date?: string) {
  const params: Record<string, string> = {
    league: leagueId.toString(),
    season: CURRENT_SEASON.toString(),
  };
  
  if (date) {
    params.date = date;
  }

  return fetchApi<ApiFixture[]>('/fixtures', params);
}

export async function getFixturesByRound(leagueId: number, round: string) {
  return fetchApi<ApiFixture[]>('/fixtures', {
    league: leagueId.toString(),
    season: CURRENT_SEASON.toString(),
    round,
  });
}

export async function getLiveFixtures(leagueId?: number) {
  const params: Record<string, string> = { live: 'all' };
  if (leagueId) {
    params.league = leagueId.toString();
  }
  return fetchApi<ApiFixture[]>('/fixtures', params);
}

export async function getStandings(leagueId: number) {
  const data = await fetchApi<Array<{ league: { standings: ApiStanding[][] } }>>('/standings', {
    league: leagueId.toString(),
    season: CURRENT_SEASON.toString(),
  });
  
  return data[0]?.league?.standings[0] || [];
}

export async function getFixtureEvents(fixtureId: number) {
  return fetchApi<ApiEvent[]>('/fixtures/events', {
    fixture: fixtureId.toString(),
  });
}

export async function getFixtureLineups(fixtureId: number) {
  return fetchApi<ApiLineup[]>('/fixtures/lineups', {
    fixture: fixtureId.toString(),
  });
}

export async function getFixtureStats(fixtureId: number) {
  return fetchApi<Array<{
    team: ApiTeam;
    statistics: Array<{ type: string; value: number | string | null }>;
  }>>('/fixtures/statistics', {
    fixture: fixtureId.toString(),
  });
}

export async function getHeadToHead(team1Id: number, team2Id: number, last: number = 10) {
  return fetchApi<ApiFixture[]>('/fixtures/headtohead', {
    h2h: `${team1Id}-${team2Id}`,
    last: last.toString(),
  });
}

export async function getTeam(teamId: number) {
  const data = await fetchApi<Array<{ team: ApiTeam }>>('/teams', {
    id: teamId.toString(),
  });
  return data[0]?.team;
}
