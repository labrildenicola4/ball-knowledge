import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';

// Reverse mapping: competition code (PD) -> league ID (laliga)
const CODE_TO_LEAGUE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([leagueId, code]) => [code, leagueId])
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = Number(params.id);

  if (!matchId) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // Fetch match details first to get team IDs
    const match = await getMatch(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Fetch H2H and team forms in parallel
    const [h2hMatches, homeForm, awayForm] = await Promise.all([
      getHeadToHead(matchId, 10).catch(() => []),
      getTeamForm(match.homeTeam.id, 5).catch(() => []),
      getTeamForm(match.awayTeam.id, 5).catch(() => []),
    ]);

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
    const leagueCode = CODE_TO_LEAGUE[match.competition.code] || null;

    const matchDetails = {
      id: match.id,
      league: match.competition.name,
      leagueCode: leagueCode,
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
        form: homeForm,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.tla || match.awayTeam.shortName || match.awayTeam.name.substring(0, 3).toUpperCase(),
        logo: match.awayTeam.crest,
        score: match.score.fullTime.away,
        form: awayForm,
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
