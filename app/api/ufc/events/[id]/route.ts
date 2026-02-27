import { NextResponse } from 'next/server';
import { getCachedUFCEvent } from '@/lib/ufc-cache-helpers';
import { getUFCEventDetails } from '@/lib/api-espn-ufc';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try cache first
    const { event: cachedEvent, isFresh } = await getCachedUFCEvent(params.id);

    if (cachedEvent && isFresh) {
      return NextResponse.json({ event: cachedEvent });
    }

    // Cache miss or stale — fall back to direct API
    const event = await getUFCEventDetails(params.id);

    if (event) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('ufc_events_cache')
        .upsert({
          id: `ufc_${event.id}`,
          espn_event_id: event.id,
          event_name: event.name,
          event_date: event.date ? event.date.split('T')[0] : null,
          status: event.status,
          event_data: event,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[ufc] event cache write error:', error.message);
        });

      return NextResponse.json({ event });
    }

    // If direct API failed, return stale cache if available
    if (cachedEvent) {
      return NextResponse.json({ event: cachedEvent });
    }

    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  } catch (error) {
    console.error('UFC event detail error:', error);

    try {
      const { event } = await getCachedUFCEvent(params.id);
      if (event) {
        return NextResponse.json({ event });
      }
    } catch {}

    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
