import { NextResponse } from 'next/server';
import { getCachedGolfStandings } from '@/lib/golf-cache-helpers';
import { getGolfLeaders } from '@/lib/api-espn-golf';
import { createServiceClient } from '@/lib/supabase-server';
import { GolfTourSlug } from '@/lib/types/golf';

export const dynamic = 'force-dynamic';

const VALID_TOURS = new Set<GolfTourSlug>(['pga', 'eur', 'lpga', 'liv']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourParam = searchParams.get('tour');
    const tour: GolfTourSlug = tourParam && VALID_TOURS.has(tourParam as GolfTourSlug)
      ? (tourParam as GolfTourSlug)
      : 'pga';

    // Try cache first
    const { data: cachedData, isFresh } = await getCachedGolfStandings(tour, 'leaders');

    if (cachedData && isFresh) {
      return NextResponse.json(cachedData);
    }

    // Cache miss or stale — fall back to direct API
    const leaders = await getGolfLeaders(tour);

    if (leaders.categories && leaders.categories.length > 0) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('golf_standings_cache')
        .upsert({
          id: `${tour}_leaders`,
          tour_slug: tour,
          data_type: 'leaders',
          data: leaders,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[golf] leaders cache write error:', error.message);
        });
    }

    // If API returned empty, try stale cache
    if ((!leaders.categories || leaders.categories.length === 0) && cachedData) {
      return NextResponse.json(cachedData);
    }

    return NextResponse.json(leaders);
  } catch (error) {
    console.error('Golf leaders error:', error);

    try {
      const { searchParams } = new URL(request.url);
      const tour = (searchParams.get('tour') as GolfTourSlug) || 'pga';
      const { data } = await getCachedGolfStandings(tour, 'leaders');
      if (data) return NextResponse.json(data);
    } catch {}

    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
