// ESPN API client for NFL
// No authentication required - public endpoints

import { NFLGame, NFLTeam, NFLBoxScore, NFLStandings, NFLTeamInfo, NFLStanding, NFLTeamScheduleGame } from './types/nfl';
import { getCurrentNFLSeason, getSuperBowlDateRange } from './espn-season-utils';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/football/nfl';

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
const CACHE_TTL = 60 * 1000;
const LIVE_CACHE_TTL = 15 * 1000;

async function fetchESPN<T>(url: string, isLive = false): Promise<T> {
  const cacheKey = url;
  const cacheTTL = isLive ? LIVE_CACHE_TTL : CACHE_TTL;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTeam(competitor: any): NFLTeam {
  const team = competitor.team;
  const name = team.name || team.displayName || 'Unknown';

  return {
    id: team.id,
    name,
    abbreviation: team.abbreviation || name.substring(0, 3).toUpperCase(),
    displayName: team.displayName || name,
    shortDisplayName: team.shortDisplayName || name,
    logo: team.logo || team.logos?.[0]?.href || '',
    color: team.color,
    alternateColor: team.alternateColor,
    record: competitor.records?.[0]?.summary,
    score: competitor.score !== undefined ? parseInt(competitor.score) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformGame(event: any): NFLGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away')!;

  const status = GAME_STATUS_MAP[event.status.type.name] || 'scheduled';

  // Get possession if game is live
  let possession: string | undefined;
  if (status === 'in_progress') {
    const possessingTeam = competition.situation?.possession;
    possession = possessingTeam;
  }

  return {
    id: event.id,
    status,
    statusDetail: event.status.type.shortDetail || event.status.type.detail,
    quarter: event.status.period || 0,
    clock: event.status.displayClock || '',
    possession,
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
    rawDate: event.date,
    startTime: new Date(event.date).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }),
    week: event.week?.number,
    seasonType: event.season?.type === 3 ? 'Playoffs' : event.season?.type === 4 ? 'Pro Bowl' : undefined,
  };
}

