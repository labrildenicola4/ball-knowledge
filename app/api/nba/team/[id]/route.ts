import { NextResponse } from 'next/server';
import {
  getNBATeam,
  getNBARoster,
  getNBATeamStats,
  getNBARecentForm,
  getNBAStandings
} from '@/lib/api-espn-nba';

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

    // Fetch all data in parallel
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

    return NextResponse.json({
      ...team,
      roster,
      stats,
      recentForm,
      standings,
    });
  } catch (error) {
    console.error('[API] NBA team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
