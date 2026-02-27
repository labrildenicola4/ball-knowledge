import { NextResponse } from 'next/server';
import { getNHLLeaders } from '@/lib/api-espn-nhl';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    // 1. Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'hockey_nhl')
      .eq('league_code', 'NHL_LEADERS')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < FRESHNESS_MS) {
        return NextResponse.json(cached.standings);
      }
    }

    // 2. Cache miss or stale — fetch from ESPN
    const leaders = await getNHLLeaders();

    // 3. Fire-and-forget write to cache
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'hockey_nhl',
          league_code: 'NHL_LEADERS',
          season: new Date().getFullYear().toString(),
          standings: leaders,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/NHL/Leaders] Cache write error:', error);
      });

    return NextResponse.json(leaders);
  } catch (error) {
    console.error('[API/NHL/Leaders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NHL leaders' },
      { status: 500 }
    );
  }
}
