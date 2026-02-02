import { NextResponse } from 'next/server';
import { getNFLLeaders } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaders = await getNFLLeaders();
    return NextResponse.json(leaders);
  } catch (error) {
    console.error('[API/NFL/Leaders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL leaders' },
      { status: 500 }
    );
  }
}
