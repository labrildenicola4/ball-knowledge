import { NextRequest, NextResponse } from 'next/server';
import { getMLBTeam, getMLBRoster, getMLBTeamStats, getMLBRecentForm, getMLBTeamSchedule, getMLBStandings } from '@/lib/api-espn-mlb';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      ...team,
      roster,
      stats,
      recentForm,
      schedule,
      standings,
    });
  } catch (error) {
    console.error(`[API/MLB/Team/${teamId}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
