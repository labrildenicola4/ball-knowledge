import { NextRequest, NextResponse } from 'next/server';
import { getLeagueBySlug } from '@/lib/constants/leagues';
import { getStandings, getTopScorers, getLeagueFixtures, Standing, TopScorer, Fixture } from '@/lib/api-football';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get league config from slug
    const league = getLeagueBySlug(id);

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Fetch data in parallel
    const [standings, topScorers, recentFixtures, upcomingFixtures] = await Promise.all([
      getStandings(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch standings:`, err);
        return [] as Standing[];
      }),
      getTopScorers(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch top scorers:`, err);
        return [] as TopScorer[];
      }),
      getLeagueFixtures(league.id, { last: 10 }).catch((err) => {
        console.error(`[API/League] Failed to fetch recent fixtures:`, err);
        return [] as Fixture[];
      }),
      getLeagueFixtures(league.id, { next: 10 }).catch((err) => {
        console.error(`[API/League] Failed to fetch upcoming fixtures:`, err);
        return [] as Fixture[];
      }),
    ]);

    // Transform standings
    const transformedStandings = standings.map(s => ({
      rank: s.rank,
      team: {
        id: s.team.id,
        name: s.team.name,
        logo: s.team.logo,
      },
      points: s.points,
      played: s.all.played,
      won: s.all.win,
      drawn: s.all.draw,
      lost: s.all.lose,
      goalsFor: s.all.goals.for,
      goalsAgainst: s.all.goals.against,
      goalDiff: s.goalsDiff,
      form: s.form,
    }));

    // Transform top scorers
    const transformedScorers = topScorers.slice(0, 20).map(ts => ({
      player: {
        id: ts.player.id,
        name: ts.player.name,
        photo: ts.player.photo,
        nationality: ts.player.nationality,
      },
      team: {
        id: ts.statistics[0]?.team.id,
        name: ts.statistics[0]?.team.name,
        logo: ts.statistics[0]?.team.logo,
      },
      goals: ts.statistics[0]?.goals.total || 0,
      assists: ts.statistics[0]?.goals.assists || 0,
      appearances: ts.statistics[0]?.games.appearances || 0,
      penaltyGoals: ts.statistics[0]?.penalty.scored || 0,
    }));

    // Transform fixtures
    const transformFixture = (f: Fixture) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      status: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed,
      round: f.league.round,
      venue: f.fixture.venue.name,
      homeTeam: {
        id: f.teams.home.id,
        name: f.teams.home.name,
        logo: f.teams.home.logo,
      },
      awayTeam: {
        id: f.teams.away.id,
        name: f.teams.away.name,
        logo: f.teams.away.logo,
      },
      homeScore: f.goals.home,
      awayScore: f.goals.away,
    });

    return NextResponse.json({
      league: {
        id: league.id,
        key: league.key,
        slug: league.slug,
        name: league.name,
        shortName: league.shortName,
        country: league.country,
        type: league.type,
      },
      standings: transformedStandings,
      topScorers: transformedScorers,
      recentFixtures: recentFixtures.map(transformFixture).reverse(),
      upcomingFixtures: upcomingFixtures.map(transformFixture),
    });
  } catch (error) {
    console.error('[API/League] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}
