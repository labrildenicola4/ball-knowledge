// College Football Playoff Bracket API functions
import { getCurrentCFBSeason, getCFPDateRanges } from './espn-season-utils';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

// Simple cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

async function fetchESPN<T>(url: string): Promise<T> {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  console.log(`[ESPN-CFB-Bracket] Fetching: ${url}`);
  const response = await fetch(url, { next: { revalidate: 60 } });

  if (!response.ok) {
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data as T;
}

export interface CFBBracketTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  seed?: number;
  score?: number;
  isWinner?: boolean;
}

export interface CFBBracketGame {
  id: string;
  homeTeam: CFBBracketTeam;
  awayTeam: CFBBracketTeam;
  status: 'scheduled' | 'in_progress' | 'final';
  venue?: string;
  date?: string;
  time?: string;
  broadcast?: string;
  bowlName?: string;
}

export interface CFBPlayoffBracket {
  season: string;
  firstRound: CFBBracketGame[];
  quarterfinals: CFBBracketGame[];
  semifinals: CFBBracketGame[];
  championship: CFBBracketGame | null;
}

// Game status mapping
const STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final'> = {
  'STATUS_SCHEDULED': 'scheduled',
  'STATUS_IN_PROGRESS': 'in_progress',
  'STATUS_HALFTIME': 'in_progress',
  'STATUS_END_PERIOD': 'in_progress',
  'STATUS_FINAL': 'final',
  'STATUS_FINAL_OT': 'final',
  'STATUS_POSTPONED': 'scheduled',
  'STATUS_CANCELED': 'final',
  'STATUS_DELAYED': 'scheduled',
};

// CFP Round names
const CFP_ROUND_NAMES: Record<string, string> = {
  'FIRST_ROUND': 'First Round',
  'QUARTERFINAL': 'Quarterfinal',
  'SEMIFINAL': 'Semifinal',
  'CHAMPIONSHIP': 'Championship',
};

function transformToBracketGame(event: any): CFBBracketGame & { round: string } {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away')!;

  const status = STATUS_MAP[event.status?.type?.name] || 'scheduled';
  const isFinal = status === 'final';

  const homeScore = homeCompetitor.score !== undefined ? parseInt(homeCompetitor.score) : undefined;
  const awayScore = awayCompetitor.score !== undefined ? parseInt(awayCompetitor.score) : undefined;

  // Get seed from curatedRank
  const getTeamSeed = (competitor: any) => {
    return competitor.curatedRank?.current || competitor.seed;
  };

  const homeTeam: CFBBracketTeam = {
    id: homeCompetitor.team.id,
    name: homeCompetitor.team.shortDisplayName || homeCompetitor.team.name,
    abbreviation: homeCompetitor.team.abbreviation || '',
    logo: homeCompetitor.team.logo || homeCompetitor.team.logos?.[0]?.href || '',
    seed: getTeamSeed(homeCompetitor),
    score: homeScore,
    isWinner: isFinal && homeScore !== undefined && awayScore !== undefined && homeScore > awayScore,
  };

  const awayTeam: CFBBracketTeam = {
    id: awayCompetitor.team.id,
    name: awayCompetitor.team.shortDisplayName || awayCompetitor.team.name,
    abbreviation: awayCompetitor.team.abbreviation || '',
    logo: awayCompetitor.team.logo || awayCompetitor.team.logos?.[0]?.href || '',
    seed: getTeamSeed(awayCompetitor),
    score: awayScore,
    isWinner: isFinal && awayScore !== undefined && homeScore !== undefined && awayScore > homeScore,
  };

  // Determine round from event notes or name
  let round = 'UNKNOWN';
  const name = (event.name || '').toLowerCase();
  const notes = event.notes?.find((n: any) => n.type === 'event')?.headline?.toLowerCase() || '';

  if (name.includes('championship') || notes.includes('championship')) {
    round = 'CHAMPIONSHIP';
  } else if (name.includes('semifinal') || notes.includes('semifinal')) {
    round = 'SEMIFINAL';
  } else if (name.includes('quarterfinal') || notes.includes('quarterfinal')) {
    round = 'QUARTERFINAL';
  } else if (name.includes('first round') || notes.includes('first round')) {
    round = 'FIRST_ROUND';
  }

  // Bowl name from event name
  const bowlName = event.shortName || event.name || '';

  return {
    id: event.id,
    homeTeam,
    awayTeam,
    status,
    venue: competition.venue?.fullName,
    date: new Date(event.date).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: new Date(event.date).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }),
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    bowlName,
    round,
  };
}

export async function getCFBPlayoffBracket(): Promise<CFBPlayoffBracket> {
  try {
    // Fetch CFP games by date ranges (seasontype=3 alone doesn't return all games)
    const season = getCurrentCFBSeason();
    const cfpDates = getCFPDateRanges(season);

    const [firstRoundData, quarterfinalsData, semifinalsData, championshipData] = await Promise.all([
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=${cfpDates.firstRound}`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=${cfpDates.quarterfinals}`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=${cfpDates.semifinals}`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=${cfpDates.championship}`),
    ]);

    // Combine all events
    const allEvents = [
      ...(firstRoundData.events || []).map((e: any) => ({ ...e, cfpRound: 'FIRST_ROUND' })),
      ...(quarterfinalsData.events || []).map((e: any) => ({ ...e, cfpRound: 'QUARTERFINAL' })),
      ...(semifinalsData.events || []).map((e: any) => ({ ...e, cfpRound: 'SEMIFINAL' })),
      ...(championshipData.events || []).map((e: any) => ({ ...e, cfpRound: 'CHAMPIONSHIP' })),
    ];

    // Dedupe by game ID
    const eventMap = new Map();
    allEvents.forEach(event => eventMap.set(event.id, event));
    const playoffData = { events: Array.from(eventMap.values()) };

    // Transform games - use the cfpRound we tagged during fetch
    const allGames = (playoffData.events || []).map((event: any) => {
      const game = transformToBracketGame(event);
      return { ...game, cfpRound: event.cfpRound };
    });

    // Organize by round using the tagged cfpRound
    const firstRound = allGames.filter((g: any) => g.cfpRound === 'FIRST_ROUND');
    const quarterfinals = allGames.filter((g: any) => g.cfpRound === 'QUARTERFINAL');
    const semifinals = allGames.filter((g: any) => g.cfpRound === 'SEMIFINAL');
    const championshipGame = allGames.find((g: any) => g.cfpRound === 'CHAMPIONSHIP') || null;

    return {
      season: String(getCurrentCFBSeason()),
      firstRound,
      quarterfinals,
      semifinals,
      championship: championshipGame,
    };
  } catch (error) {
    console.error('[ESPN-CFB-Bracket] Failed to fetch playoff bracket:', error);
    return {
      season: String(getCurrentCFBSeason()),
      firstRound: [],
      quarterfinals: [],
      semifinals: [],
      championship: null,
    };
  }
}
