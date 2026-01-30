// Unified ESPN data fetcher for all sports
// Fetches from ESPN API and transforms to a common format

import {
  ESPN_SPORTS,
  ESPN_API_BASE,
  ESPNSportKey,
  GAME_STATUS_MAP,
  getEasternDateString,
  formatEasternTime,
  formatEasternDate,
  ESPNGameRecord,
} from './espn-sync-config';

// ESPN API response types
interface ESPNTeam {
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
  id?: string;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  records?: Array<{ summary: string }>;
  curatedRank?: { current: number };
  hits?: string;
  errors?: string;
  linescores?: Array<{ value: number }>;
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
    situation?: {
      balls?: number;
      strikes?: number;
      outs?: number;
      onFirst?: boolean;
      onSecond?: boolean;
      onThird?: boolean;
    };
  }>;
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

// Fetch ESPN scoreboard for a sport and date
export async function fetchESPNScoreboard(
  sport: ESPNSportKey,
  date?: string
): Promise<ESPNEvent[]> {
  const config = ESPN_SPORTS[sport];
  let url = `${ESPN_API_BASE}/${config.espnPath}/scoreboard?limit=500`;

  if (config.groups) {
    url += `&groups=${config.groups}`;
  }

  if (date) {
    // Convert YYYY-MM-DD to YYYYMMDD for ESPN
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  console.log(`[ESPN-Sync] Fetching ${sport} scoreboard: ${url}`);

  const response = await fetch(url, {
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    console.error(`[ESPN-Sync] HTTP Error: ${response.status}`);
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data: ESPNScoreboardResponse = await response.json();
  return data.events || [];
}

// Transform ESPN event to our database record format
export function transformESPNEvent(
  event: ESPNEvent,
  sportType: string
): ESPNGameRecord {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const eventDate = new Date(event.date);
  const statusName = event.status.type.name;
  const status = GAME_STATUS_MAP[statusName] || 'scheduled';

  // Extract team info with fallbacks
  const getTeamName = (team: ESPNTeam) =>
    team.name || team.displayName || team.shortDisplayName || 'Unknown';
  const getTeamAbbrev = (team: ESPNTeam) =>
    team.abbreviation || team.shortDisplayName || getTeamName(team).substring(0, 3).toUpperCase();
  const getTeamLogo = (team: ESPNTeam) =>
    team.logo || team.logos?.[0]?.href || null;

  // Build extra data for sport-specific info
  const extraData: Record<string, unknown> = {};

  // Baseball-specific
  if (sportType === 'baseball' && competition.situation) {
    extraData.situation = {
      balls: competition.situation.balls,
      strikes: competition.situation.strikes,
      outs: competition.situation.outs,
      onFirst: competition.situation.onFirst,
      onSecond: competition.situation.onSecond,
      onThird: competition.situation.onThird,
    };
  }

  // Line scores for baseball
  if (homeCompetitor.linescores || awayCompetitor.linescores) {
    extraData.lineScore = {
      home: homeCompetitor.linescores?.map(ls => ls.value) || [],
      away: awayCompetitor.linescores?.map(ls => ls.value) || [],
    };
  }

  // Hits and errors for baseball
  if (homeCompetitor.hits !== undefined) {
    extraData.homeHits = parseInt(homeCompetitor.hits) || 0;
    extraData.homeErrors = parseInt(homeCompetitor.errors || '0') || 0;
    extraData.awayHits = parseInt(awayCompetitor.hits || '0') || 0;
    extraData.awayErrors = parseInt(awayCompetitor.errors || '0') || 0;
  }

  const now = new Date().toISOString();

  return {
    id: `${sportType}_${event.id}`,
    sport_type: sportType,
    espn_game_id: event.id,
    game_date: getEasternDateString(eventDate),
    kickoff: event.date,
    status,
    status_detail: event.status.type.shortDetail || event.status.type.detail,
    period: event.status.period || null,
    clock: event.status.displayClock || null,

    // Home team
    home_team_id: homeCompetitor.team.id,
    home_team_name: getTeamName(homeCompetitor.team),
    home_team_abbrev: getTeamAbbrev(homeCompetitor.team),
    home_team_logo: getTeamLogo(homeCompetitor.team),
    home_team_color: homeCompetitor.team.color || null,
    home_team_record: homeCompetitor.records?.[0]?.summary || null,
    home_team_rank: homeCompetitor.curatedRank?.current && homeCompetitor.curatedRank.current <= 25
      ? homeCompetitor.curatedRank.current
      : null,
    home_score: homeCompetitor.score !== undefined ? parseInt(homeCompetitor.score) : null,

    // Away team
    away_team_id: awayCompetitor.team.id,
    away_team_name: getTeamName(awayCompetitor.team),
    away_team_abbrev: getTeamAbbrev(awayCompetitor.team),
    away_team_logo: getTeamLogo(awayCompetitor.team),
    away_team_color: awayCompetitor.team.color || null,
    away_team_record: awayCompetitor.records?.[0]?.summary || null,
    away_team_rank: awayCompetitor.curatedRank?.current && awayCompetitor.curatedRank.current <= 25
      ? awayCompetitor.curatedRank.current
      : null,
    away_score: awayCompetitor.score !== undefined ? parseInt(awayCompetitor.score) : null,

    // Additional info
    venue: competition.venue?.fullName || null,
    broadcast: competition.broadcasts?.[0]?.names?.[0] || null,
    conference_game: competition.conferenceCompetition || false,
    neutral_site: competition.neutralSite || false,

    // Sport-specific
    extra_data: Object.keys(extraData).length > 0 ? extraData : null,

    created_at: now,
    updated_at: now,
  };
}

// Fetch and transform all games for a sport and date range
export async function fetchAndTransformGames(
  sport: ESPNSportKey,
  dates: string[]
): Promise<ESPNGameRecord[]> {
  const config = ESPN_SPORTS[sport];
  const allGames: ESPNGameRecord[] = [];

  for (const date of dates) {
    try {
      const events = await fetchESPNScoreboard(sport, date);
      const transformed = events.map(event =>
        transformESPNEvent(event, config.sportType)
      );
      allGames.push(...transformed);
      console.log(`[ESPN-Sync] ${sport} ${date}: ${transformed.length} games`);
    } catch (error) {
      console.error(`[ESPN-Sync] Error fetching ${sport} for ${date}:`, error);
    }
  }

  return allGames;
}

// Transform database record to frontend game format
export function transformToFrontendGame(record: ESPNGameRecord) {
  const eventDate = new Date(record.kickoff);

  return {
    id: record.espn_game_id,
    status: record.status as 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed',
    statusDetail: record.status_detail,
    period: record.period || 0,
    clock: record.clock || '',
    date: formatEasternDate(eventDate),
    startTime: formatEasternTime(eventDate),
    venue: record.venue,
    broadcast: record.broadcast,
    conferenceGame: record.conference_game,
    neutralSite: record.neutral_site,
    homeTeam: {
      id: record.home_team_id,
      name: record.home_team_name,
      abbreviation: record.home_team_abbrev,
      displayName: record.home_team_name,
      shortDisplayName: record.home_team_abbrev,
      logo: record.home_team_logo || '',
      color: record.home_team_color,
      record: record.home_team_record,
      rank: record.home_team_rank,
      score: record.home_score,
    },
    awayTeam: {
      id: record.away_team_id,
      name: record.away_team_name,
      abbreviation: record.away_team_abbrev,
      displayName: record.away_team_name,
      shortDisplayName: record.away_team_abbrev,
      logo: record.away_team_logo || '',
      color: record.away_team_color,
      record: record.away_team_record,
      rank: record.away_team_rank,
      score: record.away_score,
    },
    // Sport-specific data
    ...(record.extra_data || {}),
  };
}
