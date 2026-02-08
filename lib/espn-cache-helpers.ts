// ESPN cache helpers - reads from espn_games_cache and transforms to sport-specific frontend formats

import { supabase } from '@/lib/supabase';
import {
  ESPN_SPORTS,
  ESPNSportKey,
  ESPN_GAMES_TABLE,
  ESPNGameRecord,
  getEasternDateString,
} from '@/lib/espn-sync-config';
import type { BasketballGame, BasketballTeam } from '@/lib/types/basketball';
import type { NFLGame, NFLTeam } from '@/lib/types/nfl';
import type { MLBGame, MLBTeam } from '@/lib/types/mlb';
import type { CollegeFootballGame, CollegeFootballTeam } from '@/lib/types/college-football';

// Freshness threshold: 60 seconds
const FRESHNESS_TTL_MS = 60 * 1000;

/**
 * Query espn_games_cache for a sport + date.
 * Returns the records and whether the data is considered fresh.
 */
export async function getCachedGames(
  sport: ESPNSportKey,
  date?: string
): Promise<{ records: ESPNGameRecord[]; isFresh: boolean }> {
  const config = ESPN_SPORTS[sport];
  const targetDate = date || getEasternDateString();

  const { data, error } = await supabase
    .from(ESPN_GAMES_TABLE)
    .select('*')
    .eq('sport_type', config.sportType)
    .eq('game_date', targetDate)
    .order('kickoff', { ascending: true });

  if (error || !data || data.length === 0) {
    return { records: [], isFresh: false };
  }

  const records = data as ESPNGameRecord[];

  // Check freshness: most recent updated_at within threshold
  const mostRecent = records.reduce((latest, r) => {
    const t = new Date(r.updated_at).getTime();
    return t > latest ? t : latest;
  }, 0);

  const isFresh = Date.now() - mostRecent < FRESHNESS_TTL_MS;

  return { records, isFresh };
}

// ---------- Shared helpers ----------

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------- NBA ----------

function buildBasketballTeam(
  r: ESPNGameRecord,
  side: 'home' | 'away'
): BasketballTeam {
  const prefix = side === 'home' ? 'home' : 'away';
  return {
    id: r[`${prefix}_team_id`],
    name: r[`${prefix}_team_name`],
    abbreviation: r[`${prefix}_team_abbrev`],
    displayName: r[`${prefix}_team_name`],
    shortDisplayName: r[`${prefix}_team_abbrev`],
    logo: r[`${prefix}_team_logo`] || '',
    color: r[`${prefix}_team_color`] ?? undefined,
    record: r[`${prefix}_team_record`] ?? undefined,
    rank: r[`${prefix}_team_rank`] ?? undefined,
    score: r[`${prefix}_score`] ?? undefined,
  };
}

export function cacheToNBAGame(r: ESPNGameRecord): BasketballGame {
  return {
    id: r.espn_game_id,
    status: r.status as BasketballGame['status'],
    statusDetail: r.status_detail,
    period: r.period || 0,
    clock: r.clock || '',
    homeTeam: buildBasketballTeam(r, 'home'),
    awayTeam: buildBasketballTeam(r, 'away'),
    venue: r.venue ?? undefined,
    broadcast: r.broadcast ?? undefined,
    date: formatDate(r.kickoff),
    startTime: formatTime(r.kickoff),
    conferenceGame: false,
    neutralSite: r.neutral_site,
    conference: 'NBA',
  };
}

// ---------- NFL ----------

export function cacheToNFLGame(r: ESPNGameRecord): NFLGame {
  const extra = (r.extra_data || {}) as Record<string, unknown>;

  const buildTeam = (side: 'home' | 'away'): NFLTeam => ({
    id: r[`${side}_team_id`],
    name: r[`${side}_team_name`],
    abbreviation: r[`${side}_team_abbrev`],
    displayName: r[`${side}_team_name`],
    shortDisplayName: r[`${side}_team_abbrev`],
    logo: r[`${side}_team_logo`] || '',
    color: r[`${side}_team_color`] ?? undefined,
    record: r[`${side}_team_record`] ?? undefined,
    score: r[`${side}_score`] ?? undefined,
  });

  return {
    id: r.espn_game_id,
    status: r.status as NFLGame['status'],
    statusDetail: r.status_detail,
    quarter: r.period || 0,
    clock: r.clock || '',
    possession: (extra.possession as string) ?? undefined,
    homeTeam: buildTeam('home'),
    awayTeam: buildTeam('away'),
    venue: r.venue ?? undefined,
    broadcast: r.broadcast ?? undefined,
    date: formatDate(r.kickoff),
    startTime: formatTime(r.kickoff),
    week: (extra.week as number) ?? undefined,
    seasonType: (extra.seasonType as string) ?? undefined,
  };
}

