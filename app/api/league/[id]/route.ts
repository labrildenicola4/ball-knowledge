import { NextRequest, NextResponse } from 'next/server';
import { getLeagueBySlug } from '@/lib/constants/leagues';
import {
  getStandings,
  getTopScorers,
  getTopAssists,
  getTopYellowCards,
  getTopRedCards,
  getLeaguePlayers,
  getLeagueTeamStatistics,
  getLeagueFixtures,
  Standing,
  TopScorer,
  Fixture,
  PlayerWithStats,
  TeamStatistics,
} from '@/lib/api-football';

export const dynamic = 'force-dynamic';

// Helper to get league logo URL
function getLeagueLogo(leagueId: number): string {
  return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
}

// Transform player with stats for response
function transformPlayerStats(p: PlayerWithStats) {
  const stats = p.statistics[0];
  return {
    player: {
      id: p.player.id,
      name: p.player.name,
      photo: p.player.photo,
      nationality: p.player.nationality,
    },
    team: stats ? {
      id: stats.team.id,
      name: stats.team.name,
      logo: stats.team.logo,
    } : null,
    games: {
      appearances: stats?.games.appearances || 0,
      minutes: stats?.games.minutes || 0,
      lineups: stats?.games.lineups || 0,
      position: stats?.games.position || null,
    },
    goals: stats?.goals.total || 0,
    assists: stats?.goals.assists || 0,
    shots: {
      total: stats?.shots.total || 0,
      onTarget: stats?.shots.on || 0,
    },
    passes: {
      total: stats?.passes.total || 0,
      key: stats?.passes.key || 0,
      accuracy: stats?.passes.accuracy || 0,
    },
    tackles: {
      total: stats?.tackles.total || 0,
      blocks: stats?.tackles.blocks || 0,
      interceptions: stats?.tackles.interceptions || 0,
    },
    duels: {
      total: stats?.duels.total || 0,
      won: stats?.duels.won || 0,
    },
    dribbles: {
      attempts: stats?.dribbles.attempts || 0,
      success: stats?.dribbles.success || 0,
    },
    fouls: {
      drawn: stats?.fouls.drawn || 0,
      committed: stats?.fouls.committed || 0,
    },
    cards: {
      yellow: stats?.cards.yellow || 0,
      red: stats?.cards.red || 0,
    },
    penalty: {
      won: stats?.penalty.won || 0,
      scored: stats?.penalty.scored || 0,
      missed: stats?.penalty.missed || 0,
    },
  };
}

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

    // Fetch basic data in parallel (fast endpoints)
    const [standings, topScorers, topAssists, recentFixtures, upcomingFixtures] = await Promise.all([
      getStandings(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch standings:`, err);
        return [] as Standing[];
      }),
      getTopScorers(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch top scorers:`, err);
        return [] as TopScorer[];
      }),
      getTopAssists(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch top assists:`, err);
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

    // Fetch additional player stats (yellow/red cards) and detailed player stats
    const [yellowCards, redCards, leaguePlayers] = await Promise.all([
      getTopYellowCards(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch yellow cards:`, err);
        return [] as PlayerWithStats[];
      }),
      getTopRedCards(league.id).catch((err) => {
        console.error(`[API/League] Failed to fetch red cards:`, err);
        return [] as PlayerWithStats[];
      }),
      // Fetch league players with full stats (limit to 5 pages to avoid too many API calls)
      getLeaguePlayers(league.id, undefined, 5).catch((err) => {
        console.error(`[API/League] Failed to fetch league players:`, err);
        return [] as PlayerWithStats[];
      }),
    ]);

    // Fetch team statistics for clean sheets
    const teamIds = standings.map(s => s.team.id);
    const teamDetailedStats = await getLeagueTeamStatistics(league.id, teamIds).catch((err) => {
      console.error(`[API/League] Failed to fetch team statistics:`, err);
      return [] as TeamStatistics[];
    });

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

    // Calculate team statistics for Stats tab
    const teamStats = transformedStandings
      .filter(s => s.played > 0)
      .map(s => {
        const detailedStats = teamDetailedStats.find(ts => ts.team.id === s.team.id);
        return {
          team: s.team,
          played: s.played,
          ppg: Number((s.points / s.played).toFixed(2)),
          goalsPerGame: Number((s.goalsFor / s.played).toFixed(2)),
          goalsAgainstPerGame: Number((s.goalsAgainst / s.played).toFixed(2)),
          winPct: Number(((s.won / s.played) * 100).toFixed(1)),
          goalDiffPerGame: Number((s.goalDiff / s.played).toFixed(2)),
          cleanSheets: detailedStats?.clean_sheet?.total || 0,
          homeWins: s.won, // From standings we only have total, but detailedStats has breakdown
          awayWins: detailedStats?.fixtures?.wins?.away || 0,
          form: s.form,
        };
      });

    // Transform top scorers (from topscorers endpoint)
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

    // Transform top assists (from topassists endpoint - more accurate)
    const transformedAssists = topAssists.slice(0, 20).map(ts => ({
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
      assists: ts.statistics[0]?.goals.assists || 0,
      goals: ts.statistics[0]?.goals.total || 0,
      appearances: ts.statistics[0]?.games.appearances || 0,
    }));

    // Transform yellow cards
    const transformedYellowCards = yellowCards.slice(0, 20).map(transformPlayerStats);

    // Transform red cards
    const transformedRedCards = redCards.slice(0, 20).map(transformPlayerStats);

    // Process detailed player stats for various leader categories
    const detailedPlayers = leaguePlayers.map(transformPlayerStats);

    // Sort and get top players for each stat category
    const playerLeaders = {
      // Appearances
      appearances: [...detailedPlayers]
        .sort((a, b) => b.games.appearances - a.games.appearances)
        .slice(0, 10),
      // Minutes
      minutes: [...detailedPlayers]
        .sort((a, b) => b.games.minutes - a.games.minutes)
        .slice(0, 10),
      // Shots
      shots: [...detailedPlayers]
        .sort((a, b) => b.shots.total - a.shots.total)
        .slice(0, 10),
      // Shots on target
      shotsOnTarget: [...detailedPlayers]
        .sort((a, b) => b.shots.onTarget - a.shots.onTarget)
        .slice(0, 10),
      // Key passes
      keyPasses: [...detailedPlayers]
        .sort((a, b) => b.passes.key - a.passes.key)
        .slice(0, 10),
      // Pass accuracy (minimum 500 passes)
      passAccuracy: [...detailedPlayers]
        .filter(p => p.passes.total >= 500)
        .sort((a, b) => b.passes.accuracy - a.passes.accuracy)
        .slice(0, 10),
      // Tackles
      tackles: [...detailedPlayers]
        .sort((a, b) => b.tackles.total - a.tackles.total)
        .slice(0, 10),
      // Interceptions
      interceptions: [...detailedPlayers]
        .sort((a, b) => b.tackles.interceptions - a.tackles.interceptions)
        .slice(0, 10),
      // Duels won
      duelsWon: [...detailedPlayers]
        .sort((a, b) => b.duels.won - a.duels.won)
        .slice(0, 10),
      // Successful dribbles
      dribbles: [...detailedPlayers]
        .sort((a, b) => b.dribbles.success - a.dribbles.success)
        .slice(0, 10),
      // Fouls drawn
      foulsDrawn: [...detailedPlayers]
        .sort((a, b) => b.fouls.drawn - a.fouls.drawn)
        .slice(0, 10),
    };

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
        logo: getLeagueLogo(league.id),
        code: league.code,
      },
      standings: transformedStandings,
      teamStats,
      topScorers: transformedScorers,
      topAssists: transformedAssists,
      yellowCards: transformedYellowCards,
      redCards: transformedRedCards,
      playerLeaders,
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
