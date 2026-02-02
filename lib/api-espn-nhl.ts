// ESPN API client for NHL
// No authentication required - public endpoints

import { NHLGame, NHLTeam, NHLBoxScore, NHLStandings, NHLTeamInfo, NHLStanding, NHLTeamScheduleGame } from './types/nhl';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/hockey/nhl';

// Game status mapping
const GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final'> = {
  'STATUS_SCHEDULED': 'scheduled',
  'STATUS_IN_PROGRESS': 'in_progress',
  'STATUS_HALFTIME': 'in_progress',
  'STATUS_END_PERIOD': 'in_progress',
  'STATUS_FINAL': 'final',
  'STATUS_FINAL_OT': 'final',
  'STATUS_FINAL_SO': 'final',
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

  console.log(`[ESPN-NHL] Fetching: ${url}`);

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
function transformTeam(competitor: any): NHLTeam {
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
function transformGame(event: any): NHLGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away')!;

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
  };
}

// Get games for a specific date
export async function getNHLGames(date?: string): Promise<NHLGame[]> {
  let url = `${API_BASE}/scoreboard?limit=100`;

  if (date) {
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<any>(url, !date);
  return data.events?.map(transformGame) || [];
}

// Get live games only
export async function getLiveNHLGames(): Promise<NHLGame[]> {
  const games = await getNHLGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get game summary/details
export async function getNHLGameSummary(gameId: string): Promise<{
  game: NHLGame;
  boxScore: NHLBoxScore | null;
}> {
  const url = `${API_BASE}/summary?event=${gameId}`;
  const data = await fetchESPN<any>(url, true);

  const event = data.header.competitions[0];
  const homeCompetitor = event.competitors.find((c: any) => c.homeAway === 'home')!;
  const awayCompetitor = event.competitors.find((c: any) => c.homeAway === 'away')!;

  const statusName = data.header.competitions[0].status?.type?.name;
  const status = (statusName && GAME_STATUS_MAP[statusName]) || 'scheduled';

  const game: NHLGame = {
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
  };

  const boxScore: NHLBoxScore | null = null;

  return { game, boxScore };
}

// Get NHL standings
export async function getNHLStandings(): Promise<NHLStandings> {
  const url = `${API_V2_BASE}/standings`;
  const data = await fetchESPN<any>(url);

  const conferences: NHLStandings['conferences'] = [];

  data.children?.forEach((conf: any) => {
    const divisions: any[] = [];

    conf.children?.forEach((div: any) => {
      const teams: NHLStanding[] = div.standings?.entries?.map((entry: any) => {
        const getStatValue = (name: string) => {
          const stat = entry.stats?.find((s: any) => s.name === name || s.type === name);
          return stat?.value ?? stat?.displayValue ?? 0;
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
          wins: parseInt(getStatValue('wins')) || 0,
          losses: parseInt(getStatValue('losses')) || 0,
          otLosses: parseInt(getStatValue('otLosses')) || parseInt(getStatValue('OTL')) || 0,
          points: parseInt(getStatValue('points')) || 0,
          gamesPlayed: parseInt(getStatValue('gamesPlayed')) || 0,
          goalsFor: parseInt(getStatValue('pointsFor')) || 0,
          goalsAgainst: parseInt(getStatValue('pointsAgainst')) || 0,
          goalDiff: parseInt(getStatValue('pointDifferential')) || 0,
          streak: String(getStatValue('streak') || '-'),
          seed: parseInt(getStatValue('playoffSeed')) || undefined,
        };
      }) || [];

      // Sort by points
      teams.sort((a, b) => b.points - a.points);

      divisions.push({
        id: String(div.id),
        name: div.name || 'Unknown',
        teams,
      });
    });

    conferences.push({
      id: String(conf.id),
      name: conf.name || 'Unknown',
      divisions,
    });
  });

  return { conferences };
}

// Get team info
export async function getNHLTeam(teamId: string): Promise<NHLTeamInfo | null> {
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
    console.error(`[ESPN-NHL] Failed to fetch team ${teamId}:`, error);
    return null;
  }
}

// Get team schedule
export async function getNHLTeamSchedule(teamId: string): Promise<NHLTeamScheduleGame[]> {
  const url = `${API_BASE}/teams/${teamId}/schedule`;

  try {
    const data = await fetchESPN<any>(url);
    const events = data.events || [];

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
      };
    });
  } catch (error) {
    console.error(`[ESPN-NHL] Failed to fetch schedule for team ${teamId}:`, error);
    return [];
  }
}
