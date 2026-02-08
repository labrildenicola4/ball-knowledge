// NFL Playoff Bracket API functions
import { NFLGame } from './types/nfl';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/football/nfl';

// Simple cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

async function fetchESPN<T>(url: string): Promise<T> {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  console.log(`[ESPN-NFL-Bracket] Fetching: ${url}`);
  const response = await fetch(url, { next: { revalidate: 60 } });

  if (!response.ok) {
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data as T;
}

// Team division info for determining conference
const TEAM_CONFERENCE: Record<string, 'AFC' | 'NFC'> = {
  // AFC teams
  '2': 'AFC', '15': 'AFC', '17': 'AFC', '20': 'AFC', // East
  '33': 'AFC', '4': 'AFC', '5': 'AFC', '23': 'AFC', // North
  '34': 'AFC', '11': 'AFC', '30': 'AFC', '10': 'AFC', // South
  '7': 'AFC', '12': 'AFC', '13': 'AFC', '24': 'AFC', // West
  // NFC teams
  '6': 'NFC', '19': 'NFC', '21': 'NFC', '28': 'NFC', // East
  '3': 'NFC', '8': 'NFC', '9': 'NFC', '16': 'NFC', // North
  '1': 'NFC', '29': 'NFC', '18': 'NFC', '27': 'NFC', // South
  '22': 'NFC', '14': 'NFC', '25': 'NFC', '26': 'NFC', // West
};

export interface BracketTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  seed?: number;
  score?: number;
  isWinner?: boolean;
}

export interface BracketGame {
  id: string;
  homeTeam: BracketTeam;
  awayTeam: BracketTeam;
  status: 'scheduled' | 'in_progress' | 'final';
  venue?: string;
  date?: string;
  time?: string;
  broadcast?: string;
}

export interface NFLPlayoffBracket {
  season: string;
  afc: {
    wildCard: BracketGame[];
    divisional: BracketGame[];
    championship: BracketGame | null;
  };
  nfc: {
    wildCard: BracketGame[];
    divisional: BracketGame[];
    championship: BracketGame | null;
  };
  superBowl: BracketGame | null;
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

function transformToBracketGame(event: any, seedLookup: Map<string, number>): BracketGame & { conference: 'AFC' | 'NFC' | 'SUPER_BOWL'; round: number } {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away')!;

  const status = STATUS_MAP[event.status?.type?.name] || 'scheduled';
  const isFinal = status === 'final';

  const homeScore = homeCompetitor.score !== undefined ? parseInt(homeCompetitor.score) : undefined;
  const awayScore = awayCompetitor.score !== undefined ? parseInt(awayCompetitor.score) : undefined;

  // Get seed from lookup table (from standings)
  const homeSeed = seedLookup.get(homeCompetitor.team.id) || homeCompetitor.curatedRank?.current || homeCompetitor.seed;
  const awaySeed = seedLookup.get(awayCompetitor.team.id) || awayCompetitor.curatedRank?.current || awayCompetitor.seed;

  const homeTeam: BracketTeam = {
    id: homeCompetitor.team.id,
    name: homeCompetitor.team.shortDisplayName || homeCompetitor.team.name,
    abbreviation: homeCompetitor.team.abbreviation || '',
    logo: homeCompetitor.team.logo || homeCompetitor.team.logos?.[0]?.href || '',
    seed: homeSeed,
    score: homeScore,
    isWinner: isFinal && homeScore !== undefined && awayScore !== undefined && homeScore > awayScore,
  };

  const awayTeam: BracketTeam = {
    id: awayCompetitor.team.id,
    name: awayCompetitor.team.shortDisplayName || awayCompetitor.team.name,
    abbreviation: awayCompetitor.team.abbreviation || '',
    logo: awayCompetitor.team.logo || awayCompetitor.team.logos?.[0]?.href || '',
    seed: awaySeed,
    score: awayScore,
    isWinner: isFinal && awayScore !== undefined && homeScore !== undefined && awayScore > homeScore,
  };

  // Determine conference based on teams
  const homeConf = TEAM_CONFERENCE[homeTeam.id];
  const awayConf = TEAM_CONFERENCE[awayTeam.id];
  const round = event.week?.number || 0;

  // Super Bowl is when teams from different conferences play
  const conference = homeConf !== awayConf ? 'SUPER_BOWL' : (homeConf || 'AFC');

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
    conference,
    round,
  };
}

// Fetch playoff seeds from standings
async function getPlayoffSeeds(): Promise<Map<string, number>> {
  const seedLookup = new Map<string, number>();

  try {
    const standingsData = await fetchESPN<any>(`${API_V2_BASE}/standings`);

    // Process both conferences
    standingsData.children?.forEach((conf: any) => {
      conf.standings?.entries?.forEach((entry: any) => {
        const teamId = entry.team?.id;
        const seedStat = entry.stats?.find((s: any) => s.name === 'playoffSeed' || s.type === 'playoffseed');
        if (teamId && seedStat?.value) {
          seedLookup.set(teamId, Math.floor(seedStat.value));
        }
      });
    });
  } catch (error) {
    console.error('[ESPN-NFL-Bracket] Failed to fetch standings for seeds:', error);
  }

  return seedLookup;
}

export async function getNFLPlayoffBracket(): Promise<NFLPlayoffBracket> {
  try {
    // Fetch playoff games by date ranges and standings for seeds in parallel
    // 2025-26 NFL Playoff dates:
    // - Wild Card: Jan 11-13, 2026
    // - Divisional: Jan 17-18, 2026
    // - Conference Championships: Jan 25, 2026
    // - Pro Bowl: Feb 2, 2026
    // - Super Bowl: Feb 8, 2026
    const [wildCardData, divisionalData, confChampData, superBowlData, seedLookup] = await Promise.all([
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=20260111-20260113`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=20260117-20260118`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=20260125`),
      fetchESPN<any>(`${API_BASE}/scoreboard?dates=20260208`),
      getPlayoffSeeds(),
    ]);

    // Combine all events
    const allEvents = [
      ...(wildCardData.events || []),
      ...(divisionalData.events || []),
      ...(confChampData.events || []),
      ...(superBowlData.events || []),
    ];

    // Dedupe by game ID
    const eventMap = new Map();
    allEvents.forEach(event => eventMap.set(event.id, event));
    const uniqueEvents = Array.from(eventMap.values());

    // Transform and categorize games
    const games = uniqueEvents.map(event => transformToBracketGame(event, seedLookup));

    // Organize by conference and round
    const afc = {
      wildCard: games.filter(g => g.conference === 'AFC' && g.round === 1),
      divisional: games.filter(g => g.conference === 'AFC' && g.round === 2),
      championship: games.find(g => g.conference === 'AFC' && g.round === 3) || null,
    };

    const nfc = {
      wildCard: games.filter(g => g.conference === 'NFC' && g.round === 1),
      divisional: games.filter(g => g.conference === 'NFC' && g.round === 2),
      championship: games.find(g => g.conference === 'NFC' && g.round === 3) || null,
    };

    const superBowl = games.find(g => g.conference === 'SUPER_BOWL' || g.round === 5) || null;

    return {
      season: '2025',
      afc,
      nfc,
      superBowl,
    };
  } catch (error) {
    console.error('[ESPN-NFL-Bracket] Failed to fetch playoff bracket:', error);
    return {
      season: '2025',
      afc: { wildCard: [], divisional: [], championship: null },
      nfc: { wildCard: [], divisional: [], championship: null },
      superBowl: null,
    };
  }
}
