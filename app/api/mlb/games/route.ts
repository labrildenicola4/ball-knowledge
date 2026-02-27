import { NextRequest, NextResponse } from 'next/server';
import { getMLBGames } from '@/lib/api-espn-mlb';
import { getCachedGames, cacheToMLBGame } from '@/lib/espn-cache-helpers';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchESPNScoreboard, transformESPNEvent } from '@/lib/espn-unified-fetcher';
import { ESPN_SPORTS, ESPN_GAMES_TABLE, getEasternDateString } from '@/lib/espn-sync-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    // Try cache first
    const { records, isFresh } = await getCachedGames('mlb', date);

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToMLBGame);

      // Sort: live first, then by start time
      games.sort((a, b) => {
        const aIsLive = a.status === 'in_progress';
        const bIsLive = b.status === 'in_progress';
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return a.startTime.localeCompare(b.startTime);
      });

      return NextResponse.json({
        games,
        count: games.length,
        date: date || 'today',
        cached: true,
      });
    }

    // Fall back to direct ESPN API
    const games = await getMLBGames(date);

    // Fire-and-forget: backfill cache for next request
    if (games.length > 0) {
      const syncDate = date || getEasternDateString();
      fetchESPNScoreboard('mlb', syncDate)
        .then(events => {
          if (events.length === 0) return;
          createServiceClient()
            .from(ESPN_GAMES_TABLE)
            .upsert(
              events.map(e => transformESPNEvent(e, ESPN_SPORTS.mlb.sportType)),
              { onConflict: 'id', ignoreDuplicates: false }
            )
            .then(({ error }) => {
              if (error) console.error('[mlb] cache write error:', error.message);
            });
        })
        .catch(() => {});
    }

    // Sort games: live first, then by start time
    games.sort((a, b) => {
      const aIsLive = a.status === 'in_progress';
      const bIsLive = b.status === 'in_progress';

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Then sort by time
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      games,
      count: games.length,
      date: date || 'today',
    });
  } catch (error) {
    console.error('[API/MLB/Games] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLB games', games: [] },
      { status: 500 }
    );
  }
}
