import { NextRequest, NextResponse } from 'next/server';
import { getNFLTeam, getNFLTeamSchedule, getNFLStandings } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [teamInfo, schedule, standings] = await Promise.all([
      getNFLTeam(id),
      getNFLTeamSchedule(id),
      getNFLStandings(),
    ]);

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
    });
  } catch (error) {
    console.error('[API] NFL team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
