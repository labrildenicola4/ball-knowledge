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
    // Get more matches to show full season
    const [teamDetails, finishedMatches, scheduledMatches] = await Promise.all([
      getTeamDetails(teamId),
      getTeamMatches(teamId, 'FINISHED', 50),
      getTeamMatches(teamId, 'SCHEDULED', 50),
    ]);

    // Transform matches to our format
    const transformMatch = (match: typeof finishedMatches[0]) => {
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
        competitionCode: match.competition.code,
        competitionLogo: match.competition.emblem,
        date: displayDate,
        fullDate: matchDate.toISOString(),
        time: displayTime,
        status: displayStatus,
        matchday: match.matchday,
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

    // Transform all matches
    const allFinished = finishedMatches.map(transformMatch);
    const allScheduled = scheduledMatches.map(transformMatch);

    // Compute form from last 5 finished matches
    const form: string[] = [];
    const recentFinished = finishedMatches.slice(-5).reverse();
    for (const match of recentFinished) {
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

    // Compute statistics from finished matches
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0;
    let cleanSheets = 0;
    let biggestWin = { margin: 0, match: '' };
    let biggestLoss = { margin: 0, match: '' };

    for (const match of finishedMatches) {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
      const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;
      const opponent = isHome ? match.awayTeam.shortName : match.homeTeam.shortName;

      if (teamScore === null || opponentScore === null) continue;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (opponentScore === 0) cleanSheets++;

      const margin = teamScore - opponentScore;
      if (margin > biggestWin.margin) {
        biggestWin = { margin, match: `${teamScore}-${opponentScore} vs ${opponent}` };
      }
      if (margin < -biggestLoss.margin) {
        biggestLoss = { margin: -margin, match: `${teamScore}-${opponentScore} vs ${opponent}` };
      }

      if (teamScore > opponentScore) {
        wins++;
        if (isHome) homeWins++;
        else awayWins++;
      } else if (teamScore < opponentScore) {
        losses++;
        if (isHome) homeLosses++;
        else awayLosses++;
      } else {
        draws++;
        if (isHome) homeDraws++;
        else awayDraws++;
      }
    }

    const played = wins + draws + losses;
    const points = wins * 3 + draws;
    const ppg = played > 0 ? (points / played).toFixed(2) : '0.00';

    // Transform squad data
    const squad = (teamDetails.squad || []).map(player => ({
      id: player.id,
      name: player.name,
      position: player.position || 'Unknown',
      nationality: player.nationality || 'Unknown',
    }));

    // Group squad by position
    const positions = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];
    const squadByPosition = positions.map(pos => ({
      position: pos,
      players: squad.filter(p => p.position === pos ||
        (pos === 'Defence' && p.position?.includes('Back')) ||
        (pos === 'Midfield' && p.position?.includes('Midfield')) ||
        (pos === 'Offence' && (p.position?.includes('Forward') || p.position?.includes('Winger')))
      ),
    })).filter(g => g.players.length > 0);

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
      coachNationality: teamDetails.coach?.nationality || null,
      competitions: teamDetails.runningCompetitions.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        logo: c.emblem,
      })),
      form: form.slice(0, 5),
      // Full season matches
      finishedMatches: allFinished.reverse(), // Most recent first
      scheduledMatches: allScheduled, // Chronological order
      // Squad
      squad: squadByPosition,
      // Statistics
      statistics: {
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        ppg,
        cleanSheets,
        homeRecord: { wins: homeWins, draws: homeDraws, losses: homeLosses },
        awayRecord: { wins: awayWins, draws: awayDraws, losses: awayLosses },
        biggestWin: biggestWin.match || 'N/A',
        biggestLoss: biggestLoss.match || 'N/A',
        winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      },
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
