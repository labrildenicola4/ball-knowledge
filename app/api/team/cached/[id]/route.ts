import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTeamDetails, mapStatus } from '@/lib/football-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  try {
    // Try to get cached team info and matches in parallel
    const [cachedTeamResult, cachedMatchesResult] = await Promise.all([
      supabase
        .from('teams_cache')
        .select('*')
        .eq('api_id', teamId)
        .single(),
      supabase
        .from('fixtures_cache')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('kickoff', { ascending: false })
        .limit(100),
    ]);

    const cachedTeam = cachedTeamResult.data;
    const cachedMatches = cachedMatchesResult.data || [];

    // We still need full team details for squad, competitions, etc.
    // This is the only slow API call now
    let teamDetails;
    try {
      teamDetails = await getTeamDetails(teamId);
    } catch (error) {
      // If API fails but we have cached data, return partial response
      if (cachedTeam && cachedMatches.length > 0) {
        return buildPartialResponse(cachedTeam, cachedMatches, teamId);
      }
      throw error;
    }

    // Transform cached matches to our format
    const transformCachedMatch = (match: typeof cachedMatches[0]) => {
      const matchDate = new Date(match.kickoff);
      const isHome = match.home_team_id === teamId;

      // Format date
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

      // Format time
      const hours = matchDate.getUTCHours();
      const minutes = matchDate.getUTCMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: match.api_id,
        competition: match.league_name,
        competitionCode: match.league_code,
        competitionLogo: match.league_logo || `https://crests.football-data.org/${match.league_code}.png`,
        date: displayDate,
        fullDate: matchDate.toISOString(),
        time: displayTime,
        status: match.status,
        matchday: match.matchday,
        home: {
          id: match.home_team_id,
          name: match.home_team_name,
          logo: match.home_team_logo,
          score: match.home_score,
        },
        away: {
          id: match.away_team_id,
          name: match.away_team_name,
          logo: match.away_team_logo,
          score: match.away_score,
        },
        isHome,
      };
    };

    // Use cached matches if available, otherwise would need API call
    const transformedMatches = cachedMatches.map(transformCachedMatch);

    // Split into finished and scheduled
    const finishedMatches = transformedMatches
      .filter(m => m.status === 'FT')
      .sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());

    const scheduledMatches = transformedMatches
      .filter(m => m.status === 'NS' || m.status === 'TIMED')
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Compute form from finished matches
    const form: string[] = [];
    const recentFinished = finishedMatches.slice(0, 5);
    for (const match of recentFinished) {
      const teamScore = match.isHome ? match.home.score : match.away.score;
      const opponentScore = match.isHome ? match.away.score : match.home.score;

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
      const teamScore = match.isHome ? match.home.score : match.away.score;
      const opponentScore = match.isHome ? match.away.score : match.home.score;
      const opponent = match.isHome ? match.away.name : match.home.name;

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
        if (match.isHome) homeWins++;
        else awayWins++;
      } else if (teamScore < opponentScore) {
        losses++;
        if (match.isHome) homeLosses++;
        else awayLosses++;
      } else {
        draws++;
        if (match.isHome) homeDraws++;
        else awayDraws++;
      }
    }

    const played = wins + draws + losses;
    const points = wins * 3 + draws;
    const ppg = played > 0 ? (points / played).toFixed(2) : '0.00';

    // Transform squad data from API
    const squad = (teamDetails.squad || []).map(player => {
      let age: number | null = null;
      if (player.dateOfBirth) {
        const birthDate = new Date(player.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      return {
        id: player.id,
        name: player.name,
        position: player.position || 'Unknown',
        nationality: player.nationality || 'Unknown',
        shirtNumber: player.shirtNumber || null,
        age,
        stats: {
          appearances: null,
          substitutions: null,
          goals: null,
          assists: null,
          shots: null,
          shotsOnTarget: null,
          foulsCommitted: null,
          foulsSuffered: null,
          yellowCards: null,
          redCards: null,
          saves: null,
          goalsAgainst: null,
        },
      };
    });

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
        logo: c.emblem || `https://crests.football-data.org/${c.code}.png`,
      })),
      form: form.slice(0, 5),
      finishedMatches,
      scheduledMatches,
      squad: squadByPosition,
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
      cached: cachedMatches.length > 0,
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

// Build partial response when API is unavailable but cache exists
function buildPartialResponse(cachedTeam: any, cachedMatches: any[], teamId: number) {
  const transformCachedMatch = (match: any) => {
    const matchDate = new Date(match.kickoff);
    const isHome = match.home_team_id === teamId;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

    const hours = matchDate.getUTCHours();
    const minutes = matchDate.getUTCMinutes();
    const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return {
      id: match.api_id,
      competition: match.league_name,
      competitionCode: match.league_code,
      competitionLogo: match.league_logo,
      date: displayDate,
      fullDate: matchDate.toISOString(),
      time: displayTime,
      status: match.status,
      matchday: match.matchday,
      home: {
        id: match.home_team_id,
        name: match.home_team_name,
        logo: match.home_team_logo,
        score: match.home_score,
      },
      away: {
        id: match.away_team_id,
        name: match.away_team_name,
        logo: match.away_team_logo,
        score: match.away_score,
      },
      isHome,
    };
  };

  const transformedMatches = cachedMatches.map(transformCachedMatch);
  const finishedMatches = transformedMatches.filter(m => m.status === 'FT');
  const scheduledMatches = transformedMatches.filter(m => m.status === 'NS');

  return NextResponse.json({
    id: cachedTeam.api_id,
    name: cachedTeam.name,
    shortName: cachedTeam.short_name,
    tla: cachedTeam.tla,
    crest: cachedTeam.crest,
    founded: null,
    venue: null,
    clubColors: null,
    website: null,
    coach: null,
    coachNationality: null,
    competitions: [],
    form: [],
    finishedMatches,
    scheduledMatches,
    squad: [],
    statistics: {
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
      points: 0, ppg: '0.00', cleanSheets: 0,
      homeRecord: { wins: 0, draws: 0, losses: 0 },
      awayRecord: { wins: 0, draws: 0, losses: 0 },
      biggestWin: 'N/A', biggestLoss: 'N/A', winRate: 0,
    },
    cached: true,
    partial: true,
  });
}
