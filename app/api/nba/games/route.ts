import { NextRequest, NextResponse } from 'next/server';
import { getNBAGames } from '@/lib/api-espn-nba';
import { getCachedGames, cacheToNBAGame } from '@/lib/espn-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    // Try cache first
    const { records, isFresh } = await getCachedGames('nba', date);

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToNBAGame);
      games.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return NextResponse.json({
        games,
        count: games.length,
        date: date || 'today',
        cached: true,
      });
    }

    // Fall back to direct ESPN API
    const games = await getNBAGames(date);

    return NextResponse.json({
      games,
      count: games.length,
      date: date || 'today',
    });
  } catch (error) {
    console.error('[API/NBA/Games] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA games' },
      { status: 500 }
    );
  }
}
