import { NextRequest, NextResponse } from 'next/server';
import { getStandings, LEAGUE_IDS } from '@/lib/api-football';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';

  try {
    const leagueId = LEAGUE_IDS[league as keyof typeof LEAGUE_IDS];
    
    if (!leagueId) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
    }

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
      form: team.form ? team.form.split('').slice(0, 5) : [],
    }));

    return NextResponse.json({ standings: table });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
