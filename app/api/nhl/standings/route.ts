import { NextResponse } from 'next/server';
import { getNHLStandings } from '@/lib/api-espn-nhl';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const STANDINGS_FRESHNESS_MS = 5 * 60 * 1000;

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 7 ? year : year - 1;
}

export async function GET() {
  try {
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'hockey_nhl')
      .eq('league_code', 'NHL')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < STANDINGS_FRESHNESS_MS) {
        return NextResponse.json({ ...cached.standings, cached: true });
      }
    }

    // Cache is stale or missing — try ESPN
    try {
      const standings = await getNHLStandings();

      // Fire-and-forget: backfill cache
      createServiceClient()
        .from('standings_cache')
        .upsert({
          sport_type: 'hockey_nhl',
          league_code: 'NHL',
          league_name: 'NHL',
          season: getCurrentSeason(),
          standings,
        }, {
          onConflict: 'league_code,season,sport_type',
          ignoreDuplicates: false,
        })
        .then(({ error }) => {
          if (error) console.error('[nhl] standings cache write error:', error.message);
        });

      return NextResponse.json(standings);
    } catch (espnError) {
      console.error('[API/NHL/Standings] ESPN fetch failed:', espnError);

      // Fall back to stale cache
      if (!cacheError && cached?.standings) {
        return NextResponse.json({ ...cached.standings, cached: true, stale: true });
      }

      throw espnError;
    }
  } catch (error) {
    console.error('[API/NHL/Standings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NHL standings' },
      { status: 500 }
    );
  }
}
