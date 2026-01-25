import { NextRequest, NextResponse } from 'next/server';
import * as ApiFootball from '@/lib/api-football';

// Force dynamic rendering - no caching at Vercel edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fixtureId = Number(params.id);

  if (!fixtureId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // Fetch fixture details from API-Football
    const fixture = await ApiFootball.getFixture(fixtureId);

    if (!fixture) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const statusInfo = ApiFootball.mapStatus(
      fixture.fixture.status.short,
      fixture.fixture.status.elapsed
    );

    const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'LIVE'].includes(statusInfo.status);
    const isFinished = statusInfo.status === 'FT';

    // Fetch stats and H2H in parallel
    const [statsData, h2hData, homeForm, awayForm] = await Promise.all([
      // Only fetch stats for live/finished matches
      (isLive || isFinished)
        ? ApiFootball.getFixtureStatistics(fixtureId).catch(() => [])
        : Promise.resolve([]),
      // Head to head
      ApiFootball.getHeadToHead(
        fixture.teams.home.id,
        fixture.teams.away.id,
        10
      ).catch(() => []),
      // Team forms
      ApiFootball.getTeamForm(fixture.teams.home.id, 5).catch(() => []),
      ApiFootball.getTeamForm(fixture.teams.away.id, 5).catch(() => []),
    ]);

    // Map statistics
    const stats = ApiFootball.mapStatistics(statsData);

    // Calculate H2H stats
    let h2hStats = { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
    if (h2hData.length > 0) {
      h2hStats.total = h2hData.length;
      h2hData.forEach((m) => {
        const homeGoals = m.goals.home ?? 0;
        const awayGoals = m.goals.away ?? 0;
        const isCurrentHomeTeamHome = m.teams.home.id === fixture.teams.home.id;

        if (homeGoals === awayGoals) {
          h2hStats.draws++;
        } else if (
          (homeGoals > awayGoals && isCurrentHomeTeamHome) ||
          (awayGoals > homeGoals && !isCurrentHomeTeamHome)
        ) {
          h2hStats.homeWins++;
        } else {
          h2hStats.awayWins++;
        }
      });
    }

    // Format date
    const matchDate = new Date(fixture.fixture.date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

    // Get league key for standings lookup
    const leagueKey = ApiFootball.LEAGUE_ID_TO_KEY[fixture.league.id] || null;

    const matchDetails = {
      id: fixture.fixture.id,
      league: fixture.league.name,
      leagueCode: leagueKey,
      date: displayDate,
      venue: fixture.fixture.venue.name || 'TBD',
      attendance: null,
      status: statusInfo.status,
      minute: fixture.fixture.status.elapsed,
      matchday: ApiFootball.parseRound(fixture.league.round),
      home: {
        id: fixture.teams.home.id,
        name: fixture.teams.home.name,
        shortName: fixture.teams.home.name.substring(0, 3).toUpperCase(),
        logo: fixture.teams.home.logo,
        score: fixture.goals.home,
        form: homeForm,
      },
      away: {
        id: fixture.teams.away.id,
        name: fixture.teams.away.name,
        shortName: fixture.teams.away.name.substring(0, 3).toUpperCase(),
        logo: fixture.teams.away.logo,
        score: fixture.goals.away,
        form: awayForm,
      },
      h2h: h2hStats,
      halfTimeScore: {
        home: fixture.score.halftime.home,
        away: fixture.score.halftime.away,
      },
      stats: stats,
    };

    return NextResponse.json(matchDetails, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}
