import { NextResponse } from 'next/server';
import { getMLBStandings } from '@/lib/api-espn-mlb';
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
      .eq('sport_type', 'baseball')
      .eq('league_code', 'MLB')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < STANDINGS_FRESHNESS_MS) {
        const standings = cached.standings;
        return NextResponse.json({
          standings,
          count: Array.isArray(standings) ? standings.reduce((acc: number, div: { standings?: unknown[] }) => acc + (div.standings?.length || 0), 0) : 0,
          cached: true,
        });
      }
    }

    // Fall back to direct ESPN API
    const standings = await getMLBStandings();

    return NextResponse.json({
      standings,
      count: standings.reduce((acc, div) => acc + div.standings.length, 0),
    });
  } catch (error) {
    console.error('[API/MLB/Standings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLB standings', standings: [] },
      { status: 500 }
    );
  }
}
