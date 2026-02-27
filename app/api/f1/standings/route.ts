import { NextResponse } from 'next/server';
import { getCachedF1Standings } from '@/lib/f1-cache-helpers';
import { getF1Standings } from '@/lib/api-espn-f1';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const EMPTY_STANDINGS = { driverStandings: [], constructorStandings: [] };

export async function GET() {
  try {
    // Try cache first
    const { standings: cachedStandings, isFresh } = await getCachedF1Standings();

    if (cachedStandings && isFresh) {
      return NextResponse.json(cachedStandings);
    }

    // Cache miss or stale — fall back to direct API
    const standings = await getF1Standings();

    const hasData = standings.driverStandings.length > 0 || standings.constructorStandings.length > 0;

    if (hasData) {
      // Fire-and-forget write to cache
      const supabase = createServiceClient();
      supabase
        .from('f1_standings_cache')
        .upsert({
          id: 'current',
          season: new Date().getFullYear(),
          driver_standings: standings.driverStandings,
          constructor_standings: standings.constructorStandings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false })
        .then(({ error }) => {
          if (error) console.error('[f1] standings cache write error:', error.message);
        });

      return NextResponse.json(standings);
    }

    // If direct API returned empty, return stale cache if available
    if (cachedStandings) {
      return NextResponse.json(cachedStandings);
    }

    return NextResponse.json(EMPTY_STANDINGS);
  } catch (error) {
    console.error('F1 standings error:', error);

    // Last resort: try stale cache
    try {
      const { standings } = await getCachedF1Standings();
      if (standings) {
        return NextResponse.json(standings);
      }
    } catch {}

    return NextResponse.json(EMPTY_STANDINGS, { status: 500 });
  }
}
