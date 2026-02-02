// ESPN API client for NBA
// No authentication required - public endpoints

import { BasketballGame, BasketballTeam, BasketballBoxScore, BasketballPlayerStats, BasketballTeamStats, BasketballTeamInfo } from './types/basketball';

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

// Get team info
export async function getNBATeam(teamId: string): Promise<BasketballTeamInfo | null> {
  try {
    const url = `${API_BASE}/teams/${teamId}`;
    const data = await fetchESPN<ESPNTeamResponse>(url);

    if (!data.team) {
      return null;
    }

    const team = data.team;

    // Extract records
    const overallRecord = team.record?.items?.find((r: ESPNRecordItem) => r.type === 'total');
    const confRecord = team.record?.items?.find((r: ESPNRecordItem) => r.type === 'vsconf');

    // Extract division from standingSummary (e.g., "3rd in Southeast Division")
    const standingSummary = team.standingSummary || '';
    const divisionMatch = standingSummary.match(/in (.+)/);
    const divisionName = divisionMatch ? divisionMatch[1] : 'NBA';

    const teamInfo: BasketballTeamInfo = {
      team: {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        displayName: team.displayName,
        shortDisplayName: team.shortDisplayName || team.displayName,
        logo: team.logos?.[0]?.href || '',
        color: team.color,
        alternateColor: team.alternateColor,
      },
      conference: {
        id: team.groups?.parent?.id || 'nba',
        name: divisionName,
        shortName: divisionName,
      },
      record: overallRecord?.summary || team.record?.items?.[0]?.summary || '-',
      conferenceRecord: confRecord?.summary || '-',
      rank: team.rank,
      schedule: [],
      venue: team.franchise?.venue ? {
        name: team.franchise.venue.fullName,
        city: team.franchise.venue.address?.city || '',
        capacity: team.franchise.venue.capacity,
      } : undefined,
    };

    // Try to get schedule
    try {
      const scheduleUrl = `${API_BASE}/teams/${teamId}/schedule`;
      const scheduleData = await fetchESPN<ESPNScheduleResponse>(scheduleUrl);

      if (scheduleData.events) {
        teamInfo.schedule = scheduleData.events.map((event: ESPNScheduleEvent) => {
          const competition = event.competitions[0];
          const isHome = competition.competitors.find((c: ESPNScheduleCompetitor) => c.id === teamId)?.homeAway === 'home';
          const opponent = competition.competitors.find((c: ESPNScheduleCompetitor) => c.id !== teamId);

          const status = GAME_STATUS_MAP[event.competitions[0].status?.type?.name || ''] || 'scheduled';

          let result: { win: boolean; score: string } | undefined;
          if (status === 'final' && opponent) {
            const teamComp = competition.competitors.find((c: ESPNScheduleCompetitor) => c.id === teamId);
            const teamScore = typeof teamComp?.score === 'object'
              ? parseInt(teamComp.score.displayValue || '0')
              : parseInt(teamComp?.score || '0');
            const oppScore = typeof opponent.score === 'object'
              ? parseInt(opponent.score.displayValue || '0')
              : parseInt(opponent.score || '0');
            result = {
              win: teamScore > oppScore,
              score: `${teamScore}-${oppScore}`,
            };
          }

          return {
            id: event.id,
            date: new Date(event.date).toLocaleDateString('en-US', {
              timeZone: 'America/New_York',
              month: 'short',
              day: 'numeric',
            }),
            opponent: {
              id: opponent?.team?.id || '',
              name: opponent?.team?.name || 'TBD',
              abbreviation: opponent?.team?.abbreviation || '',
              displayName: opponent?.team?.displayName || 'TBD',
              shortDisplayName: opponent?.team?.shortDisplayName || 'TBD',
              logo: opponent?.team?.logos?.[0]?.href || '',
            },
            isHome,
            result,
            status,
          };
        });
      }
    } catch (e) {
      console.error('[ESPN-NBA] Failed to fetch schedule:', e);
    }

    return teamInfo;
  } catch (error) {
    console.error(`[ESPN-NBA] Failed to fetch team ${teamId}:`, error);
    return null;
  }
}

