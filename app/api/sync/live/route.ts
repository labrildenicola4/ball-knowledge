import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getFixture } from '@/lib/api-football';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Get date in Eastern Time as YYYY-MM-DD
function getEasternDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Status codes that indicate a live match
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'LIVE', '1H', '2H', 'HT', 'ET', 'P'];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const supabase = createServiceClient();

    // Find matches that might be live (scheduled for today with live-ish status or starting soon)
    const today = getEasternDate(new Date());
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
      return NextResponse.json({
        error: 'Failed to fetch matches',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    if (!potentialLiveMatches || potentialLiveMatches.length === 0) {
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
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No matches in active window',
        duration: `${Date.now() - startTime}ms`,
      });
    }

    let updated = 0;
    const errors: string[] = [];

    // Update each match
    for (const match of matchesToCheck) {
      try {
        const fixture = await getFixture(match.api_id);

        if (!fixture) {
          errors.push(`Match ${match.api_id}: Not found`);
          continue;
        }

        // Map api-football status codes
        let status = 'NS';
        const apiStatus = fixture.fixture.status.short;
        switch (apiStatus) {
          case 'FT':
          case 'AET':
          case 'PEN': status = 'FT'; break;
          case '1H': status = '1H'; break;
          case '2H': status = '2H'; break;
          case 'HT': status = 'HT'; break;
          case 'ET': status = 'ET'; break;
          case 'NS':
          case 'TBD': status = 'NS'; break;
          case 'PST': status = 'PST'; break;
          case 'CANC': status = 'CAN'; break;
          case 'SUSP': status = 'SUSP'; break;
          case 'INT': status = 'INT'; break;
          case 'LIVE': status = fixture.fixture.status.elapsed && fixture.fixture.status.elapsed <= 45 ? '1H' : '2H'; break;
          default: status = apiStatus;
        }

        // Update the cache
        const { error: updateError } = await supabase
          .from('fixtures_cache')
          .update({
            status,
            minute: fixture.fixture.status.elapsed || null,
            home_score: fixture.goals.home ?? fixture.score.halftime?.home ?? null,
            away_score: fixture.goals.away ?? fixture.score.halftime?.away ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('api_id', match.api_id);

        if (updateError) {
          errors.push(`Match ${match.api_id}: ${updateError.message}`);
        } else {
          updated++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Match ${match.api_id}: ${msg}`);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      updated,
      total: matchesToCheck.length,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
