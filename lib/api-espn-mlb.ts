// ESPN API client for MLB Baseball
// No authentication required - public endpoints

import {
  MLBGame,
  MLBTeam,
  MLBBoxScore,
  MLBPlayerBattingStats,
  MLBPlayerPitchingStats,
  MLBStanding,
  MLBTeamInfo,
  MLBPlayerSeasonStats,
  MLBLeader,
  MLBLeadersResponse,
} from './types/mlb';
import { GAME_STATUS_MAP, INNING_HALF_MAP } from './constants/mlb-teams';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb';
const API_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/baseball/mlb';

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

  // Cache the response
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data as T;
}

// Transform ESPN team data to our format
function transformTeam(competitor: ESPNCompetitor): MLBTeam {
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
    hits: competitor.hits !== undefined ? parseInt(competitor.hits) : undefined,
    errors: competitor.errors !== undefined ? parseInt(competitor.errors) : undefined,
  };
}

// Transform ESPN game to our format
function transformGame(event: ESPNEvent): MLBGame {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const statusName = event.status.type.name;
  const status = GAME_STATUS_MAP[statusName] || 'scheduled';
  const isLive = status === 'in_progress';

  // Parse inning info
  let inning = event.status.period || 0;
  let inningHalf: 'top' | 'bottom' | '' = '';

  if (isLive && event.status.type.shortDetail) {
    const detail = event.status.type.shortDetail;
    const halfMatch = detail.match(/^(Top|Bot|Bottom|Mid|End)/i);
    if (halfMatch) {
      inningHalf = INNING_HALF_MAP[halfMatch[1]] || '';
    }
  }

  // Get situation if live
  let situation: MLBGame['situation'] = undefined;
  if (isLive && competition.situation) {
    const sit = competition.situation;
    situation = {
      balls: sit.balls || 0,
      strikes: sit.strikes || 0,
      onFirst: sit.onFirst || false,
      onSecond: sit.onSecond || false,
      onThird: sit.onThird || false,
      batter: sit.batter?.athlete?.displayName,
      pitcher: sit.pitcher?.athlete?.displayName,
    };
  }

  return {
    id: event.id,
    status,
    statusDetail: event.status.type.shortDetail || event.status.type.detail,
    inning,
    inningHalf,
    outs: competition.situation?.outs || 0,
    homeTeam: transformTeam(homeCompetitor),
    awayTeam: transformTeam(awayCompetitor),
    venue: competition.venue?.fullName,
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    date: new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }),
    rawDate: event.date,
    startTime: new Date(event.date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }),
    weather: competition.weather?.displayValue,
    seriesInfo: competition.series?.summary,
    situation,
  };
}

// Get games for a specific date
export async function getMLBGames(date?: string): Promise<MLBGame[]> {
  let url = `${API_BASE}/scoreboard?limit=100`;

  if (date) {
    // Convert YYYY-MM-DD to YYYYMMDD
    const formattedDate = date.replace(/-/g, '');
    url += `&dates=${formattedDate}`;
  }

  const data = await fetchESPN<ESPNScoreboardResponse>(url, !date);

  return data.events?.map(transformGame) || [];
}

// Get live games only
export async function getLiveMLBGames(): Promise<MLBGame[]> {
  const games = await getMLBGames();
  return games.filter(g => g.status === 'in_progress');
}

