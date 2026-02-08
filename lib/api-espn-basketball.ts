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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
    signal: controller.signal,
  });
  clearTimeout(timeout);

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

  // Helper to parse standings entries
  const parseStandings = (entries: ESPNStandingsEntry[] | undefined): BasketballStanding[] => {
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
    const confName = data.name || (data.id ? CONFERENCE_BY_GROUP_ID[data.id]?.name : undefined) || 'Unknown';
    const standings = parseStandings(data.standings.entries);
    if (standings.length > 0) {
      results.push({ conference: confName, standings });
    }
  } else {
    // When no conference specified, data has children array
    data.children?.forEach(child => {
      const confName = child.name || CONFERENCE_BY_GROUP_ID[child.id]?.name || 'Unknown';
      const standings = parseStandings(child.standings?.entries);
      if (standings.length > 0) {
        results.push({ conference: confName, standings });
      }
    });
  }

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
        name: team.groups?.name || team.standingSummary?.match(/in (.+)$/)?.[1] || 'Independent',
        shortName: team.groups?.abbreviation || team.standingSummary?.match(/in (.+)$/)?.[1] || '',
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

// Type exports for College Basketball-specific data
export interface CollegeBasketballPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot: string;
  height: string;
  weight: string;
  year?: string;
  stats: CollegeBasketballPlayerStats | null;
}

export interface CollegeBasketballPlayerStats {
  gamesPlayed: number;
  minutesPerGame: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  turnoversPerGame: number;
}

export interface CollegeBasketballTeamSeasonStats {
  pointsPerGame: { value: string };
  reboundsPerGame: { value: string };
  assistsPerGame: { value: string };
  fieldGoalPct: { value: string };
  threePointPct: { value: string };
  freeThrowPct: { value: string };
}

export interface CollegeBasketballGameResult {
  id: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  win: boolean;
  score: string;
}

export interface CollegeBasketballConferenceStandings {
  id: string;
  name: string;
  teams: CollegeBasketballStandingTeam[];
}

export interface CollegeBasketballStandingTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
  seed?: number;
}

