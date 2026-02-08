// ESPN API client for NCAA College Football
// No authentication required - public endpoints

import {
  CollegeFootballGame,
  CollegeFootballTeam,
  CollegeFootballTeamInfo,
  CollegeFootballStanding,
  CollegeFootballRanking,
} from './types/college-football';
import {
  FBS_GROUP_ID,
  FOOTBALL_GAME_STATUS_MAP,
  FOOTBALL_CONFERENCE_BY_GROUP_ID,
} from './constants/football-conferences';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/football/college-football';

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
    console.log(`[ESPN-Football] Cache hit: ${url.substring(0, 80)}...`);
    return cached.data as T;
  }

  console.log(`[ESPN-Football] Fetching: ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    console.error(`[ESPN-Football] HTTP Error: ${response.status}`);
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();

  // Cache the response
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data as T;
}

// Transform ESPN team data to our format
function transformTeam(competitor: ESPNCompetitor): CollegeFootballTeam {
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
function transformGame(event: ESPNEvent): CollegeFootballGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const status = FOOTBALL_GAME_STATUS_MAP[event.status.type.name] || 'scheduled';

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
export async function getCollegeFootballGames(date?: string): Promise<CollegeFootballGame[]> {
  let url = `${API_BASE}/scoreboard?groups=${FBS_GROUP_ID}&limit=500`;

  if (date) {
    // Convert YYYY-MM-DD to YYYYMMDD
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<ESPNScoreboardResponse>(url, !date);

  return data.events?.map(transformGame) || [];
}

// Get live games only
export async function getLiveCollegeFootballGames(): Promise<CollegeFootballGame[]> {
  const games = await getCollegeFootballGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get team info
export async function getCollegeFootballTeam(teamId: string): Promise<CollegeFootballTeamInfo | null> {
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
    console.error(`[ESPN-Football] Error fetching team ${teamId}:`, error);
    return null;
  }
}

// Get conference standings
export async function getCollegeFootballStandings(conferenceGroupId?: number): Promise<{
  conference: string;
  standings: CollegeFootballStanding[];
}[]> {
  const url = conferenceGroupId
    ? `${API_V2_BASE}/standings?group=${conferenceGroupId}`
    : `${API_V2_BASE}/standings`;

  const data = await fetchESPN<ESPNStandingsResponse>(url);

  const results: { conference: string; standings: CollegeFootballStanding[] }[] = [];

  // Helper to parse standings entries
  const parseStandings = (entries: ESPNStandingsEntry[] | undefined): CollegeFootballStanding[] => {
    const standings = entries?.map(entry => {
      const getStatValue = (nameOrType: string) => {
        const stat = entry.stats?.find((s: ESPNStandingStat) =>
          s.name === nameOrType || s.abbreviation === nameOrType || s.type === nameOrType
        );
        return stat?.value ?? stat?.displayValue ?? '0';
      };

      const teamName = entry.team.name || entry.team.displayName || 'Unknown';
      const seed = parseInt(getStatValue('playoffseed') as string) || 999;

      return {
        seed,
        team: {
          id: entry.team.id,
          name: teamName,
          abbreviation: entry.team.abbreviation || '',
          displayName: entry.team.displayName || teamName,
          shortDisplayName: entry.team.shortDisplayName || teamName,
          logo: entry.team.logos?.[0]?.href || '',
        },
        conferenceRecord: {
          wins: parseInt(getStatValue('vsconf_wins') as string) || 0,
          losses: parseInt(getStatValue('vsconf_losses') as string) || 0,
        },
        overallRecord: {
          wins: parseInt(getStatValue('wins') as string) || 0,
          losses: parseInt(getStatValue('losses') as string) || 0,
        },
        streak: String(getStatValue('streak')) || '-',
      };
    }) || [];

    // Sort by seed (conference position)
    return standings.sort((a, b) => a.seed - b.seed);
  };

  // When a specific conference is requested, ESPN returns data directly (not in children)
  if (conferenceGroupId && data.standings?.entries) {
    const confName = data.name || (data.id ? FOOTBALL_CONFERENCE_BY_GROUP_ID[data.id]?.name : undefined) || 'Unknown';
    const standings = parseStandings(data.standings.entries);
    if (standings.length > 0) {
      results.push({ conference: confName, standings });
    }
  } else {
    // When no conference specified, data has children array
    data.children?.forEach(child => {
      const confName = child.name || FOOTBALL_CONFERENCE_BY_GROUP_ID[child.id]?.name || 'Unknown';
      const standings = parseStandings(child.standings?.entries);
      if (standings.length > 0) {
        results.push({ conference: confName, standings });
      }
    });
  }

  return results;
}

// Get AP Top 25 rankings
export async function getCollegeFootballRankings(): Promise<CollegeFootballRanking[]> {
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
    console.error('[ESPN-Football] Error fetching rankings:', error);
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

interface ESPNStandingStat {
  name?: string;
  abbreviation?: string;
  type?: string;
  value?: number;
  displayValue?: string;
}

interface ESPNStandingsEntry {
  team: ESPNTeamBase;
  stats?: ESPNStandingStat[];
}

interface ESPNStandingsResponse {
  id?: number;
  name?: string;
  standings?: {
    entries?: ESPNStandingsEntry[];
  };
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
