import { NextRequest, NextResponse } from 'next/server';
import { getCollegeFootballGames } from '@/lib/api-espn-college-football';
import { getCachedGames, cacheToCollegeFootballGame } from '@/lib/espn-cache-helpers';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchESPNScoreboard, transformESPNEvent } from '@/lib/espn-unified-fetcher';
import { ESPN_SPORTS, ESPN_GAMES_TABLE, getEasternDateString } from '@/lib/espn-sync-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    // Try cache first
    const { records, isFresh } = await getCachedGames('cfb', date);

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToCollegeFootballGame);
      games.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return NextResponse.json({
        games,
        count: games.length,
        date: date || 'today',
        cached: true,
      });
    }

    // Fall back to direct ESPN API
    const games = await getCollegeFootballGames(date);

    // Fire-and-forget: backfill cache for next request
    if (games.length > 0) {
      const syncDate = date || getEasternDateString();
      fetchESPNScoreboard('cfb', syncDate)
        .then(events => {
          if (events.length === 0) return;
          createServiceClient()
            .from(ESPN_GAMES_TABLE)
            .upsert(
              events.map(e => transformESPNEvent(e, ESPN_SPORTS.cfb.sportType)),
              { onConflict: 'id', ignoreDuplicates: false }
            )
            .then(({ error }) => {
              if (error) console.error('[cfb] cache write error:', error.message);
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
    console.error('[API/Football/Games] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch college football games' },
      { status: 500 }
    );
  }
}
