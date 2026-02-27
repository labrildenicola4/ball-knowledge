import { NextResponse } from 'next/server';
import { getBasketballGameSummary } from '@/lib/api-espn-basketball';
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Check game status from espn_games_cache
    const { data: gameRow } = await supabase
      .from('espn_games_cache')
      .select('status')
      .eq('sport_type', 'basketball')
      .eq('espn_game_id', id)
      .limit(1)
      .single();

    const gameStatus = gameRow?.status ?? 'scheduled';
    const { freshnessMs, cacheControl } = getGameCacheParams(gameStatus);

    // Try cache
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'basketball')
      .eq('league_code', `CBB_GAME_${id}`)
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
    const result = await getBasketballGameSummary(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'basketball',
          league_code: `CBB_GAME_${id}`,
          season: new Date().getFullYear().toString(),
          standings: result,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/Basketball/Games] Cache write error:', error);
      });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', cacheControl);
    return response;
  } catch (error) {
    console.error('[API] Basketball game details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