// Get NBA standings by conference
export async function getNBAStandings(): Promise<NBAStandings> {
  const url = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';
  const data = await fetchESPN<ESPNStandingsResponse>(url);

  const conferences: NBAConferenceStandings[] = data.children?.map((conf) => {
    const teams: NBAStandingTeam[] = conf.standings?.entries?.map((entry) => {
      const getStat = (name: string) => {
        const stat = entry.stats?.find((s) => s.name === name);
        return stat?.value ?? 0;
      };

      return {
        id: entry.team?.id || '',
        name: entry.team?.displayName || '',
        abbreviation: entry.team?.abbreviation || '',
        logo: entry.team?.logos?.[0]?.href || '',
        seed: Math.round(getStat('playoffSeed')),
        wins: Math.round(getStat('wins')),
        losses: Math.round(getStat('losses')),
        winPct: getStat('winPercent'),
        gamesBehind: getStat('gamesBehind'),
        streak: Math.round(getStat('streak')),
        lastTen: entry.stats?.find(s => s.name === 'Last Ten Games')?.displayValue || '-',
      };
    }) || [];

    // Sort by seed
    teams.sort((a, b) => a.seed - b.seed);

    return {
      id: conf.id || '',
      name: conf.name || '',
      teams,
    };
  }) || [];

  return { conferences };
}

// Fetch player season stats
async function fetchPlayerStats(playerId: string): Promise<NBAPlayerSeasonStats | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
    if (!response.ok) return null;

    const data = await response.json();
    const averages = data.categories?.find((c: { name: string }) => c.name === 'averages');

    if (!averages?.statistics?.length) return null;

    // Get current season (last entry)
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

// Get team roster with stats
export async function getNBARoster(teamId: string): Promise<NBAPlayer[]> {
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
      age: athlete.age,
      experience: athlete.experience?.years || 0,
      stats: null as NBAPlayerSeasonStats | null,
    })) || [];

    // Fetch stats for all players in parallel (batched)
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const statsResults = await Promise.all(batch.map(p => fetchPlayerStats(p.id)));
      batch.forEach((player, idx) => {
        player.stats = statsResults[idx];
      });
    }

    // Sort by PPG (highest first)
    players.sort((a, b) => (b.stats?.pointsPerGame || 0) - (a.stats?.pointsPerGame || 0));

    return players;
  } catch (error) {
    console.error(`[ESPN-NBA] Failed to fetch roster for team ${teamId}:`, error);
    return [];
  }
}

// All NBA team IDs
const NBA_TEAM_IDS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
];

// Cache for all teams' stats (for ranking calculation)
let allTeamsStatsCache: { data: Map<string, RawTeamStats>; timestamp: number } | null = null;
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface RawTeamStats {
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  avgTurnovers: number;
}

// Fetch stats for a single team (raw numbers)
async function fetchTeamRawStats(teamId: string): Promise<RawTeamStats | null> {
  const url = `${API_BASE}/teams/${teamId}/statistics`;
  try {
    const data = await fetchESPN<ESPNTeamStatsResponse>(url);
    const allStats = data.results?.stats?.categories?.flatMap(cat => cat.stats) || [];

    const getStatValue = (name: string): number => {
      const stat = allStats.find(s => s.name === name);
      return stat?.value || 0;
    };

    return {
      avgPoints: getStatValue('avgPoints'),
      avgRebounds: getStatValue('avgRebounds'),
      avgAssists: getStatValue('avgAssists'),
      avgSteals: getStatValue('avgSteals'),
      avgBlocks: getStatValue('avgBlocks'),
      fieldGoalPct: getStatValue('fieldGoalPct'),
      threePointPct: getStatValue('threePointFieldGoalPct'),
      freeThrowPct: getStatValue('freeThrowPct'),
      avgTurnovers: getStatValue('avgTurnovers'),
    };
  } catch {
    return null;
  }
}