// Get game summary/details with box score
export async function getMLBGameSummary(gameId: string): Promise<{
  game: MLBGame;
  boxScore: MLBBoxScore | null;
  lastPlay?: string;
  enrichment: {
    venue?: { name: string; city: string; state?: string; capacity?: number };
    attendance?: number;
    officials?: string[];
    headlines?: string[];
    weather?: { temperature?: string; condition?: string; wind?: string };
    probablePitchers?: { home?: string; away?: string };
    scoringPlays?: Array<{
      inning: number;
      halfInning: string;
      text: string;
      awayScore: number;
      homeScore: number;
    }>;
    gameNote?: string;
  };
}> {
  const url = `${API_BASE}/summary?event=${gameId}`;
  const data = await fetchESPN<ESPNGameSummary>(url, true);

  // Transform main game info
  const event = data.header.competitions[0];
  const homeCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'home')!;
  const awayCompetitor = event.competitors.find((c: ESPNCompetitor) => c.homeAway === 'away')!;

  const statusName = data.header.competitions[0].status?.type?.name;
  const status = (statusName && GAME_STATUS_MAP[statusName]) || 'scheduled';
  const isLive = status === 'in_progress';

  // Parse inning info
  let inning = data.header.competitions[0].status?.period || 0;
  let inningHalf: 'top' | 'bottom' | '' = '';
  const detail = data.header.competitions[0].status?.type?.shortDetail || '';
  const halfMatch = detail.match(/^(Top|Bot|Bottom|Mid|End)/i);
  if (halfMatch) {
    inningHalf = INNING_HALF_MAP[halfMatch[1]] || '';
  }

  const game: MLBGame = {
    id: gameId,
    status,
    statusDetail: detail,
    inning,
    inningHalf,
    outs: 0,
    homeTeam: transformTeam(homeCompetitor),
    awayTeam: transformTeam(awayCompetitor),
    venue: data.gameInfo?.venue?.fullName,
    broadcast: event.broadcasts?.[0]?.names?.[0],
    date: new Date(data.header.competitions[0].date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }),
    rawDate: data.header.competitions[0].date,
    startTime: new Date(data.header.competitions[0].date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }),
    weather: data.gameInfo?.weather?.displayValue,
    seriesInfo: event.series?.summary,
  };

  // Transform box score if available
  let boxScore: MLBBoxScore | null = null;

  if (data.boxscore?.players && data.boxscore.players.length >= 2) {
    const homeBox = data.boxscore.players.find((p: ESPNBoxscoreTeam) =>
      p.team?.id === homeCompetitor.team.id
    ) || data.boxscore.players[0];
    const awayBox = data.boxscore.players.find((p: ESPNBoxscoreTeam) =>
      p.team?.id === awayCompetitor.team.id
    ) || data.boxscore.players[1];

    const extractBatters = (boxTeam: ESPNBoxscoreTeam): MLBPlayerBattingStats[] => {
      const players: MLBPlayerBattingStats[] = [];
      const battingStats = boxTeam.statistics?.find(s => s.type === 'batting');

      battingStats?.athletes?.forEach((athlete, idx) => {
        const getStatValue = (abbrev: string) => {
          const statIdx = battingStats.labels?.indexOf(abbrev) ?? -1;
          return statIdx >= 0 ? athlete.stats[statIdx] : '0';
        };

        players.push({
          id: athlete.athlete.id,
          name: athlete.athlete.displayName,
          jersey: athlete.athlete.jersey || '',
          position: athlete.athlete.position?.abbreviation || '',
          battingOrder: idx + 1,
          atBats: parseInt(getStatValue('AB')) || 0,
          runs: parseInt(getStatValue('R')) || 0,
          hits: parseInt(getStatValue('H')) || 0,
          rbi: parseInt(getStatValue('RBI')) || 0,
          walks: parseInt(getStatValue('BB')) || 0,
          strikeouts: parseInt(getStatValue('K')) || parseInt(getStatValue('SO')) || 0,
          homeRuns: parseInt(getStatValue('HR')) || 0,
          avg: getStatValue('AVG') || '.000',
          obp: getStatValue('OBP') || undefined,
          slg: getStatValue('SLG') || undefined,
          ops: getStatValue('OPS') || undefined,
        });
      });
      return players;
    };

    const extractPitchers = (boxTeam: ESPNBoxscoreTeam): MLBPlayerPitchingStats[] => {
      const players: MLBPlayerPitchingStats[] = [];
      const pitchingStats = boxTeam.statistics?.find(s => s.type === 'pitching');

      pitchingStats?.athletes?.forEach(athlete => {
        const getStatValue = (abbrev: string) => {
          const statIdx = pitchingStats.labels?.indexOf(abbrev) ?? -1;
          return statIdx >= 0 ? athlete.stats[statIdx] : '0';
        };

        players.push({
          id: athlete.athlete.id,
          name: athlete.athlete.displayName,
          jersey: athlete.athlete.jersey || '',
          isWinner: athlete.didWin || false,
          isLoser: athlete.didLose || false,
          isSave: athlete.hasSave || false,
          inningsPitched: getStatValue('IP') || '0.0',
          hits: parseInt(getStatValue('H')) || 0,
          runs: parseInt(getStatValue('R')) || 0,
          earnedRuns: parseInt(getStatValue('ER')) || 0,
          walks: parseInt(getStatValue('BB')) || 0,
          strikeouts: parseInt(getStatValue('K')) || parseInt(getStatValue('SO')) || 0,
          homeRuns: parseInt(getStatValue('HR')) || 0,
          pitchCount: parseInt(getStatValue('PC')) || undefined,
          era: getStatValue('ERA') || '0.00',
        });
      });
      return players;
    };

    // Extract line score
    const lineScore = {
      home: [] as (number | null)[],
      away: [] as (number | null)[],
    };

    if (data.plays) {
      // Try to build line score from linescore data
      const linescore = data.header?.competitions?.[0]?.competitors;
      linescore?.forEach((comp: ESPNCompetitor) => {
        const scores = comp.linescores?.map((ls: { value: number }) => ls.value) || [];
        if (comp.homeAway === 'home') {
          lineScore.home = scores;
        } else {
          lineScore.away = scores;
        }
      });
    }

    boxScore = {
      homeTeam: {
        team: game.homeTeam,
        batting: extractBatters(homeBox),
        pitching: extractPitchers(homeBox),
        stats: {
          runs: game.homeTeam.score || 0,
          hits: game.homeTeam.hits || 0,
          errors: game.homeTeam.errors || 0,
          leftOnBase: 0,
        },
      },
      awayTeam: {
        team: game.awayTeam,
        batting: extractBatters(awayBox),
        pitching: extractPitchers(awayBox),
        stats: {
          runs: game.awayTeam.score || 0,
          hits: game.awayTeam.hits || 0,
          errors: game.awayTeam.errors || 0,
          leftOnBase: 0,
        },
      },
      lineScore,
    };
  }

  // --- RAG Enrichment extraction ---
  const enrichment: {
    venue?: { name: string; city: string; state?: string; capacity?: number };
    attendance?: number;
    officials?: string[];
    headlines?: string[];
    weather?: { temperature?: string; condition?: string; wind?: string };
    probablePitchers?: { home?: string; away?: string };
    scoringPlays?: Array<{
      inning: number;
      halfInning: string;
      text: string;
      awayScore: number;
      homeScore: number;
    }>;
    gameNote?: string;
  } = {};

  // Venue info
  const venueData = data.gameInfo?.venue;
  if (venueData?.fullName) {
    enrichment.venue = {
      name: venueData.fullName,
      city: venueData.address?.city || venueData.city || '',
      state: venueData.address?.state || venueData.state,
      capacity: venueData.capacity,
    };
  }

  // Attendance
  if (data.gameInfo?.attendance != null) {
    enrichment.attendance = data.gameInfo.attendance;
  }

  // Officials / umpires
  if (data.gameInfo?.officials && data.gameInfo.officials.length > 0) {
    enrichment.officials = data.gameInfo.officials
      .map(o => o.displayName || o.fullName || '')
      .filter(Boolean);
  }

  // Weather
  if (data.gameInfo?.weather) {
    const w = data.gameInfo.weather;
    const weatherObj: { temperature?: string; condition?: string; wind?: string } = {};
    if (w.temperature != null) {
      weatherObj.temperature = `${w.temperature}°F`;
    }
    if (w.displayValue) {
      weatherObj.condition = w.displayValue;
    }
    if (w.link?.text) {
      weatherObj.wind = w.link.text;
    }
    if (Object.keys(weatherObj).length > 0) {
      enrichment.weather = weatherObj;
    }
  }

  // Game notes from header
  const notes = data.header.competitions?.[0]?.notes;
  if (notes && notes.length > 0) {
    const noteText = notes
      .map(n => n.headline || n.text || '')
      .filter(Boolean);
    if (noteText.length > 0) {
      enrichment.gameNote = noteText.join('; ');
    }
  }

  // News headlines
  if (data.news?.articles && data.news.articles.length > 0) {
    const headlines = data.news.articles
      .map(a => a.headline || '')
      .filter(Boolean);
    if (headlines.length > 0) {
      enrichment.headlines = headlines;
    }
  }

  // Probable pitchers - extract from boxscore pitching stats (first pitcher per team)
  const homePitchers = boxScore?.homeTeam?.pitching;
  const awayPitchers = boxScore?.awayTeam?.pitching;
  if (homePitchers?.[0] || awayPitchers?.[0]) {
    enrichment.probablePitchers = {
      home: homePitchers?.[0]?.name,
      away: awayPitchers?.[0]?.name,
    };
  }

  // Scoring plays
  if (data.plays && data.plays.length > 0) {
    const scoring = data.plays
      .filter(p => p.scoringPlay === true)
      .map(p => ({
        inning: p.period?.number || 0,
        halfInning: p.halfInning || (p.type?.text || ''),
        text: p.text,
        awayScore: p.awayScore || 0,
        homeScore: p.homeScore || 0,
      }));
    if (scoring.length > 0) {
      enrichment.scoringPlays = scoring;
    }
  }

  return {
    game,
    boxScore,
    lastPlay: data.plays?.[data.plays.length - 1]?.text,
    enrichment,
  };
}

