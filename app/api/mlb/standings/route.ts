import { NextResponse } from 'next/server';
import { getMLBStandings } from '@/lib/api-espn-mlb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = await getMLBStandings();

    return NextResponse.json({
      standings,
      count: standings.reduce((acc, div) => acc + div.standings.length, 0),
    });
  } catch (error) {
    console.error('[API/MLB/Standings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLB standings', standings: [] },
      { status: 500 }
    );
  }
}
