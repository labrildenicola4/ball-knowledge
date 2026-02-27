// F1 cache helpers - reads from f1_events_cache and f1_standings_cache

import { supabase } from '@/lib/supabase';
import type { F1Event, F1StandingsResponse } from '@/lib/types/f1';

const EVENTS_TTL_MS = 2 * 60 * 1000; // 2 minutes
const STANDINGS_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all F1 events from cache, ordered by start_date.
 * Returns events and whether the data is fresh enough.
 */
export async function getCachedF1Events(): Promise<{
  events: F1Event[];
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('f1_events_cache')
    .select('event_data, updated_at')
    .order('start_date', { ascending: true });

  if (error || !data || data.length === 0) {
    return { events: [], isFresh: false };
  }

  const events = data.map((row: any) => row.event_data as F1Event);

  // Check freshness based on most recent updated_at
  const mostRecent = data.reduce((latest: number, row: any) => {
    const t = new Date(row.updated_at).getTime();
    return t > latest ? t : latest;
  }, 0);

  const isFresh = Date.now() - mostRecent < EVENTS_TTL_MS;

  return { events, isFresh };
}

/**
 * Get a single F1 event from cache by ESPN event ID.
 */
export async function getCachedF1Event(
  eventId: string
): Promise<{ event: F1Event | null; isFresh: boolean }> {
  const { data, error } = await supabase
    .from('f1_events_cache')
    .select('event_data, updated_at')
    .eq('espn_event_id', eventId)
    .single();

  if (error || !data) {
    return { event: null, isFresh: false };
  }

  const event = data.event_data as F1Event;
  const isFresh = Date.now() - new Date(data.updated_at).getTime() < EVENTS_TTL_MS;

  return { event, isFresh };
}

/**
 * Get F1 standings from cache.
 */
export async function getCachedF1Standings(): Promise<{
  standings: F1StandingsResponse | null;
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('f1_standings_cache')
    .select('driver_standings, constructor_standings, updated_at')
    .eq('id', 'current')
    .single();

  if (error || !data) {
    return { standings: null, isFresh: false };
  }

  const standings: F1StandingsResponse = {
    driverStandings: data.driver_standings || [],
    constructorStandings: data.constructor_standings || [],
  };

  // Empty standings are not considered fresh
  if (standings.driverStandings.length === 0 && standings.constructorStandings.length === 0) {
    return { standings: null, isFresh: false };
  }

  const isFresh = Date.now() - new Date(data.updated_at).getTime() < STANDINGS_TTL_MS;

  return { standings, isFresh };
}
