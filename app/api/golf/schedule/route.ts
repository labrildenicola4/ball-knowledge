import { NextResponse } from 'next/server';
import { getCachedGolfStandings } from '@/lib/golf-cache-helpers';
import { getGolfSchedule } from '@/lib/api-espn-golf';
import { createServiceClient } from '@/lib/supabase-server';
import { GolfTourSlug } from '@/lib/types/golf';

export const dynamic = 'force-dynamic';

const VALID_TOURS = new Set<GolfTourSlug>(['pga', 'eur', 'lpga', 'liv']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = (searchParams.get('tour') as GolfTourSlug) || 'pga';
    const validTour = VALID_TOURS.has(tour) ? tour : 'pga';

    // Try cache first
    const { data: cachedData, isFresh } = await getCachedGolfStandings(validTour, 'schedule');

    if (cachedData && isFresh) {
      return NextResponse.json(cachedData);
    }

    // Cache miss or stale — fall back to direct API
    const schedule = await getGolfSchedule(validTour);

    const responseData = { events: schedule };

    if (schedule.length > 0) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('golf_standings_cache')
        .upsert({
          id: `${validTour}_schedule`,
          tour_slug: validTour,
          data_type: 'schedule',
          data: responseData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[golf] schedule cache write error:', error.message);
        });
    }

    // If API returned empty, try stale cache
    if (schedule.length === 0 && cachedData) {
      return NextResponse.json(cachedData);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Golf schedule error:', error);

    try {
      const { searchParams } = new URL(request.url);
      const tour = (searchParams.get('tour') as GolfTourSlug) || 'pga';
      const { data } = await getCachedGolfStandings(tour, 'schedule');
      if (data) return NextResponse.json(data);
    } catch {}

    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
