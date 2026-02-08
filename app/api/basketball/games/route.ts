import { NextResponse } from 'next/server';
import { getBasketballGames } from '@/lib/api-espn-basketball';
import { getCachedGames, cacheToBasketballGame } from '@/lib/espn-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    // Try cache first
    const { records, isFresh } = await getCachedGames('basketball', date);

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToBasketballGame);

      // Sort: live first, then ranked matchups, then by start time
      const sortedGames = [...games].sort((a, b) => {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

        const aRanked = (a.homeTeam.rank && a.awayTeam.rank) ? 1 : 0;
        const bRanked = (b.homeTeam.rank && b.awayTeam.rank) ? 1 : 0;
        if (aRanked !== bRanked) return bRanked - aRanked;

        const aHasRank = (a.homeTeam.rank || a.awayTeam.rank) ? 1 : 0;
        const bHasRank = (b.homeTeam.rank || b.awayTeam.rank) ? 1 : 0;
        if (aHasRank !== bHasRank) return bHasRank - aHasRank;

        return a.startTime.localeCompare(b.startTime);
      });

      return NextResponse.json({
        games: sortedGames,
        count: sortedGames.length,
        date: date || new Date().toISOString().split('T')[0],
        cached: true,
      });
    }

    // Fall back to direct ESPN API
    const games = await getBasketballGames(date);

    // Sort games: live first, then by start time, then ranked matchups
    const sortedGames = [...games].sort((a, b) => {
      // Live games first
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

      // Then ranked matchups (both teams ranked)
      const aRanked = (a.homeTeam.rank && a.awayTeam.rank) ? 1 : 0;
      const bRanked = (b.homeTeam.rank && b.awayTeam.rank) ? 1 : 0;
      if (aRanked !== bRanked) return bRanked - aRanked;

      // Then any ranked team
      const aHasRank = (a.homeTeam.rank || a.awayTeam.rank) ? 1 : 0;
      const bHasRank = (b.homeTeam.rank || b.awayTeam.rank) ? 1 : 0;
      if (aHasRank !== bHasRank) return bHasRank - aHasRank;

      // Then by time
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      games: sortedGames,
      count: sortedGames.length,
      date: date || new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('[API] Basketball games error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch basketball games' },
      { status: 500 }
    );
  }
}
