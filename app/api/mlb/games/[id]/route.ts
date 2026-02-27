import { NextRequest, NextResponse } from 'next/server';
import { getMLBGameSummary } from '@/lib/api-espn-mlb';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function getGameCacheParams(status: string) {
  if (status === 'final' || status === 'post') {
    return { freshnessMs: 3600 * 1000, cacheControl: 'public, s-maxage=3600, stale-while-revalidate=7200' };
  }
  if (status === 'in_progress' || status === 'in') {
    return { freshnessMs: 60 * 1000, cacheControl: 'public, s-maxage=15, stale-while-revalidate=30' };
  }
  return { freshnessMs: 300 * 1000, cacheControl: 'public, s-maxage=300, stale-while-revalidate=600' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const gameId = params.id;

  if (!gameId) {
    return NextResponse.json(
      { error: 'Game ID is required' },
      { status: 400 }
    );
  }

  try {
    // Check game status from espn_games_cache
    const { data: gameRow } = await supabase
      .from('espn_games_cache')
      .select('status')
      .eq('sport_type', 'baseball')
      .eq('espn_game_id', gameId)
      .limit(1)
      .single();

    const gameStatus = gameRow?.status ?? 'scheduled';
    const { freshnessMs, cacheControl } = getGameCacheParams(gameStatus);

    // Try cache
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'baseball')
      .eq('league_code', `MLB_GAME_${gameId}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < freshnessMs) {
        const response = NextResponse.json(cached.standings);
        response.headers.set('Cache-Control', cacheControl);
        return response;
      }
    }

    // Cache miss or stale — fetch from ESPN
    const result = await getMLBGameSummary(gameId);

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'baseball',
          league_code: `MLB_GAME_${gameId}`,
          season: new Date().getFullYear().toString(),
          standings: result,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/MLB/Games] Cache write error:', error);
      });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', cacheControl);
    return response;
  } catch (error) {
    console.error(`[API/MLB/Game/${gameId}] Error:`, error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
