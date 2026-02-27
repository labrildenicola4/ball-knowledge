import { NextResponse } from 'next/server';
import { getCachedGolfEvents } from '@/lib/golf-cache-helpers';
import { getGolfTournaments, getAllGolfTournaments } from '@/lib/api-espn-golf';
import { createServiceClient } from '@/lib/supabase-server';
import { GolfTourSlug } from '@/lib/types/golf';

export const dynamic = 'force-dynamic';

const VALID_TOURS = new Set<GolfTourSlug>(['pga', 'eur', 'lpga', 'liv']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const tourParam = searchParams.get('tour');
    const hasTour = tourParam && VALID_TOURS.has(tourParam as GolfTourSlug);
    const tour = hasTour ? (tourParam as GolfTourSlug) : null;

    // Try cache first (only for single-tour requests without date filter)
    if (tour && !date) {
      const { events: cachedEvents, isFresh } = await getCachedGolfEvents(tour);
      if (cachedEvents.length > 0 && isFresh) {
        return NextResponse.json({ events: cachedEvents });
      }
    }

    // Cache miss or stale — fall back to direct API
    let tournaments;
    if (tour) {
      tournaments = await getGolfTournaments(date, tour);
    } else {
      tournaments = await getAllGolfTournaments(date);
    }

    if (tournaments.length > 0 && tour && !date) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      const records = tournaments.map(event => ({
        id: `golf_${tour}_${event.id}`,
        tour_slug: tour,
        espn_event_id: event.id,
        event_name: event.name,
        event_date: event.date ? event.date.split('T')[0] : null,
        status: event.status,
        event_data: event,
        updated_at: new Date().toISOString(),
      }));

      supabase
        .from('golf_events_cache')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[golf] events cache write error:', error.message);
        });
    }

    return NextResponse.json({ events: tournaments });
  } catch (error) {
    console.error('Golf events error:', error);

    // Last resort: try stale cache
    try {
      const { searchParams } = new URL(request.url);
      const tourParam = searchParams.get('tour');
      if (tourParam && VALID_TOURS.has(tourParam as GolfTourSlug)) {
        const { events } = await getCachedGolfEvents(tourParam);
        if (events.length > 0) {
          return NextResponse.json({ events });
        }
      }
    } catch {}

    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
