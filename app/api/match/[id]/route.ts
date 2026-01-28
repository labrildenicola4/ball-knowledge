import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';
import { getMatchDataForFixture, mapStatistics, FixtureLineup } from '@/lib/api-football';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering - no caching at Vercel edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Reverse mapping from competition code to league key
const CODE_TO_LEAGUE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([key, code]) => [code, key])
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = Number(params.id);

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // CHECK CACHE FIRST: For finished matches, return cached data if available
    const { data: cachedMatch } = await supabase
      .from('fixtures_cache')
      .select('match_details, status, h2h_data')
      .eq('api_id', matchId)
      .single();

    // If we have cached full match details AND match is finished, return immediately
    if (cachedMatch?.match_details && cachedMatch.status === 'FT') {
      console.log(`[Match API] Returning cached data for match ${matchId}`);
      return NextResponse.json(cachedMatch.match_details, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // Check if we have cached H2H data (for upcoming matches)
    const cachedH2H = cachedMatch?.h2h_data as { total: number; homeWins: number; draws: number; awayWins: number } | null;

    // Fetch match details from football-data.org
    const match = await getMatch(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const statusInfo = mapStatus(match.status, match.minute);

    const isLive = ['1H', '2H', 'HT', 'LIVE'].includes(statusInfo.status);
    const isFinished = statusInfo.status === 'FT';

    // Format date
    const matchDate = new Date(match.utcDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

    // Get league key for standings lookup
    const leagueKey = CODE_TO_LEAGUE[match.competition.code] || null;

    // Initialize lineup and stats data
    let homeLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeFormation: string | null = null;
    let awayFormation: string | null = null;
    let homeCoach: string | null = null;
    let awayCoach: string | null = null;
    let matchStats: { all: Array<{ label: string; home: number; away: number; type?: 'decimal' }> } | null = null;

    // Fetch H2H (if not cached), team forms, AND lineups+stats all in parallel
    const matchDateStr = matchDate.toISOString().split('T')[0];
    const shouldFetchH2H = !cachedH2H || cachedH2H.total === 0;

    const [h2hData, homeForm, awayForm, apiFootballData] = await Promise.all([
      // Only fetch H2H if not cached
      shouldFetchH2H ? getHeadToHead(matchId, 10).catch(() => []) : Promise.resolve([]),
      getTeamForm(match.homeTeam.id, 5).catch(() => []),
      getTeamForm(match.awayTeam.id, 5).catch(() => []),
      // Fetch lineups AND statistics from API-Football
      leagueKey
        ? getMatchDataForFixture(leagueKey, matchDateStr, match.homeTeam.name, match.awayTeam.name).catch((err) => {
            console.error('[Match API] Error fetching API-Football data:', err);
            return { lineups: [], statistics: [], fixtureId: null };
          })
        : Promise.resolve({ lineups: [], statistics: [], fixtureId: null }),
    ]);

    // Use cached H2H or calculate from fetched data
    let h2hStats = cachedH2H || { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
    if (shouldFetchH2H && h2hData.length > 0) {
      h2hStats = { total: h2hData.length, homeWins: 0, draws: 0, awayWins: 0 };
      h2hData.forEach((m) => {
        const homeGoals = m.score.fullTime.home ?? 0;
        const awayGoals = m.score.fullTime.away ?? 0;
        const isCurrentHomeTeamHome = m.homeTeam.id === match.homeTeam.id;

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

      // Cache H2H for future requests (fire and forget)
      supabase
        .from('fixtures_cache')
        .update({ h2h_data: h2hStats })
        .eq('api_id', matchId)
        .then(({ error }) => {
          if (error) {
            console.error(`[Match API] Failed to cache H2H for match ${matchId}:`, error);
          } else {
            console.log(`[Match API] Cached H2H for match ${matchId}`);
          }
        });
    }

    // Process lineup data from API-Football
    const lineupResult = apiFootballData.lineups;
    if (lineupResult.length >= 2) {
      const mapLineupPlayer = (p: { player: { id: number; name: string; number: number; pos: string } }) => ({
        id: p.player.id,
        name: p.player.name,
        position: p.player.pos || 'Unknown',
        shirtNumber: p.player.number || null,
      });

      const homeLineupData = lineupResult.find(l =>
        l.team.name.toLowerCase().includes(match.homeTeam.name.toLowerCase().split(' ')[0]) ||
        match.homeTeam.name.toLowerCase().includes(l.team.name.toLowerCase().split(' ')[0])
      ) || lineupResult[0];

      const awayLineupData = lineupResult.find(l =>
        l.team.name.toLowerCase().includes(match.awayTeam.name.toLowerCase().split(' ')[0]) ||
        match.awayTeam.name.toLowerCase().includes(l.team.name.toLowerCase().split(' ')[0])
      ) || lineupResult[1];

      homeLineup = homeLineupData.startXI.map(mapLineupPlayer);
      homeBench = homeLineupData.substitutes.map(mapLineupPlayer);
      homeFormation = homeLineupData.formation || null;
      homeCoach = homeLineupData.coach?.name || null;

      awayLineup = awayLineupData.startXI.map(mapLineupPlayer);
      awayBench = awayLineupData.substitutes.map(mapLineupPlayer);
      awayFormation = awayLineupData.formation || null;
      awayCoach = awayLineupData.coach?.name || null;
    }

    // Process real statistics from API-Football (for live or finished matches)
    if ((isLive || isFinished) && apiFootballData.statistics.length > 0) {
      matchStats = mapStatistics(apiFootballData.statistics);
      console.log(`[Match API] Real stats loaded: ${matchStats?.all?.length || 0} stat types`);
    }

    const matchDetails = {
      id: match.id,
      league: match.competition.name,
      leagueCode: leagueKey,
      date: displayDate,
      venue: match.venue || 'TBD',
      attendance: null,
      status: statusInfo.status,
      minute: match.minute,
      matchday: match.matchday,
      home: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.tla || match.homeTeam.shortName || match.homeTeam.name.substring(0, 3).toUpperCase(),
        logo: match.homeTeam.crest,
        score: match.score.fullTime.home,
        form: homeForm,
        lineup: homeLineup,
        bench: homeBench,
        formation: homeFormation,
        coach: homeCoach,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.tla || match.awayTeam.shortName || match.awayTeam.name.substring(0, 3).toUpperCase(),
        logo: match.awayTeam.crest,
        score: match.score.fullTime.away,
        form: awayForm,
        lineup: awayLineup,
        bench: awayBench,
        formation: awayFormation,
        coach: awayCoach,
      },
      h2h: h2hStats,
      halfTimeScore: {
        home: match.score.halfTime.home,
        away: match.score.halfTime.away,
      },
      stats: matchStats,
    };

    // CACHE FINISHED MATCHES: Save full details to Supabase for instant future loads
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
        'Cache-Control': isFinished ? 'public, max-age=3600' : 'no-store, no-cache, must-revalidate, max-age=0',
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
