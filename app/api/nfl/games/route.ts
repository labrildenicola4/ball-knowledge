import { NextResponse } from 'next/server';
import { getNFLGames } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await getNFLGames();

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
