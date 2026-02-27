import { NextResponse } from 'next/server';
import { getCachedGolfStandings } from '@/lib/golf-cache-helpers';
import { getGolfStandings } from '@/lib/api-espn-golf';
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
    const { data: cachedData, isFresh } = await getCachedGolfStandings(tour, 'rankings');

    if (cachedData && isFresh) {
      return NextResponse.json(cachedData);
    }

    // Cache miss or stale — fall back to direct API
    const standings = await getGolfStandings(tour);

    if (standings.players && standings.players.length > 0) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('golf_standings_cache')
        .upsert({
          id: `${tour}_rankings`,
          tour_slug: tour,
          data_type: 'rankings',
          data: standings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[golf] rankings cache write error:', error.message);
        });
    }

    // If API returned empty, try stale cache
    if ((!standings.players || standings.players.length === 0) && cachedData) {
      return NextResponse.json(cachedData);
    }

    return NextResponse.json(standings);
  } catch (error) {
    console.error('Golf rankings error:', error);

    try {
      const { searchParams } = new URL(request.url);
      const tour = (searchParams.get('tour') as GolfTourSlug) || 'pga';
      const { data } = await getCachedGolfStandings(tour, 'rankings');
      if (data) return NextResponse.json(data);
    } catch {}

    return NextResponse.json({ title: 'Rankings', players: [] }, { status: 500 });
  }
}
