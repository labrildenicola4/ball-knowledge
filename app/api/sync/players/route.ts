import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Delete stale rows
  const { data: stale, error: deleteError } = await supabase
    .from('player_cache')
    .delete()
    .lt('updated_at', cutoff)
    .select('id');

  if (deleteError) {
    console.error('[Sync/Players] Delete error:', deleteError.message);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const purged = stale?.length ?? 0;

  // Count remaining
  const { count, error: countError } = await supabase
    .from('player_cache')
    .select('id', { count: 'exact', head: true });

  const remaining = countError ? -1 : (count ?? 0);

  return NextResponse.json({ purged, remaining });
}
