import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getGolfTournaments,
  getGolfLeaderboard,
  getGolfStandings,
  getGolfLeaders,
  getGolfSchedule,
} from '@/lib/api-espn-golf';
import type { GolfTourSlug } from '@/lib/types/golf';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TOURS: GolfTourSlug[] = ['pga', 'eur', 'lpga', 'liv'];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const mode = request.nextUrl.searchParams.get('mode') || 'live';
  const supabase = createServiceClient();

  const results: Record<string, { eventsSynced: number; standingsSynced: number; errors: string[] }> = {};

  try {
    for (const tour of TOURS) {
      const tourResults = { eventsSynced: 0, standingsSynced: 0, errors: [] as string[] };

      try {
        // --- Sync events ---
        const events = await getGolfTournaments(undefined, tour);

        if (events.length > 0) {
          // In full mode, fetch leaderboard details for each event
          if (mode === 'full') {
            for (const event of events) {
              try {
                const detailed = await getGolfLeaderboard(event.id, tour);
                if (detailed) {
                  const record = {
                    id: `golf_${tour}_${detailed.id}`,
                    tour_slug: tour,
                    espn_event_id: detailed.id,
                    event_name: detailed.name,
                    event_date: detailed.date ? detailed.date.split('T')[0] : null,
                    status: detailed.status,
                    event_data: detailed,
                    updated_at: new Date().toISOString(),
                  };

                  const { error } = await supabase
                    .from('golf_events_cache')
                    .upsert(record, { onConflict: 'id', ignoreDuplicates: false });

                  if (error) {
                    tourResults.errors.push(`Event ${event.id} upsert: ${error.message}`);
                  } else {
                    tourResults.eventsSynced++;
                  }
                }
                await new Promise(r => setTimeout(r, 200));
              } catch (err) {
                tourResults.errors.push(`Leaderboard ${event.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
              }
            }
          } else {
            // Live mode: upsert base events, fetch details only for in_progress
            const records = events.map(event => ({
              id: `golf_${tour}_${event.id}`,
              tour_slug: tour,
              espn_event_id: event.id,
              event_name: event.name,
              event_date: event.date ? event.date.split('T')[0] : null,
              status: event.status,
              event_data: event,
              updated_at: new Date().toISOString(),
            }));

            const { error } = await supabase
              .from('golf_events_cache')
              .upsert(records, { onConflict: 'id', ignoreDuplicates: false });

            if (error) {
              tourResults.errors.push(`Events upsert: ${error.message}`);
            } else {
              tourResults.eventsSynced = records.length;
            }

            // Fetch details for in_progress events
            const liveEvents = events.filter(e => e.status === 'in_progress');
            for (const event of liveEvents) {
              try {
                const detailed = await getGolfLeaderboard(event.id, tour);
                if (detailed) {
                  const { error: liveErr } = await supabase
                    .from('golf_events_cache')
                    .upsert({
                      id: `golf_${tour}_${detailed.id}`,
                      tour_slug: tour,
                      espn_event_id: detailed.id,
                      event_name: detailed.name,
                      event_date: detailed.date ? detailed.date.split('T')[0] : null,
                      status: detailed.status,
                      event_data: detailed,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'id', ignoreDuplicates: false });
                  if (liveErr) console.error(`[golf-sync] live detail upsert error (${tour}/${detailed.id}):`, liveErr.message);
                }
                await new Promise(r => setTimeout(r, 200));
              } catch (err) {
                tourResults.errors.push(`Live detail ${event.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
              }
            }
          }
        }

        // --- Sync standings data (full mode only) ---
        if (mode === 'full') {
          // Rankings
          try {
            const rankings = await getGolfStandings(tour);
            const { error: rankErr } = await supabase
              .from('golf_standings_cache')
              .upsert({
                id: `${tour}_rankings`,
                tour_slug: tour,
                data_type: 'rankings',
                data: rankings,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id', ignoreDuplicates: false });
            if (rankErr) console.error(`[golf-sync] rankings upsert error (${tour}):`, rankErr.message);
            tourResults.standingsSynced++;
          } catch (err) {
            tourResults.errors.push(`Rankings: ${err instanceof Error ? err.message : 'Unknown'}`);
          }

          // Leaders
          try {
            const leaders = await getGolfLeaders(tour);
            const { error: leadErr } = await supabase
              .from('golf_standings_cache')
              .upsert({
                id: `${tour}_leaders`,
                tour_slug: tour,
                data_type: 'leaders',
                data: leaders,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id', ignoreDuplicates: false });
            if (leadErr) console.error(`[golf-sync] leaders upsert error (${tour}):`, leadErr.message);
            tourResults.standingsSynced++;
          } catch (err) {
            tourResults.errors.push(`Leaders: ${err instanceof Error ? err.message : 'Unknown'}`);
          }

          // Schedule
          try {
            const schedule = await getGolfSchedule(tour);
            const { error: schedErr } = await supabase
              .from('golf_standings_cache')
              .upsert({
                id: `${tour}_schedule`,
                tour_slug: tour,
                data_type: 'schedule',
                data: { events: schedule },
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id', ignoreDuplicates: false });
            if (schedErr) console.error(`[golf-sync] schedule upsert error (${tour}):`, schedErr.message);
            tourResults.standingsSynced++;
          } catch (err) {
            tourResults.errors.push(`Schedule: ${err instanceof Error ? err.message : 'Unknown'}`);
          }
        }
      } catch (err) {
        tourResults.errors.push(`Tour ${tour}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }

      results[tour] = tourResults;

      // Rate limit: 200ms delay between tours
      await new Promise(r => setTimeout(r, 200));
    }

    const totalEventsSynced = Object.values(results).reduce((sum, r) => sum + r.eventsSynced, 0);
    const totalStandingsSynced = Object.values(results).reduce((sum, r) => sum + r.standingsSynced, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

    // Log to sync_log
    await supabase.from('sync_log').insert({
      sync_type: 'golf',
      sport_type: 'golf',
      records_synced: totalEventsSynced + totalStandingsSynced,
      status: totalErrors === 0 ? 'success' : 'partial',
      error_message: totalErrors > 0 ? JSON.stringify(
        Object.fromEntries(Object.entries(results).filter(([, r]) => r.errors.length > 0).map(([k, r]) => [k, r.errors]))
      ) : null,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: totalErrors === 0,
      mode,
      totalEventsSynced,
      totalStandingsSynced,
      totalErrors,
      results,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'golf',
        sport_type: 'golf',
        status: 'error',
        error_message: message,
        completed_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error('[golf-sync] sync_log insert failed:', logErr instanceof Error ? logErr.message : logErr);
    }

    return NextResponse.json({ error: 'Sync failed', message }, { status: 500 });
  }
}
