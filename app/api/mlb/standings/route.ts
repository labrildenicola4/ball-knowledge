import { NextResponse } from 'next/server';
import { getMLBStandings } from '@/lib/api-espn-mlb';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// 5 minute freshness threshold for standings
const STANDINGS_FRESHNESS_MS = 5 * 60 * 1000;

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 7 ? year : year - 1;
}

export async function GET() {
  try {
    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'baseball')
      .eq('league_code', 'MLB')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < STANDINGS_FRESHNESS_MS) {
        const standings = cached.standings;
        return NextResponse.json({
          standings,
          count: Array.isArray(standings) ? standings.reduce((acc: number, div: { standings?: unknown[] }) => acc + (div.standings?.length || 0), 0) : 0,
          cached: true,
        });
      }
    }

    // Cache is stale or missing — try ESPN
    try {
      const standings = await getMLBStandings();

      // Fire-and-forget: backfill cache
      createServiceClient()
        .from('standings_cache')
        .upsert({
          sport_type: 'baseball',
          league_code: 'MLB',
          league_name: 'MLB',
          season: getCurrentSeason(),
          standings,
        }, {
          onConflict: 'league_code,season,sport_type',
          ignoreDuplicates: false,
        })
        .then(({ error }) => {
          if (error) console.error('[mlb] standings cache write error:', error.message);
        });

      return NextResponse.json({
        standings,
        count: standings.reduce((acc, div) => acc + div.standings.length, 0),
      });
    } catch (espnError) {
      console.error('[API/MLB/Standings] ESPN fetch failed:', espnError);

      // Fall back to stale cache
      if (!cacheError && cached?.standings) {
        const standings = cached.standings;
        return NextResponse.json({
          standings,
          count: Array.isArray(standings) ? standings.reduce((acc: number, div: { standings?: unknown[] }) => acc + (div.standings?.length || 0), 0) : 0,
          cached: true,
          stale: true,
        });
      }

      throw espnError;
    }
  } catch (error) {
    console.error('[API/MLB/Standings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLB standings', standings: [] },
      { status: 500 }
    );
  }
}
