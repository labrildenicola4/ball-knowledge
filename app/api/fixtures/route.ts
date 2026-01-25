import { NextRequest, NextResponse } from 'next/server';
import * as ApiFootball from '@/lib/api-football';

// Force dynamic for live data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';
  const date = searchParams.get('date'); // Filter by date YYYY-MM-DD
  const status = searchParams.get('status'); // Filter by status: NS, FT, LIVE, etc.
  const limit = searchParams.get('limit'); // Limit number of results
  const live = searchParams.get('live'); // Get only live matches

  try {
    const leagueId = ApiFootball.LEAGUE_IDS[league];

    if (!leagueId) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
    }

    let fixtures: ApiFootball.Fixture[];

    if (live === 'true') {
      // Get live matches only
      fixtures = await ApiFootball.getLiveFixtures(leagueId);
    } else if (date) {
      // Get matches for specific date
      fixtures = await ApiFootball.getFixturesByDate(date, leagueId);
    } else {
      // Get today's matches
      const today = new Date().toISOString().split('T')[0];
      fixtures = await ApiFootball.getFixturesByDate(today, leagueId);
    }

    // Transform to our format
    let transformedMatches = fixtures.map((fixture) => {
      const matchDate = new Date(fixture.fixture.date);
      const statusInfo = ApiFootball.mapStatus(
        fixture.fixture.status.short,
        fixture.fixture.status.elapsed
      );

      // Format date
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

      // Format time
      const hours = matchDate.getHours();
      const minutes = matchDate.getMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: fixture.fixture.id,
        league: fixture.league.name,
        leagueCode: ApiFootball.LEAGUE_ID_TO_KEY[fixture.league.id] || fixture.league.name,
        leagueLogo: fixture.league.logo,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        homeId: fixture.teams.home.id,
        awayId: fixture.teams.away.id,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        status: statusInfo.status,
        time: statusInfo.status === 'NS' ? displayTime : statusInfo.time,
        venue: fixture.fixture.venue.name || 'TBD',
        date: displayDate,
        fullDate: matchDate.toISOString().split('T')[0],
        timestamp: fixture.fixture.timestamp * 1000,
        matchday: ApiFootball.parseRound(fixture.league.round),
      };
    });

    // Filter by status if provided
    if (status) {
      const statusList = status.split(',');
      transformedMatches = transformedMatches.filter(m => statusList.includes(m.status));
    }

    // Sort by timestamp
    transformedMatches.sort((a, b) => a.timestamp - b.timestamp);

    // Limit results if specified
    if (limit) {
      transformedMatches = transformedMatches.slice(0, parseInt(limit));
    }

    return NextResponse.json(
      { matches: transformedMatches },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
