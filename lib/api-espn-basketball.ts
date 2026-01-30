// ESPN API client for NCAA Men's Basketball
// No authentication required - public endpoints

import {
  BasketballGame,
  BasketballTeam,
  BasketballBoxScore,
  BasketballPlayerStats,
  BasketballTeamStats,
  BasketballStanding,
  BasketballTeamInfo,
  BasketballRanking,
} from './types/basketball';
import {
  NCAA_D1_GROUP_ID,
  GAME_STATUS_MAP,
  CONFERENCE_BY_GROUP_ID,
} from './constants/basketball-conferences';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute for general data
const LIVE_CACHE_TTL = 15 * 1000; // 15 seconds for live data

async function fetchESPN<T>(
  url: string,
  isLive = false
): Promise<T> {
  const cacheKey = url;
  const cacheTTL = isLive ? LIVE_CACHE_TTL : CACHE_TTL;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    console.log(`[ESPN-Basketball] Cache hit: ${url.substring(0, 80)}...`);
    return cached.data as T;
  }

  console.log(`[ESPN-Basketball] Fetching: ${url}`);

  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
  });

  if (!response.ok) {
    console.error(`[ESPN-Basketball] HTTP Error: ${response.status}`);
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();

  // Cache the response
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data as T;
}

// Transform ESPN team data to our format
function transformTeam(competitor: ESPNCompetitor): BasketballTeam {
  const team = competitor.team;
  const rank = competitor.curatedRank?.current;
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
    rank: rank && rank <= 25 ? rank : undefined,
    score: competitor.score !== undefined ? parseInt(competitor.score) : undefined,
  };
}

// Transform ESPN game to our format
function transformGame(event: ESPNEvent): BasketballGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const status = GAME_STATUS_MAP[event.status.type.name] || 'scheduled';
  const isLive = status === 'in_progress';

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
    conferenceGame: competition.conferenceCompetition || false,
    neutralSite: competition.neutralSite || false,
    conference: competition.groups?.shortName || competition.groups?.name || '',
  };
}

// Get games for a specific date
export async function getBasketballGames(date?: string): Promise<BasketballGame[]> {
  let url = `${API_BASE}/scoreboard?groups=${NCAA_D1_GROUP_ID}&limit=500`;

  if (date) {
    // Convert YYYY-MM-DD to YYYYMMDD
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<ESPNScoreboardResponse>(url, !date);

  return data.events?.map(transformGame) || [];
}

// Get live games only
export async function getLiveBasketballGames(): Promise<BasketballGame[]> {
  const games = await getBasketballGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get game summary/details with box score
export async function getBasketballGameSummary(gameId: string): Promise<{
  game: BasketballGame;
  boxScore: BasketballBoxScore | null;
  lastPlay?: string;
}> {
  const url = `${API_BASE}/summary?event=${gameId}`;
  const data = await fetchESPN<ESPNGameSummary>(url, true);

  // Transform main game info
  const event = data.header.competitions[0];
  const homeCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'home')!;
  const awayCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'away')!;

  const gameState = data.header.gameState;
  const statusName = data.header.competitions[0].status?.type?.name;
  const status = (gameState && GAME_STATUS_MAP[gameState]) ||
                 (statusName && GAME_STATUS_MAP[statusName]) ||
                 'scheduled';

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
    conferenceGame: event.conferenceCompetition || false,
    neutralSite: event.neutralSite || false,
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

// Get conference standings
export async function getBasketballStandings(conferenceGroupId?: number): Promise<{
  conference: string;
  standings: BasketballStanding[];
}[]> {
  const url = conferenceGroupId
    ? `${API_V2_BASE}/standings?group=${conferenceGroupId}`
    : `${API_V2_BASE}/standings`;

  const data = await fetchESPN<ESPNStandingsResponse>(url);

  const results: { conference: string; standings: BasketballStanding[] }[] = [];

  data.children?.forEach(child => {
    const confName = child.name || CONFERENCE_BY_GROUP_ID[child.id]?.name || 'Unknown';

    const standings: BasketballStanding[] = child.standings?.entries?.map(entry => {
      const getStatValue = (name: string) => {
        const stat = entry.stats?.find((s: ESPNStandingStat) => s.name === name || s.abbreviation === name);
        return stat?.value ?? stat?.displayValue ?? '0';
      };

      const teamName = entry.team.name || entry.team.displayName || 'Unknown';
      return {
        team: {
          id: entry.team.id,
          name: teamName,
          abbreviation: entry.team.abbreviation || '',
          displayName: entry.team.displayName || teamName,
          shortDisplayName: entry.team.shortDisplayName || teamName,
          logo: entry.team.logos?.[0]?.href || '',
        },
        conferenceRecord: {
          wins: parseInt(getStatValue('conferenceWins') as string) || 0,
          losses: parseInt(getStatValue('conferenceLosses') as string) || 0,
        },
        overallRecord: {
          wins: parseInt(getStatValue('wins') as string) || parseInt(getStatValue('overall') as string) || 0,
          losses: parseInt(getStatValue('losses') as string) || 0,
        },
        streak: String(getStatValue('streak')) || '-',
      };
    }) || [];

    if (standings.length > 0) {
      results.push({ conference: confName, standings });
    }
  });

  return results;
}

// Get team info
export async function getBasketballTeam(teamId: string): Promise<BasketballTeamInfo | null> {
  const url = `${API_BASE}/teams/${teamId}`;

  try {
    const data = await fetchESPN<ESPNTeamResponse>(url);

    const team = data.team;
    const teamName = team.name || team.displayName || 'Unknown';

    return {
      team: {
        id: team.id,
        name: teamName,
        abbreviation: team.abbreviation || '',
        displayName: team.displayName || teamName,
        shortDisplayName: team.shortDisplayName || teamName,
        logo: team.logos?.[0]?.href || '',
        color: team.color,
        alternateColor: team.alternateColor,
        record: team.record?.items?.[0]?.summary,
        rank: team.rank,
      },
      conference: {
        id: team.groups?.id || '',
        name: team.groups?.name || 'Independent',
        shortName: team.groups?.abbreviation || team.groups?.name || '',
      },
      record: team.record?.items?.[0]?.summary || '',
      conferenceRecord: team.record?.items?.find((r: ESPNRecordItem) => r.type === 'vsconf')?.summary || '',
      rank: team.rank,
      schedule: data.team.nextEvent?.map(event => ({
        id: event.id,
        date: new Date(event.date).toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        opponent: {
          id: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.id || '',
          name: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.displayName || '',
          abbreviation: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.abbreviation || '',
          displayName: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.displayName || '',
          shortDisplayName: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.shortDisplayName || '',
          logo: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id !== teamId)?.team.logo || '',
        },
        isHome: event.competitions?.[0]?.competitors?.find((c: ESPNCompetitor) => c.team.id === teamId)?.homeAway === 'home',
        status: 'scheduled',
      })) || [],
      venue: team.franchise?.venue ? {
        name: team.franchise.venue.fullName,
        city: team.franchise.venue.address?.city || '',
        capacity: team.franchise.venue.capacity,
      } : undefined,
    };
  } catch (error) {
    console.error(`[ESPN-Basketball] Error fetching team ${teamId}:`, error);
    return null;
  }
}

