import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getUFCEvents, getUFCEventDetails } from '@/lib/api-espn-ufc';

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
  const errors: string[] = [];

  try {
    const events = await getUFCEvents();

    if (events.length > 0) {
      // In live mode, fetch details only for in_progress events
      // In full mode, fetch details for all events
      const eventsToDetail = mode === 'full'
        ? events
        : events.filter(e => e.status === 'in_progress');

      const detailedEvents = new Map<string, typeof events[0]>();

      for (const event of eventsToDetail) {
        try {
          const detailed = await getUFCEventDetails(event.id);
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
          id: `ufc_${detailed.id}`,
          espn_event_id: detailed.id,
          event_name: detailed.name,
          event_date: detailed.date ? detailed.date.split('T')[0] : null,
          status: detailed.status,
          event_data: detailed,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('ufc_events_cache')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: false });

      if (error) {
        errors.push(`Events upsert error: ${error.message}`);
      } else {
        eventsSynced = records.length;
      }
    }

    // Log to sync_log
    await supabase.from('sync_log').insert({
      sync_type: 'ufc',
      sport_type: 'ufc',
      records_synced: eventsSynced,
      status: errors.length === 0 ? 'success' : 'partial',
      error_message: errors.length > 0 ? JSON.stringify(errors) : null,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: errors.length === 0,
      mode,
      eventsSynced,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'ufc',
        sport_type: 'ufc',
        status: 'error',
        error_message: message,
        completed_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ error: 'Sync failed', message }, { status: 500 });
  }
}
