import { NextRequest, NextResponse } from 'next/server';
import { getCollegeFootballGames } from '@/lib/api-espn-college-football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;

  try {
    const games = await getCollegeFootballGames(date);

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