// Get all teams' stats (cached)
async function getAllTeamsStats(): Promise<Map<string, RawTeamStats>> {
  // Check cache
  if (allTeamsStatsCache && Date.now() - allTeamsStatsCache.timestamp < STATS_CACHE_TTL) {
    return allTeamsStatsCache.data;
  }

  console.log('[ESPN-NBA] Fetching all teams stats for rankings...');

  const statsMap = new Map<string, RawTeamStats>();

  // Fetch all teams in parallel (batched to avoid rate limiting)
  const batchSize = 10;
  for (let i = 0; i < NBA_TEAM_IDS.length; i += batchSize) {
    const batch = NBA_TEAM_IDS.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(id => fetchTeamRawStats(id)));
    batch.forEach((id, idx) => {
      if (results[idx]) {
        statsMap.set(id, results[idx]!);
      }
    });
  }

  allTeamsStatsCache = { data: statsMap, timestamp: Date.now() };
  return statsMap;
}

// Calculate rank for a stat (higher is better, except turnovers)
function calculateRank(
  teamId: string,
  statName: keyof RawTeamStats,
  allStats: Map<string, RawTeamStats>,
  lowerIsBetter = false
): number {
  const values: { id: string; value: number }[] = [];
  allStats.forEach((stats, id) => {
    values.push({ id, value: stats[statName] });
  });

  // Sort: higher is better by default, lower is better for turnovers
  values.sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value);

  const rank = values.findIndex(v => v.id === teamId) + 1;
  return rank || 30;
}

// Get team stats with rankings
export async function getNBATeamStats(teamId: string): Promise<NBATeamSeasonStats | null> {
  try {
    // Get all teams stats for ranking
    const allStats = await getAllTeamsStats();
    const teamStats = allStats.get(teamId);

    if (!teamStats) {
      return null;
    }

    const formatValue = (val: number, decimals = 1) => val.toFixed(decimals);
    const formatPct = (val: number) => val.toFixed(1); // ESPN already returns as percentage

    return {
      pointsPerGame: {
        value: formatValue(teamStats.avgPoints),
        rank: calculateRank(teamId, 'avgPoints', allStats),
      },
      reboundsPerGame: {
        value: formatValue(teamStats.avgRebounds),
        rank: calculateRank(teamId, 'avgRebounds', allStats),
      },
      assistsPerGame: {
        value: formatValue(teamStats.avgAssists),
        rank: calculateRank(teamId, 'avgAssists', allStats),
      },
      stealsPerGame: {
        value: formatValue(teamStats.avgSteals),
        rank: calculateRank(teamId, 'avgSteals', allStats),
      },
      blocksPerGame: {
        value: formatValue(teamStats.avgBlocks),
        rank: calculateRank(teamId, 'avgBlocks', allStats),
      },
      fieldGoalPct: {
        value: formatPct(teamStats.fieldGoalPct),
        rank: calculateRank(teamId, 'fieldGoalPct', allStats),
      },
      threePointPct: {
        value: formatPct(teamStats.threePointPct),
        rank: calculateRank(teamId, 'threePointPct', allStats),
      },
      freeThrowPct: {
        value: formatPct(teamStats.freeThrowPct),
        rank: calculateRank(teamId, 'freeThrowPct', allStats),
      },
      turnoversPerGame: {
        value: formatValue(teamStats.avgTurnovers),
        rank: calculateRank(teamId, 'avgTurnovers', allStats, true), // Lower is better
      },
    };
  } catch (error) {
    console.error(`[ESPN-NBA] Failed to fetch stats for team ${teamId}:`, error);
    return null;
  }
}

// Get recent form (last 5 games)
export async function getNBARecentForm(teamId: string): Promise<NBAGameResult[]> {
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
        ? parseInt(teamComp.score.displayValue || '0')
        : parseInt(teamComp?.score || '0');
      const oppScore = typeof oppComp?.score === 'object'
        ? parseInt(oppComp.score.displayValue || '0')
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
    console.error(`[ESPN-NBA] Failed to fetch recent form for team ${teamId}:`, error);
    return [];
  }
}

// Type exports for NBA-specific data
export interface NBAStandings {
  conferences: NBAConferenceStandings[];
}

export interface NBAConferenceStandings {
  id: string;
  name: string;
  teams: NBAStandingTeam[];
}

export interface NBAStandingTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  seed: number;
  wins: number;
  losses: number;
  winPct: number;
  gamesBehind: number;
  streak: number;
  lastTen: string;
}

export interface NBAPlayerSeasonStats {
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

export interface NBAPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot: string;
  height: string;
  weight: string;
  age?: number;
  experience: number;
  stats: NBAPlayerSeasonStats | null;
}

