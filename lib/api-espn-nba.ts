// ESPN API client for NBA
// No authentication required - public endpoints

import { BasketballGame, BasketballTeam, BasketballBoxScore, BasketballPlayerStats, BasketballTeamStats } from './types/basketball';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

// Game status mapping
const GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final'> = {
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

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute for general data
const LIVE_CACHE_TTL = 15 * 1000; // 15 seconds for live data

async function fetchESPN<T>(url: string, isLive = false): Promise<T> {
  const cacheKey = url;
  const cacheTTL = isLive ? LIVE_CACHE_TTL : CACHE_TTL;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    console.log(`[ESPN-NBA] Cache hit: ${url.substring(0, 80)}...`);
    return cached.data as T;
  }

  console.log(`[ESPN-NBA] Fetching: ${url}`);

  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
  });

  if (!response.ok) {
    console.error(`[ESPN-NBA] HTTP Error: ${response.status}`);
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data as T;
}

// Transform ESPN team data to our format
function transformTeam(competitor: ESPNCompetitor): BasketballTeam {
  const team = competitor.team;
  const name = team.name || team.displayName || 'Unknown';

  return {
    id: team.id,
    name,
    abbreviation: team.abbreviation || team.shortDisplayName || name.substring(0, 3).toUpperCase(),
    displayName: team.displayName || name,
    shortDisplayName: team.shortDisplayName || name,
    logo: team.logo || team.logos?.[0]?.href || '',
    color: team.color,
    alternateColor: team.alternateColor,
    record: competitor.records?.[0]?.summary,
    score: competitor.score !== undefined ? parseInt(competitor.score) : undefined,
  };
}

// Transform ESPN game to our format
function transformGame(event: ESPNEvent): BasketballGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const status = GAME_STATUS_MAP[event.status.type.name] || 'scheduled';

  return {
    id: event.id,
    status,
    statusDetail: event.status.type.shortDetail || event.status.type.detail,
    period: event.status.period || 0,
    clock: event.status.displayClock || '',
    homeTeam: transformTeam(homeCompetitor),
    awayTeam: transformTeam(awayCompetitor),
    venue: competition.venue?.fullName,
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    date: new Date(event.date).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    startTime: new Date(event.date).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }),
    conferenceGame: false,
    neutralSite: competition.neutralSite || false,
    conference: 'NBA',
  };
}

