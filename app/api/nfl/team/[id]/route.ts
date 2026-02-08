import { NextRequest, NextResponse } from 'next/server';
import { getNFLTeam, getNFLTeamSchedule, getNFLStandings, getNFLRoster } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    return NextResponse.json({
      ...teamInfo,
      schedule,
      standings,
      recentForm,
      roster,
    });
  } catch (error) {
    console.error('[API] NFL team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