// Fetch player season stats for college basketball
async function fetchCollegePlayerStats(playerId: string): Promise<CollegeBasketballPlayerStats | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/${playerId}/stats`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return null;

    const data = await response.json();
    const averages = data.categories?.find((c: { name: string }) => c.name === 'averages');

    if (!averages?.statistics?.length) return null;

    const currentSeason = averages.statistics[averages.statistics.length - 1];
    const stats = currentSeason?.stats || [];
    const labels = averages.labels || [];

    const getStatByLabel = (label: string): string => {
      const idx = labels.indexOf(label);
      return idx >= 0 ? stats[idx] : '0';
    };

    return {
      gamesPlayed: parseInt(getStatByLabel('GP')) || 0,
      minutesPerGame: parseFloat(getStatByLabel('MIN')) || 0,
      pointsPerGame: parseFloat(getStatByLabel('PTS')) || 0,
      reboundsPerGame: parseFloat(getStatByLabel('REB')) || 0,
      assistsPerGame: parseFloat(getStatByLabel('AST')) || 0,
      stealsPerGame: parseFloat(getStatByLabel('STL')) || 0,
      blocksPerGame: parseFloat(getStatByLabel('BLK')) || 0,
      fieldGoalPct: parseFloat(getStatByLabel('FG%')) || 0,
      threePointPct: parseFloat(getStatByLabel('3P%')) || 0,
      freeThrowPct: parseFloat(getStatByLabel('FT%')) || 0,
      turnoversPerGame: parseFloat(getStatByLabel('TO')) || 0,
    };
  } catch {
    return null;
  }
}

// Get college basketball team roster with stats
export async function getCollegeBasketballRoster(teamId: string): Promise<CollegeBasketballPlayer[]> {
  const url = `${API_BASE}/teams/${teamId}/roster`;

  try {
    const data = await fetchESPN<ESPNRosterResponse>(url);

    const players = data.athletes?.map((athlete) => ({
      id: athlete.id,
      name: athlete.displayName,
      jersey: athlete.jersey || '',
      position: athlete.position?.abbreviation || '',
      headshot: athlete.headshot?.href || '',
      height: athlete.displayHeight || '',
      weight: athlete.displayWeight || '',
      year: athlete.experience?.displayValue || '',
      stats: null as CollegeBasketballPlayerStats | null,
    })) || [];

    // Fetch stats for all players in parallel (batched)
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const statsResults = await Promise.all(batch.map(p => fetchCollegePlayerStats(p.id)));
      batch.forEach((player, idx) => {
        player.stats = statsResults[idx];
      });
    }

    // Sort by PPG (highest first)
    players.sort((a, b) => (b.stats?.pointsPerGame || 0) - (a.stats?.pointsPerGame || 0));

    return players;
  } catch (error) {
    console.error(`[ESPN-Basketball] Failed to fetch roster for team ${teamId}:`, error);
    return [];
  }
}

// Get college basketball team stats
export async function getCollegeBasketballTeamStats(teamId: string): Promise<CollegeBasketballTeamSeasonStats | null> {
  const url = `${API_BASE}/teams/${teamId}/statistics`;

  try {
    const data = await fetchESPN<ESPNTeamStatsResponse>(url);
    const allStats = data.results?.stats?.categories?.flatMap(cat => cat.stats) || [];

    const getStatValue = (name: string): number => {
      const stat = allStats.find(s => s.name === name);
      return stat?.value || 0;
    };

    const formatValue = (val: number) => val.toFixed(1);

    return {
      pointsPerGame: { value: formatValue(getStatValue('avgPoints')) },
      reboundsPerGame: { value: formatValue(getStatValue('avgRebounds')) },
      assistsPerGame: { value: formatValue(getStatValue('avgAssists')) },
      fieldGoalPct: { value: formatValue(getStatValue('fieldGoalPct')) },
      threePointPct: { value: formatValue(getStatValue('threePointFieldGoalPct')) },
      freeThrowPct: { value: formatValue(getStatValue('freeThrowPct')) },
    };
  } catch (error) {
    console.error(`[ESPN-Basketball] Failed to fetch stats for team ${teamId}:`, error);
    return null;
  }
}

// Get recent form (last 5 games)
export async function getCollegeBasketballRecentForm(teamId: string): Promise<CollegeBasketballGameResult[]> {
  const url = `${API_BASE}/teams/${teamId}/schedule`;

  try {
    const data = await fetchESPN<ESPNScheduleResponse>(url);

    const finishedGames = data.events?.filter(
      event => event.competitions?.[0]?.status?.type?.name === 'STATUS_FINAL'
    ) || [];

    // Get last 5 finished games
    const last5 = finishedGames.slice(-5);

    return last5.map(event => {
      const competition = event.competitions[0];
      const teamComp = competition.competitors.find(c => c.id === teamId);
      const oppComp = competition.competitors.find(c => c.id !== teamId);

      const teamScore = typeof teamComp?.score === 'object'
        ? parseInt((teamComp.score as { displayValue?: string }).displayValue || '0')
        : parseInt(teamComp?.score || '0');
      const oppScore = typeof oppComp?.score === 'object'
        ? parseInt((oppComp.score as { displayValue?: string }).displayValue || '0')
        : parseInt(oppComp?.score || '0');

      return {
        id: event.id,
        opponent: oppComp?.team?.abbreviation || 'TBD',
        opponentLogo: oppComp?.team?.logos?.[0]?.href || '',
        isHome: teamComp?.homeAway === 'home',
        win: teamScore > oppScore,
        score: `${teamScore}-${oppScore}`,
      };
    });
  } catch (error) {
    console.error(`[ESPN-Basketball] Failed to fetch recent form for team ${teamId}:`, error);
    return [];
  }
}

// Schedule game type for team page
export interface CollegeBasketballScheduleGame {
  id: string;
  date: string;
  opponent: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
  };
  isHome: boolean;
  status: 'scheduled' | 'in_progress' | 'final';
  result?: {
    win: boolean;
    score: string;
  };
}

// Get full schedule for a team
export async function getCollegeBasketballSchedule(teamId: string): Promise<CollegeBasketballScheduleGame[]> {
  const url = `${API_BASE}/teams/${teamId}/schedule`;

  try {
    const data = await fetchESPN<ESPNScheduleResponse>(url);

    if (!data.events) return [];

    return data.events.map(event => {
      const competition = event.competitions[0];
      const teamComp = competition.competitors.find(c => c.id === teamId);
      const oppComp = competition.competitors.find(c => c.id !== teamId);

      const statusName = competition.status?.type?.name || '';
      const isFinal = statusName === 'STATUS_FINAL';
      const isInProgress = statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME';

      let result: { win: boolean; score: string } | undefined;
      if (isFinal) {
        const teamScore = typeof teamComp?.score === 'object'
          ? parseInt((teamComp.score as { displayValue?: string }).displayValue || '0')
          : parseInt(teamComp?.score || '0');
        const oppScore = typeof oppComp?.score === 'object'
          ? parseInt((oppComp.score as { displayValue?: string }).displayValue || '0')
          : parseInt(oppComp?.score || '0');
        result = {
          win: teamScore > oppScore,
          score: `${teamScore}-${oppScore}`,
        };
      }

      return {
        id: event.id,
        date: new Date(event.date).toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        opponent: {
          id: oppComp?.team?.id || '',
          name: oppComp?.team?.name || 'TBD',
          abbreviation: oppComp?.team?.abbreviation || '',
          displayName: oppComp?.team?.displayName || 'TBD',
          shortDisplayName: oppComp?.team?.shortDisplayName || 'TBD',
          logo: oppComp?.team?.logos?.[0]?.href || '',
        },
        isHome: teamComp?.homeAway === 'home',
        status: isFinal ? 'final' : isInProgress ? 'in_progress' : 'scheduled',
        result,
      };
    });
  } catch (error) {
    console.error(`[ESPN-Basketball] Failed to fetch schedule for team ${teamId}:`, error);
    return [];
  }
}

// Get conference standings for a team's conference
export async function getCollegeBasketballConferenceStandings(conferenceGroupId: string): Promise<CollegeBasketballConferenceStandings | null> {
  // Query the specific conference directly
  const url = `${API_V2_BASE}/standings?group=${conferenceGroupId}`;

  try {
    const data = await fetchESPN<ESPNStandingsResponse>(url);

    // When querying a specific conference, data is at top level (not in children)
    const entries = data.standings?.entries;
    if (!entries || entries.length === 0) {
      console.log(`[ESPN-Basketball] No standings found for conference ${conferenceGroupId}`);
      return null;
    }

    const teams: CollegeBasketballStandingTeam[] = entries.map(entry => {
      const getStatValue = (nameOrType: string) => {
        const stat = entry.stats?.find((s: ESPNStandingStat) =>
          s.name === nameOrType || s.abbreviation === nameOrType || s.type === nameOrType
        );
        return stat?.value ?? 0;
      };

      return {
        id: entry.team.id,
        name: entry.team.displayName || entry.team.name || '',
        abbreviation: entry.team.abbreviation || '',
        logo: entry.team.logos?.[0]?.href || '',
        conferenceWins: Math.round(getStatValue('vsconf_wins')),
        conferenceLosses: Math.round(getStatValue('vsconf_losses')),
        overallWins: Math.round(getStatValue('wins')),
        overallLosses: Math.round(getStatValue('losses')),
        seed: Math.round(getStatValue('playoffseed')) || 999,
      };
    });

    // Sort by playoff seed (conference position)
    teams.sort((a, b) => (a.seed || 999) - (b.seed || 999));

    return {
      id: String(data.id || conferenceGroupId),
      name: data.name || 'Unknown',
      teams,
    };
  } catch (error) {
    console.error(`[ESPN-Basketball] Failed to fetch standings for conference ${conferenceGroupId}:`, error);
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
    standingSummary?: string;
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

// Roster response types
interface ESPNRosterResponse {
  athletes?: Array<{
    id: string;
    displayName: string;
    jersey?: string;
    position?: { abbreviation: string };
    headshot?: { href: string };
    displayHeight?: string;
    displayWeight?: string;
    experience?: { displayValue: string };
  }>;
}

// Team stats response types
interface ESPNTeamStatsResponse {
  results?: {
    stats?: {
      categories?: Array<{
        name: string;
        stats: Array<{
          name: string;
          displayValue?: string;
          value?: number;
        }>;
      }>;
    };
  };
}

// Schedule response types
interface ESPNScheduleResponse {
  events?: Array<{
    id: string;
    date: string;
    competitions: Array<{
      competitors: Array<{
        id: string;
        homeAway: 'home' | 'away';
        score?: string | { displayValue?: string };
        team?: {
          id: string;
          name: string;
          abbreviation: string;
          displayName: string;
          shortDisplayName: string;
          logos?: Array<{ href: string }>;
        };
      }>;
      status?: {
        type?: { name: string };
      };
    }>;
  }>;
}
