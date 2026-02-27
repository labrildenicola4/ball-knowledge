import { GolfTournament, GolfPlayer, GolfTourSlug, GolfTourConfig, GolfStatCategory, GolfStatLeader, GolfLeadersResponse, GolfRankedPlayer, GolfRankingsResponse } from './types/golf';

// ---------------------------------------------------------------------------
// Tour Configurations
// ---------------------------------------------------------------------------

export const GOLF_TOURS: GolfTourConfig[] = [
  { slug: 'pga', espnSlug: 'pga', name: 'PGA Tour', shortName: 'PGA', color: '#003F2D' },
  { slug: 'eur', espnSlug: 'eur', name: 'DP World Tour', shortName: 'DPWT', color: '#1a3c6e' },
  { slug: 'lpga', espnSlug: 'lpga', name: 'LPGA Tour', shortName: 'LPGA', color: '#00205B' },
  { slug: 'liv', espnSlug: 'liv', name: 'LIV Golf', shortName: 'LIV', color: '#000000' },
];

// Major championships (identified by name keywords)
const MAJOR_KEYWORDS = [
  'Masters',
  'PGA Championship',
  'U.S. Open',
  'Open Championship',
  'The Open',
  // Women's majors
  'Chevron Championship',
  'KPMG',
  "Women's PGA",
  'U.S. Women\'s Open',
  'Women\'s Open',
  'Evian Championship',
  'AIG Women\'s Open',
];

