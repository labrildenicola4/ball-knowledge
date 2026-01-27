import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Returns ONLY cached data - no API calls, instant response
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  try {
    // Get cached team info and matches in parallel - pure Supabase, no API
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

    // If team not in cache, return empty response instead of 404
    // This allows the frontend to wait for the full API instead of showing "not found"
    if (!cachedTeam) {
      return NextResponse.json({
        notCached: true,
        id: teamId,
      });
    }

    // Transform cached matches
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

      if (teamScore > opponentScore) form.push('W');
      else if (teamScore < opponentScore) form.push('L');
      else form.push('D');
    }

    // Compute basic statistics from cached matches
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;

    for (const match of finishedMatches) {
      const teamScore = match.isHome ? match.home.score : match.away.score;
      const opponentScore = match.isHome ? match.away.score : match.home.score;

      if (teamScore === null || opponentScore === null) continue;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (teamScore > opponentScore) wins++;
      else if (teamScore < opponentScore) losses++;
      else draws++;
    }

    const played = wins + draws + losses;
    const points = wins * 3 + draws;

    return NextResponse.json({
      id: cachedTeam.api_id,
      name: cachedTeam.name,
      shortName: cachedTeam.short_name || cachedTeam.name,
      tla: cachedTeam.tla,
      crest: cachedTeam.crest,
      founded: null, // Only available from full API
      venue: null,
      clubColors: null,
      website: null,
      coach: null,
      coachNationality: null,
      competitions: [], // Will be loaded from full API
      form,
      finishedMatches,
      scheduledMatches,
      squad: [], // Will be loaded from full API
      statistics: {
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        ppg: played > 0 ? (points / played).toFixed(2) : '0.00',
        cleanSheets: 0,
        homeRecord: { wins: 0, draws: 0, losses: 0 },
        awayRecord: { wins: 0, draws: 0, losses: 0 },
        biggestWin: 'N/A',
        biggestLoss: 'N/A',
        winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      },
      cached: true,
      partial: true, // Indicates squad/competitions will load separately
    });
  } catch (error) {
    console.error('[Team/Cached] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}