// ---------- MLB ----------

export function cacheToMLBGame(r: ESPNGameRecord): MLBGame {
  const extra = (r.extra_data || {}) as Record<string, unknown>;

  const buildTeam = (side: 'home' | 'away'): MLBTeam => ({
    id: r[`${side}_team_id`],
    name: r[`${side}_team_name`],
    abbreviation: r[`${side}_team_abbrev`],
    displayName: r[`${side}_team_name`],
    shortDisplayName: r[`${side}_team_abbrev`],
    logo: r[`${side}_team_logo`] || '',
    color: r[`${side}_team_color`] ?? undefined,
    record: r[`${side}_team_record`] ?? undefined,
    score: r[`${side}_score`] ?? undefined,
    hits: (extra[`${side}_hits`] as number) ?? undefined,
    errors: (extra[`${side}_errors`] as number) ?? undefined,
  });

  return {
    id: r.espn_game_id,
    status: r.status as MLBGame['status'],
    statusDetail: r.status_detail,
    inning: r.period || 0,
    inningHalf: ((extra.inningHalf as string) || '') as MLBGame['inningHalf'],
    outs: (extra.outs as number) || 0,
    homeTeam: buildTeam('home'),
    awayTeam: buildTeam('away'),
    venue: r.venue ?? undefined,
    broadcast: r.broadcast ?? undefined,
    date: formatDate(r.kickoff),
    startTime: formatTime(r.kickoff),
    weather: (extra.weather as string) ?? undefined,
    seriesInfo: (extra.seriesInfo as string) ?? undefined,
    situation: (extra.situation as MLBGame['situation']) ?? undefined,
    lineScore: (extra.lineScore as MLBGame['lineScore']) ?? undefined,
  };
}

// ---------- NCAA Basketball ----------

export function cacheToBasketballGame(r: ESPNGameRecord): BasketballGame {
  return {
    id: r.espn_game_id,
    status: r.status as BasketballGame['status'],
    statusDetail: r.status_detail,
    period: r.period || 0,
    clock: r.clock || '',
    homeTeam: buildBasketballTeam(r, 'home'),
    awayTeam: buildBasketballTeam(r, 'away'),
    venue: r.venue ?? undefined,
    broadcast: r.broadcast ?? undefined,
    date: formatDate(r.kickoff),
    startTime: formatTime(r.kickoff),
    conferenceGame: r.conference_game,
    neutralSite: r.neutral_site,
    conference: ((r.extra_data as Record<string, unknown>)?.conference as string) ?? undefined,
  };
}

// ---------- College Football ----------

export function cacheToCollegeFootballGame(r: ESPNGameRecord): CollegeFootballGame {
  const buildTeam = (side: 'home' | 'away'): CollegeFootballTeam => ({
    id: r[`${side}_team_id`],
    name: r[`${side}_team_name`],
    abbreviation: r[`${side}_team_abbrev`],
    displayName: r[`${side}_team_name`],
    shortDisplayName: r[`${side}_team_abbrev`],
    logo: r[`${side}_team_logo`] || '',
    color: r[`${side}_team_color`] ?? undefined,
    record: r[`${side}_team_record`] ?? undefined,
    rank: r[`${side}_team_rank`] ?? undefined,
    score: r[`${side}_score`] ?? undefined,
  });

  return {
    id: r.espn_game_id,
    status: r.status as CollegeFootballGame['status'],
    statusDetail: r.status_detail,
    period: r.period || 0,
    clock: r.clock || '',
    homeTeam: buildTeam('home'),
    awayTeam: buildTeam('away'),
    venue: r.venue ?? undefined,
    broadcast: r.broadcast ?? undefined,
    date: formatDate(r.kickoff),
    startTime: formatTime(r.kickoff),
    conferenceGame: r.conference_game,
    neutralSite: r.neutral_site,
    conference: ((r.extra_data as Record<string, unknown>)?.conference as string) ?? undefined,
  };
}
