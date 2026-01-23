import { NextRequest, NextResponse } from 'next/server';
import { getTeamDetails, getTeamMatches, mapStatus } from '@/lib/football-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  try {
    // Fetch team details and matches in parallel
    const [teamDetails, recentMatches, upcomingMatches] = await Promise.all([
      getTeamDetails(teamId),
      getTeamMatches(teamId, 'FINISHED', 5),
      getTeamMatches(teamId, 'SCHEDULED', 5),
    ]);

    // Transform matches to our format
    const transformMatch = (match: typeof recentMatches[0]) => {
      const matchDate = new Date(match.utcDate);
      const { status: displayStatus } = mapStatus(match.status, match.minute);

      // Format date
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

      // Format time
      const hours = matchDate.getUTCHours();
      const minutes = matchDate.getUTCMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: match.id,
        competition: match.competition.name,
        competitionLogo: match.competition.emblem,
        date: displayDate,
        time: displayTime,
        status: displayStatus,
        home: {
          id: match.homeTeam.id,
          name: match.homeTeam.shortName || match.homeTeam.name,
          logo: match.homeTeam.crest,
          score: match.score.fullTime.home,
        },
        away: {
          id: match.awayTeam.id,
          name: match.awayTeam.shortName || match.awayTeam.name,
          logo: match.awayTeam.crest,
          score: match.score.fullTime.away,
        },
        isHome: match.homeTeam.id === teamId,
      };
    };

    // Compute form from recent matches
    const form: string[] = [];
    for (const match of recentMatches.slice().reverse()) {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
      const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;

      if (teamScore === null || opponentScore === null) continue;

      if (teamScore > opponentScore) {
        form.push('W');
      } else if (teamScore < opponentScore) {
        form.push('L');
      } else {
        form.push('D');
      }
    }

    return NextResponse.json({
      id: teamDetails.id,
      name: teamDetails.name,
      shortName: teamDetails.shortName,
      tla: teamDetails.tla,
      crest: teamDetails.crest,
      founded: teamDetails.founded,
      venue: teamDetails.venue,
      clubColors: teamDetails.clubColors,
      website: teamDetails.website,
      coach: teamDetails.coach?.name || null,
      competitions: teamDetails.runningCompetitions.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        logo: c.emblem,
      })),
      form: form.slice(0, 5),
      recentMatches: recentMatches.map(transformMatch).reverse(), // Most recent first
      upcomingMatches: upcomingMatches.map(transformMatch),
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'Rate limited - please wait a moment and try again',
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to fetch team details' }, { status: 500 });
  }
}
