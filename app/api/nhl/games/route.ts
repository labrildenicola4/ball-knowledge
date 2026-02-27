import { NextRequest, NextResponse } from 'next/server';
import { getNHLGames } from '@/lib/api-espn-nhl';
import { getCachedGames, cacheToNHLGame } from '@/lib/espn-cache-helpers';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchESPNScoreboard, transformESPNEvent } from '@/lib/espn-unified-fetcher';
import { ESPN_SPORTS, ESPN_GAMES_TABLE, getEasternDateString } from '@/lib/espn-sync-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    const { records, isFresh } = await getCachedGames('nhl', date);

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToNHLGame);
      games.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return NextResponse.json({
        games,
        count: games.length,
        date: date || 'today',
        cached: true,
      });
    }

    const games = await getNHLGames(date);

    // Fire-and-forget: backfill cache for next request
    if (games.length > 0) {
      const syncDate = date || getEasternDateString();
      fetchESPNScoreboard('nhl', syncDate)
        .then(events => {
          if (events.length === 0) return;
          createServiceClient()
            .from(ESPN_GAMES_TABLE)
            .upsert(
              events.map(e => transformESPNEvent(e, ESPN_SPORTS.nhl.sportType)),
              { onConflict: 'id', ignoreDuplicates: false }
            )
            .then(({ error }) => {
              if (error) console.error('[nhl] cache write error:', error.message);
            });
        })
        .catch(() => {});
    }

    return NextResponse.json({
      games,
      count: games.length,
      date: date || 'today',
    });
  } catch (error) {
    console.error('[API/NHL/Games] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NHL games' },
      { status: 500 }
    );
  }
}
