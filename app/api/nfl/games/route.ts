import { NextRequest, NextResponse } from 'next/server';
import { getNFLGames, getNFLPlayoffGames } from '@/lib/api-espn-nfl';
import { getCachedGames, cacheToNFLGame } from '@/lib/espn-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // Format: YYYY-MM-DD

    // If a specific date is requested, try cache first
    if (date) {
      const { records, isFresh } = await getCachedGames('nfl', date);

      if (isFresh && records.length > 0) {
        const games = records.map(cacheToNFLGame);
        games.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return NextResponse.json({
          games,
          count: games.length,
          cached: true,
        });
      }

      const games = await getNFLGames(date);
      return NextResponse.json({
        games,
        count: games.length,
      });
    }

    // No date: try cache for today first
    const { records, isFresh } = await getCachedGames('nfl');

    if (isFresh && records.length > 0) {
      const games = records.map(cacheToNFLGame);
      games.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return NextResponse.json({
        games,
        count: games.length,
        cached: true,
      });
    }

    // Fall back to existing today + playoff combo
    const [todayGames, playoffGames] = await Promise.all([
      getNFLGames(),
      getNFLPlayoffGames(),
    ]);

    // Combine and dedupe by game ID
    const gameMap = new Map();
    [...todayGames, ...playoffGames].forEach(game => {
      gameMap.set(game.id, game);
    });

    const games = Array.from(gameMap.values());

    return NextResponse.json({
      games,
      count: games.length,
    });
  } catch (error) {
    console.error('[API] NFL games error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL games' },
      { status: 500 }
    );
  }
}
