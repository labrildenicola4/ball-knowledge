import { NextResponse } from 'next/server';
import {
  getNBATeam,
  getNBARoster,
  getNBATeamStats,
  getNBARecentForm,
  getNBAStandings
} from '@/lib/api-espn-nba';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'basketball_nba')
      .eq('league_code', `NBA_TEAM_${id}`)
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

    // Cache miss or stale — fetch all data in parallel
    const [teamResult, rosterResult, statsResult, recentFormResult, standingsResult] = await Promise.allSettled([
      getNBATeam(id),
      getNBARoster(id),
      getNBATeamStats(id),
      getNBARecentForm(id),
      getNBAStandings(),
    ]);

    const team = teamResult.status === 'fulfilled' ? teamResult.value : null;
    const roster = rosterResult.status === 'fulfilled' ? rosterResult.value : null;
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
    const recentForm = recentFormResult.status === 'fulfilled' ? recentFormResult.value : null;
    const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : null;

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const responseData = {
      ...team,
      roster,
      stats,
      recentForm,
      standings,
    };

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'basketball_nba',
          league_code: `NBA_TEAM_${id}`,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/NBA/Team] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] NBA team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
