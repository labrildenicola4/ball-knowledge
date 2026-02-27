import { UFCEvent, UFCFight, UFCFighter, UFCFightDetail, UFCFighterProfile, UFCFighterRecord, UFCFightStats, UFCCalendarEvent } from './types/ufc';

const ESPN_UFC_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard';
const ESPN_UFC_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/summary';
const ESPN_UFC_CORE = 'https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc';

// Map ESPN status names to our status type
function mapStatus(statusName: string): 'scheduled' | 'in_progress' | 'final' {
  switch (statusName) {
    case 'STATUS_IN_PROGRESS':
      return 'in_progress';
    case 'STATUS_FINAL':
      return 'final';
    case 'STATUS_SCHEDULED':
    default:
      return 'scheduled';
  }
}

// Parse result type from status detail string
// e.g. "Result - KO/TKO" -> "KO/TKO"
// e.g. "Result - Unanimous Decision" -> "UD"
// e.g. "Result - Split Decision" -> "SD"
// e.g. "Result - Majority Decision" -> "MD"
// e.g. "Result - Submission" -> "SUB"
// e.g. "Result - Decision" -> "DEC"
function parseResultType(detail: string): string | undefined {
  if (!detail) return undefined;

  const match = detail.match(/Result\s*-\s*(.+)/i);
  if (!match) return undefined;

  const raw = match[1].trim();

  // Map common decision types to abbreviations
  const mapping: Record<string, string> = {
    'Unanimous Decision': 'UD',
    'Split Decision': 'SD',
    'Majority Decision': 'MD',
    'Submission': 'SUB',
    'Decision': 'DEC',
  };

  return mapping[raw] || raw;
}

// Format a date string to a localized time in ET
function formatStartTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });
  } catch {
    return '';
  }
}

// Transform an ESPN competitor object into a UFCFighter
function mapFighter(competitor: any): UFCFighter {
  const athlete = competitor.athlete || {};
  return {
    id: competitor.id || athlete.id || '',
    name: athlete.displayName || competitor.displayName || '',
    shortName: athlete.shortName || competitor.shortName || '',
    logo: athlete.headshot?.href || athlete.logo || '',
    record: competitor.records?.[0]?.summary,
    flag: athlete.flag?.href,
    winner: competitor.winner ?? undefined,
    score: competitor.score,
  };
}

// Transform an ESPN competition object into a UFCFight
function mapFight(competition: any, eventDate: string): UFCFight {
  const competitors = competition.competitors || [];
  const status = competition.status?.type || {};

  return {
    id: competition.id || '',
    status: mapStatus(status.name),
    statusDetail: status.detail || '',
    fighter1: mapFighter(competitors[0] || {}),
    fighter2: mapFighter(competitors[1] || {}),
    weightClass: competition.type?.text,
    cardSegment: competition.note,
    round: competition.status?.period,
    clock: competition.status?.displayClock,
    resultType: parseResultType(status.detail || ''),
    broadcast: competition.geoBroadcasts?.[0]?.media?.shortName || competition.broadcasts?.[0]?.names?.[0] || undefined,
    startTime: formatStartTime(competition.date || eventDate),
    date: competition.date || eventDate,
  };
}

// Determine overall event status from its fights
function deriveEventStatus(fights: UFCFight[]): 'scheduled' | 'in_progress' | 'final' {
  if (fights.some((f) => f.status === 'in_progress')) return 'in_progress';
  if (fights.length > 0 && fights.every((f) => f.status === 'final')) return 'final';
  return 'scheduled';
}

// Transform an ESPN event object into a UFCEvent
function mapEvent(event: any): UFCEvent {
  const competitions = event.competitions || [];
  const fights = competitions.map((c: any) => mapFight(c, event.date));
  const venue = event.competitions?.[0]?.venue;

  return {
    id: event.id || '',
    name: event.name || '',
    shortName: event.shortName || '',
    date: event.date || '',
    venue: venue?.fullName,
    city: venue?.address
      ? [venue.address.city, venue.address.state || venue.address.country]
          .filter(Boolean)
          .join(', ')
      : undefined,
    fights,
    status: deriveEventStatus(fights),
    startTime: formatStartTime(event.date),
  };
}

/**
 * Fetch UFC events from the ESPN scoreboard API.
 * Optionally pass a date string (YYYYMMDD) to fetch a specific date.
 */
