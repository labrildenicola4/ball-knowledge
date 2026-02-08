import { NextResponse } from 'next/server';
import { getCFBPlayoffBracket } from '@/lib/api-espn-cfb-bracket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bracket = await getCFBPlayoffBracket();
    return NextResponse.json(bracket);
  } catch (error) {
    console.error('[API] CFB bracket error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch College Football Playoff bracket' },
      { status: 500 }
    );
  }
}
