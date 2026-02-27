import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getF1Events, getF1EventDetails, getF1Standings } from '@/lib/api-espn-f1';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const mode = request.nextUrl.searchParams.get('mode') || 'live';
  const supabase = createServiceClient();

  let eventsSynced = 0;
  let standingsSynced = false;
  const errors: string[] = [];

  try {
    // --- Sync events ---
    const events = await getF1Events();

    if (events.length > 0) {
      // In live mode, fetch details only for in_progress events
      // In full mode, fetch details for all events
      const eventsToDetail = mode === 'full'
        ? events
        : events.filter(e => e.status === 'in_progress');

      // Fetch details (with results) for relevant events
      const detailedEvents = new Map<string, typeof events[0]>();

      for (const event of eventsToDetail) {
        try {
          const detailed = await getF1EventDetails(event.id);
          if (detailed) {
            detailedEvents.set(detailed.id, detailed);
          }
          // Rate limit: 200ms delay between detail fetches
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          errors.push(`Detail fetch failed for event ${event.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      }

      // Build upsert records: use detailed version if available, otherwise base event
      const records = events.map(event => {
        const detailed = detailedEvents.get(event.id) || event;
        return {
          id: `f1_${detailed.id}`,
          espn_event_id: detailed.id,
          event_name: detailed.name,
          short_name: detailed.shortName,
          event_date: detailed.date ? detailed.date.split('T')[0] : null,
          start_date: detailed.date,
          status: detailed.status,
          event_data: detailed,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('f1_events_cache')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: false });

      if (error) {
        errors.push(`Events upsert error: ${error.message}`);
      } else {
        eventsSynced = records.length;
      }
    }

    // --- Sync standings (full mode only) ---
    if (mode === 'full') {
      try {
        const standings = await getF1Standings();

        const { error } = await supabase
          .from('f1_standings_cache')
          .upsert({
            id: 'current',
            season: new Date().getFullYear(),
            driver_standings: standings.driverStandings,
            constructor_standings: standings.constructorStandings,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          errors.push(`Standings upsert error: ${error.message}`);
        } else {
          standingsSynced = true;
        }
      } catch (err) {
        errors.push(`Standings fetch error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    // Log to sync_log
    await supabase.from('sync_log').insert({
      sync_type: 'f1',
      sport_type: 'f1',
      records_synced: eventsSynced + (standingsSynced ? 1 : 0),
      status: errors.length === 0 ? 'success' : 'partial',
      error_message: errors.length > 0 ? JSON.stringify(errors) : null,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: errors.length === 0,
      mode,
      eventsSynced,
      standingsSynced,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'f1',
        sport_type: 'f1',
        status: 'error',
        error_message: message,
        completed_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json(
      { error: 'Sync failed', message },
      { status: 500 }
    );
  }
}
