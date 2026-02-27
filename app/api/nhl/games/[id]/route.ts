import { NextRequest, NextResponse } from 'next/server';
import { getNHLGameSummary } from '@/lib/api-espn-nhl';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Quick Supabase read to determine game status for Cache-Control
    const { data: cached } = await supabase
      .from('espn_games_cache')
      .select('status')
      .eq('sport_type', 'hockey_nhl')
      .eq('espn_game_id', id)
      .limit(1)
      .single();

    const data = await getNHLGameSummary(id);

    const gameStatus = cached?.status ?? data?.game?.status ?? 'scheduled';

    let sMaxAge = 300; // default: scheduled
    if (gameStatus === 'final' || gameStatus === 'post') {
      sMaxAge = 3600;
    } else if (gameStatus === 'in_progress' || gameStatus === 'in') {
      sMaxAge = 15;
    }

    const response = NextResponse.json(data);
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 2}`
    );
    return response;
  } catch (error) {
    console.error(`[API/NHL/Games/${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch NHL game details' },
      { status: 500 }
    );
  }
}
