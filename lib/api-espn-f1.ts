// ESPN API client for F1 Racing

import { F1Event, F1Session, F1Driver, F1DriverStanding, F1ConstructorStanding, F1StandingsResponse, F1CalendarEntry } from './types/f1';

const ESPN_F1_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard';
const ESPN_F1_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/summary';

// Map session description to short name
const SESSION_SHORT_NAMES: Record<string, string> = {
  'Practice 1': 'FP1',
  'Practice 2': 'FP2',
  'Practice 3': 'FP3',
  'Qualifying': 'Q',
  'Sprint Qualifying': 'SQ',
  'Sprint': 'Sprint',
  'Race': 'Race',
};

function getSessionShortName(description: string): string {
  return SESSION_SHORT_NAMES[description] || description;
}

function mapStatus(statusName: string): 'scheduled' | 'in_progress' | 'final' {
  if (statusName === 'STATUS_FINAL' || statusName === 'STATUS_ENDED') {
    return 'final';
  }
  if (
    statusName === 'STATUS_IN_PROGRESS' ||
    statusName === 'STATUS_LIVE' ||
    statusName === 'STATUS_HALFTIME'
  ) {
    return 'in_progress';
  }
  return 'scheduled';
}

function formatTimeET(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function determineEventStatus(
  sessions: F1Session[]
): 'scheduled' | 'in_progress' | 'final' {
  const hasInProgress = sessions.some((s) => s.status === 'in_progress');
  if (hasInProgress) return 'in_progress';

  const allFinal = sessions.length > 0 && sessions.every((s) => s.status === 'final');
  if (allFinal) return 'final';

  const hasFinal = sessions.some((s) => s.status === 'final');
  const hasScheduled = sessions.some((s) => s.status === 'scheduled');
  if (hasFinal && hasScheduled) return 'in_progress';

  return 'scheduled';
}

function parseSession(competition: any): F1Session {
  const description = competition.description || competition.type?.text || '';
  const statusName = competition.status?.type?.name || 'STATUS_SCHEDULED';

  return {
    id: competition.id || '',
    name: description,
    shortName: getSessionShortName(description),
    status: mapStatus(statusName),
    date: competition.date || '',
    startTime: formatTimeET(competition.date || ''),
    results: undefined, // Scoreboard does NOT return competitor data
  };
}

function parseDriverFromCompetitor(competitor: any): F1Driver {
  const athlete = competitor.athlete || {};
  const team = competitor.team || {};

  return {
    id: athlete.id || competitor.id || '',
    name: athlete.displayName || athlete.fullName || '',
    shortName: athlete.shortName || athlete.lastName || '',
    team: team.displayName || team.name || undefined,
    flag: athlete.flag?.href || undefined,
    position: competitor.order ?? competitor.position ?? undefined,
    time: competitor.time || competitor.behindTime || undefined,
    points: competitor.points != null ? Number(competitor.points) : undefined,
    status: competitor.status || undefined,
  };
}

/**
 * Fetches F1 events from the ESPN scoreboard.
 * Groups sub-competitions (sessions) into each event.
 * Note: The scoreboard does NOT return competitor/result data.
 */
export async function getF1Events(date?: string): Promise<F1Event[]> {
  try {
    let url = ESPN_F1_SCOREBOARD;
    if (date) {
      url += `?dates=${date}`;
    }

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`ESPN F1 scoreboard error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events: F1Event[] = [];

    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    for (const event of data.events) {
      const competitions = event.competitions || [];
      const sessions: F1Session[] = competitions.map(parseSession);

      const venue = event.venue || competitions[0]?.venue || {};
      const address = venue.address || {};

      const f1Event: F1Event = {
        id: event.id || '',
        name: event.name || '',
        shortName: event.shortName || '',
        circuit: venue.fullName || undefined,
        city: address.city || undefined,
        country: address.country || undefined,
        countryFlag: undefined,
        date: event.date || '',
        startTime: formatTimeET(event.date || ''),
        sessions,
        status: determineEventStatus(sessions),
      };

      events.push(f1Event);
    }

    return events;
  } catch (error) {
    console.error('Failed to fetch F1 events:', error);
    return [];
  }
}

/**
 * Fetches detailed F1 event data from the ESPN summary endpoint.
 * Falls back to scoreboard/calendar data when summary returns 404
 * (common for future events that haven't started yet).
 */
export async function getF1EventDetails(
  eventId: string
): Promise<F1Event | null> {
  try {
    // Try summary endpoint first (has results data)
    const url = `${ESPN_F1_SUMMARY}?event=${eventId}`;
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (res.ok) {
      const data = await res.json();

      const header = data.header || {};
      const eventInfo = header.event || data.event || {};
      const competitions = header.competitions || eventInfo.competitions || data.competitions || [];

      const venue = eventInfo.venue || competitions[0]?.venue || {};
      const address = venue.address || {};

      const sessions: F1Session[] = [];

      for (const comp of competitions) {
        const description = comp.description || comp.type?.text || '';
        const statusName = comp.status?.type?.name || 'STATUS_SCHEDULED';
        const competitors = comp.competitors || [];

        const results: F1Driver[] = competitors.map(parseDriverFromCompetitor);
        results.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

        sessions.push({
          id: comp.id || '',
          name: description,
          shortName: getSessionShortName(description),
          status: mapStatus(statusName),
          date: comp.date || '',
          startTime: formatTimeET(comp.date || ''),
          results: results.length > 0 ? results : undefined,
        });
      }

      return {
        id: eventInfo.id || eventId,
        name: eventInfo.name || '',
        shortName: eventInfo.shortName || '',
        circuit: venue.fullName || undefined,
        city: address.city || undefined,
        country: address.country || undefined,
        countryFlag: undefined,
        date: eventInfo.date || '',
        startTime: formatTimeET(eventInfo.date || ''),
        sessions,
        status: determineEventStatus(sessions),
      };
    }

    // Summary returned non-200 (common for future events) — fall back to scoreboard
    console.log(`[f1] Summary ${res.status} for event ${eventId}, falling back to scoreboard`);
    const sbRes = await fetch(ESPN_F1_SCOREBOARD, { next: { revalidate: 60 } });
    if (!sbRes.ok) return null;

    const sbData = await sbRes.json();

    // Check if this event is in the current scoreboard events array
    const sbEvent = sbData.events?.find((e: any) => String(e.id) === String(eventId));
    if (sbEvent) {
      const competitions = sbEvent.competitions || [];
      const sessions: F1Session[] = competitions.map(parseSession);
      const venue = sbEvent.venue || competitions[0]?.venue || {};
      const address = venue.address || {};

      return {
        id: sbEvent.id || eventId,
        name: sbEvent.name || '',
        shortName: sbEvent.shortName || '',
        circuit: venue.fullName || undefined,
        city: address.city || undefined,
        country: address.country || undefined,
        countryFlag: undefined,
        date: sbEvent.date || '',
        startTime: formatTimeET(sbEvent.date || ''),
        sessions,
        status: determineEventStatus(sessions),
      };
    }

    // Event not in current scoreboard — try to build minimal data from calendar
    const calEntry = sbData.leagues?.[0]?.calendar?.find((c: any) => String(c.id) === String(eventId));
    if (calEntry) {
      const venue = calEntry.venue || {};
      const address = venue.address || {};

      return {
        id: String(calEntry.id),
        name: calEntry.name || '',
        shortName: calEntry.shortName || calEntry.name || '',
        circuit: venue.fullName || venue.shortName || undefined,
        city: address.city || undefined,
        country: address.country || undefined,
        countryFlag: address.countryFlag?.href || undefined,
        date: calEntry.startDate || calEntry.date || '',
        startTime: formatTimeET(calEntry.startDate || calEntry.date || ''),
        sessions: [],
        status: 'scheduled',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch F1 event details:', error);
    return null;
  }
}

/**
 * Fetches the full F1 season calendar from the ESPN scoreboard response.
 * The scoreboard has data.leagues[0].calendar[] with ALL races for the season,
 * while data.events[] only has the current/next race.
 */
export async function getF1Calendar(): Promise<{ calendar: F1CalendarEntry[]; currentEvent: F1Event | null }> {
  try {
    const res = await fetch(ESPN_F1_SCOREBOARD, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`ESPN F1 scoreboard: ${res.status}`);
    const data = await res.json();

    // Parse full calendar from leagues
    const calendar: F1CalendarEntry[] = [];
    const leagueCalendar = data?.leagues?.[0]?.calendar || [];

    for (let i = 0; i < leagueCalendar.length; i++) {
      const entry = leagueCalendar[i];
      if (!entry) continue;

      const startDate = entry.startDate || entry.date || '';
      const endDate = entry.endDate || startDate;
      const now = new Date();
      const eventEnd = new Date(endDate);
      const eventStart = new Date(startDate);

      let status: 'upcoming' | 'in_progress' | 'complete' = 'upcoming';
      if (eventEnd < now) {
        status = 'complete';
      } else if (eventStart <= now && eventEnd >= now) {
        status = 'in_progress';
      }

      const venue = entry.venue || {};
      const address = venue.address || {};

      calendar.push({
        id: String(entry.id || ''),
        name: entry.name || `Round ${i + 1}`,
        shortName: entry.shortName || entry.name || '',
        date: startDate,
        startDate,
        endDate,
        circuit: venue.fullName || venue.shortName || '',
        city: address.city || '',
        country: address.country || '',
        countryFlag: address.countryFlag?.href || '',
        status,
        round: i + 1,
      });
    }

    // Parse current event with full session details (from data.events)
    let currentEvent: F1Event | null = null;
    if (data.events && data.events.length > 0) {
      const events = await getF1Events();
      currentEvent = events[0] || null;
    }

    return { calendar, currentEvent };
  } catch (err) {
    console.error('F1 calendar fetch error:', err);
    return { calendar: [], currentEvent: null };
  }
}

// ---------------------------------------------------------------------------
// F1 Standings (Driver + Constructor Championships)
// ---------------------------------------------------------------------------

const ESPN_F1_DRIVER_STANDINGS =
  'https://site.web.api.espn.com/apis/v2/sports/racing/f1/standings';

function getConstructorStandingsUrl(): string {
  const year = new Date().getFullYear();
  return `https://sports.core.api.espn.com/v2/sports/racing/leagues/f1/seasons/${year}/types/1/standings/1`;
}

function findStat(stats: any[], name: string): number {
  const s = stats.find((st: any) => st.name === name);
  return s?.value != null ? Number(s.value) : 0;
}

function findStatDisplay(stats: any[], name: string): string {
  const s = stats.find((st: any) => st.name === name);
  return s?.displayValue || '0';
}

async function fetchDriverStandings(): Promise<F1DriverStanding[]> {
  try {
    const res = await fetch(ESPN_F1_DRIVER_STANDINGS, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[f1] driver standings fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const entries = data.children?.[0]?.standings?.entries || [];

    return entries.map((entry: any): F1DriverStanding => {
      const athlete = entry.athlete || {};
      const stats = entry.stats || [];
      const team = entry.team?.displayName || entry.team?.name || undefined;

      return {
        position: findStat(stats, 'rank'),
        driver: {
          id: athlete.id || '',
          name: athlete.displayName || '',
          shortName: athlete.shortName || '',
          flag: athlete.flag?.href || undefined,
        },
        team,
        points: findStat(stats, 'championshipPts'),
        wins: findStat(stats, 'wins'),
        poles: findStat(stats, 'poles'),
        top5: findStat(stats, 'top5'),
        top10: findStat(stats, 'top10'),
        behind: findStat(stats, 'behind'),
      };
    });
  } catch (error) {
    console.error('Failed to fetch F1 driver standings:', error);
    return [];
  }
}

async function fetchConstructorStandings(): Promise<F1ConstructorStanding[]> {
  try {
    const url = getConstructorStandingsUrl();
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[f1] constructor standings fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const entries = data.entries || [];

    // Resolve manufacturer names in parallel
    const results = await Promise.allSettled(
      entries.map(async (entry: any) => {
        const stats = entry.stats || [];
        let teamName = '';
        let teamShortName = '';
        let teamId = '';

        if (entry.manufacturer?.$ref) {
          try {
            const mfgRes = await fetch(entry.manufacturer.$ref, { next: { revalidate: 300 } });
            if (mfgRes.ok) {
              const mfg = await mfgRes.json();
              teamName = mfg.name || '';
              teamShortName = mfg.shortName || mfg.name || '';
              teamId = mfg.id || '';
            }
          } catch {
            // Fall through to empty strings
          }
        }

        return {
          position: findStat(stats, 'rank'),
          team: {
            id: teamId,
            name: teamName,
            shortName: teamShortName,
          },
          points: findStat(stats, 'championshipPts'),
          wins: findStat(stats, 'wins'),
          poles: findStat(stats, 'poles'),
          behind: findStat(stats, 'behind'),
        } as F1ConstructorStanding;
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<F1ConstructorStanding> => r.status === 'fulfilled')
      .map((r) => r.value);
  } catch (error) {
    console.error('Failed to fetch F1 constructor standings:', error);
    return [];
  }
}

/**
 * Fetches both driver and constructor championship standings.
 */
export async function getF1Standings(): Promise<F1StandingsResponse> {
  const [driverStandings, constructorStandings] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
  ]);

  return { driverStandings, constructorStandings };
}
