import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  ESPN_SPORTS,
  ESPNSportKey,
  ESPN_GAMES_TABLE,
  getEasternDateString,
  ESPNGameRecord,
} from '@/lib/espn-sync-config';
import { transformToFrontendGame } from '@/lib/espn-unified-fetcher';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sport = searchParams.get('sport') as ESPNSportKey | null;
  const date = searchParams.get('date');

  // Validate sport parameter
  if (!sport || !ESPN_SPORTS[sport]) {
    return NextResponse.json(
      { error: `Invalid or missing sport. Valid options: ${Object.keys(ESPN_SPORTS).join(', ')}` },
      { status: 400 }
    );
  }

  const config = ESPN_SPORTS[sport];
  const targetDate = date || getEasternDateString();

  try {
    // Query Supabase for cached games
    const { data: games, error } = await supabase
      .from(ESPN_GAMES_TABLE)
      .select('*')
      .eq('sport_type', config.sportType)
      .eq('game_date', targetDate)
      .order('kickoff', { ascending: true });

    if (error) {
      console.error(`[Games/Cached] Supabase error:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch games', games: [] },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedGames = (games as ESPNGameRecord[] || []).map(transformToFrontendGame);

    // Sort: live first, then by time
    transformedGames.sort((a, b) => {
      const aIsLive = a.status === 'in_progress';
      const bIsLive = b.status === 'in_progress';
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return NextResponse.json({
      games: transformedGames,
      count: transformedGames.length,
      sport,
      date: targetDate,
      cached: true,
      source: 'supabase',
    });
  } catch (error) {
    console.error(`[Games/Cached] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch games', games: [] },
      { status: 500 }
    );
  }
}
