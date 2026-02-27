import { NextResponse } from 'next/server';
import { getCachedUFCEvents } from '@/lib/ufc-cache-helpers';
import { getUFCEvents, getUFCCalendar } from '@/lib/api-espn-ufc';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch calendar in parallel with cache check
    const [{ events: cachedEvents, isFresh }, calendar] = await Promise.all([
      getCachedUFCEvents(),
      getUFCCalendar(),
    ]);

    if (cachedEvents.length > 0 && isFresh) {
      return NextResponse.json({ events: cachedEvents, calendar });
    }

    // Cache miss or stale — fall back to direct API
    const events = await getUFCEvents();

    if (events.length > 0) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      const records = events.map(event => ({
        id: `ufc_${event.id}`,
        espn_event_id: event.id,
        event_name: event.name,
        event_date: event.date ? event.date.split('T')[0] : null,
        status: event.status,
        event_data: event,
        updated_at: new Date().toISOString(),
      }));

      supabase
        .from('ufc_events_cache')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[ufc] events cache write error:', error.message);
        });

      return NextResponse.json({ events, calendar });
    }

    // If direct API also failed, return stale cache if available
    if (cachedEvents.length > 0) {
      return NextResponse.json({ events: cachedEvents, calendar });
    }

    return NextResponse.json({ events: [], calendar });
  } catch (error) {
    console.error('UFC events error:', error);

    try {
      const { events } = await getCachedUFCEvents();
      if (events.length > 0) {
        return NextResponse.json({ events, calendar: [] });
      }
    } catch {}

    return NextResponse.json({ events: [], calendar: [] }, { status: 500 });
  }
}
