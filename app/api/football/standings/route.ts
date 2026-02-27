import { NextResponse } from 'next/server';
import { getCollegeFootballStandings, getCollegeFootballRankings } from '@/lib/api-espn-college-football';
import { MULTI_SPORT_CONFERENCES } from '@/lib/constants/unified-conferences';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('conference');
    const includeRankings = searchParams.get('rankings') !== 'false';

    const cacheKey = `CFB_STANDINGS_${conferenceId || 'all'}`;

    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'football_college')
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
      const conference = MULTI_SPORT_CONFERENCES.find(c => c.id === conferenceId);
      if (conference?.football) {
        conferenceGroupId = conference.football.groupId;
      }
    }

    const [standingsData, rankings] = await Promise.all([
      conferenceGroupId ? getCollegeFootballStandings(conferenceGroupId) : Promise.resolve([]),
      includeRankings ? getCollegeFootballRankings() : Promise.resolve([]),
    ]);

    // Flatten standings from all conferences and transform to expected format
    const standings = standingsData.flatMap(conf =>
      conf.standings.map(s => ({
        id: s.team.id,
        name: s.team.displayName || s.team.name,
        shortName: s.team.shortDisplayName || s.team.abbreviation,
        logo: s.team.logo,
        conferenceRecord: `${s.conferenceRecord.wins}-${s.conferenceRecord.losses}`,
        overallRecord: `${s.overallRecord.wins}-${s.overallRecord.losses}`,
      }))
    );

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
          sport_type: 'football_college',
          league_code: cacheKey,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/Football/Standings] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] Football standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
