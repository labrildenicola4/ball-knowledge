import { NextResponse } from 'next/server';
import { getNHLTeam, getNHLTeamSchedule, getNHLRoster } from '@/lib/api-espn-nhl';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

    // Read standings from cache instead of calling getNHLStandings()
    const standingsPromise = supabase
      .from('standings_cache')
      .select('standings')
      .eq('sport_type', 'hockey_nhl')
      .eq('league_code', 'NHL')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const [teamResult, scheduleResult, standingsResult, rosterResult] = await Promise.allSettled([
      getNHLTeam(id),
      getNHLTeamSchedule(id),
      standingsPromise,
      getNHLRoster(id),
    ]);

    const team = teamResult.status === 'fulfilled' ? teamResult.value : null;
    const schedule = scheduleResult.status === 'fulfilled' ? scheduleResult.value : null;
    const standings = standingsResult.status === 'fulfilled'
      ? standingsResult.value.data?.standings ?? null
      : null;
    const roster = rosterResult.status === 'fulfilled' ? rosterResult.value : [];

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      ...team,
      roster,
      schedule,
      standings,
    });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  } catch (error) {
    console.error('[API] NHL team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
