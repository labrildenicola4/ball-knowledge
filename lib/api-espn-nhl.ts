// ESPN API client for NHL
// No authentication required - public endpoints

import { NHLGame, NHLTeam, NHLBoxScore, NHLPlayerStats, NHLTeamStats, NHLStandings, NHLTeamInfo, NHLStanding, NHLTeamScheduleGame, NHLPlayer, NHLPlayerSeasonStats } from './types/nhl';

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
  enrichment: {
    venue?: { name: string; city: string; state?: string; capacity?: number };
    attendance?: number;
    officials?: string[];
    headlines?: string[];
    scoringSummary?: Array<{ period: number; clock: string; text: string; team: string; scorer?: string; assists?: string[] }>;
    penaltySummary?: Array<{ period: number; clock: string; text: string; team: string; player?: string; penalty?: string; minutes?: number }>;
    gameNote?: string;
    threeStars?: Array<{ name: string; team: string; stats?: string }>;
  };
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

  // --- Box Score extraction ---
  let boxScore: NHLBoxScore | null = null;

  try {
    const bsData = data.boxscore;
    if (bsData?.players?.length >= 2 && bsData?.teams?.length >= 2) {
      const parseTeamBoxScore = (playersGroup: any, teamStats: any) => {
        // Parse team-level stats
        const getTeamStat = (name: string): number => {
          const s = teamStats?.statistics?.find((st: any) => st.name === name);
          return parseInt(s?.displayValue ?? s?.value ?? '0') || 0;
        };
        const getTeamStatFloat = (name: string): number => {
          const s = teamStats?.statistics?.find((st: any) => st.name === name);
          return parseFloat(s?.displayValue ?? s?.value ?? '0') || 0;
        };

        const stats: NHLTeamStats = {
          goals: game.status === 'final'
            ? (teamStats.homeAway === 'home' ? (homeCompetitor.score ?? 0) : (awayCompetitor.score ?? 0))
            : 0,
          shots: getTeamStat('shotsTotal'),
          powerPlayGoals: getTeamStat('powerPlayGoals'),
          powerPlayOpportunities: getTeamStat('powerPlayOpportunities'),
          penaltyMinutes: getTeamStat('penaltyMinutes'),
          hits: getTeamStat('hits'),
          blockedShots: getTeamStat('blockedShots'),
          faceoffWins: getTeamStat('faceoffsWon'),
          faceoffLosses: 0,
          giveaways: getTeamStat('giveaways'),
          takeaways: getTeamStat('takeaways'),
        };
        // Derive faceoff losses from total and wins
        const totalFO = Math.round(getTeamStat('faceoffsWon') / (getTeamStatFloat('faceoffPercent') / 100 || 1));
        stats.faceoffLosses = totalFO - stats.faceoffWins;

        // Parse player stats from all groups (forwards, defenses, goalies)
        const players: NHLPlayerStats[] = [];
        for (const group of (playersGroup.statistics || [])) {
          const labels: string[] = group.labels || [];
          const isGoalie = group.name?.toLowerCase() === 'goalies';

          for (const athlete of (group.athletes || [])) {
            const statValues: string[] = athlete.stats || [];
            const getVal = (label: string): string => {
              const idx = labels.indexOf(label);
              return idx >= 0 && idx < statValues.length ? statValues[idx] : '0';
            };

            if (isGoalie) {
              players.push({
                id: String(athlete.athlete?.id || ''),
                name: athlete.athlete?.displayName || '',
                jersey: athlete.athlete?.jersey || '',
                position: 'G',
                goals: 0,
                assists: 0,
                points: 0,
                plusMinus: 0,
                penaltyMinutes: parseInt(getVal('PIM')) || 0,
                shots: 0,
                saves: parseInt(getVal('SV')) || 0,
                goalsAgainst: parseInt(getVal('GA')) || 0,
                savePercentage: getVal('SV%'),
              });
            } else {
              const goals = parseInt(getVal('G')) || 0;
              const assists = parseInt(getVal('A')) || 0;
              players.push({
                id: String(athlete.athlete?.id || ''),
                name: athlete.athlete?.displayName || '',
                jersey: athlete.athlete?.jersey || '',
                position: group.name === 'forwards' ? 'F' : 'D',
                goals,
                assists,
                points: goals + assists,
                plusMinus: parseInt(getVal('+/-')) || 0,
                penaltyMinutes: parseInt(getVal('PIM')) || 0,
                shots: parseInt(getVal('SOG')) || parseInt(getVal('S')) || 0,
                hits: parseInt(getVal('HT')) || 0,
                blockedShots: parseInt(getVal('BS')) || 0,
              });
            }
          }
        }

        return {
          team: {
            id: String(playersGroup.team?.id || teamStats?.team?.id || ''),
            name: playersGroup.team?.displayName || teamStats?.team?.displayName || '',
            abbreviation: playersGroup.team?.abbreviation || teamStats?.team?.abbreviation || '',
            displayName: playersGroup.team?.displayName || teamStats?.team?.displayName || '',
            shortDisplayName: playersGroup.team?.shortDisplayName || teamStats?.team?.shortDisplayName || '',
            logo: playersGroup.team?.logo || teamStats?.team?.logo || '',
          },
          players,
          stats,
        };
      };

      // Match players groups to teams by homeAway
      const homePlayersGroup = bsData.players.find((p: any) => p.team?.id === homeCompetitor.team?.id) || bsData.players[0];
      const awayPlayersGroup = bsData.players.find((p: any) => p.team?.id === awayCompetitor.team?.id) || bsData.players[1];
      const homeTeamStats = bsData.teams.find((t: any) => t.homeAway === 'home') || bsData.teams[0];
      const awayTeamStats = bsData.teams.find((t: any) => t.homeAway === 'away') || bsData.teams[1];

      boxScore = {
        homeTeam: parseTeamBoxScore(homePlayersGroup, homeTeamStats),
        awayTeam: parseTeamBoxScore(awayPlayersGroup, awayTeamStats),
      };
    }
  } catch (e) {
    console.error('[NHL] Box score parsing error:', e);
  }

  // --- Enrichment extraction for RAG/AI ---

  // Venue
  const venueData = data.gameInfo?.venue;
  const venue = venueData
    ? {
        name: venueData.fullName || venueData.shortName || '',
        city: venueData.address?.city || '',
        state: venueData.address?.state as string | undefined,
        capacity: venueData.capacity as number | undefined,
      }
    : undefined;

  // Attendance
  const attendance = data.gameInfo?.attendance as number | undefined;

  // Officials
  const officials: string[] | undefined = data.gameInfo?.officials
    ?.map((o: any) => {
      const name = o.displayName || o.fullName || '';
      const position = o.position?.displayName || '';
      return position ? `${name} (${position})` : name;
    })
    .filter(Boolean);

  // Game notes
  const notes = data.header?.competitions?.[0]?.notes;
  const gameNote = notes?.length
    ? notes.map((n: any) => n.headline || n.text || '').filter(Boolean).join('; ')
    : undefined;

  // Headlines from news articles
  const headlines: string[] | undefined = data.news?.articles
    ?.map((a: any) => a.headline as string)
    .filter(Boolean);

  // Scoring summary - filter plays for goals (type id 505 for NHL goals)
  const allPlays: any[] = data.plays || [];
  const scoringPlays = allPlays.filter(
    (p: any) =>
      p.scoringPlay === true ||
      p.type?.id === '505' ||
      p.type?.text?.toLowerCase()?.includes('goal')
  );
  const scoringSummary = scoringPlays.length
    ? scoringPlays.map((p: any) => {
        const participants = p.participants || [];
        const scorerParticipant = participants.find((pp: any) => pp.type === 'scorer' || pp.athlete);
        const assistParticipants = participants.filter((pp: any) => pp.type === 'assist');
        return {
          period: p.period?.number || p.period || 0,
          clock: p.clock?.displayValue || p.displayClock || '',
          text: p.text || p.shortText || '',
          team: p.team?.abbreviation || p.team?.displayName || '',
          scorer: scorerParticipant?.athlete?.displayName as string | undefined,
          assists: assistParticipants.length
            ? assistParticipants.map((a: any) => a.athlete?.displayName).filter(Boolean) as string[]
            : undefined,
        };
      })
    : undefined;

  // Penalty summary - filter plays for penalties (type id 509 for NHL penalties)
  const penaltyPlays = allPlays.filter(
    (p: any) =>
      p.type?.id === '509' ||
      p.type?.id === '510' ||
      p.type?.text?.toLowerCase()?.includes('penalty')
  );
  const penaltySummary = penaltyPlays.length
    ? penaltyPlays.map((p: any) => {
        const participants = p.participants || [];
        const penalizedPlayer = participants.find((pp: any) => pp.athlete);
        return {
          period: p.period?.number || p.period || 0,
          clock: p.clock?.displayValue || p.displayClock || '',
          text: p.text || p.shortText || '',
          team: p.team?.abbreviation || p.team?.displayName || '',
          player: penalizedPlayer?.athlete?.displayName as string | undefined,
          penalty: p.type?.text as string | undefined,
          minutes: p.penaltyMinutes as number | undefined,
        };
      })
    : undefined;

  // Three stars (leaders section - ESPN sometimes includes "threeStars" or top performers)
  const threeStarsRaw: any[] = data.threeStars || data.leaders || [];
  const threeStars = threeStarsRaw.length
    ? threeStarsRaw
        .slice(0, 3)
        .map((star: any) => {
          // Format varies: could be direct athlete or nested under leaders
          const athlete = star.athlete || star.leaders?.[0]?.leaders?.[0]?.athlete;
          const statLine =
            star.stats || star.displayValue || star.leaders?.[0]?.leaders?.[0]?.displayValue;
          const teamInfo =
            star.team?.abbreviation || athlete?.team?.abbreviation || star.team?.displayName || '';
          return {
            name: athlete?.displayName || star.displayName || star.name || '',
            team: teamInfo,
            stats: statLine as string | undefined,
          };
        })
        .filter((s: { name: string }) => s.name)
    : undefined;

  const enrichment = {
    venue,
    attendance,
    officials: officials?.length ? officials : undefined,
    headlines: headlines?.length ? headlines : undefined,
    scoringSummary,
    penaltySummary,
    gameNote: gameNote || undefined,
    threeStars,
  };

  return { game, boxScore, enrichment };
}