// Get AP Top 25 rankings
export async function getBasketballRankings(): Promise<BasketballRanking[]> {
  const url = `${API_BASE}/rankings`;

  try {
    const data = await fetchESPN<ESPNRankingsResponse>(url);

    const apPoll = data.rankings?.find(r => r.name?.includes('AP') || r.type === 'ap');

    if (!apPoll?.ranks) return [];

    return apPoll.ranks.map(rank => {
      const rankTeamName = rank.team.name || rank.team.nickname || 'Unknown';
      return {
        rank: rank.current,
        team: {
          id: rank.team.id,
          name: rankTeamName,
          abbreviation: rank.team.abbreviation || '',
          displayName: rank.team.displayName || rankTeamName,
          shortDisplayName: rank.team.shortDisplayName || rankTeamName,
          logo: rank.team.logos?.[0]?.href || '',
        },
        record: rank.recordSummary || '',
        previousRank: rank.previous,
        trend: rank.current < rank.previous ? 'up' : rank.current > rank.previous ? 'down' : 'same',
      };
    });
  } catch (error) {
    console.error('[ESPN-Basketball] Error fetching rankings:', error);
    return [];
  }
}

// ESPN API Response Types (internal)
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
  nickname?: string;
}

interface ESPNCompetitor {
  id?: string;
  homeAway: 'home' | 'away';
  team: ESPNTeamBase;
  score?: string;
  records?: Array<{ summary: string }>;
  curatedRank?: { current: number };
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
    conferenceCompetition?: boolean;
    neutralSite?: boolean;
    groups?: { shortName?: string; name?: string };
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
  athlete?: ESPNPlayer;
}

interface ESPNStatItem {
  name?: string;
  label?: string;
  displayValue?: string;
  value?: number;
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
    gameState?: string;
    competitions: Array<{
      competitors: ESPNCompetitor[];
      broadcasts?: Array<{ names: string[] }>;
      status?: {
        type?: { name: string; shortDetail: string };
        period?: number;
        displayClock?: string;
      };
      date: string;
      conferenceCompetition?: boolean;
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

interface ESPNStandingStat {
  name?: string;
  abbreviation?: string;
  value?: number;
  displayValue?: string;
}

interface ESPNStandingsEntry {
  team: ESPNTeamBase;
  stats?: ESPNStandingStat[];
}

interface ESPNStandingsResponse {
  children?: Array<{
    id: number;
    name?: string;
    standings?: {
      entries?: ESPNStandingsEntry[];
    };
  }>;
}

interface ESPNRecordItem {
  type?: string;
  summary?: string;
}

interface ESPNTeamResponse {
  team: ESPNTeamBase & {
    record?: {
      items?: ESPNRecordItem[];
    };
    groups?: {
      id: string;
      name: string;
      abbreviation?: string;
    };
    rank?: number;
    franchise?: {
      venue?: {
        fullName: string;
        address?: { city: string };
        capacity?: number;
      };
    };
    nextEvent?: Array<{
      id: string;
      date: string;
      competitions?: Array<{
        competitors?: ESPNCompetitor[];
      }>;
    }>;
  };
}

interface ESPNRankingsResponse {
  rankings?: Array<{
    name?: string;
    type?: string;
    ranks?: Array<{
      current: number;
      previous: number;
      team: ESPNTeamBase;
      recordSummary?: string;
    }>;
  }>;
}
