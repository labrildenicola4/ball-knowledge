import { NextResponse } from 'next/server';
import { getBasketballStandings, getBasketballRankings } from '@/lib/api-espn-basketball';
import { CONFERENCE_BY_ID } from '@/lib/constants/basketball-conferences';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('conference');
    const includeRankings = searchParams.get('rankings') !== 'false';

    const cacheKey = `CBB_STANDINGS_${conferenceId || 'all'}`;

    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'basketball')
      .eq('league_code', cacheKey)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < FRESHNESS_MS) {
        const response = NextResponse.json(cached.standings);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return response;
      }
    }

    // Cache miss or stale — fetch from ESPN
    let conferenceGroupId: number | undefined;

    if (conferenceId) {
      const conference = CONFERENCE_BY_ID[conferenceId];
      if (conference) {
        conferenceGroupId = conference.groupId;
      }
    }

    const [standingsData, rankings] = await Promise.all([
      conferenceGroupId ? getBasketballStandings(conferenceGroupId) : Promise.resolve([]),
      includeRankings ? getBasketballRankings() : Promise.resolve([]),
    ]);

    // Flatten standings from all conferences
    const standings = standingsData.flatMap(conf => conf.standings || []);

    const responseData = {
      standings,
      rankings,
    };

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'basketball',
          league_code: cacheKey,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/Basketball/Standings] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] Basketball standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