function isMajorTournament(name: string): boolean {
  const lower = name.toLowerCase();
  return MAJOR_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

export function getGolfTour(slug: GolfTourSlug): GolfTourConfig | undefined {
  return GOLF_TOURS.find(t => t.slug === slug);
}

function getBaseUrl(tourSlug: GolfTourSlug): string {
  const tour = GOLF_TOURS.find(t => t.slug === tourSlug);
  const espnSlug = tour?.espnSlug || 'pga';
  return `https://site.api.espn.com/apis/site/v2/sports/golf/${espnSlug}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatus(espnStatus: string): 'scheduled' | 'in_progress' | 'final' {
  switch (espnStatus) {
    case 'STATUS_IN_PROGRESS':
      return 'in_progress';
    case 'STATUS_FINAL':
      return 'final';
    case 'STATUS_SCHEDULED':
    default:
      return 'scheduled';
  }
}

function formatStartTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { timeZone: 'America/New_York' });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate a player's "today" score relative to par (assumed 72).
 * Returns a string like "-3", "E", "+2", or undefined if unavailable.
 */
function calculateToday(
  linescores: any[] | undefined,
  currentRound: number | undefined,
  playerStatus: string | undefined
): string | undefined {
  if (!linescores || !currentRound || playerStatus === 'cut' || playerStatus === 'withdrawn') {
    return undefined;
  }

  const currentRoundScore = linescores[currentRound - 1];
  if (!currentRoundScore || currentRoundScore.value == null) {
    return undefined;
  }

  const par = 72;
  const diff = currentRoundScore.value - par;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

/**
 * Extract rounds array from ESPN linescores.
 * Each linescore entry has a `value` property.
 */
function extractRounds(linescores: any[] | undefined): (number | null)[] {
  if (!linescores || !Array.isArray(linescores)) return [];
  return linescores.map((ls: any) => (ls && ls.value != null ? Number(ls.value) : null));
}

/**
 * Determine the current round number from the competitors' linescores.
 * The current round is the latest round with at least one player having a score.
 */
function detectCurrentRound(competitors: any[]): number | undefined {
  let maxRound = 0;
  for (const c of competitors) {
    if (c.linescores && Array.isArray(c.linescores)) {
      for (let i = c.linescores.length - 1; i >= 0; i--) {
        if (c.linescores[i] && c.linescores[i].value != null) {
          maxRound = Math.max(maxRound, i + 1);
          break;
        }
      }
    }
  }
  return maxRound > 0 ? maxRound : undefined;
}

/**
 * Derive "thru" from the competitor's last round hole-by-hole data.
 * If the last round's linescores (nested) array has entries, its length = holes completed.
 * 18 = finished the round ("F").
 */
function deriveThru(competitor: any, currentRound: number | undefined): string | undefined {
  if (!currentRound || !competitor.linescores) return undefined;
  const roundData = competitor.linescores[currentRound - 1];
  if (!roundData) return undefined;
  // Check for nested hole-by-hole linescores
  const holeScores = roundData.linescores;
  if (holeScores && Array.isArray(holeScores) && holeScores.length > 0) {
    return holeScores.length >= 18 ? 'F' : String(holeScores.length);
  }
  // If no hole data but round has a value, assume finished
  if (roundData.value != null) return 'F';
  return undefined;
}

/**
 * Transform an ESPN competitor object into a GolfPlayer.
 */
function parsePlayer(competitor: any, currentRound?: number): GolfPlayer {
  const athlete = competitor.athlete || {};
  const statusObj = competitor.status || {};
  const positionDisplay = statusObj?.position?.displayName || competitor.order?.toString() || '-';
  const playerStatusName = statusObj?.type?.name?.toLowerCase() || 'active';
  const thruFromAPI = statusObj?.thru != null ? String(statusObj.thru) : undefined;
  const thruDerived = deriveThru(competitor, currentRound);

  const linescores = competitor.linescores;
  const rounds = extractRounds(linescores);
  const today = calculateToday(linescores, currentRound, playerStatusName);

  return {
    id: competitor.id || athlete.id || '',
    name: athlete.displayName || '',
    shortName: athlete.shortName || athlete.displayName || '',
    country: athlete.flag?.alt || undefined,
    countryFlag: athlete.flag?.href || undefined,
    position: positionDisplay,
    score: competitor.score != null ? String(competitor.score) : 'E',
    today,
    thru: thruFromAPI || thruDerived,
    rounds,
    status: playerStatusName,
  };
}

/**
 * Transform an ESPN event object into a GolfTournament.
 */
function parseEvent(event: any, tourSlug: GolfTourSlug): GolfTournament {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors || [];
  const statusName = competition?.status?.type?.name || 'STATUS_SCHEDULED';
  const currentRound = detectCurrentRound(competitors);

  const leaderboard: GolfPlayer[] = competitors.map((c: any) =>
    parsePlayer(c, currentRound)
  );

  // Sort leaderboard by position (numeric first, then ties, then CUT/WD)
  leaderboard.sort((a, b) => {
    const aNum = parseInt(a.position.replace('T', ''), 10);
    const bNum = parseInt(b.position.replace('T', ''), 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    return 0;
  });

  const venue = event.venue || competition?.venue;
  const name = event.name || '';

  return {
    id: event.id || '',
    name,
    shortName: event.shortName || name,
    venue: venue?.fullName || undefined,
    city: venue?.address?.city || undefined,
    course: venue?.course?.name || undefined,
    date: event.date || '',
    startTime: formatStartTime(event.date || ''),
    status: mapStatus(statusName),
    currentRound,
    purse: competition?.purse?.displayValue || undefined,
    defendingChampion: competition?.defendingChampion?.athlete?.displayName || undefined,
    leaderboard,
    tour: tourSlug,
    isMajor: isMajorTournament(name),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch current / upcoming tournaments for a specific tour.
 * Optionally pass a date string (YYYYMMDD) to query a specific date.
 */
export async function getGolfTournaments(date?: string, tour: GolfTourSlug = 'pga'): Promise<GolfTournament[]> {
  try {
    let url = `${getBaseUrl(tour)}/scoreboard`;
    if (date) {
      url += `?dates=${date}`;
    }

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] scoreboard fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events = data.events || [];

    return events.map((event: any) => parseEvent(event, tour));
  } catch (err) {
    console.error(`[golf/${tour}] error fetching tournaments:`, err);
    return [];
  }
}

/**
 * Fetch full leaderboard / event summary for a specific event on a tour.
 */
export async function getGolfLeaderboard(eventId: string, tour: GolfTourSlug = 'pga'): Promise<GolfTournament | null> {
  try {
    const url = `${getBaseUrl(tour)}/summary?event=${eventId}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] summary fetch failed: ${res.status}`);
      return null;
    }

    const data = await res.json();

    // The summary endpoint nests the event data differently.
    // Try to find the event either at top-level or inside `header`.
    const header = data.header || {};
    const competitions = data.competitions || header.competitions || [];
    const competition = competitions[0];

    if (!competition) {
      console.error(`[golf/${tour}] no competition found in summary`);
      return null;
    }

    const competitors = competition.competitors || [];
    const statusName = competition.status?.type?.name || 'STATUS_SCHEDULED';
    const currentRound = detectCurrentRound(competitors);

    const leaderboard: GolfPlayer[] = competitors.map((c: any) =>
      parsePlayer(c, currentRound)
    );

    leaderboard.sort((a, b) => {
      const aNum = parseInt(a.position.replace('T', ''), 10);
      const bNum = parseInt(b.position.replace('T', ''), 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return 0;
    });

    const eventInfo = header.event || data.event || {};
    const venue = eventInfo.venue || competition.venue;
    const name = eventInfo.name || header.name || '';

    return {
      id: eventInfo.id || eventId,
      name,
      shortName: eventInfo.shortName || name,
      venue: venue?.fullName || undefined,
      city: venue?.address?.city || undefined,
      course: venue?.course?.name || undefined,
      date: eventInfo.date || '',
      startTime: formatStartTime(eventInfo.date || ''),
      status: mapStatus(statusName),
      currentRound,
      purse: competition.purse?.displayValue || undefined,
      defendingChampion: competition.defendingChampion?.athlete?.displayName || undefined,
      leaderboard,
      tour,
      isMajor: isMajorTournament(name),
    };
  } catch (err) {
    console.error(`[golf/${tour}] error fetching leaderboard:`, err);
    return null;
  }
}

/**
 * Fetch tournaments from ALL tours at once (for home page / combined view).
 */
export async function getAllGolfTournaments(date?: string): Promise<GolfTournament[]> {
  const results = await Promise.allSettled(
    GOLF_TOURS.map(tour => getGolfTournaments(date, tour.slug))
  );

  const all: GolfTournament[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value);
    }
  }
  return all;
}

/**
 * Fetch the full season schedule/calendar for a tour.
 * Returns all events for the current season with basic info (not full leaderboards).
 */
export async function getGolfSchedule(tour: GolfTourSlug = 'pga'): Promise<GolfTournament[]> {
  try {
    const url = `${getBaseUrl(tour)}/scoreboard`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] schedule fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const league = data.leagues?.[0];
    if (!league) return [];

    // The calendar has all season events
    const calendarEvents = league.calendar || [];
    const allEvents: GolfTournament[] = [];

    for (const cal of calendarEvents) {
      if (cal.event) {
        // Calendar entry has an event object with just IDs
        const event = cal.event;
        allEvents.push({
          id: event.id || cal.id || '',
          name: cal.label || event.name || '',
          shortName: cal.label || event.shortName || '',
          date: cal.startDate || event.date || '',
          startTime: formatStartTime(cal.startDate || event.date || ''),
          status: new Date(cal.endDate || cal.startDate) < new Date() ? 'final' :
                  new Date(cal.startDate) <= new Date() && new Date(cal.endDate || cal.startDate) >= new Date() ? 'in_progress' : 'scheduled',
          leaderboard: [],
          tour,
          isMajor: isMajorTournament(cal.label || ''),
        });
      } else {
        allEvents.push({
          id: cal.id || '',
          name: cal.label || '',
          shortName: cal.label || '',
          date: cal.startDate || '',
          startTime: formatStartTime(cal.startDate || ''),
          status: new Date(cal.endDate || cal.startDate) < new Date() ? 'final' :
                  new Date(cal.startDate) <= new Date() && new Date(cal.endDate || cal.startDate) >= new Date() ? 'in_progress' : 'scheduled',
          leaderboard: [],
          tour,
          isMajor: isMajorTournament(cal.label || ''),
        });
      }
    }

    // Also merge in the current events from scoreboard (which have leaderboard data)
    const currentEvents = (data.events || []).map((e: any) => parseEvent(e, tour));

    // Replace calendar entries with detailed versions if available
    for (const ce of currentEvents) {
      const idx = allEvents.findIndex(e => e.id === ce.id);
      if (idx !== -1) {
        allEvents[idx] = ce;
      } else {
        allEvents.push(ce);
      }
    }

    return allEvents;
  } catch (err) {
    console.error(`[golf/${tour}] error fetching schedule:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Leaders / Stats (v3 leaders endpoint – top 10 per category, with flags)
// Tours supported: pga, lpga
// ---------------------------------------------------------------------------

function getLeadersUrl(tourSlug: GolfTourSlug): string {
  const tour = GOLF_TOURS.find(t => t.slug === tourSlug);
  const espnSlug = tour?.espnSlug || 'pga';
  return `https://site.api.espn.com/apis/site/v3/sports/golf/${espnSlug}/leaders`;
}

// Readable category display names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  officialAmount: 'Money List',
  cupPoints: 'FedEx Cup Points',
  cutsMade: 'Cuts Made',
  yardsPerDrive: 'Driving Distance',
  strokesPerHole: 'Putts Per Hole',
  driveAccuracyPct: 'Driving Accuracy',
  greensInRegPutts: 'Greens in Regulation',
  birdiesPerRound: 'Birdies Per Round',
  scoringAverage: 'Scoring Average',
  wins: 'Wins',
  topTenFinishes: 'Top 10 Finishes',
  greensInRegPct: 'GIR %',
};