// Get games for a specific date or week
export async function getNFLGames(date?: string): Promise<NFLGame[]> {
  let url = `${API_BASE}/scoreboard?limit=100`;

  if (date) {
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<any>(url, !date);
  return data.events?.map(transformGame) || [];
}

// Playoff week to round name mapping
const PLAYOFF_ROUND_NAMES: Record<number, string> = {
  1: 'Wild Card',
  2: 'Divisional',
  3: 'Conf Champ',
  4: 'Pro Bowl',
  5: 'Super Bowl',
};

// Get upcoming NFL playoff games (including Super Bowl)
export async function getNFLPlayoffGames(): Promise<NFLGame[]> {
  try {
    // Get current postseason games
    const currentUrl = `${API_BASE}/scoreboard?seasontype=3&limit=100`;

    // Get Super Bowl date range (2nd Sunday of Feb, ±1 day)
    const superBowlUrl = `${API_BASE}/scoreboard?dates=${getSuperBowlDateRange(getCurrentNFLSeason())}`;

    const [currentData, superBowlData] = await Promise.all([
      fetchESPN<any>(currentUrl),
      fetchESPN<any>(superBowlUrl).catch(() => ({ events: [] })),
    ]);

    const currentGames = currentData.events?.map(transformGame) || [];
    const superBowlGames = superBowlData.events?.map(transformGame) || [];

    // Combine and dedupe
    const gameMap = new Map();
    [...currentGames, ...superBowlGames].forEach(game => {
      gameMap.set(game.id, game);
    });

    return Array.from(gameMap.values());
  } catch {
    return [];
  }
}

// Get live games only
export async function getLiveNFLGames(): Promise<NFLGame[]> {
  const games = await getNFLGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get game summary/details
export async function getNFLGameSummary(gameId: string): Promise<{
  game: NFLGame;
  boxScore: NFLBoxScore | null;
  drives?: any[];
}> {
  const url = `${API_BASE}/summary?event=${gameId}`;
  const data = await fetchESPN<any>(url, true);

  const event = data.header.competitions[0];
  const homeCompetitor = event.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = event.competitors.find((c: any) => c.homeAway === 'away')!;

  const statusName = data.header.competitions[0].status?.type?.name;
  const status = (statusName && GAME_STATUS_MAP[statusName]) || 'scheduled';

  const game: NFLGame = {
    id: gameId,
    status,
    statusDetail: data.header.competitions[0].status?.type?.shortDetail || '',
    quarter: data.header.competitions[0].status?.period || 0,
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
    rawDate: data.header.competitions[0].date,
    startTime: new Date(data.header.competitions[0].date).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };

  // Basic box score (simplified for now)
  const boxScore: NFLBoxScore | null = null;

  return { game, boxScore, drives: data.drives?.previous };
}

// Division mapping by team ID
const TEAM_DIVISIONS: Record<string, { division: string; conference: 'AFC' | 'NFC' }> = {
  // AFC East
  '2': { division: 'East', conference: 'AFC' },
  '15': { division: 'East', conference: 'AFC' },
  '17': { division: 'East', conference: 'AFC' },
  '20': { division: 'East', conference: 'AFC' },
  // AFC North
  '33': { division: 'North', conference: 'AFC' },
  '4': { division: 'North', conference: 'AFC' },
  '5': { division: 'North', conference: 'AFC' },
  '23': { division: 'North', conference: 'AFC' },
  // AFC South
  '34': { division: 'South', conference: 'AFC' },
  '11': { division: 'South', conference: 'AFC' },
  '30': { division: 'South', conference: 'AFC' },
  '10': { division: 'South', conference: 'AFC' },
  // AFC West
  '7': { division: 'West', conference: 'AFC' },
  '12': { division: 'West', conference: 'AFC' },
  '13': { division: 'West', conference: 'AFC' },
  '24': { division: 'West', conference: 'AFC' },
  // NFC East
  '6': { division: 'East', conference: 'NFC' },
  '19': { division: 'East', conference: 'NFC' },
  '21': { division: 'East', conference: 'NFC' },
  '28': { division: 'East', conference: 'NFC' },
  // NFC North
  '3': { division: 'North', conference: 'NFC' },
  '8': { division: 'North', conference: 'NFC' },
  '9': { division: 'North', conference: 'NFC' },
  '16': { division: 'North', conference: 'NFC' },
  // NFC South
  '1': { division: 'South', conference: 'NFC' },
  '29': { division: 'South', conference: 'NFC' },
  '18': { division: 'South', conference: 'NFC' },
  '27': { division: 'South', conference: 'NFC' },
  // NFC West
  '22': { division: 'West', conference: 'NFC' },
  '14': { division: 'West', conference: 'NFC' },
  '25': { division: 'West', conference: 'NFC' },
  '26': { division: 'West', conference: 'NFC' },
};

// Get NFL standings
export async function getNFLStandings(): Promise<NFLStandings> {
  const url = `${API_V2_BASE}/standings`;
  const data = await fetchESPN<any>(url);

  const conferences: NFLStandings['conferences'] = [];

  // ESPN API returns conferences with standings.entries (flat, no division nesting)
  data.children?.forEach((conf: any) => {
    const confName = conf.name || 'Unknown';
    const isAFC = confName.includes('American') || confName.includes('AFC');
    const confAbbrev = isAFC ? 'AFC' : 'NFC';

    // Parse all teams from the conference standings
    const allTeams: NFLStanding[] = conf.standings?.entries?.map((entry: any) => {
      const getStatValue = (name: string): number | string => {
        const stat = entry.stats?.find((s: any) =>
          s.name === name || s.type === name || s.abbreviation === name
        );
        return stat?.value ?? stat?.displayValue ?? 0;
      };

      const getStatDisplay = (name: string): string => {
        const stat = entry.stats?.find((s: any) =>
          s.name === name || s.type === name || s.abbreviation === name
        );
        return stat?.displayValue || String(stat?.value || '0');
      };

      return {
        team: {
          id: entry.team.id,
          name: entry.team.name || entry.team.displayName,
          abbreviation: entry.team.abbreviation || '',
          displayName: entry.team.displayName || entry.team.name,
          shortDisplayName: entry.team.shortDisplayName || entry.team.name,
          logo: entry.team.logos?.[0]?.href || '',
        },
        wins: parseInt(String(getStatValue('wins'))) || 0,
        losses: parseInt(String(getStatValue('losses'))) || 0,
        ties: parseInt(String(getStatValue('ties'))) || 0,
        pct: getStatDisplay('winPercent') || '.000',
        divisionWins: parseInt(String(getStatValue('divisionWins'))) || 0,
        divisionLosses: parseInt(String(getStatValue('divisionLosses'))) || 0,
        conferenceWins: parseInt(String(getStatValue('vsconf_wins'))) || 0,
        conferenceLosses: parseInt(String(getStatValue('vsconf_losses'))) || 0,
        pointsFor: parseInt(String(getStatValue('pointsFor'))) || 0,
        pointsAgainst: parseInt(String(getStatValue('pointsAgainst'))) || 0,
        streak: getStatDisplay('streak') || '-',
        seed: parseInt(String(getStatValue('playoffSeed'))) || undefined,
      };
    }) || [];

    // Group teams by division
    const divisionMap = new Map<string, NFLStanding[]>();
    allTeams.forEach(team => {
      const teamDiv = TEAM_DIVISIONS[team.team.id];
      if (teamDiv && teamDiv.conference === confAbbrev) {
        const divName = teamDiv.division;
        if (!divisionMap.has(divName)) {
          divisionMap.set(divName, []);
        }
        divisionMap.get(divName)!.push(team);
      }
    });

    // Create divisions array with sorted teams
    const divisions = ['East', 'North', 'South', 'West'].map(divName => {
      const teams = divisionMap.get(divName) || [];
      // Sort by wins, then losses
      teams.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
      });
      return {
        id: `${confAbbrev.toLowerCase()}-${divName.toLowerCase()}`,
        name: divName,
        teams,
      };
    });

    conferences.push({
      id: String(conf.id || confAbbrev.toLowerCase()),
      name: confAbbrev,
      divisions,
    });
  });

  return { conferences };
}

