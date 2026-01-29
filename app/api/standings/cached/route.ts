import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStandings } from '@/lib/api-football';

export const dynamic = 'force-dynamic';

// Map league names/codes to API-Football league IDs
const LEAGUE_NAME_TO_ID: Record<string, number> = {
  'laliga': 140, 'premier': 39, 'seriea': 135, 'bundesliga': 78, 'ligue1': 61,
  'primeiraliga': 94, 'eredivisie': 88, 'championship': 40, 'brasileirao': 71,
  'championsleague': 2, 'europaleague': 3, 'copalibertadores': 13,
  'PD': 140, 'PL': 39, 'SA': 135, 'BL1': 78, 'FL1': 61,
  'PPL': 94, 'DED': 88, 'ELC': 40, 'BSA': 71,
  'CL': 2, 'EL': 3, 'CLI': 13,
};

// Reverse mapping for cache lookups
const LEAGUE_ID_TO_CODE: Record<number, string> = {
  140: 'PD', 39: 'PL', 135: 'SA', 78: 'BL1', 61: 'FL1',
  94: 'PPL', 88: 'DED', 40: 'ELC', 71: 'BSA',
  2: 'CL', 3: 'EL', 13: 'CLI',
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
      console.log(`[Standings/Cached] Returning cached standings for ${leagueCode}`);
      return NextResponse.json({
        standings: cached.standings,
        cached: true,
      });
    }

    // Fall back to live API
    console.log(`[Standings/Cached] Cache miss for ${leagueCode}, fetching from API-Football`);
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

    return NextResponse.json({
      standings: table,
      cached: false,
    });
  } catch (error) {
    console.error('[Standings/Cached] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
