import { NextResponse } from 'next/server';
import { getCachedGolfEvent } from '@/lib/golf-cache-helpers';
import { getGolfLeaderboard } from '@/lib/api-espn-golf';
import { createServiceClient } from '@/lib/supabase-server';
import { GolfTourSlug } from '@/lib/types/golf';

export const dynamic = 'force-dynamic';

const VALID_TOURS = new Set<GolfTourSlug>(['pga', 'eur', 'lpga', 'liv']);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = (searchParams.get('tour') as GolfTourSlug) || 'pga';
    const validTour = VALID_TOURS.has(tour) ? tour : 'pga';

    // Try cache first
    const { event: cachedEvent, isFresh } = await getCachedGolfEvent(params.id);

    if (cachedEvent && isFresh) {
      return NextResponse.json({ event: cachedEvent });
    }

    // Cache miss or stale — fall back to direct API
    const tournament = await getGolfLeaderboard(params.id, validTour);

    if (tournament) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('golf_events_cache')
        .upsert({
          id: `golf_${validTour}_${tournament.id}`,
          tour_slug: validTour,
          espn_event_id: tournament.id,
          event_name: tournament.name,
          event_date: tournament.date ? tournament.date.split('T')[0] : null,
          status: tournament.status,
          event_data: tournament,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[golf] event cache write error:', error.message);
        });

      return NextResponse.json({ event: tournament });
    }

    // If direct API failed, return stale cache if available
    if (cachedEvent) {
      return NextResponse.json({ event: cachedEvent });
    }

    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  } catch (error) {
    console.error('Golf leaderboard error:', error);

    // Last resort: try stale cache
    try {
      const { event } = await getCachedGolfEvent(params.id);
      if (event) {
        return NextResponse.json({ event });
      }
    } catch {}

    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