// Get NHL standings
export async function getNHLStandings(): Promise<NHLStandings> {
  const url = `${API_V2_BASE}/standings?level=3`;
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
  } catch {
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
  } catch {
    return [];
  }
}

// Fetch individual player season stats
export async function fetchNHLPlayerStats(playerId: string): Promise<NHLPlayerSeasonStats | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/hockey/nhl/athletes/${playerId}/stats`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return null;

    const data = await response.json();
    const categories: any[] = data.categories || [];

    // Detect goalie by looking for goalie-specific categories
    const goalieCategory = categories.find((c: any) => {
      const labels: string[] = c.labels || [];
      return labels.includes('GAA') || labels.includes('SV%') || c.name?.toLowerCase().includes('goaltending');
    });

    if (goalieCategory) {
      const statistics = goalieCategory.statistics;
      if (!statistics?.length) return null;

      const currentSeason = statistics[statistics.length - 1];
      const statValues: string[] = currentSeason?.stats || [];
      const labels: string[] = goalieCategory.labels || [];

      const getVal = (label: string): string => {
        const idx = labels.indexOf(label);
        return idx >= 0 && idx < statValues.length ? statValues[idx] : '0';
      };

      return {
        type: 'goalie',
        gamesPlayed: parseInt(getVal('GP')) || 0,
        wins: parseInt(getVal('W')) || 0,
        losses: parseInt(getVal('L')) || 0,
        otLosses: parseInt(getVal('OTL')) || 0,
        goalsAgainst: parseInt(getVal('GA')) || 0,
        goalsAgainstAverage: parseFloat(getVal('GAA')) || 0,
        saves: parseInt(getVal('SV')) || 0,
        savePercentage: parseFloat(getVal('SV%')) || 0,
        shutouts: parseInt(getVal('SO')) || 0,
      };
    }

    // Skater stats
    const skaterCategory = categories.find((c: any) => {
      const labels: string[] = c.labels || [];
      return labels.includes('G') || labels.includes('PTS') || c.name?.toLowerCase().includes('skating');
    });

    if (!skaterCategory?.statistics?.length) return null;

    const currentSeason = skaterCategory.statistics[skaterCategory.statistics.length - 1];
    const statValues: string[] = currentSeason?.stats || [];
    const labels: string[] = skaterCategory.labels || [];

    const getVal = (label: string): string => {
      const idx = labels.indexOf(label);
      return idx >= 0 && idx < statValues.length ? statValues[idx] : '0';
    };

    return {
      type: 'skater',
      gamesPlayed: parseInt(getVal('GP')) || 0,
      goals: parseInt(getVal('G')) || 0,
      assists: parseInt(getVal('A')) || 0,
      points: parseInt(getVal('PTS')) || 0,
      plusMinus: parseInt(getVal('+/-')) || 0,
      penaltyMinutes: parseInt(getVal('PIM')) || 0,
      powerPlayGoals: parseInt(getVal('PPG')) || 0,
      shortHandedGoals: parseInt(getVal('SHG')) || 0,
      gameWinningGoals: parseInt(getVal('GWG')) || 0,
      shots: parseInt(getVal('SOG')) || parseInt(getVal('S')) || 0,
      shotPct: parseFloat(getVal('S%')) || parseFloat(getVal('SPCT')) || 0,
      timeOnIce: getVal('TOI') || getVal('ATOI') || '0:00',
      hits: parseInt(getVal('HIT')) || parseInt(getVal('HTS')) || 0,
      blockedShots: parseInt(getVal('BLK')) || parseInt(getVal('BS')) || 0,
    };
  } catch {
    return null;
  }
}

// Get team roster with player details and stats
export async function getNHLRoster(teamId: string): Promise<NHLPlayer[]> {
  const url = `${API_BASE}/teams/${teamId}/roster`;

  try {
    const data = await fetchESPN<any>(url);

    const players: NHLPlayer[] = data.athletes?.map((athlete: any) => {
      const birthCity = athlete.birthPlace?.city || '';
      const birthCountry = athlete.birthPlace?.country || '';
      const birthPlace = [birthCity, birthCountry].filter(Boolean).join(', ');

      return {
        id: athlete.id,
        name: athlete.displayName,
        jersey: athlete.jersey || '',
        position: athlete.position?.abbreviation || '',
        headshot: athlete.headshot?.href || `https://a.espncdn.com/i/headshots/nhl/players/full/${athlete.id}.png`,
        height: athlete.displayHeight || '',
        weight: athlete.displayWeight || '',
        age: athlete.age,
        birthDate: athlete.dateOfBirth || athlete.birthDate || undefined,
        birthPlace: birthPlace || undefined,
        shoots: athlete.shoots || athlete.hand || undefined,
        experience: athlete.experience?.years || 0,
        stats: null as NHLPlayerSeasonStats | null,
      };
    }) || [];

    // Fetch stats for all players in parallel (batched)
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const statsResults = await Promise.all(batch.map(p => fetchNHLPlayerStats(p.id)));
      batch.forEach((player, idx) => {
        player.stats = statsResults[idx];
      });
    }

    return players;
  } catch {
    return [];
  }
}