// Get MLB standings
export async function getMLBStandings(): Promise<{
  division: string;
  standings: MLBStanding[];
}[]> {
  const url = `${API_V2_BASE}/standings`;

  const data = await fetchESPN<ESPNStandingsResponse>(url);

  const results: { division: string; standings: MLBStanding[] }[] = [];

  data.children?.forEach(league => {
    league.children?.forEach(division => {
      const divName = division.name || 'Unknown';

      const standings: MLBStanding[] = division.standings?.entries?.map(entry => {
        const getStatValue = (name: string) => {
          const stat = entry.stats?.find((s: ESPNStandingStat) => s.name === name || s.abbreviation === name);
          return stat?.displayValue ?? stat?.value ?? '0';
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
          wins: parseInt(getStatValue('wins') as string) || 0,
          losses: parseInt(getStatValue('losses') as string) || 0,
          pct: String(getStatValue('winPercent') || getStatValue('pct') || '.000'),
          gamesBack: String(getStatValue('gamesBehind') || getStatValue('GB') || '-'),
          homeRecord: String(getStatValue('Home') || getStatValue('homeRecord') || '0-0'),
          awayRecord: String(getStatValue('Away') || getStatValue('awayRecord') || '0-0'),
          last10: String(getStatValue('L10') || getStatValue('last10Record') || '0-0'),
          streak: String(getStatValue('streak') || '-'),
          runDiff: parseInt(getStatValue('differential') as string) || 0,
        };
      }) || [];

      if (standings.length > 0) {
        results.push({ division: divName, standings });
      }
    });
  });

  return results;
}