// Get team info
export async function getNFLTeam(teamId: string): Promise<NFLTeamInfo | null> {
  const url = `${API_BASE}/teams/${teamId}`;

  try {
    const data = await fetchESPN<any>(url);
    const team = data.team;

    if (!team) return null;

    const record = team.record?.items?.find((r: any) => r.type === 'total')?.summary || 
                   team.record?.items?.[0]?.summary || '-';

    return {
      team: {
        id: team.id,
        name: team.name || team.displayName,
        abbreviation: team.abbreviation || '',
        displayName: team.displayName || team.name,
        shortDisplayName: team.shortDisplayName || team.name,
        logo: team.logos?.[0]?.href || '',
        color: team.color,
        alternateColor: team.alternateColor,
      },
      conference: team.groups?.parent?.name || '',
      division: team.groups?.name || '',
      record,
      schedule: [],
      venue: team.franchise?.venue ? {
        name: team.franchise.venue.fullName,
        city: team.franchise.venue.address?.city || '',
        capacity: team.franchise.venue.capacity,
      } : undefined,
    };
  } catch {
    return null;
  }
}

// Get team schedule
export async function getNFLTeamSchedule(teamId: string): Promise<NFLTeamScheduleGame[]> {
  // Get both regular season and postseason games
  const season = getCurrentNFLSeason();
  const regularSeasonUrl = `${API_BASE}/teams/${teamId}/schedule?seasontype=2&season=${season}`;
  const postseasonUrl = `${API_BASE}/teams/${teamId}/schedule?seasontype=3&season=${season}`;

  try {
    const [regularData, postData] = await Promise.all([
      fetchESPN<any>(regularSeasonUrl),
      fetchESPN<any>(postseasonUrl).catch(() => ({ events: [] })),
    ]);

    // Mark postseason events
    const regularEvents = (regularData.events || []).map((e: any) => ({ ...e, isPostseason: false }));
    const postEvents = (postData.events || []).map((e: any) => ({ ...e, isPostseason: true }));
    const events = [...regularEvents, ...postEvents];

    return events.map((event: any) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const teamCompetitor = competitors.find((c: any) => c.id === teamId || c.team?.id === teamId);
      const opponentCompetitor = competitors.find((c: any) => c.id !== teamId && c.team?.id !== teamId);

      const isHome = teamCompetitor?.homeAway === 'home';
      const status = GAME_STATUS_MAP[event.status?.type?.name] || 'scheduled';

      let result;
      if (status === 'final' && teamCompetitor && opponentCompetitor) {
        const teamScore = parseInt(teamCompetitor.score) || 0;
        const oppScore = parseInt(opponentCompetitor.score) || 0;
        result = {
          win: teamScore > oppScore,
          score: `${teamScore}-${oppScore}`,
        };
      }

      // For postseason games, use round name instead of week number
      const weekNumber = event.week?.number;
      const weekDisplay = event.isPostseason && weekNumber
        ? PLAYOFF_ROUND_NAMES[weekNumber] || `Playoff Wk ${weekNumber}`
        : weekNumber;

      return {
        id: event.id,
        date: new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        opponent: opponentCompetitor ? {
          id: opponentCompetitor.team?.id || opponentCompetitor.id,
          name: opponentCompetitor.team?.name || 'TBD',
          abbreviation: opponentCompetitor.team?.abbreviation || '',
          displayName: opponentCompetitor.team?.displayName || 'TBD',
          shortDisplayName: opponentCompetitor.team?.shortDisplayName || 'TBD',
          logo: opponentCompetitor.team?.logos?.[0]?.href || '',
        } : {
          id: 'tbd',
          name: 'TBD',
          abbreviation: 'TBD',
          displayName: 'TBD',
          shortDisplayName: 'TBD',
          logo: '',
        },
        isHome,
        result,
        status,
        week: weekDisplay,
      };
    });
  } catch {
    return [];
  }
}