export async function getUFCEvents(date?: string): Promise<UFCEvent[]> {
  try {
    const url = new URL(ESPN_UFC_SCOREBOARD);
    if (date) {
      url.searchParams.set('dates', date);
    }

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) {
      console.error(`ESPN UFC scoreboard error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events = data.events || [];

    return events.map(mapEvent);
  } catch (error) {
    console.error('Error fetching UFC events:', error);
    return [];
  }
}

/**
 * Fetch the full UFC season calendar from the ESPN scoreboard API.
 * Extracts leagues[0].calendar[] which contains all events for the season.
 */
export async function getUFCCalendar(): Promise<UFCCalendarEvent[]> {
  try {
    const res = await fetch(ESPN_UFC_SCOREBOARD, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`ESPN UFC calendar error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const calendarEntries: any[] = data.leagues?.[0]?.calendar || [];
    const now = new Date();

    return calendarEntries
      .map((entry: any) => {
        // Extract event ID from $ref URL if present
        let id = entry.id || '';
        if (!id && entry.event?.$ref) {
          const match = entry.event.$ref.match(/events\/(\d+)/);
          if (match) id = match[1];
        }
        if (!id && entry.$ref) {
          const match = entry.$ref.match(/events\/(\d+)/);
          if (match) id = match[1];
        }

        const eventDate = new Date(entry.startDate || entry.date || '');
        const endDate = entry.endDate ? new Date(entry.endDate) : eventDate;

        let status: 'upcoming' | 'in_progress' | 'complete';
        if (endDate < now) {
          status = 'complete';
        } else if (eventDate <= now && now <= endDate) {
          status = 'in_progress';
        } else {
          status = 'upcoming';
        }

        // Parse venue/city from the entry if available
        const venue = entry.venue?.fullName;
        const address = entry.venue?.address;
        const city = address
          ? [address.city, address.state || address.country].filter(Boolean).join(', ')
          : undefined;

        return {
          id,
          name: entry.label || entry.name || '',
          shortName: entry.shortName || entry.label || entry.name || '',
          date: entry.startDate || entry.date || '',
          venue,
          city,
          status,
        };
      })
      .filter((e: UFCCalendarEvent) => e.id && e.name)
      .sort((a: UFCCalendarEvent, b: UFCCalendarEvent) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching UFC calendar:', error);
    return [];
  }
}

/**
 * Fetch detailed UFC event info.
 * Uses the core API to get event metadata + date, then the scoreboard API
 * with that date to get the full fight cards (the /summary endpoint 404s).
 */
export async function getUFCEventDetails(eventId: string): Promise<UFCEvent | null> {
  try {
    // 1. Get event metadata from core API
    const coreEvent = await fetchCoreJSON(`${ESPN_UFC_CORE}/events/${eventId}`);
    if (!coreEvent) return null;

    const eventDate = coreEvent.date || coreEvent.startDate || '';

    // 2. Use scoreboard with the event date to get full fight cards
    if (eventDate) {
      const dateStr = eventDate.slice(0, 10).replace(/-/g, '');
      const events = await getUFCEvents(dateStr);
      const match = events.find(e => e.id === eventId);
      if (match) return match;
    }

    // 3. Fallback: build basic event from core data (no fight cards yet)
    let venue: string | undefined;
    let city: string | undefined;
    if (coreEvent.venues) {
      const venueItems = coreEvent.venues.items || coreEvent.venues || [];
      for (const v of Array.isArray(venueItems) ? venueItems : []) {
        const venueData = v.$ref ? await fetchCoreJSON(v.$ref) : v;
        if (venueData) {
          venue = venueData.fullName;
          const addr = venueData.address;
          city = addr ? [addr.city, addr.state || addr.country].filter(Boolean).join(', ') : undefined;
          break;
        }
      }
    }

    return {
      id: eventId,
      name: coreEvent.name || '',
      shortName: coreEvent.shortName || '',
      date: eventDate,
      venue,
      city,
      fights: [],
      status: 'scheduled',
      startTime: formatStartTime(eventDate),
    };
  } catch (error) {
    console.error('Error fetching UFC event details:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core API helpers for fight detail
// ---------------------------------------------------------------------------

async function fetchCoreJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function parseFighterRecord(recordData: any): UFCFighterRecord {
  const empty: UFCFighterRecord = {
    wins: 0, losses: 0, draws: 0,
    tkoWins: 0, subWins: 0, decWins: 0,
    tkoLosses: 0, subLosses: 0, decLosses: 0,
    titleWins: 0,
  };

  if (!recordData) return empty;

  // Records endpoint returns { items: [...] }
  const items: any[] = recordData.items || [];

  for (const item of items) {
    const stats: any[] = item.stats || [];
    const getStat = (name: string): number => {
      const s = stats.find((st: any) => st.name === name);
      return s?.value ?? 0;
    };

    // The main "overall" record item
    if (item.type === 'overall' || items.length === 1) {
      return {
        wins: getStat('wins'),
        losses: getStat('losses'),
        draws: getStat('draws'),
        tkoWins: getStat('KOTKOWins'),
        subWins: getStat('submissionWins'),
        decWins: getStat('decisionWins'),
        tkoLosses: getStat('KOTKOLosses'),
        subLosses: getStat('submissionLosses'),
        decLosses: getStat('decisionLosses'),
        titleWins: getStat('titleWins'),
      };
    }
  }

  // Fallback: try first item
  if (items.length > 0) {
    const stats: any[] = items[0].stats || [];
    const getStat = (name: string): number => {
      const s = stats.find((st: any) => st.name === name);
      return s?.value ?? 0;
    };
    return {
      wins: getStat('wins'),
      losses: getStat('losses'),
      draws: getStat('draws'),
      tkoWins: getStat('KOTKOWins'),
      subWins: getStat('submissionWins'),
      decWins: getStat('decisionWins'),
      tkoLosses: getStat('KOTKOLosses'),
      subLosses: getStat('submissionLosses'),
      decLosses: getStat('decisionLosses'),
      titleWins: getStat('titleWins'),
    };
  }

  return empty;
}

function parseFighterProfile(athleteData: any, recordData: any): UFCFighterProfile {
  return {
    id: String(athleteData.id || ''),
    name: athleteData.displayName || athleteData.fullName || '',
    nickname: athleteData.nickname || undefined,
    headshot: athleteData.headshot?.href || `https://a.espncdn.com/i/headshots/mma/players/full/${athleteData.id}.png`,
    flag: athleteData.flag?.href || undefined,
    height: athleteData.displayHeight || undefined,
    weight: athleteData.displayWeight || undefined,
    reach: athleteData.reach ? `${athleteData.reach}"` : undefined,
    stance: athleteData.stance?.displayName || athleteData.stance?.text || undefined,
    age: athleteData.age || undefined,
    association: athleteData.proTeam?.name || athleteData.college?.name || undefined,
    styles: athleteData.style ? [athleteData.style.text || athleteData.style] : undefined,
    record: parseFighterRecord(recordData),
  };
}

function parseFightStats(statsData: any, fighterId: string): UFCFightStats | undefined {
  if (!statsData) return undefined;

  const splits = statsData.splits?.categories || [];
  const allStats: Record<string, number | string> = {};

  for (const cat of splits) {
    for (const stat of (cat.stats || [])) {
      allStats[stat.name] = stat.value ?? stat.displayValue ?? 0;
    }
  }

  const getNum = (name: string): number => {
    const v = allStats[name];
    return typeof v === 'number' ? v : parseInt(String(v)) || 0;
  };
  const getStr = (name: string): string => String(allStats[name] || '0:00');

  return {
    fighterId,
    knockdowns: getNum('knockdowns'),
    sigStrikesLanded: getNum('significantStrikesLanded'),
    sigStrikesAttempted: getNum('significantStrikesAttempted'),
    totalStrikesLanded: getNum('totalStrikesLanded'),
    totalStrikesAttempted: getNum('totalStrikesAttempted'),
    takedownsLanded: getNum('takedownsLanded'),
    takedownsAttempted: getNum('takedownsAttempted'),
    submissionAttempts: getNum('submissionAttempts'),
    controlTime: getStr('controlTime'),
    headStrikesLanded: getNum('headSignificantStrikesLanded'),
    bodyStrikesLanded: getNum('bodySignificantStrikesLanded'),
    legStrikesLanded: getNum('legSignificantStrikesLanded'),
  };
}

/**
 * Fetch detailed fight info from the ESPN core API.
 * Includes fighter profiles, records, fight stats, and referee.
 */
export async function getUFCFightDetail(eventId: string, competitionId: string): Promise<UFCFightDetail | null> {
  try {
    // 1. Fetch the competition detail
    const compUrl = `${ESPN_UFC_CORE}/events/${eventId}/competitions/${competitionId}`;
    const compData = await fetchCoreJSON(compUrl);
    if (!compData) return null;

    const competitors = compData.competitors?.items || compData.competitors || [];
    const status = compData.status?.type || {};

    // Extract competitor IDs (core API uses $ref or nested objects)
    const competitorEntries: { id: string; athleteId: string; winner?: boolean; score?: string }[] = [];

    for (const comp of competitors) {
      // If the competitor has a $ref, follow it
      let competitorData = comp;
      if (comp.$ref && !comp.id) {
        competitorData = await fetchCoreJSON(comp.$ref) || comp;
      }

      const athleteRef = competitorData.athlete?.$ref;
      let athleteId = competitorData.athlete?.id || competitorData.id || '';

      // Try to extract athlete ID from $ref URL
      if (athleteRef && !athleteId) {
        const match = athleteRef.match(/athletes\/(\d+)/);
        if (match) athleteId = match[1];
      }

      competitorEntries.push({
        id: competitorData.id || athleteId,
        athleteId,
        winner: competitorData.winner,
        score: competitorData.score?.displayValue || competitorData.score,
      });
    }

    if (competitorEntries.length < 2) {
      // Fallback: use the summary API to get basic fight info
      return null;
    }

    // 2. Fetch fighter profiles, records, and fight stats in parallel
    const [
      athlete1Data, athlete2Data,
      record1Data, record2Data,
      stats1Data, stats2Data,
      officialsData,
    ] = await Promise.all([
      fetchCoreJSON(`${ESPN_UFC_CORE}/athletes/${competitorEntries[0].athleteId}`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/athletes/${competitorEntries[1].athleteId}`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/athletes/${competitorEntries[0].athleteId}/records`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/athletes/${competitorEntries[1].athleteId}/records`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/events/${eventId}/competitions/${competitionId}/competitors/${competitorEntries[0].id}/statistics`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/events/${eventId}/competitions/${competitionId}/competitors/${competitorEntries[1].id}/statistics`),
      fetchCoreJSON(`${ESPN_UFC_CORE}/events/${eventId}/competitions/${competitionId}/officials`),
    ]);

    // Build fighter objects from basic competition data (for name/record display)
    const fighter1: UFCFighter = {
      id: competitorEntries[0].athleteId,
      name: athlete1Data?.displayName || '',
      shortName: athlete1Data?.shortName || '',
      logo: athlete1Data?.headshot?.href || '',
      record: athlete1Data?.records?.[0]?.summary || undefined,
      flag: athlete1Data?.flag?.href,
      winner: competitorEntries[0].winner,
      score: competitorEntries[0].score,
    };

    const fighter2: UFCFighter = {
      id: competitorEntries[1].athleteId,
      name: athlete2Data?.displayName || '',
      shortName: athlete2Data?.shortName || '',
      logo: athlete2Data?.headshot?.href || '',
      record: athlete2Data?.records?.[0]?.summary || undefined,
      flag: athlete2Data?.flag?.href,
      winner: competitorEntries[1].winner,
      score: competitorEntries[1].score,
    };

    // Parse referee
    let referee: string | undefined;
    if (officialsData) {
      const refs = officialsData.items || officialsData;
      if (Array.isArray(refs) && refs.length > 0) {
        const refEntry = refs[0];
        if (refEntry.$ref) {
          const refData = await fetchCoreJSON(refEntry.$ref);
          referee = refData?.displayName || refData?.fullName;
        } else {
          referee = refEntry.displayName || refEntry.fullName;
        }
      }
    }

    return {
      id: competitionId,
      eventId,
      status: mapStatus(status.name || compData.status?.type?.name || ''),
      statusDetail: status.detail || '',
      weightClass: compData.type?.text || compData.type?.abbreviation || undefined,
      scheduledRounds: compData.format?.regulation?.periods || undefined,
      resultType: parseResultType(status.detail || ''),
      round: compData.status?.period,
      clock: compData.status?.displayClock,
      date: compData.date || '',
      fighter1,
      fighter2,
      fighter1Profile: athlete1Data ? parseFighterProfile(athlete1Data, record1Data) : undefined,
      fighter2Profile: athlete2Data ? parseFighterProfile(athlete2Data, record2Data) : undefined,
      fighter1Stats: parseFightStats(stats1Data, competitorEntries[0].athleteId),
      fighter2Stats: parseFightStats(stats2Data, competitorEntries[1].athleteId),
      referee,
    };
  } catch (error) {
    console.error('Error fetching UFC fight detail:', error);
    return null;
  }
}
