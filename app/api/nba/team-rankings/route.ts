import { NextResponse } from 'next/server';
import { getNBATeamRankings } from '@/lib/api-espn-nba';
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
      .eq('sport_type', 'basketball_nba')
      .eq('league_code', 'NBA_TEAM_RANKINGS')
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
    const rankings = await getNBATeamRankings();

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'basketball_nba',
          league_code: 'NBA_TEAM_RANKINGS',
          season: new Date().getFullYear().toString(),
          standings: rankings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/NBA/TeamRankings] Cache write error:', error);
      });

    const response = NextResponse.json(rankings);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API/NBA/TeamRankings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA team rankings' },
      { status: 500 }
    );
  }
}
