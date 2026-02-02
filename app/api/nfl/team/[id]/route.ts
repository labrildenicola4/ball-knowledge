import { NextRequest, NextResponse } from 'next/server';
import { getNFLTeam, getNFLTeamSchedule } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [teamInfo, schedule] = await Promise.all([
      getNFLTeam(id),
      getNFLTeamSchedule(id),
    ]);

    if (!teamInfo) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...teamInfo,
      schedule,
    });
  } catch (error) {
    console.error('[API] NFL team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
