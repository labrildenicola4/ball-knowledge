import { NextRequest, NextResponse } from 'next/server';
import { getNFLTeam, getNFLTeamSchedule, getNFLStandings, getNFLRoster } from '@/lib/api-espn-nfl';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'football_nfl')
      .eq('league_code', `NFL_TEAM_${id}`)
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
    const [teamInfoResult, scheduleResult, standingsResult, rosterResult] = await Promise.allSettled([
      getNFLTeam(id),
      getNFLTeamSchedule(id),
      getNFLStandings(),
      getNFLRoster(id),
    ]);

    const teamInfo = teamInfoResult.status === 'fulfilled' ? teamInfoResult.value : null;
    const schedule = scheduleResult.status === 'fulfilled' ? scheduleResult.value : [];
    const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : null;
    const roster = rosterResult.status === 'fulfilled' ? rosterResult.value : null;

    if (!teamInfo) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Extract recent form from completed games
    const recentForm = schedule
      .filter(g => g.status === 'final' && g.result)
      .slice(-5)
      .map(g => ({
        id: g.id,
        win: g.result!.win,
        score: g.result!.score,
        opponent: g.opponent.abbreviation,
        isHome: g.isHome,
      }));

    const responseData = {
      ...teamInfo,
      schedule,
      standings,
      recentForm,
      roster,
    };

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'football_nfl',
          league_code: `NFL_TEAM_${id}`,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/NFL/Team] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] NFL team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
