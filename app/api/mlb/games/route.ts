import { NextRequest, NextResponse } from 'next/server';
import { getMLBGames } from '@/lib/api-espn-mlb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    const games = await getMLBGames(date);

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
