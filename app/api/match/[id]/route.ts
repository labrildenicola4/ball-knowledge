import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, mapStatus } from '@/lib/football-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = Number(params.id);

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // Fetch match details and head-to-head in parallel
    const [match, h2hMatches] = await Promise.all([
      getMatch(matchId),
      getHeadToHead(matchId, 10).catch(() => []),
    ]);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchDate = new Date(match.utcDate);
    const { status: displayStatus, time } = mapStatus(match.status, match.minute);

    // Format date in UTC to avoid timezone shifts
    const utcDate = matchDate.toISOString().split('T')[0];
    const [year, month, day] = utcDate.split('-').map(Number);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[month - 1]} ${day}`;

    // Calculate H2H stats from recent matches
    let h2hStats = { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
    if (h2hMatches.length > 0) {
      h2hStats.total = h2hMatches.length;
      h2hMatches.forEach(m => {
        const homeGoals = m.score.fullTime.home ?? 0;
        const awayGoals = m.score.fullTime.away ?? 0;
        const isCurrentHomeTeamHome = m.homeTeam.id === match.homeTeam.id;

        if (homeGoals === awayGoals) {
          h2hStats.draws++;
        } else if ((homeGoals > awayGoals && isCurrentHomeTeamHome) || (awayGoals > homeGoals && !isCurrentHomeTeamHome)) {
          h2hStats.homeWins++;
        } else {
          h2hStats.awayWins++;
        }
      });
    }

    // Build the response
    // Note: Football-Data.org free tier doesn't provide lineups, detailed stats, or events
    const matchDetails = {
      id: match.id,
      league: match.competition.name,
      date: displayDate,
      venue: match.venue || 'TBD',
      attendance: null,
      status: displayStatus,
      matchday: match.matchday,
      home: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.tla || match.homeTeam.shortName || match.homeTeam.name.substring(0, 3).toUpperCase(),
        logo: match.homeTeam.crest,
        score: match.score.fullTime.home,
        // Stats not available in free tier
        possession: 0,
        shots: 0,
        shotsOnTarget: 0,
        corners: 0,
        fouls: 0,
        form: [],
        scorers: [],
        lineup: null,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.tla || match.awayTeam.shortName || match.awayTeam.name.substring(0, 3).toUpperCase(),
        logo: match.awayTeam.crest,
        score: match.score.fullTime.away,
        // Stats not available in free tier
        possession: 0,
        shots: 0,
        shotsOnTarget: 0,
        corners: 0,
        fouls: 0,
        form: [],
        scorers: [],
        lineup: null,
      },
      timeline: [], // Not available in free tier
      h2h: h2hStats,
      halfTimeScore: {
        home: match.score.halfTime.home,
        away: match.score.halfTime.away,
      },
    };

    return NextResponse.json(matchDetails);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
