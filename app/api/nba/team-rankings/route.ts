import { NextResponse } from 'next/server';
import { getNBATeamRankings } from '@/lib/api-espn-nba';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rankings = await getNBATeamRankings();
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('[API/NBA/TeamRankings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA team rankings' },
      { status: 500 }
    );
  }
}