export interface NBATeamSeasonStats {
  pointsPerGame: { value: string; rank?: number };
  reboundsPerGame: { value: string; rank?: number };
  assistsPerGame: { value: string; rank?: number };
  stealsPerGame: { value: string; rank?: number };
  blocksPerGame: { value: string; rank?: number };
  fieldGoalPct: { value: string; rank?: number };
  threePointPct: { value: string; rank?: number };
  freeThrowPct: { value: string; rank?: number };
  turnoversPerGame: { value: string; rank?: number };
}

export interface NBAGameResult {
  id: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  win: boolean;
  score: string;
}

// ESPN Standings Response Types
interface ESPNStandingsResponse {
  children?: Array<{
    id: string;
    name: string;
    standings?: {
      entries?: Array<{
        team?: {
          id: string;
          displayName: string;
          abbreviation: string;
          logos?: Array<{ href: string }>;
        };
        stats?: Array<{
          name: string;
          value?: number;
          displayValue?: string;
        }>;
      }>;
    };
  }>;
}

// ESPN Roster Response Types
interface ESPNRosterResponse {
  athletes?: Array<{
    id: string;
    displayName: string;
    jersey?: string;
    position?: { abbreviation: string };
    headshot?: { href: string };
    displayHeight?: string;
    displayWeight?: string;
    age?: number;
    experience?: { years: number };
  }>;
}

// ESPN Team Stats Response Types
interface ESPNTeamStatsResponse {
  results?: {
    stats?: {
      categories?: Array<{
        name: string;
        stats: Array<{
          name: string;
          displayValue?: string;
          value?: number;
          rank?: number;
        }>;
      }>;
    };
  };
}

// ESPN API Response Types
interface ESPNRecordItem {
  type: string;
  summary: string;
}

interface ESPNTeamResponse {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName?: string;
    logos?: Array<{ href: string }>;
    color?: string;
    alternateColor?: string;
    rank?: number;
    standingSummary?: string;
    record?: {
      items?: ESPNRecordItem[];
    };
    groups?: {
      id?: string;
      name?: string;
      abbreviation?: string;
      parent?: {
        id: string;
        name: string;
        abbreviation: string;
      };
    };
    franchise?: {
      venue?: {
        fullName: string;
        address?: { city: string };
        capacity?: number;
      };
    };
  };
}

interface ESPNScheduleCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  score?: string | { value: number; displayValue: string };
  team?: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logos?: Array<{ href: string }>;
  };
}

interface ESPNScheduleEvent {
  id: string;
  date: string;
  competitions: Array<{
    competitors: ESPNScheduleCompetitor[];
    status?: {
      type?: { name: string };
    };
  }>;
}

interface ESPNScheduleResponse {
  events?: ESPNScheduleEvent[];
}

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

// Stat leaders types
export interface NBAStatLeader {
  player: {
    id: string;
    name: string;
    headshot: string;
  };
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  value: number;
  displayValue: string;
}

export interface NBALeaders {
  points: NBAStatLeader[];
  rebounds: NBAStatLeader[];
  assists: NBAStatLeader[];
  steals: NBAStatLeader[];
  blocks: NBAStatLeader[];
}

// Get NBA stat leaders
export async function getNBALeaders(): Promise<NBALeaders> {
  // Use v3 endpoint which has the correct response format
  const url = 'https://site.api.espn.com/apis/site/v3/sports/basketball/nba/leaders';

  try {
    const data = await fetchESPN<ESPNLeadersResponse>(url);

    const extractLeaders = (categoryName: string): NBAStatLeader[] => {
      const category = data.leaders?.categories?.find(c =>
        c.name?.toLowerCase().includes(categoryName.toLowerCase()) ||
        c.abbreviation?.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category?.leaders) return [];

      return category.leaders.slice(0, 5).map(leader => ({
        player: {
          id: leader.athlete?.id || '',
          name: leader.athlete?.displayName || '',
          headshot: leader.athlete?.headshot?.href || '',
        },
        team: {
          id: leader.team?.id || '',
          name: leader.team?.name || '',
          abbreviation: leader.team?.abbreviation || '',
          logo: leader.team?.logos?.[0]?.href || '',
        },
        value: leader.value || 0,
        displayValue: leader.displayValue || String(leader.value || 0),
      }));
    };

    return {
      points: extractLeaders('pointsPerGame'),
      rebounds: extractLeaders('reboundsPerGame'),
      assists: extractLeaders('assistsPerGame'),
      steals: extractLeaders('stealsPerGame'),
      blocks: extractLeaders('blocksPerGame'),
    };
  } catch (error) {
    console.error('[ESPN-NBA] Failed to fetch leaders:', error);
    return { points: [], rebounds: [], assists: [], steals: [], blocks: [] };
  }
}

