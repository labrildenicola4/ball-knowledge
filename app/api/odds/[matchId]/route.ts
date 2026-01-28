import { NextRequest, NextResponse } from 'next/server';
import { getMatchOdds } from '@/lib/polymarket';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = Number(params.matchId);

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // Get match info from cache to know teams and league
    const { data: match } = await supabase
      .from('fixtures_cache')
      .select('home_team_name, away_team_name, league_code, kickoff')
      .eq('api_id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch odds from Polymarket
    const odds = await getMatchOdds(
      match.league_code,
      match.home_team_name,
      match.away_team_name,
      match.kickoff
    );

    if (!odds) {
      return NextResponse.json({ odds: null }, {
        headers: { 'Cache-Control': 'public, max-age=300' }, // Cache "no odds" for 5 min
      });
    }

    return NextResponse.json({ odds }, {
      headers: { 'Cache-Control': 'public, max-age=60' }, // Cache odds for 1 min
    });
  } catch (error) {
    console.error('[Odds API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 500 });
  }
}