function parseLeaderEntry(entry: any, rank: number): GolfStatLeader {
  const athlete = entry.athlete || {};
  return {
    rank,
    player: {
      id: athlete.id || '',
      name: athlete.displayName || athlete.fullName || '',
      shortName: athlete.shortName || athlete.displayName || '',
      headshot: athlete.headshot?.href || undefined,
      flag: athlete.flag?.href || undefined,
      country: athlete.flag?.alt || undefined,
    },
    value: entry.value ?? 0,
    displayValue: entry.displayValue || String(entry.value ?? ''),
  };
}

/**
 * Fetch stat leaders for a tour (top 10 per category).
 * Works for PGA and LPGA. Returns empty for EUR/LIV.
 */
export async function getGolfLeaders(tour: GolfTourSlug = 'pga'): Promise<GolfLeadersResponse> {
  const empty: GolfLeadersResponse = { categories: [] };
  // Only PGA and LPGA have leaders endpoints
  if (tour !== 'pga' && tour !== 'lpga') return empty;

  try {
    const url = getLeadersUrl(tour);
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] leaders fetch failed: ${res.status}`);
      return empty;
    }

    const data = await res.json();
    // v3 leaders endpoint: data.leaders is an object with { categories: [...] }
    const leadersObj = data.leaders || {};
    const rawCategories = leadersObj.categories || (Array.isArray(data.leaders) ? data.leaders : []);

    const categories: GolfStatCategory[] = rawCategories.map((cat: any) => {
      const leaders = (cat.leaders || []).map((entry: any, idx: number) =>
        parseLeaderEntry(entry, idx + 1)
      );

      return {
        name: cat.name || '',
        displayName: CATEGORY_DISPLAY_NAMES[cat.name] || cat.displayName || cat.name || '',
        abbreviation: cat.abbreviation || '',
        leaders,
      };
    });

    return { categories };
  } catch (err) {
    console.error(`[golf/${tour}] error fetching leaders:`, err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Rankings (v2 statistics endpoint – top 50 per category, richer stats)
// Tours supported: pga, lpga
// ---------------------------------------------------------------------------

function getStatisticsUrl(tourSlug: GolfTourSlug): string {
  const tour = GOLF_TOURS.find(t => t.slug === tourSlug);
  const espnSlug = tour?.espnSlug || 'pga';
  return `https://site.api.espn.com/apis/site/v2/sports/golf/${espnSlug}/statistics`;
}

