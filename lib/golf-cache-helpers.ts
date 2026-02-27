// Golf cache helpers - reads from golf_events_cache and golf_standings_cache

import { supabase } from '@/lib/supabase';
import type { GolfTournament } from '@/lib/types/golf';

const EVENTS_TTL_MS = 2 * 60 * 1000; // 2 minutes
const STANDINGS_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get golf events from cache for a specific tour.
 */
export async function getCachedGolfEvents(tourSlug: string): Promise<{
  events: GolfTournament[];
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('golf_events_cache')
    .select('event_data, updated_at')
    .eq('tour_slug', tourSlug)
    .order('event_date', { ascending: true });

  if (error || !data || data.length === 0) {
    return { events: [], isFresh: false };
  }

  const events = data.map((row: any) => row.event_data as GolfTournament);

  const mostRecent = data.reduce((latest: number, row: any) => {
    const t = new Date(row.updated_at).getTime();
    return t > latest ? t : latest;
  }, 0);

  const isFresh = Date.now() - mostRecent < EVENTS_TTL_MS;

  return { events, isFresh };
}

/**
 * Get a single golf event from cache by ESPN event ID.
 */
export async function getCachedGolfEvent(eventId: string): Promise<{
  event: GolfTournament | null;
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('golf_events_cache')
    .select('event_data, updated_at')
    .eq('espn_event_id', eventId)
    .single();

  if (error || !data) {
    return { event: null, isFresh: false };
  }

  const event = data.event_data as GolfTournament;
  const isFresh = Date.now() - new Date(data.updated_at).getTime() < EVENTS_TTL_MS;

  return { event, isFresh };
}

/**
 * Get golf standings/leaders/schedule from cache.
 */
export async function getCachedGolfStandings(tourSlug: string, dataType: string): Promise<{
  data: any | null;
  isFresh: boolean;
}> {
  const id = `${tourSlug}_${dataType}`;

  const { data, error } = await supabase
    .from('golf_standings_cache')
    .select('data, updated_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return { data: null, isFresh: false };
  }

  const isFresh = Date.now() - new Date(data.updated_at).getTime() < STANDINGS_TTL_MS;

  return { data: data.data, isFresh };
}
