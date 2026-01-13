import { NextRequest, NextResponse } from 'next/server';
import { getFixtures, getStandings, LEAGUE_IDS } from '@/lib/api-football';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';
  const date = searchParams.get('date');

  try {
    const leagueId = LEAGUE_IDS[league as keyof typeof LEAGUE_IDS];
    
    if (!leagueId) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
    }

    const fixtures = await getFixtures(leagueId, date || undefined);

    // Transform API response to our format
    const matches = fixtures.map((fixture) => ({
      id: fixture.fixture.id,
      league: fixture.league.name,
      home: fixture.teams.home.name,
      away: fixture.teams.away.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      homeLogo: fixture.teams.home.logo,
      awayLogo: fixture.teams.away.logo,
      status: fixture.fixture.status.short,
      time: fixture.fixture.status.short === 'NS' 
        ? new Date(fixture.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : fixture.fixture.status.short,
      venue: fixture.fixture.venue.name,
      date: new Date(fixture.fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