/**
 * Fetch rankings / statistics for a tour (top 50 per category).
 * Works for PGA and LPGA. Returns empty for EUR/LIV.
 */
export async function getGolfRankings(tour: GolfTourSlug = 'pga'): Promise<GolfLeadersResponse> {
  const empty: GolfLeadersResponse = { categories: [] };
  if (tour !== 'pga' && tour !== 'lpga') return empty;

  try {
    const url = getStatisticsUrl(tour);
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] statistics fetch failed: ${res.status}`);
      return empty;
    }

    const data = await res.json();
    // v2 statistics endpoint: data.stats is an object with { categories: [...] }
    const statsObj = data.stats || {};
    const rawCategories = statsObj.categories || (Array.isArray(data.stats) ? data.stats : []);

    const categories: GolfStatCategory[] = rawCategories.map((cat: any) => {
      const leaders = (cat.leaders || []).map((entry: any, idx: number) => {
        const athlete = entry.athlete || {};
        return {
          rank: idx + 1,
          player: {
            id: athlete.id || '',
            name: athlete.displayName || '',
            shortName: athlete.shortName || athlete.displayName || '',
            headshot: athlete.headshot?.href || undefined,
            flag: undefined, // v2 statistics endpoint doesn't include flags
            country: undefined,
          },
          value: entry.value ?? 0,
          displayValue: entry.displayValue || String(entry.value ?? ''),
        } as GolfStatLeader;
      });

      return {
        name: cat.name || '',
        displayName: CATEGORY_DISPLAY_NAMES[cat.name] || cat.displayName || cat.name || '',
        abbreviation: cat.abbreviation || '',
        leaders,
      };
    });

    return { categories };
  } catch (err) {
    console.error(`[golf/${tour}] error fetching rankings:`, err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// FedEx Cup Standings — single ranked list (1-50)
// Uses v2 statistics → cupPoints category for ordering,
// then enriches each player with their inline stats.
// ---------------------------------------------------------------------------

/**
 * Fetch FedEx Cup Standings as a single ranked player list.
 * Each player includes points, events, wins, top-10s, and earnings.
 */
export async function getGolfStandings(tour: GolfTourSlug = 'pga'): Promise<GolfRankingsResponse> {
  const empty: GolfRankingsResponse = { title: 'FedEx Cup Standings', players: [] };
  if (tour !== 'pga' && tour !== 'lpga') return empty;

  try {
    const url = getStatisticsUrl(tour);
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[golf/${tour}] standings fetch failed: ${res.status}`);
      return empty;
    }

    const data = await res.json();
    const statsObj = data.stats || {};
    const rawCategories = statsObj.categories || (Array.isArray(data.stats) ? data.stats : []);

    // Find the FedEx Cup Points category — this is our ordering source
    const cupCat = rawCategories.find((c: any) => c.name === 'cupPoints');
    if (!cupCat || !cupCat.leaders?.length) return empty;

    const title = tour === 'pga' ? 'FedEx Cup Standings' : 'LPGA Tour Standings';

    const players: GolfRankedPlayer[] = cupCat.leaders.map((entry: any, idx: number) => {
      const athlete = entry.athlete || {};
      // Each entry includes inline statistics.splits.categories[0].stats[]
      const statsList = entry.statistics?.splits?.categories?.[0]?.stats || [];

      const findStat = (name: string): string => {
        const s = statsList.find((st: any) => st.name === name);
        return s?.displayValue || '0';
      };

      return {
        rank: idx + 1,
        player: {
          id: athlete.id || '',
          name: athlete.displayName || '',
          shortName: athlete.shortName || athlete.displayName || '',
          headshot: athlete.headshot?.href || undefined,
          flag: undefined,
          country: undefined,
        },
        points: entry.displayValue || String(entry.value ?? '0'),
        pointsValue: entry.value ?? 0,
        events: findStat('tournamentsPlayed'),
        wins: findStat('wins'),
        topTens: findStat('topTenFinishes'),
        earnings: findStat('officialAmount'),
      } as GolfRankedPlayer;
    });

    return { title, players };
  } catch (err) {
    console.error(`[golf/${tour}] error fetching standings:`, err);
    return empty;
  }
}
