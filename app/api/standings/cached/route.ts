import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStandings, COMPETITION_CODES, type LeagueId } from '@/lib/football-data';

export const dynamic = 'force-dynamic';

// Reverse mapping: competition code -> league id
const CODE_TO_LEAGUE: Record<string, string> = Object.entries(COMPETITION_CODES).reduce(
  (acc, [leagueId, code]) => ({ ...acc, [code]: leagueId }),
  {}
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';

  // Support both league names (laliga) and competition codes (PD)
  let competitionCode: string | undefined = COMPETITION_CODES[league as LeagueId];

  // If not found by league name, check if it's already a competition code
  if (!competitionCode && CODE_TO_LEAGUE[league]) {
    competitionCode = league;
  }

  if (!competitionCode) {
    return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
  }

  try {
    // Try to get from cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings')
      .eq('league_code', competitionCode)
      .single();

    if (!cacheError && cached?.standings) {
      console.log(`[Standings/Cached] Returning cached standings for ${competitionCode}`);
      return NextResponse.json({
        standings: cached.standings,
        cached: true,
      });
    }

    // Fall back to live API
    console.log(`[Standings/Cached] Cache miss for ${competitionCode}, fetching from API`);
    const standings = await getStandings(competitionCode);

    // Transform API response to our format
    const table = standings.map((team) => ({
      position: team.position,
      teamId: team.team.id,
      team: team.team.shortName || team.team.name,
      logo: team.team.crest,
      played: team.playedGames,
      won: team.won,
      drawn: team.draw,
      lost: team.lost,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      gd: team.goalDifference > 0 ? `+${team.goalDifference}` : `${team.goalDifference}`,
      points: team.points,
      form: team.form ? team.form.split(',').map(r => r.trim()).filter(r => r) : [],
    }));

    return NextResponse.json({
      standings: table,
      cached: false,
    });
  } catch (error) {
    console.error('[Standings/Cached] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
