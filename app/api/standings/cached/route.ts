import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStandings } from '@/lib/api-football';
import { LEAGUE_IDS, LEAGUE_ID_TO_CODE, CODE_TO_LEAGUE_ID } from '@/lib/constants/leagues';

export const dynamic = 'force-dynamic';

// Map league names/codes to API-Football league IDs (combines key lookup and code lookup)
const LEAGUE_NAME_TO_ID: Record<string, number> = {
  ...LEAGUE_IDS,
  ...CODE_TO_LEAGUE_ID,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';

  const leagueId = LEAGUE_NAME_TO_ID[league];
  if (!leagueId) {
    return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
  }

  const leagueCode = LEAGUE_ID_TO_CODE[leagueId] || league;

  try {
    // Try to get from cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings')
      .eq('league_code', leagueCode)
      .single();

    if (!cacheError && cached?.standings) {
      return NextResponse.json({
        standings: cached.standings,
        cached: true,
      });
    }

    // Fall back to live API
    const standings = await getStandings(leagueId);

    // Transform API response to our format
    const table = standings.map((team) => ({
      position: team.rank,
      teamId: team.team.id,
      team: team.team.name,
      logo: team.team.logo,
      played: team.all.played,
      won: team.all.win,
      drawn: team.all.draw,
      lost: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against,
      gd: team.goalsDiff > 0 ? `+${team.goalsDiff}` : `${team.goalsDiff}`,
      points: team.points,
      form: team.form ? team.form.split('').filter(r => r) : [],
    }));

    // Fire-and-forget cache write
    supabase.from('standings_cache').upsert({
      league_code: leagueCode,
      sport_type: 'soccer',
      league_name: leagueCode,
      season: new Date().getFullYear(),
      standings: table,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'league_code,season,sport_type' })
      .then(({ error }) => { if (error) console.error('[Standings/cached] write error:', error.message); });

    return NextResponse.json({
      standings: table,
      cached: false,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
