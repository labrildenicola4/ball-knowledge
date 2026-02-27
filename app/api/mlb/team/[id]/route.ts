import { NextRequest, NextResponse } from 'next/server';
import { getMLBTeam, getMLBRoster, getMLBTeamStats, getMLBRecentForm, getMLBTeamSchedule, getMLBStandings } from '@/lib/api-espn-mlb';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;

  if (!teamId) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  try {
    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'baseball')
      .eq('league_code', `MLB_TEAM_${teamId}`)
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
    const [teamResult, rosterResult, statsResult, recentFormResult, scheduleResult, standingsResult] = await Promise.allSettled([
      getMLBTeam(teamId),
      getMLBRoster(teamId),
      getMLBTeamStats(teamId),
      getMLBRecentForm(teamId),
      getMLBTeamSchedule(teamId),
      getMLBStandings(),
    ]);

    const team = teamResult.status === 'fulfilled' ? teamResult.value : null;
    const roster = rosterResult.status === 'fulfilled' ? rosterResult.value : null;
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
    const recentForm = recentFormResult.status === 'fulfilled' ? recentFormResult.value : null;
    const schedule = scheduleResult.status === 'fulfilled' ? scheduleResult.value : null;
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
      schedule,
      standings,
    };

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'baseball',
          league_code: `MLB_TEAM_${teamId}`,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/MLB/Team] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error(`[API/MLB/Team/${teamId}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
