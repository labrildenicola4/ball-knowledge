import { NextRequest, NextResponse } from 'next/server';
import { getGameOddsBySlug, SportType } from '@/lib/polymarket';

export const dynamic = 'force-dynamic';

const VALID_SPORTS: SportType[] = ['nba', 'ncaab', 'nfl', 'mlb', 'cfb'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sport = searchParams.get('sport') as SportType | null;
  const homeAbbrev = searchParams.get('homeAbbrev');
  const awayAbbrev = searchParams.get('awayAbbrev');
  const gameDate = searchParams.get('date');
  const homeName = searchParams.get('homeName');
  const awayName = searchParams.get('awayName');

  if (!sport || !homeAbbrev || !awayAbbrev || !gameDate || !VALID_SPORTS.includes(sport)) {
    return NextResponse.json({ odds: null }, { status: 400 });
  }

  try {
    const odds = await getGameOddsBySlug(
      sport, awayAbbrev, homeAbbrev, gameDate,
      homeName || undefined, awayName || undefined,
    );

    if (!odds) {
      return NextResponse.json({ odds: null }, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    return NextResponse.json({ odds }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch {
    return NextResponse.json({ odds: null }, { status: 500 });
  }
}
