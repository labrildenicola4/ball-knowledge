import { NextRequest, NextResponse } from 'next/server';
import { getFixture, getFixtureStatistics, getFixtureLineups, getHeadToHead, getTeamForm, mapStatus, mapStatistics } from '@/lib/api-football';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = Number(params.id);

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // CHECK CACHE FIRST: For finished matches with full details, return immediately
    const { data: cachedMatch } = await supabase
      .from('fixtures_cache')
      .select('*')
      .eq('api_id', matchId)
      .single();

    // If we have cached full match details AND match is finished, return them
    if (cachedMatch?.match_details && cachedMatch.status === 'FT') {
      console.log(`[Match API] Returning cached match_details for ${matchId}`);
      return NextResponse.json(cachedMatch.match_details, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // Fetch fresh fixture data from API-Football
    const fixture = await getFixture(matchId);

    if (!fixture) {
      // If not in API, try to return basic cached data
      if (cachedMatch) {
        console.log(`[Match API] Fixture not in API, returning cached basic data for ${matchId}`);
        return buildResponseFromCache(cachedMatch);
      }
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const statusInfo = mapStatus(fixture.fixture.status.short, fixture.fixture.status.elapsed);
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(statusInfo.status);
    const isFinished = statusInfo.status === 'FT';

    // Format date
    const matchDate = new Date(fixture.fixture.date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = matchDate.getUTCHours();
    const minutes = matchDate.getUTCMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const displayDate = `${dayNames[matchDate.getUTCDay()]}, ${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()} · ${timeStr}`;

    // Fetch additional data in parallel
    const [lineups, statistics, h2hMatches, homeForm, awayForm] = await Promise.all([
      getFixtureLineups(matchId).catch(() => []),
      (isLive || isFinished) ? getFixtureStatistics(matchId).catch(() => []) : Promise.resolve([]),
      getHeadToHead(fixture.teams.home.id, fixture.teams.away.id, 10).catch(() => []),
      getTeamForm(fixture.teams.home.id, 5).catch(() => []),
      getTeamForm(fixture.teams.away.id, 5).catch(() => []),
    ]);

    // Process lineups
    let homeLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeFormation: string | null = null;
    let awayFormation: string | null = null;
    let homeCoach: string | null = null;
    let awayCoach: string | null = null;

    if (lineups.length >= 2) {
      const mapPlayer = (p: { player: { id: number; name: string; number: number; pos: string } }) => ({
        id: p.player.id,
        name: p.player.name,
        position: p.player.pos || 'Unknown',
        shirtNumber: p.player.number || null,
      });

      const homeLineupData = lineups.find(l => l.team.id === fixture.teams.home.id) || lineups[0];
      const awayLineupData = lineups.find(l => l.team.id === fixture.teams.away.id) || lineups[1];

      homeLineup = homeLineupData.startXI.map(mapPlayer);
      homeBench = homeLineupData.substitutes.map(mapPlayer);
      homeFormation = homeLineupData.formation || null;
      homeCoach = homeLineupData.coach?.name || null;

      awayLineup = awayLineupData.startXI.map(mapPlayer);
      awayBench = awayLineupData.substitutes.map(mapPlayer);
      awayFormation = awayLineupData.formation || null;
      awayCoach = awayLineupData.coach?.name || null;
    }

    // Process statistics
    const matchStats = statistics.length > 0 ? mapStatistics(statistics) : null;

    // Process H2H
    const h2hStats = {
      total: h2hMatches.length,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      matches: h2hMatches.map(m => ({
        date: m.fixture.date,
        home: m.teams.home.name,
        away: m.teams.away.name,
        homeLogo: m.teams.home.logo,
        awayLogo: m.teams.away.logo,
        homeScore: m.goals.home ?? 0,
        awayScore: m.goals.away ?? 0,
        competition: m.league.name,
      })),
    };

    // Calculate H2H wins/draws/losses
    h2hMatches.forEach(m => {
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

    // Map league code
    const LEAGUE_ID_TO_CODE: Record<number, string> = {
      39: 'PL', 140: 'PD', 135: 'SA', 78: 'BL1', 61: 'FL1',
      94: 'PPL', 88: 'DED', 40: 'ELC', 71: 'BSA',
      2: 'CL', 3: 'EL', 13: 'CLI',
      143: 'CDR', 45: 'FAC', 66: 'CDF', 137: 'CIT', 81: 'DFB',
    };

    const matchDetails = {
      id: fixture.fixture.id,
      league: fixture.league.name,
      leagueCode: LEAGUE_ID_TO_CODE[fixture.league.id] || fixture.league.name,
      leagueLogo: fixture.league.logo,
      date: displayDate,
      venue: fixture.fixture.venue?.name || 'TBD',
      attendance: null,
      status: statusInfo.status,
      minute: fixture.fixture.status.elapsed,
      matchday: parseInt(fixture.league.round.match(/\d+/)?.[0] || '0'),
      stage: fixture.league.round,
      home: {
        id: fixture.teams.home.id,
        name: fixture.teams.home.name,
        shortName: fixture.teams.home.name.substring(0, 3).toUpperCase(),
        logo: fixture.teams.home.logo,
        score: fixture.goals.home,
        form: homeForm,
        lineup: homeLineup,
        bench: homeBench,
        formation: homeFormation,
        coach: homeCoach,
      },
      away: {
        id: fixture.teams.away.id,
        name: fixture.teams.away.name,
        shortName: fixture.teams.away.name.substring(0, 3).toUpperCase(),
        logo: fixture.teams.away.logo,
        score: fixture.goals.away,
        form: awayForm,
        lineup: awayLineup,
        bench: awayBench,
        formation: awayFormation,
        coach: awayCoach,
      },
      h2h: h2hStats,
      halfTimeScore: {
        home: fixture.score.halftime.home,
        away: fixture.score.halftime.away,
      },
      stats: matchStats,
    };

    // Cache finished matches for instant future loads
    if (isFinished) {
      supabase
        .from('fixtures_cache')
        .update({ match_details: matchDetails })
        .eq('api_id', matchId)
        .then(({ error }) => {
          if (error) {
            console.error(`[Match API] Failed to cache match ${matchId}:`, error);
          } else {
            console.log(`[Match API] Cached full details for match ${matchId}`);
          }
        });
    }

    return NextResponse.json(matchDetails, {
      headers: {
        'Cache-Control': isFinished ? 'public, max-age=3600' : 'no-store',
      },
    });
  } catch (error) {
    console.error('[Match API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}

// Helper to build response from cached fixture data
function buildResponseFromCache(match: Record<string, unknown>) {
  const matchDate = new Date(match.kickoff as string);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = matchDate.getUTCHours();
  const minutes = matchDate.getUTCMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const displayDate = `${dayNames[matchDate.getUTCDay()]}, ${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()} · ${timeStr}`;

  return NextResponse.json({
    id: match.api_id,
    league: match.league_name,
    leagueCode: match.league_code,
    leagueLogo: match.league_logo,
    date: displayDate,
    venue: match.venue || 'TBD',
    status: match.status,
    minute: match.minute,
    matchday: match.matchday || 0,
    stage: match.stage,
    home: {
      id: match.home_team_id,
      name: match.home_team_name,
      shortName: match.home_team_short || (match.home_team_name as string).substring(0, 3).toUpperCase(),
      logo: match.home_team_logo,
      score: match.home_score,
      form: [],
      lineup: [],
      bench: [],
      formation: null,
      coach: null,
    },
    away: {
      id: match.away_team_id,
      name: match.away_team_name,
      shortName: match.away_team_short || (match.away_team_name as string).substring(0, 3).toUpperCase(),
      logo: match.away_team_logo,
      score: match.away_score,
      form: [],
      lineup: [],
      bench: [],
      formation: null,
      coach: null,
    },
    h2h: { total: 0, homeWins: 0, draws: 0, awayWins: 0, matches: [] },
    halfTimeScore: { home: null, away: null },
    stats: null,
    cached: true,
  });
}