// Get team-specific player stats using the leaders endpoint with team filter
export async function getNFLTeamStats(teamId: string): Promise<{
  passing: any[];
  rushing: any[];
  receiving: any[];
  defense: any[];
}> {
  const url = `https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders?team=${teamId}`;

  try {
    const data = await fetchESPN<any>(url);

    const extractLeaders = (categoryName: string) => {
      const category = data.leaders?.categories?.find((c: any) =>
        c.name?.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category?.leaders) return [];

      return category.leaders.slice(0, 5).map((leader: any) => ({
        player: {
          id: leader.athlete?.id || '',
          name: leader.athlete?.displayName || '',
          headshot: leader.athlete?.headshot?.href || '',
          position: leader.athlete?.position?.abbreviation || '',
        },
        displayValue: leader.displayValue || '',
        value: leader.value || 0,
      }));
    };

    return {
      passing: extractLeaders('passingYards'),
      rushing: extractLeaders('rushingYards'),
      receiving: extractLeaders('receivingYards'),
      defense: extractLeaders('totalTackles'),
    };
  } catch {
    return {
      passing: [],
      rushing: [],
      receiving: [],
      defense: [],
    };
  }
}

// Get NFL stat leaders (regular season stats)
export async function getNFLLeaders(): Promise<{
  passingYards: any[];
  rushingYards: any[];
  receivingYards: any[];
  passingTouchdowns: any[];
  rushingTouchdowns: any[];
  receivingTouchdowns: any[];
  sacks: any[];
  interceptions: any[];
  tackles: any[];
}> {
  // Use core API to get regular season stats (types/2 = regular season)
  const coreUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${getCurrentNFLSeason()}/types/2/leaders?limit=5`;

  try {
    const data = await fetchESPN<any>(coreUrl);

    // Helper to extract athlete ID from ref URL
    const getAthleteId = (ref: string) => {
      const match = ref.match(/athletes\/(\d+)/);
      return match ? match[1] : '';
    };

    // Helper to extract team ID from ref URL
    const getTeamId = (ref: string) => {
      const match = ref.match(/teams\/(\d+)/);
      return match ? match[1] : '';
    };

    // NFL team data for quick lookup
    const NFL_TEAM_DATA: Record<string, { name: string; abbreviation: string; logo: string }> = {
      '1': { name: 'Falcons', abbreviation: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
      '2': { name: 'Bills', abbreviation: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
      '3': { name: 'Bears', abbreviation: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
      '4': { name: 'Bengals', abbreviation: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
      '5': { name: 'Browns', abbreviation: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
      '6': { name: 'Cowboys', abbreviation: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
      '7': { name: 'Broncos', abbreviation: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
      '8': { name: 'Lions', abbreviation: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
      '9': { name: 'Packers', abbreviation: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
      '10': { name: 'Titans', abbreviation: 'TEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
      '11': { name: 'Colts', abbreviation: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
      '12': { name: 'Chiefs', abbreviation: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
      '13': { name: 'Raiders', abbreviation: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
      '14': { name: 'Rams', abbreviation: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
      '15': { name: 'Dolphins', abbreviation: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
      '16': { name: 'Vikings', abbreviation: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
      '17': { name: 'Patriots', abbreviation: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
      '18': { name: 'Saints', abbreviation: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
      '19': { name: 'Giants', abbreviation: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
      '20': { name: 'Jets', abbreviation: 'NYJ', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
      '21': { name: 'Eagles', abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
      '22': { name: 'Cardinals', abbreviation: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
      '23': { name: 'Steelers', abbreviation: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
      '24': { name: 'Chargers', abbreviation: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
      '25': { name: '49ers', abbreviation: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
      '26': { name: 'Seahawks', abbreviation: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
      '27': { name: 'Buccaneers', abbreviation: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
      '28': { name: 'Commanders', abbreviation: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
      '29': { name: 'Panthers', abbreviation: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
      '30': { name: 'Jaguars', abbreviation: 'JAX', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
      '33': { name: 'Ravens', abbreviation: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
      '34': { name: 'Texans', abbreviation: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
    };

    const extractLeaders = (categoryName: string) => {
      const category = data.categories?.find((c: any) =>
        c.name?.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category?.leaders) return [];

      return category.leaders.slice(0, 5).map((leader: any) => {
        const athleteId = getAthleteId(leader.athlete?.$ref || '');
        const teamId = getTeamId(leader.team?.$ref || '');
        const teamData = NFL_TEAM_DATA[teamId] || { name: '', abbreviation: '', logo: '' };

        return {
          player: {
            id: athleteId,
            name: '', // Will be populated by athlete fetch if needed
            headshot: athleteId ? `https://a.espncdn.com/i/headshots/nfl/players/full/${athleteId}.png` : '',
            position: '',
          },
          team: {
            id: teamId,
            name: teamData.name,
            abbreviation: teamData.abbreviation,
            logo: teamData.logo,
          },
          value: leader.value || 0,
          displayValue: leader.displayValue || String(leader.value || 0),
        };
      });
    };

    // Fetch athlete names in parallel
    const fetchAthleteNames = async (leaders: any[]) => {
      const athletePromises = leaders.map(async (leader) => {
        if (!leader.player.id) return leader;
        try {
          const athleteUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${getCurrentNFLSeason()}/athletes/${leader.player.id}`;
          const athleteData = await fetch(athleteUrl).then(r => r.json());
          leader.player.name = athleteData.displayName || '';
          leader.player.position = athleteData.position?.abbreviation || '';
        } catch {
          // Silently fail - headshot is more important than name
        }
        return leader;
      });
      return Promise.all(athletePromises);
    };

    // Extract all categories
    const categories = {
      passingYards: extractLeaders('passingYards'),
      rushingYards: extractLeaders('rushingYards'),
      receivingYards: extractLeaders('receivingYards'),
      passingTouchdowns: extractLeaders('passingTouchdowns'),
      rushingTouchdowns: extractLeaders('rushingTouchdowns'),
      receivingTouchdowns: extractLeaders('receivingTouchdowns'),
      sacks: extractLeaders('sacks'),
      interceptions: extractLeaders('interceptions'),
      tackles: extractLeaders('totalTackles'),
    };

    // Fetch athlete names for all categories in parallel
    const [passingYards, rushingYards, receivingYards, passingTouchdowns, rushingTouchdowns, receivingTouchdowns, sacks, interceptions, tackles] = await Promise.all([
      fetchAthleteNames(categories.passingYards),
      fetchAthleteNames(categories.rushingYards),
      fetchAthleteNames(categories.receivingYards),
      fetchAthleteNames(categories.passingTouchdowns),
      fetchAthleteNames(categories.rushingTouchdowns),
      fetchAthleteNames(categories.receivingTouchdowns),
      fetchAthleteNames(categories.sacks),
      fetchAthleteNames(categories.interceptions),
      fetchAthleteNames(categories.tackles),
    ]);

    return {
      passingYards,
      rushingYards,
      receivingYards,
      passingTouchdowns,
      rushingTouchdowns,
      receivingTouchdowns,
      sacks,
      interceptions,
      tackles,
    };
  } catch {
    return {
      passingYards: [],
      rushingYards: [],
      receivingYards: [],
      passingTouchdowns: [],
      rushingTouchdowns: [],
      receivingTouchdowns: [],
      sacks: [],
      interceptions: [],
      tackles: [],
    };
  }
}

// Get NFL team roster
export async function getNFLRoster(teamId: string): Promise<import('./types/nfl').NFLPlayer[]> {
  const url = `${API_BASE}/teams/${teamId}/roster`;

  try {
    const data = await fetchESPN<any>(url);

    if (!data.athletes) return [];

    return data.athletes.flatMap((group: any) =>
      (group.items || []).map((athlete: any) => ({
        id: athlete.id,
        name: athlete.displayName || athlete.fullName,
        jersey: athlete.jersey || '',
        position: athlete.position?.abbreviation || athlete.position?.name || '',
        headshot: athlete.headshot?.href || '',
        height: athlete.displayHeight,
        weight: athlete.displayWeight,
        age: athlete.age,
        experience: athlete.experience?.years ? `${athlete.experience.years} yrs` : 'Rookie',
        college: athlete.college?.name,
      }))
    );
  } catch {
    return [];
  }
}