// Get games for a specific date
export async function getNBAGames(date?: string): Promise<BasketballGame[]> {
  let url = `${API_BASE}/scoreboard?limit=100`;

  if (date) {
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<ESPNScoreboardResponse>(url, !date);
  return data.events?.map(transformGame) || [];
}

// Get live games only
export async function getLiveNBAGames(): Promise<BasketballGame[]> {
  const games = await getNBAGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get game summary/details with box score
export async function getNBAGameSummary(gameId: string): Promise<{
  game: BasketballGame;
  boxScore: BasketballBoxScore | null;
  lastPlay?: string;
}> {
  const url = `${API_BASE}/summary?event=${gameId}`;
  const data = await fetchESPN<ESPNGameSummary>(url, true);

  const event = data.header.competitions[0];
  const homeCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'home')!;
  const awayCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'away')!;

  const statusName = data.header.competitions[0].status?.type?.name;
  const status = (statusName && GAME_STATUS_MAP[statusName]) || 'scheduled';

  const game: BasketballGame = {
    id: gameId,
    status,
    statusDetail: data.header.competitions[0].status?.type?.shortDetail || '',
    period: data.header.competitions[0].status?.period || 0,
    clock: data.header.competitions[0].status?.displayClock || '',
    homeTeam: transformTeam(homeCompetitor),
    awayTeam: transformTeam(awayCompetitor),
    venue: data.gameInfo?.venue?.fullName,
    broadcast: event.broadcasts?.[0]?.names?.[0],
    date: new Date(data.header.competitions[0].date).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    startTime: new Date(data.header.competitions[0].date).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }),
    conferenceGame: false,
    neutralSite: event.neutralSite || false,
    conference: 'NBA',
  };

  // Transform box score if available
  let boxScore: BasketballBoxScore | null = null;

  if (data.boxscore?.players && data.boxscore.players.length >= 2) {
    const homeBox = data.boxscore.players.find((p: ESPNBoxscoreTeam) =>
      p.team?.id === homeCompetitor.team.id
    ) || data.boxscore.players[0];
    const awayBox = data.boxscore.players.find((p: ESPNBoxscoreTeam) =>
      p.team?.id === awayCompetitor.team.id
    ) || data.boxscore.players[1];

    const transformPlayerStats = (player: ESPNPlayer, stats: ESPNPlayerStats): BasketballPlayerStats => {
      const getStatValue = (abbrev: string) => {
        const idx = stats.labels?.indexOf(abbrev) ?? -1;
        return idx >= 0 ? stats.stats[idx] : '0';
      };

      return {
        id: player.id,
        name: player.displayName,
        jersey: player.jersey || '',
        position: player.position?.abbreviation || '',
        starter: stats.starter || false,
        minutes: getStatValue('MIN'),
        points: parseInt(getStatValue('PTS')) || 0,
        rebounds: parseInt(getStatValue('REB')) || 0,
        assists: parseInt(getStatValue('AST')) || 0,
        steals: parseInt(getStatValue('STL')) || 0,
        blocks: parseInt(getStatValue('BLK')) || 0,
        turnovers: parseInt(getStatValue('TO')) || 0,
        fouls: parseInt(getStatValue('PF')) || 0,
        fieldGoalsMade: parseInt(getStatValue('FG')?.split('-')[0]) || 0,
        fieldGoalsAttempted: parseInt(getStatValue('FG')?.split('-')[1]) || 0,
        fieldGoalPct: getStatValue('FG%') || '0.0',
        threePointMade: parseInt(getStatValue('3PT')?.split('-')[0]) || 0,
        threePointAttempted: parseInt(getStatValue('3PT')?.split('-')[1]) || 0,
        threePointPct: getStatValue('3P%') || '0.0',
        freeThrowsMade: parseInt(getStatValue('FT')?.split('-')[0]) || 0,
        freeThrowsAttempted: parseInt(getStatValue('FT')?.split('-')[1]) || 0,
        freeThrowPct: getStatValue('FT%') || '0.0',
      };
    };

    const extractPlayers = (boxTeam: ESPNBoxscoreTeam): BasketballPlayerStats[] => {
      const players: BasketballPlayerStats[] = [];
      boxTeam.statistics?.forEach(statGroup => {
        statGroup.athletes?.forEach(athlete => {
          players.push(transformPlayerStats(athlete.athlete, {
            ...athlete,
            labels: statGroup.labels
          }));
        });
      });
      return players;
    };

    const extractTeamStats = (teamData: ESPNBoxscoreTeamStats | undefined): BasketballTeamStats => {
      const getStat = (name: string) => {
        const stat = teamData?.statistics?.find((s: ESPNStatItem) => s.name === name || s.label === name);
        return stat?.displayValue || '0';
      };

      return {
        fieldGoalPct: getStat('fieldGoalPct') || getStat('Field Goal %'),
        threePointPct: getStat('threePointFieldGoalPct') || getStat('3-Point %'),
        freeThrowPct: getStat('freeThrowPct') || getStat('Free Throw %'),
        rebounds: parseInt(getStat('rebounds') || getStat('Total Rebounds')) || 0,
        offensiveRebounds: parseInt(getStat('offensiveRebounds') || getStat('Offensive Rebounds')) || 0,
        defensiveRebounds: parseInt(getStat('defensiveRebounds') || getStat('Defensive Rebounds')) || 0,
        assists: parseInt(getStat('assists') || getStat('Assists')) || 0,
        steals: parseInt(getStat('steals') || getStat('Steals')) || 0,
        blocks: parseInt(getStat('blocks') || getStat('Blocks')) || 0,
        turnovers: parseInt(getStat('turnovers') || getStat('Turnovers')) || 0,
        fouls: parseInt(getStat('fouls') || getStat('Fouls')) || 0,
        points: parseInt(getStat('points')) || game.homeTeam.score || 0,
      };
    };

    const homeTeamStats = data.boxscore.teams?.find((t: ESPNBoxscoreTeamStats) =>
      t.team?.id === homeCompetitor.team.id
    );
    const awayTeamStats = data.boxscore.teams?.find((t: ESPNBoxscoreTeamStats) =>
      t.team?.id === awayCompetitor.team.id
    );

    boxScore = {
      homeTeam: {
        team: game.homeTeam,
        players: extractPlayers(homeBox),
        stats: extractTeamStats(homeTeamStats),
      },
      awayTeam: {
        team: game.awayTeam,
        players: extractPlayers(awayBox),
        stats: extractTeamStats(awayTeamStats),
      },
    };
  }

  return {
    game,
    boxScore,
    lastPlay: data.plays?.[data.plays.length - 1]?.text,
  };
}

// ESPN API Response Types
interface ESPNTeamBase {
  id: string;
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
  logos?: Array<{ href: string }>;
  color?: string;
  alternateColor?: string;
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: ESPNTeamBase;
  score?: string;
  records?: Array<{ summary: string }>;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: { name: string; shortDetail: string; detail: string };
    period?: number;
    displayClock?: string;
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    venue?: { fullName: string };
    broadcasts?: Array<{ names: string[] }>;
    neutralSite?: boolean;
  }>;
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

interface ESPNPlayer {
  id: string;
  displayName: string;
  jersey?: string;
  position?: { abbreviation: string };
}

interface ESPNPlayerStats {
  stats: string[];
  labels?: string[];
  starter?: boolean;
}

interface ESPNStatItem {
  name?: string;
  label?: string;
  displayValue?: string;
}

interface ESPNBoxscoreTeam {
  team?: ESPNTeamBase;
  statistics?: Array<{
    labels?: string[];
    athletes?: Array<{
      athlete: ESPNPlayer;
      stats: string[];
      starter?: boolean;
    }>;
  }>;
}

interface ESPNBoxscoreTeamStats {
  team?: ESPNTeamBase;
  statistics?: ESPNStatItem[];
}

interface ESPNGameSummary {
  header: {
    competitions: Array<{
      competitors: ESPNCompetitor[];
      broadcasts?: Array<{ names: string[] }>;
      status?: {
        type?: { name: string; shortDetail: string };
        period?: number;
        displayClock?: string;
      };
      date: string;
      neutralSite?: boolean;
    }>;
  };
  gameInfo?: {
    venue?: { fullName: string };
  };
  boxscore?: {
    players?: ESPNBoxscoreTeam[];
    teams?: ESPNBoxscoreTeamStats[];
  };
  plays?: Array<{ text: string }>;
}
