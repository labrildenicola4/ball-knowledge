import { NextRequest, NextResponse } from 'next/server';
import { getMatchOdds } from '@/lib/polymarket';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = Number(params.matchId);
  const searchParams = request.nextUrl.searchParams;

  // Get team names and league from query params (passed from frontend)
  const homeTeam = searchParams.get('home');
  const awayTeam = searchParams.get('away');
  const leagueCode = searchParams.get('league');
  const kickoff = searchParams.get('kickoff');

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    let home = homeTeam;
    let away = awayTeam;
    let league = leagueCode;
    let matchKickoff = kickoff;

    // If params not provided, try to get from fixtures_cache
    if (!home || !away || !league) {
      const { data: match } = await supabase
        .from('fixtures_cache')
        .select('home_team_name, away_team_name, league_code, kickoff')
        .eq('api_id', matchId)
        .single();

      if (match) {
        home = home || match.home_team_name;
        away = away || match.away_team_name;
        league = league || match.league_code;
        matchKickoff = matchKickoff || match.kickoff;
      }
    }

    if (!home || !away || !league) {
      return NextResponse.json({ odds: null }, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    // Fetch odds from Polymarket
    const odds = await getMatchOdds(
      league,
      home,
      away,
      matchKickoff || new Date().toISOString()
    );

    if (!odds) {
      return NextResponse.json({ odds: null }, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    return NextResponse.json({ odds }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('[Odds API] Error:', error);
    return NextResponse.json({ odds: null }, { status: 200 });
  }
}
