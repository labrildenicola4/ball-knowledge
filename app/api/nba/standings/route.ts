import { NextResponse } from 'next/server';
import { getNBAStandings } from '@/lib/api-espn-nba';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = await getNBAStandings();
    return NextResponse.json(standings);
  } catch (error) {
    console.error('[API/NBA/Standings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA standings' },
      { status: 500 }
    );
  }
}
