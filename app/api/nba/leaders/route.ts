import { NextResponse } from 'next/server';
import { getNBALeaders } from '@/lib/api-espn-nba';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaders = await getNBALeaders();
    return NextResponse.json(leaders);
  } catch (error) {
    console.error('[API/NBA/Leaders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA leaders' },
      { status: 500 }
    );
  }
}
