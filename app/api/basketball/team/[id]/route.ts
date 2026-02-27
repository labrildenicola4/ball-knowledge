import { NextResponse } from 'next/server';
import {
  getBasketballTeam,
  getCollegeBasketballRoster,
  getCollegeBasketballTeamStats,
  getCollegeBasketballRecentForm,
  getCollegeBasketballSchedule,
  getCollegeBasketballConferenceStandings,
  getBasketballRankings,
} from '@/lib/api-espn-basketball';
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
      .eq('sport_type', 'basketball')
      .eq('league_code', `CBB_TEAM_${id}`)
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
    const [team, roster, stats, recentForm, schedule, top25] = await Promise.all([
      getBasketballTeam(id),
      getCollegeBasketballRoster(id),
      getCollegeBasketballTeamStats(id),
      getCollegeBasketballRecentForm(id),
      getCollegeBasketballSchedule(id),
      getBasketballRankings(),
    ]);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch conference standings if we have the conference ID
    let standings = null;
    if (team.conference?.id) {
      standings = await getCollegeBasketballConferenceStandings(team.conference.id);
    }

    const responseData = {
      ...team,
      schedule, // Override with full schedule
      roster,
      stats,
      recentForm,
      standings,
      top25,
    };

    // Fire-and-forget write
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'basketball',
          league_code: `CBB_TEAM_${id}`,
          season: new Date().getFullYear().toString(),
          standings: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/Basketball/Team] Cache write error:', error);
      });

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[API] Basketball team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
