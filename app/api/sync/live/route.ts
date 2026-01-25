import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getMatch } from '@/lib/football-data';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Status codes that indicate a live match
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'LIVE', '1H', '2H', 'HT', 'ET', 'P'];

export async function GET(request: NextRequest) {
  // Verify authorization (header or query param)
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');
  const isAuthorized = !CRON_SECRET ||
    authHeader === `Bearer ${CRON_SECRET}` ||
    secretParam === CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Sync/Live] Starting live match sync...');

  try {
    const supabase = createServiceClient();

    // Find matches that might be live (scheduled for today with live-ish status or starting soon)
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAhead = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Get matches that are either:
    // 1. Already marked as live
    // 2. Scheduled to start within the window (might have started)
    const { data: potentialLiveMatches, error: fetchError } = await supabase
      .from('fixtures_cache')
      .select('api_id, status, kickoff')
      .eq('match_date', today)
      .or(`status.in.(${LIVE_STATUSES.join(',')}),and(status.eq.NS,kickoff.gte.${twoHoursAgo.toISOString()},kickoff.lte.${threeHoursAhead.toISOString()})`);

    if (fetchError) {
      console.error('[Sync/Live] Error fetching potential live matches:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    if (!potentialLiveMatches || potentialLiveMatches.length === 0) {
      console.log('[Sync/Live] No live matches found');
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No live matches',
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[Sync/Live] Found ${potentialLiveMatches.length} potential live matches`);

    let updated = 0;
    const errors: string[] = [];

    // Update each match
    for (const match of potentialLiveMatches) {
      try {
        const details = await getMatch(match.api_id);

        // Map status
        let status = 'NS';
        switch (details.status) {
          case 'FINISHED': status = 'FT'; break;
          case 'IN_PLAY': status = details.minute && details.minute <= 45 ? '1H' : '2H'; break;
          case 'PAUSED': status = 'HT'; break;
          case 'SCHEDULED':
          case 'TIMED': status = 'NS'; break;
          case 'POSTPONED': status = 'PST'; break;
          case 'CANCELLED': status = 'CAN'; break;
          default: status = details.status;
        }

        // Update the cache
        const { error: updateError } = await supabase
          .from('fixtures_cache')
          .update({
            status,
            minute: details.minute || null,
            home_score: details.score.fullTime.home ?? details.score.halfTime?.home ?? null,
            away_score: details.score.fullTime.away ?? details.score.halfTime?.away ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('api_id', match.api_id);

        if (updateError) {
          errors.push(`Match ${match.api_id}: ${updateError.message}`);
        } else {
          updated++;
          console.log(`[Sync/Live] Updated match ${match.api_id}: ${status} ${details.score.fullTime.home ?? 0}-${details.score.fullTime.away ?? 0}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Match ${match.api_id}: ${msg}`);
        console.error(`[Sync/Live] Error updating match ${match.api_id}:`, err);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Sync/Live] Completed in ${duration}ms. Updated ${updated}/${potentialLiveMatches.length} matches.`);

    return NextResponse.json({
      success: true,
      updated,
      total: potentialLiveMatches.length,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync/Live] Fatal error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
