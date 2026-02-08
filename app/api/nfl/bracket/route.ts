import { NextResponse } from 'next/server';
import { getNFLPlayoffBracket } from '@/lib/api-espn-nfl-bracket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bracket = await getNFLPlayoffBracket();
    return NextResponse.json(bracket);
  } catch (error) {
    console.error('[API] NFL bracket error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL playoff bracket' },
      { status: 500 }
    );
  }
}
