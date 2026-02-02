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

    return NextResponse.json({
      ...team,
      schedule, // Override with full schedule
      roster,
      stats,
      recentForm,
      standings,
      top25,
    });
  } catch (error) {
    console.error('[API] Basketball team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
