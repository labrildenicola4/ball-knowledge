import { NextResponse } from 'next/server';
import { getCachedF1Event } from '@/lib/f1-cache-helpers';
import { getF1EventDetails } from '@/lib/api-espn-f1';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try cache first
    const { event: cachedEvent, isFresh } = await getCachedF1Event(params.id);

    if (cachedEvent && isFresh) {
      return NextResponse.json({ event: cachedEvent });
    }

    // Cache miss or stale — fall back to direct API
    const event = await getF1EventDetails(params.id);

    if (event) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('f1_events_cache')
        .upsert({
          id: `f1_${event.id}`,
          espn_event_id: event.id,
          event_name: event.name,
          short_name: event.shortName,
          event_date: event.date ? event.date.split('T')[0] : null,
          start_date: event.date,
          status: event.status,
          event_data: event,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[f1] event cache write error:', error.message);
        });

      return NextResponse.json({ event });
    }

    // If direct API failed, return stale cache if available
    if (cachedEvent) {
      return NextResponse.json({ event: cachedEvent });
    }

    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  } catch (error) {
    console.error('F1 event detail error:', error);

    // Last resort: try stale cache
    try {
      const { event } = await getCachedF1Event(params.id);
      if (event) {
        return NextResponse.json({ event });
      }
    } catch {}

    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
