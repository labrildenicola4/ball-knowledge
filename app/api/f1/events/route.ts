import { NextResponse } from 'next/server';
import { getCachedF1Events } from '@/lib/f1-cache-helpers';
import { getF1Events, getF1Calendar } from '@/lib/api-espn-f1';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch the full season calendar (includes current event)
    const { calendar, currentEvent } = await getF1Calendar();

    // Try cache first for events
    const { events: cachedEvents, isFresh } = await getCachedF1Events();

    if (cachedEvents.length > 0 && isFresh) {
      return NextResponse.json({ events: cachedEvents, calendar });
    }

    // Cache miss or stale — fall back to direct API
    const events = currentEvent ? [currentEvent] : await getF1Events();

    if (events.length > 0) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      const records = events.map(event => ({
        id: `f1_${event.id}`,
        espn_event_id: event.id,
        event_name: event.name,
        short_name: event.shortName,
        event_date: event.date ? event.date.split('T')[0] : null,
        start_date: event.date,
        status: event.status,
        event_data: event,
        updated_at: new Date().toISOString(),
      }));

      supabase
        .from('f1_events_cache')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[f1] cache write error:', error.message);
        });

      return NextResponse.json({ events, calendar });
    }

    // If direct API also failed, return stale cache if available
    if (cachedEvents.length > 0) {
      return NextResponse.json({ events: cachedEvents, calendar });
    }

    return NextResponse.json({ events: [], calendar });
  } catch (error) {
    console.error('F1 events error:', error);

    // Last resort: try stale cache
    try {
      const { events } = await getCachedF1Events();
      if (events.length > 0) {
        return NextResponse.json({ events, calendar: [] });
      }
    } catch {}

    return NextResponse.json({ events: [], calendar: [] }, { status: 500 });
  }
}
