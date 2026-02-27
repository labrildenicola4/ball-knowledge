import { NextRequest, NextResponse } from 'next/server';
import { getStandings, getGroupedStandings } from '@/lib/api-football';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Map league names/codes to API-Football league IDs
const LEAGUE_NAME_TO_ID: Record<string, number> = {
  // League names
  'laliga': 140,
  'premier': 39,
  'seriea': 135,
  'bundesliga': 78,
  'ligue1': 61,
  'primeiraliga': 94,
  'eredivisie': 88,
  'championship': 40,
  'brasileirao': 71,
  'championsleague': 2,
  'europaleague': 3,
  'copalibertadores': 13,
  'mls': 253,
  // Competition codes
  'PD': 140,
  'PL': 39,
  'SA': 135,
  'BL1': 78,
  'FL1': 61,
  'PPL': 94,
  'DED': 88,
  'ELC': 40,
  'BSA': 71,
  'CL': 2,
  'EL': 3,
  'CLI': 13,
  'MLS': 253,
};

// Map league IDs back to codes for cache lookups
const LEAGUE_ID_TO_CODE: Record<number, string> = {
  39: 'PL', 140: 'PD', 135: 'SA', 78: 'BL1', 61: 'FL1',
  94: 'PPL', 88: 'DED', 40: 'ELC', 71: 'BSA',
  2: 'CL', 3: 'EL', 13: 'CLI', 253: 'MLS',
};

const STANDINGS_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Leagues that have multiple groups/conferences
const GROUPED_LEAGUES = new Set([253]); // MLS

function transformStandings(standings: Array<{ rank: number; team: { id: number; name: string; logo: string }; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; goalsDiff: number; points: number; form: string; group: string }>) {
  return standings.map((team) => ({
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
    form: team.form ? team.form.split('').filter((r: string) => r) : [],
    group: team.group || undefined,
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';

  try {
    const leagueId = LEAGUE_NAME_TO_ID[league];

    if (!leagueId) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
    }

    // Cache-first: check standings_cache
    const leagueCode = LEAGUE_ID_TO_CODE[leagueId];
    if (leagueCode) {
      const { data: cached } = await supabase
        .from('standings_cache')
        .select('standings, updated_at')
        .eq('league_code', leagueCode)
        .eq('sport_type', 'soccer')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (cached?.standings) {
        const isFresh = Date.now() - new Date(cached.updated_at).getTime() < STANDINGS_TTL_MS;
        if (isFresh) {
          return NextResponse.json(cached.standings);
        }
      }
    }

    // For leagues with conferences/groups, return grouped standings
    if (GROUPED_LEAGUES.has(leagueId)) {
      const groups = await getGroupedStandings(leagueId);
      const groupedStandings = groups.map((group) => ({
        name: group[0]?.group || 'Group',
        standings: transformStandings(group),
      }));
      const result = { standings: groupedStandings[0]?.standings || [], groups: groupedStandings };

      // Fire-and-forget cache write
      if (leagueCode) {
        supabase.from('standings_cache').upsert({
          league_code: leagueCode,
          sport_type: 'soccer',
          league_name: groupedStandings[0]?.name || leagueCode,
          season: new Date().getFullYear(),
          standings: result,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'league_code,season,sport_type' })
          .then(({ error }) => { if (error) console.error('[Standings] cache write error:', error.message); });
      }

      return NextResponse.json(result);
    }

    const standings = await getStandings(leagueId);
    const transformed = transformStandings(standings);
    const result = { standings: transformed };

    // Fire-and-forget cache write
    if (leagueCode) {
      supabase.from('standings_cache').upsert({
        league_code: leagueCode,
        sport_type: 'soccer',
        league_name: leagueCode,
        season: new Date().getFullYear(),
        standings: result,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'league_code,season,sport_type' })
        .then(({ error }) => { if (error) console.error('[Standings] cache write error:', error.message); });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Standings API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
