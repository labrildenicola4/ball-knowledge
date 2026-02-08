import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  ESPN_SPORTS,
  ESPNSportKey,
  ESPN_GAMES_TABLE,
  getSyncDateRange,
  getEasternDateString,
} from '@/lib/espn-sync-config';
import {
  fetchAndTransformGames,
  fetchESPNScoreboard,
  transformESPNEvent,
} from '@/lib/espn-unified-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Sync modes:
// - "full": Sync entire date range (for cron jobs, runs less frequently)
// - "live": Sync only today's games (for frequent updates during live games)
// - "date": Sync a specific date

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const sport = searchParams.get('sport') as ESPNSportKey | 'all' | null;
  const mode = searchParams.get('mode') || 'live';
  const date = searchParams.get('date');

  // Validate sport parameter
  if (sport && sport !== 'all' && !ESPN_SPORTS[sport]) {
    return NextResponse.json(
      { error: `Invalid sport: ${sport}. Valid options: ${Object.keys(ESPN_SPORTS).join(', ')}, all` },
      { status: 400 }
    );
  }

  const sportsToSync: ESPNSportKey[] = sport === 'all' || !sport
    ? (Object.keys(ESPN_SPORTS) as ESPNSportKey[])
    : [sport];

  const results: Record<string, { synced: number; errors: string[] }> = {};
  const supabase = createServiceClient();

  try {
    for (const sportKey of sportsToSync) {
      const config = ESPN_SPORTS[sportKey];
      const sportResults = { synced: 0, errors: [] as string[] };

      try {
        let dates: string[];

        if (mode === 'full') {
          // Full sync: entire date range
          dates = getSyncDateRange(config.syncDaysBack, config.syncDaysAhead);
        } else if (mode === 'date' && date) {
          // Specific date
          dates = [date];
        } else {
          // Live mode: today +/- 3 days to cover recent results and upcoming games
          dates = getSyncDateRange(3, 3);
        }

        console.log(`[ESPN-Sync] Syncing ${sportKey} for ${dates.length} dates (mode: ${mode})`);

        // Fetch all games
        const games = await fetchAndTransformGames(sportKey, dates);

        if (games.length > 0) {
          // Upsert to Supabase
          const { error } = await supabase
            .from(ESPN_GAMES_TABLE)
            .upsert(games, {
              onConflict: 'id',
              ignoreDuplicates: false,
            });

          if (error) {
            console.error(`[ESPN-Sync] Supabase error for ${sportKey}:`, error);
            sportResults.errors.push(`Database error: ${error.message}`);
          } else {
            sportResults.synced = games.length;
            console.log(`[ESPN-Sync] Synced ${games.length} ${sportKey} games`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ESPN-Sync] Error syncing ${sportKey}:`, message);
        sportResults.errors.push(message);
      }

      results[sportKey] = sportResults;

      // Rate limit: 200ms delay between sports
      await new Promise(r => setTimeout(r, 200));
    }

    const totalSynced = Object.values(results).reduce((sum, r) => sum + r.synced, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

    // Log sync result
    await supabase.from('sync_log').insert({
      sync_type: 'espn_games',
      sport_type: 'espn',
      records_synced: totalSynced,
      status: totalErrors === 0 ? 'success' : totalErrors < sportsToSync.length ? 'partial' : 'error',
      error_message: totalErrors > 0 ? JSON.stringify(Object.fromEntries(
        Object.entries(results).filter(([, r]) => r.errors.length > 0).map(([k, r]) => [k, r.errors])
      )) : null,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: totalErrors === 0,
      mode,
      totalSynced,
      totalErrors,
      results,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ESPN-Sync] Fatal error:', error);

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'espn_games',
        sport_type: 'espn',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    } catch { }

    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST endpoint for live game updates (more efficient for frequent polling)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sport = body.sport as ESPNSportKey | undefined;

  if (!sport || !ESPN_SPORTS[sport]) {
    return NextResponse.json(
      { error: 'Invalid or missing sport parameter' },
      { status: 400 }
    );
  }

  const config = ESPN_SPORTS[sport];
  const supabase = createServiceClient();

  try {
    // Fetch only today's live/recent games
    const today = getEasternDateString();
    const events = await fetchESPNScoreboard(sport, today);

    // Only sync games that are live or recently finished
    const relevantEvents = events.filter(event => {
      const status = event.status.type.name;
      return status.includes('IN_PROGRESS') ||
        status.includes('HALFTIME') ||
        status.includes('END_PERIOD') ||
        status === 'STATUS_FINAL' ||
        status === 'STATUS_FINAL_OT';
    });

    if (relevantEvents.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No live or recently finished games',
      });
    }

    const games = relevantEvents.map(event =>
      transformESPNEvent(event, config.sportType)
    );

    const { error } = await supabase
      .from(ESPN_GAMES_TABLE)
      .upsert(games, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[ESPN-Sync] Live update error for ${sport}:`, error);
      await supabase.from('sync_log').insert({
        sync_type: 'espn_live',
        sport_type: sport,
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await supabase.from('sync_log').insert({
      sync_type: 'espn_live',
      sport_type: sport,
      records_synced: games.length,
      status: 'success',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      synced: games.length,
      liveGames: games.filter(g => g.status === 'in_progress').length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ESPN-Sync] Live update error:`, message);

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'espn_live',
        sport_type: sport,
        status: 'error',
        error_message: message,
        completed_at: new Date().toISOString(),
      });
    } catch { }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
