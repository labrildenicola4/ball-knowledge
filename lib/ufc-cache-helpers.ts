// UFC cache helpers - reads from ufc_events_cache

import { supabase } from '@/lib/supabase';
import type { UFCEvent } from '@/lib/types/ufc';

const EVENTS_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Get all UFC events from cache, ordered by event_date.
 */
export async function getCachedUFCEvents(): Promise<{
  events: UFCEvent[];
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('ufc_events_cache')
    .select('event_data, updated_at')
    .order('event_date', { ascending: true });

  if (error || !data || data.length === 0) {
    return { events: [], isFresh: false };
  }

  const events = data.map((row: any) => row.event_data as UFCEvent);

  const mostRecent = data.reduce((latest: number, row: any) => {
    const t = new Date(row.updated_at).getTime();
    return t > latest ? t : latest;
  }, 0);

  const isFresh = Date.now() - mostRecent < EVENTS_TTL_MS;

  return { events, isFresh };
}

/**
 * Get a single UFC event from cache by ESPN event ID.
 */
export async function getCachedUFCEvent(eventId: string): Promise<{
  event: UFCEvent | null;
  isFresh: boolean;
}> {
  const { data, error } = await supabase
    .from('ufc_events_cache')
    .select('event_data, updated_at')
    .eq('espn_event_id', eventId)
    .single();

  if (error || !data) {
    return { event: null, isFresh: false };
  }

  const event = data.event_data as UFCEvent;
  const isFresh = Date.now() - new Date(data.updated_at).getTime() < EVENTS_TTL_MS;

  return { event, isFresh };
}
