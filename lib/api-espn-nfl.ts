// ESPN API client for NFL
// No authentication required - public endpoints

import { NFLGame, NFLTeam, NFLBoxScore, NFLStandings, NFLTeamInfo, NFLStanding, NFLTeamScheduleGame } from './types/nfl';

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

  console.log(`[ESPN-NFL] Fetching: ${url}`);

  const response = await fetch(url, {
    cache: isLive ? 'no-store' : 'default',
    next: { revalidate: isLive ? 0 : 60 },
  });

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
  } catch (error) {
    console.error(`[ESPN-NFL] Failed to fetch team ${teamId}:`, error);
    return null;
  }
}

// Get team schedule
export async function getNFLTeamSchedule(teamId: string): Promise<NFLTeamScheduleGame[]> {
  // Get both regular season and postseason games
  const regularSeasonUrl = `${API_BASE}/teams/${teamId}/schedule?seasontype=2&season=2025`;
  const postseasonUrl = `${API_BASE}/teams/${teamId}/schedule?seasontype=3&season=2025`;

  try {
    const [regularData, postData] = await Promise.all([
      fetchESPN<any>(regularSeasonUrl),
      fetchESPN<any>(postseasonUrl).catch(() => ({ events: [] })),
    ]);

    const events = [...(regularData.events || []), ...(postData.events || [])];

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
        week: event.week?.number,
      };
    });
  } catch (error) {
    console.error(`[ESPN-NFL] Failed to fetch schedule for team ${teamId}:`, error);
    return [];
  }
}

// Get NFL stat leaders
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
  const url = 'https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders';

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
  } catch (error) {
    console.error('[ESPN-NFL] Failed to fetch leaders:', error);
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