// ESPN Leaders Response (v3 API)
interface ESPNLeadersResponse {
  leaders?: {
    categories?: Array<{
      name?: string;
      displayName?: string;
      abbreviation?: string;
      leaders?: Array<{
        athlete?: {
          id: string;
          displayName: string;
          headshot?: { href: string };
        };
        team?: {
          id: string;
          name: string;
          abbreviation: string;
          logos?: Array<{ href: string }>;
        };
        value?: number;
        displayValue?: string;
      }>;
    }>;
  };
}

// Team ranking types
export interface NBATeamRanking {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  value: number;
  displayValue: string;
}

export interface NBATeamRankings {
  points: NBATeamRanking[];
  rebounds: NBATeamRanking[];
  assists: NBATeamRanking[];
  fieldGoalPct: NBATeamRanking[];
  threePointPct: NBATeamRanking[];
}

// Get NBA team rankings
export async function getNBATeamRankings(): Promise<NBATeamRankings> {
  const teamIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
  ];

  try {
    // Fetch all team stats in parallel
    const teamStatsPromises = teamIds.map(async (teamId) => {
      try {
        const teamUrl = `${API_BASE}/teams/${teamId}`;
        const statsUrl = `${API_BASE}/teams/${teamId}/statistics`;

        const [teamData, statsData] = await Promise.all([
          fetchESPN<{ team: { id: string; displayName: string; abbreviation: string; logos?: Array<{ href: string }> } }>(teamUrl),
          fetchESPN<ESPNTeamStatsResponse>(statsUrl),
        ]);

        const allStats = statsData.results?.stats?.categories?.flatMap(cat => cat.stats) || [];
        const getStatValue = (name: string): number => {
          const stat = allStats.find(s => s.name === name);
          return stat?.value || 0;
        };

        return {
          team: {
            id: teamData.team.id,
            name: teamData.team.displayName,
            abbreviation: teamData.team.abbreviation,
            logo: teamData.team.logos?.[0]?.href || '',
          },
          stats: {
            points: getStatValue('avgPoints'),
            rebounds: getStatValue('avgRebounds'),
            assists: getStatValue('avgAssists'),
            fieldGoalPct: getStatValue('fieldGoalPct'),
            threePointPct: getStatValue('threePointPct'),
          },
        };
      } catch {
        return null;
      }
    });

    const allTeamStats = (await Promise.all(teamStatsPromises)).filter(Boolean) as Array<{
      team: { id: string; name: string; abbreviation: string; logo: string };
      stats: { points: number; rebounds: number; assists: number; fieldGoalPct: number; threePointPct: number };
    }>;

    // Helper to rank and get top 5
    const getRankings = (statKey: keyof typeof allTeamStats[0]['stats']): NBATeamRanking[] => {
      return [...allTeamStats]
        .sort((a, b) => b.stats[statKey] - a.stats[statKey])
        .slice(0, 5)
        .map(t => ({
          team: t.team,
          value: t.stats[statKey],
          displayValue: statKey.includes('Pct')
            ? t.stats[statKey].toFixed(1) + '%'
            : t.stats[statKey].toFixed(1),
        }));
    };

    return {
      points: getRankings('points'),
      rebounds: getRankings('rebounds'),
      assists: getRankings('assists'),
      fieldGoalPct: getRankings('fieldGoalPct'),
      threePointPct: getRankings('threePointPct'),
    };
  } catch (error) {
    console.error('[ESPN-NBA] Failed to fetch team rankings:', error);
    return { points: [], rebounds: [], assists: [], fieldGoalPct: [], threePointPct: [] };
  }
}
