import { NextRequest, NextResponse } from 'next/server';
import { getNBAGames } from '@/lib/api-espn-nba';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
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