// Get team info
export async function getMLBTeam(teamId: string): Promise<MLBTeamInfo | null> {
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
      },
      division: {
        id: team.groups?.id || '',
        name: team.groups?.name || 'Unknown',
        shortName: team.groups?.abbreviation || team.groups?.name || '',
      },
      record: team.record?.items?.[0]?.summary || '',
      schedule: data.team.nextEvent?.map(event => ({
        id: event.id,
        date: new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'America/New_York',
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
  } catch {
    return null;
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
}

interface ESPNCompetitor {
  id?: string;
  homeAway: 'home' | 'away';
  team: ESPNTeamBase;
  score?: string;
  hits?: string;
  errors?: string;
  records?: Array<{ summary: string }>;
  linescores?: Array<{ value: number }>;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: { name: string; shortDetail: string; detail: string };
    period?: number;
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    venue?: { fullName: string };
    broadcasts?: Array<{ names: string[] }>;
    weather?: { displayValue: string };
    series?: { summary: string };
    situation?: {
      balls?: number;
      strikes?: number;
      outs?: number;
      onFirst?: boolean;
      onSecond?: boolean;
      onThird?: boolean;
      batter?: { athlete: { displayName: string } };
      pitcher?: { athlete: { displayName: string } };
    };
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

interface ESPNBoxscoreTeam {
  team?: ESPNTeamBase;
  statistics?: Array<{
    type?: string;
    labels?: string[];
    athletes?: Array<{
      athlete: ESPNPlayer;
      stats: string[];
      didWin?: boolean;
      didLose?: boolean;
      hasSave?: boolean;
    }>;
  }>;
}

interface ESPNGameSummary {
  header: {
    competitions: Array<{
      competitors: ESPNCompetitor[];
      broadcasts?: Array<{ names: string[] }>;
      status?: {
        type?: { name: string; shortDetail: string };
        period?: number;
      };
      date: string;
      series?: { summary: string };
      notes?: Array<{ headline?: string; text?: string }>;
    }>;
  };
  gameInfo?: {
    venue?: {
      fullName: string;
      city?: string;
      state?: string;
      capacity?: number;
      address?: { city?: string; state?: string };
    };
    weather?: {
      displayValue: string;
      temperature?: number;
      conditionId?: string;
      highTemperature?: number;
      link?: { text?: string };
    };
    attendance?: number;
    officials?: Array<{
      displayName?: string;
      fullName?: string;
      position?: { name?: string };
    }>;
  };
  boxscore?: {
    players?: ESPNBoxscoreTeam[];
  };
  plays?: Array<{
    text: string;
    scoringPlay?: boolean;
    period?: { number?: number };
    homeScore?: number;
    awayScore?: number;
    type?: { text?: string; abbreviation?: string };
    halfInning?: string;
  }>;
  news?: {
    articles?: Array<{
      headline?: string;
      description?: string;
    }>;
  };
  predictor?: {
    homeTeam?: { gameProjection?: number };
    awayTeam?: { gameProjection?: number };
  };
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
    children?: Array<{
      id: number;
      name?: string;
      standings?: {
        entries?: ESPNStandingsEntry[];
      };
    }>;
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

// Fetch individual MLB player season stats
async function fetchMLBPlayerStats(playerId: string): Promise<MLBPlayerSeasonStats | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/baseball/mlb/athletes/${playerId}/stats`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return null;

    const data = await response.json();
    const categories = data.categories;
    if (!categories || !Array.isArray(categories)) return null;

    const result: MLBPlayerSeasonStats = {};

    // Look for batting stats
    const battingCategory = categories.find((c: any) =>
      c.name === 'batting' || c.displayName?.toLowerCase().includes('batting')
    );
    if (battingCategory?.statistics?.length) {
      const currentSeason = battingCategory.statistics[battingCategory.statistics.length - 1];
      const stats = currentSeason?.stats || [];
      const labels = battingCategory.labels || [];

      const get = (label: string): string => {
        const idx = labels.indexOf(label);
        return idx >= 0 ? stats[idx] : '0';
      };

      result.batting = {
        games: parseInt(get('GP')) || parseInt(get('G')) || 0,
        atBats: parseInt(get('AB')) || 0,
        runs: parseInt(get('R')) || 0,
        hits: parseInt(get('H')) || 0,
        homeRuns: parseInt(get('HR')) || 0,
        rbi: parseInt(get('RBI')) || 0,
        stolenBases: parseInt(get('SB')) || 0,
        battingAverage: get('AVG') || '.000',
        onBasePct: get('OBP') || '.000',
        sluggingPct: get('SLG') || '.000',
        ops: get('OPS') || '.000',
        strikeouts: parseInt(get('K')) || parseInt(get('SO')) || 0,
        walks: parseInt(get('BB')) || 0,
      };
    }

    // Look for pitching stats
    const pitchingCategory = categories.find((c: any) =>
      c.name === 'pitching' || c.displayName?.toLowerCase().includes('pitching')
    );
    if (pitchingCategory?.statistics?.length) {
      const currentSeason = pitchingCategory.statistics[pitchingCategory.statistics.length - 1];
      const stats = currentSeason?.stats || [];
      const labels = pitchingCategory.labels || [];

      const get = (label: string): string => {
        const idx = labels.indexOf(label);
        return idx >= 0 ? stats[idx] : '0';
      };

      result.pitching = {
        wins: parseInt(get('W')) || 0,
        losses: parseInt(get('L')) || 0,
        era: get('ERA') || '0.00',
        inningsPitched: get('IP') || '0.0',
        strikeouts: parseInt(get('K')) || parseInt(get('SO')) || 0,
        walks: parseInt(get('BB')) || 0,
        whip: get('WHIP') || '0.00',
        saves: parseInt(get('SV')) || 0,
        gamesStarted: parseInt(get('GS')) || 0,
        qualityStarts: parseInt(get('QS')) || 0,
      };
    }

    // Return null if we found neither
    if (!result.batting && !result.pitching) return null;

    return result;
  } catch {
    return null;
  }
}

// Get MLB team roster with player stats
export async function getMLBRoster(teamId: string): Promise<import('./types/mlb').MLBPlayer[]> {
  const url = `${API_BASE}/teams/${teamId}/roster`;

  try {
    const data = await fetchESPN<any>(url);

    if (!data.athletes) return [];

    const PITCHING_POSITIONS = ['P', 'SP', 'RP', 'CL'];

    const players: import('./types/mlb').MLBPlayer[] = data.athletes.flatMap((group: any) =>
      (group.items || []).map((athlete: any) => ({
        id: athlete.id,
        name: athlete.displayName || athlete.fullName,
        jersey: athlete.jersey || '',
        position: athlete.position?.abbreviation || athlete.position?.name || '',
        headshot: athlete.headshot?.href || '',
        height: athlete.displayHeight,
        weight: athlete.displayWeight,
        age: athlete.age,
        birthDate: athlete.dateOfBirth,
        batHand: athlete.hand?.displayValue || athlete.batHand?.displayValue,
        throwHand: athlete.throwHand?.displayValue,
        stats: null as MLBPlayerSeasonStats | null,
      }))
    );

    // Fetch stats for all players in parallel (batched)
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const statsResults = await Promise.all(batch.map(p => fetchMLBPlayerStats(p.id)));
      batch.forEach((player, idx) => {
        const fullStats = statsResults[idx];
        if (!fullStats) {
          player.stats = null;
          return;
        }

        const isPitcher = PITCHING_POSITIONS.includes(player.position);

        // Two-way players get both; otherwise filter by position
        if (fullStats.batting && fullStats.pitching) {
          player.stats = fullStats;
        } else if (isPitcher) {
          player.stats = fullStats.pitching ? { pitching: fullStats.pitching } : null;
        } else {
          player.stats = fullStats.batting ? { batting: fullStats.batting } : null;
        }
      });
    }

    return players;
  } catch {
    return [];
  }
}

// Get MLB team schedule with results
export async function getMLBTeamSchedule(teamId: string): Promise<import('./types/mlb').MLBTeamScheduleGame[]> {
  const url = `${API_BASE}/teams/${teamId}/schedule`;

  try {
    const data = await fetchESPN<any>(url);

    if (!data.events) return [];

    return data.events.map((event: any) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const teamComp = competitors.find((c: any) => c.id === teamId || c.team?.id === teamId);
      const opponentComp = competitors.find((c: any) => c.id !== teamId && c.team?.id !== teamId);

      const isHome = teamComp?.homeAway === 'home';
      const statusName = event.status?.type?.name || '';
      const status = GAME_STATUS_MAP[statusName] || 'scheduled';

      let result;
      if (status === 'final' && teamComp && opponentComp) {
        const teamScore = parseInt(teamComp.score) || 0;
        const oppScore = parseInt(opponentComp.score) || 0;
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
          timeZone: 'America/New_York',
        }),
        opponent: opponentComp ? {
          id: opponentComp.team?.id || opponentComp.id,
          name: opponentComp.team?.name || 'TBD',
          abbreviation: opponentComp.team?.abbreviation || '',
          displayName: opponentComp.team?.displayName || 'TBD',
          shortDisplayName: opponentComp.team?.shortDisplayName || 'TBD',
          logo: opponentComp.team?.logos?.[0]?.href || opponentComp.team?.logo || '',
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

// Get MLB recent form (last 5 games)
export async function getMLBRecentForm(teamId: string): Promise<import('./types/mlb').MLBGameResult[]> {
  const schedule = await getMLBTeamSchedule(teamId);

  return schedule
    .filter(g => g.status === 'final' && g.result)
    .slice(-5)
    .map(g => ({
      id: g.id,
      win: g.result!.win,
      score: g.result!.score,
      opponent: g.opponent.abbreviation,
      isHome: g.isHome,
    }));
}

// Get MLB team season stats
export async function getMLBTeamStats(teamId: string): Promise<import('./types/mlb').MLBTeamSeasonStats | null> {
  const url = `${API_BASE}/teams/${teamId}/statistics`;

  try {
    const data = await fetchESPN<any>(url);

    const getStat = (categories: any[], categoryName: string, statName: string) => {
      const category = categories?.find((c: any) => c.name === categoryName || c.displayName === categoryName);
      const stat = category?.stats?.find((s: any) => s.name === statName || s.abbreviation === statName);
      return {
        value: stat?.value || 0,
        displayValue: stat?.displayValue || String(stat?.value || 0),
      };
    };

    const categories = data.results?.stats?.categories || data.stats?.categories || [];

    return {
      batting: {
        avg: getStat(categories, 'batting', 'AVG'),
        homeRuns: getStat(categories, 'batting', 'HR'),
        rbi: getStat(categories, 'batting', 'RBI'),
        runs: getStat(categories, 'batting', 'R'),
        stolenBases: getStat(categories, 'batting', 'SB'),
        obp: getStat(categories, 'batting', 'OBP'),
        slg: getStat(categories, 'batting', 'SLG'),
        ops: getStat(categories, 'batting', 'OPS'),
      },
      pitching: {
        era: getStat(categories, 'pitching', 'ERA'),
        wins: getStat(categories, 'pitching', 'W'),
        losses: getStat(categories, 'pitching', 'L'),
        saves: getStat(categories, 'pitching', 'SV'),
        strikeouts: getStat(categories, 'pitching', 'SO'),
        whip: getStat(categories, 'pitching', 'WHIP'),
      },
    };
  } catch {
    return null;
  }
}

// Get MLB stat leaders
export async function getMLBLeaders(): Promise<MLBLeadersResponse> {
  const url = 'https://site.api.espn.com/apis/site/v3/sports/baseball/mlb/leaders';

  try {
    const data = await fetchESPN<ESPNMLBLeadersResponse>(url);

    const extractLeaders = (categoryName: string): MLBLeader[] => {
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
      battingAverage: extractLeaders('battingAverage'),
      homeRuns: extractLeaders('homeRuns'),
      rbi: extractLeaders('RBI'),
      stolenBases: extractLeaders('stolenBases'),
      era: extractLeaders('ERA'),
      strikeouts: extractLeaders('strikeoutsPitching'),
      wins: extractLeaders('wins'),
      saves: extractLeaders('saves'),
    };
  } catch {
    return {
      battingAverage: [],
      homeRuns: [],
      rbi: [],
      stolenBases: [],
      era: [],
      strikeouts: [],
      wins: [],
      saves: [],
    };
  }
}

// ESPN MLB Leaders Response
interface ESPNMLBLeadersResponse {
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
