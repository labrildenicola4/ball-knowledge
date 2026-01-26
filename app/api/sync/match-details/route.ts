import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';
import { getMatchDataForFixture, mapStatistics } from '@/lib/api-football';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Reverse mapping from competition code to league key
const CODE_TO_LEAGUE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([key, code]) => [code, key])
);

// Rate limit delay between matches (ms)
const DELAY_BETWEEN_MATCHES = 3000;

// Max matches to sync per run (to avoid timeouts)
const MAX_MATCHES_PER_RUN = 20;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');
  const isAuthorized = !CRON_SECRET ||
    authHeader === `Bearer ${CRON_SECRET}` ||
    secretParam === CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Sync Match Details] Starting...');

  try {
    const supabase = createServiceClient();

    // Get finished matches that don't have cached match_details
    const { data: matchesToSync, error: fetchError } = await supabase
      .from('fixtures_cache')
      .select('api_id, home_team_name, away_team_name, league_code, kickoff')
      .eq('status', 'FT')
      .is('match_details', null)
      .order('kickoff', { ascending: false })
      .limit(MAX_MATCHES_PER_RUN);

    if (fetchError) {
      throw new Error(`Failed to fetch matches: ${fetchError.message}`);
    }

    if (!matchesToSync || matchesToSync.length === 0) {
      console.log('[Sync Match Details] No matches to sync');
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No matches need syncing',
      });
    }

    console.log(`[Sync Match Details] Found ${matchesToSync.length} matches to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const cachedMatch of matchesToSync) {
      try {
        console.log(`[Sync Match Details] Syncing match ${cachedMatch.api_id}: ${cachedMatch.home_team_name} vs ${cachedMatch.away_team_name}`);

        // Fetch full match details from football-data.org
        const match = await getMatch(cachedMatch.api_id);

        if (!match) {
          console.error(`[Sync Match Details] Match ${cachedMatch.api_id} not found`);
          errorCount++;
          continue;
        }

        const statusInfo = mapStatus(match.status, match.minute);
        const matchDate = new Date(match.utcDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;
        const leagueKey = CODE_TO_LEAGUE[match.competition.code] || null;
        const matchDateStr = matchDate.toISOString().split('T')[0];

        // Fetch H2H, team forms, and lineups+stats in parallel
        const [h2hData, homeForm, awayForm, apiFootballData] = await Promise.all([
          getHeadToHead(cachedMatch.api_id, 10).catch(() => []),
          getTeamForm(match.homeTeam.id, 5).catch(() => []),
          getTeamForm(match.awayTeam.id, 5).catch(() => []),
          leagueKey
            ? getMatchDataForFixture(leagueKey, matchDateStr, match.homeTeam.name, match.awayTeam.name).catch(() => ({ lineups: [], statistics: [], fixtureId: null }))
            : Promise.resolve({ lineups: [], statistics: [], fixtureId: null }),
        ]);

        // Calculate H2H stats
        let h2hStats = { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
        if (h2hData.length > 0) {
          h2hStats.total = h2hData.length;
          h2hData.forEach((m) => {
            const homeGoals = m.score.fullTime.home ?? 0;
            const awayGoals = m.score.fullTime.away ?? 0;
            const isCurrentHomeTeamHome = m.homeTeam.id === match.homeTeam.id;
            if (homeGoals === awayGoals) {
              h2hStats.draws++;
            } else if ((homeGoals > awayGoals && isCurrentHomeTeamHome) || (awayGoals > homeGoals && !isCurrentHomeTeamHome)) {
              h2hStats.homeWins++;
            } else {
              h2hStats.awayWins++;
            }
          });
        }

        // Process lineups
        let homeLineup: any[] = [];
        let homeBench: any[] = [];
        let awayLineup: any[] = [];
        let awayBench: any[] = [];
        let homeFormation: string | null = null;
        let awayFormation: string | null = null;
        let homeCoach: string | null = null;
        let awayCoach: string | null = null;

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

        // Process stats
        let matchStats = null;
        if (apiFootballData.statistics.length > 0) {
          matchStats = mapStatistics(apiFootballData.statistics);
        }

        // Build full match details
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

        // Save to cache
        const { error: updateError } = await supabase
          .from('fixtures_cache')
          .update({ match_details: matchDetails })
          .eq('api_id', cachedMatch.api_id);

        if (updateError) {
          console.error(`[Sync Match Details] Failed to cache match ${cachedMatch.api_id}:`, updateError);
          errorCount++;
        } else {
          syncedCount++;
          console.log(`[Sync Match Details] Cached match ${cachedMatch.api_id}`);
        }

        // Rate limit delay
        await delay(DELAY_BETWEEN_MATCHES);

      } catch (error) {
        console.error(`[Sync Match Details] Error syncing match ${cachedMatch.api_id}:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Log the sync
    await supabase.from('sync_log').insert({
      sync_type: 'match_details',
      sport_type: 'soccer',
      records_synced: syncedCount,
      status: errorCount === 0 ? 'success' : 'partial',
      error_message: errorCount > 0 ? `${errorCount} matches failed` : null,
      completed_at: new Date().toISOString(),
    });

    console.log(`[Sync Match Details] Completed in ${duration}ms. Synced: ${syncedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      errors: errorCount,
      remaining: matchesToSync.length - syncedCount - errorCount,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync Match Details] Fatal error:', error);

    try {
      const supabase = createServiceClient();
      await supabase.from('sync_log').insert({
        sync_type: 'match_details',
        sport_type: 'soccer',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