// ---- League Leaders ----

export interface NHLStatLeader {
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

export interface NHLLeaders {
  goals: NHLStatLeader[];
  assists: NHLStatLeader[];
  points: NHLStatLeader[];
  plusMinus: NHLStatLeader[];
  gaa: NHLStatLeader[];
  savePct: NHLStatLeader[];
  wins: NHLStatLeader[];
  shutouts: NHLStatLeader[];
}

interface ESPNLeadersResponse {
  leaders?: {
    categories?: Array<{
      name: string;
      abbreviation?: string;
      leaders?: Array<{
        athlete?: {
          id: string;
          displayName: string;
          headshot?: { href: string };
          team?: {
            id: string;
            name: string;
            abbreviation: string;
            logos?: Array<{ href: string }>;
          };
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

export async function getNHLLeaders(): Promise<NHLLeaders> {
  const url = 'https://site.api.espn.com/apis/site/v3/sports/hockey/nhl/leaders';

  try {
    const data = await fetchESPN<ESPNLeadersResponse>(url);

    const extractLeaders = (categoryName: string): NHLStatLeader[] => {
      const category = data.leaders?.categories?.find(c =>
        c.name?.toLowerCase() === categoryName.toLowerCase() ||
        c.abbreviation?.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category?.leaders) return [];

      return category.leaders.slice(0, 5).map(leader => ({
        player: {
          id: leader.athlete?.id || '',
          name: leader.athlete?.displayName || '',
          headshot: leader.athlete?.headshot?.href || (leader.athlete?.id ? `https://a.espncdn.com/i/headshots/nhl/players/full/${leader.athlete.id}.png` : ''),
        },
        team: {
          id: leader.team?.id || leader.athlete?.team?.id || '',
          name: leader.team?.name || leader.athlete?.team?.name || '',
          abbreviation: leader.team?.abbreviation || leader.athlete?.team?.abbreviation || '',
          logo: leader.team?.logos?.[0]?.href || leader.athlete?.team?.logos?.[0]?.href || '',
        },
        value: leader.value || 0,
        displayValue: leader.displayValue || String(leader.value || 0),
      }));
    };

    return {
      goals: extractLeaders('goals'),
      assists: extractLeaders('assists'),
      points: extractLeaders('points'),
      plusMinus: extractLeaders('plusMinus'),
      gaa: extractLeaders('avgGoalsAgainst'),
      savePct: extractLeaders('savePct'),
      wins: extractLeaders('wins'),
      shutouts: extractLeaders('shutouts'),
    };
  } catch {
    return { goals: [], assists: [], points: [], plusMinus: [], gaa: [], savePct: [], wins: [], shutouts: [] };
  }
}

// ---- Team Rankings ----

export interface NHLTeamRanking {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  value: number;
  displayValue: string;
}

export interface NHLTeamRankings {
  goalsFor: NHLTeamRanking[];
  goalsAgainst: NHLTeamRanking[];
  pointDiff: NHLTeamRanking[];
  points: NHLTeamRanking[];
  powerPlay: NHLTeamRanking[];
}

export async function getNHLTeamRankings(): Promise<NHLTeamRankings> {
  const url = `${API_V2_BASE}/standings?level=3`;

  try {
    const data = await fetchESPN<any>(url);

    // Collect all teams from all conferences/divisions
    const allTeams: Array<{
      team: { id: string; name: string; abbreviation: string; logo: string };
      pointsFor: number;
      pointsAgainst: number;
      pointDiff: number;
      points: number;
      gamesPlayed: number;
    }> = [];

    data.children?.forEach((conf: any) => {
      conf.children?.forEach((div: any) => {
        div.standings?.entries?.forEach((entry: any) => {
          const getStatValue = (name: string): number => {
            const stat = entry.stats?.find((s: any) => s.name === name);
            return parseFloat(stat?.value ?? stat?.displayValue ?? '0') || 0;
          };

          allTeams.push({
            team: {
              id: String(entry.team.id),
              name: entry.team.displayName || entry.team.name || '',
              abbreviation: entry.team.abbreviation || '',
              logo: entry.team.logos?.[0]?.href || '',
            },
            pointsFor: getStatValue('pointsFor'),
            pointsAgainst: getStatValue('pointsAgainst'),
            pointDiff: getStatValue('pointDifferential'),
            points: getStatValue('points'),
            gamesPlayed: getStatValue('gamesPlayed'),
          });
        });
      });
    });

    const toRanking = (
      sortFn: (a: typeof allTeams[0], b: typeof allTeams[0]) => number,
      valueFn: (t: typeof allTeams[0]) => number,
      displayFn: (t: typeof allTeams[0]) => string,
    ): NHLTeamRanking[] => {
      return [...allTeams]
        .sort(sortFn)
        .slice(0, 10)
        .map(t => ({
          team: t.team,
          value: valueFn(t),
          displayValue: displayFn(t),
        }));
    };

    return {
      goalsFor: toRanking(
        (a, b) => (b.pointsFor / b.gamesPlayed) - (a.pointsFor / a.gamesPlayed),
        t => t.pointsFor,
        t => `${(t.pointsFor / t.gamesPlayed).toFixed(1)} GPG`,
      ),
      goalsAgainst: toRanking(
        (a, b) => (a.pointsAgainst / a.gamesPlayed) - (b.pointsAgainst / b.gamesPlayed),
        t => t.pointsAgainst,
        t => `${(t.pointsAgainst / t.gamesPlayed).toFixed(1)} GPG`,
      ),
      pointDiff: toRanking(
        (a, b) => b.pointDiff - a.pointDiff,
        t => t.pointDiff,
        t => `${t.pointDiff > 0 ? '+' : ''}${t.pointDiff}`,
      ),
      points: toRanking(
        (a, b) => b.points - a.points,
        t => t.points,
        t => `${t.points} PTS`,
      ),
      powerPlay: [], // PP% not available from standings
    };
  } catch {
    return { goalsFor: [], goalsAgainst: [], pointDiff: [], points: [], powerPlay: [] };
  }
}
