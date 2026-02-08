import { NextResponse } from 'next/server';
import { getNFLStandings } from '@/lib/api-espn-nfl';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 5 minute freshness threshold for standings
const STANDINGS_FRESHNESS_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'football_nfl')
      .eq('league_code', 'NFL')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < STANDINGS_FRESHNESS_MS) {
        return NextResponse.json({ ...cached.standings, cached: true });
      }
    }

    // Fall back to direct ESPN API
    const standings = await getNFLStandings();
    return NextResponse.json(standings);
  } catch (error) {
    console.error('[API] NFL standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL standings' },
      { status: 500 }
    );
  }
}
