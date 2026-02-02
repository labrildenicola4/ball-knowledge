import { NextResponse } from 'next/server';
import { getNFLStandings } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = await getNFLStandings();

    return NextResponse.json(standings);
  } catch (error) {
    console.error('[API] NFL standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL standings' },
      { status: 500 }
    );
  }
}
