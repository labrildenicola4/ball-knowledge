import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getMatch } from '@/lib/football-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Status codes that indicate a live match
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'LIVE', '1H', '2H', 'HT', 'ET', 'P'];

export async function GET(request: NextRequest) {
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
    // 2. Scheduled to start within the time window (might have started)
    // Using simpler query: get all today's matches that are live OR scheduled
    const { data: potentialLiveMatches, error: fetchError } = await supabase
      .from('fixtures_cache')
      .select('api_id, status, kickoff')
      .eq('match_date', today)
      .in('status', [...LIVE_STATUSES, 'NS']);

    if (fetchError) {
      console.error('[Sync/Live] Error fetching potential live matches:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch matches',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    if (!potentialLiveMatches || potentialLiveMatches.length === 0) {
      console.log('[Sync/Live] No matches found for today');
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No matches today',
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Filter to only matches that are live OR scheduled within our time window
    const matchesToCheck = potentialLiveMatches.filter(match => {
      // If already live, always check
      if (LIVE_STATUSES.includes(match.status)) return true;

      // For scheduled matches, only check if kickoff is within our window
      if (match.status === 'NS' && match.kickoff) {
        const kickoffTime = new Date(match.kickoff).getTime();
        return kickoffTime >= twoHoursAgo.getTime() && kickoffTime <= threeHoursAhead.getTime();
      }

      return false;
    });

    if (matchesToCheck.length === 0) {
      console.log('[Sync/Live] No matches in the active time window');
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No matches in active window',
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[Sync/Live] Found ${matchesToCheck.length} matches to check (${potentialLiveMatches.length} total today)`);

    let updated = 0;
    const errors: string[] = [];

    // Update each match
    for (const match of matchesToCheck) {
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
    console.log(`[Sync/Live] Completed in ${duration}ms. Updated ${updated}/${matchesToCheck.length} matches.`);

    return NextResponse.json({
      success: true,
      updated,
      total: matchesToCheck.length,
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
