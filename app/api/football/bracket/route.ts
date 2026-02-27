import { NextResponse } from 'next/server';
import { getCFBPlayoffBracket } from '@/lib/api-espn-cfb-bracket';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'football_college')
      .eq('league_code', 'CFB_BRACKET')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < FRESHNESS_MS) {
        const response = NextResponse.json(cached.standings);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return response;
      }
    }

    // Cache miss or stale — fetch from ESPN
    const bracket = await getCFBPlayoffBracket();

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'football_college',
          league_code: 'CFB_BRACKET',
          season: new Date().getFullYear().toString(),
          standings: bracket,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/Football/Bracket] Cache write error:', error);
      });

    const response = NextResponse.json(bracket);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] CFB bracket error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch College Football Playoff bracket' },
      { status: 500 }
    );
  }
}
