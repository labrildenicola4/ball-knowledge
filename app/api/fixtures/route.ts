import { NextRequest, NextResponse } from 'next/server';
import { getMatches, getTodayMatches, COMPETITION_CODES, mapStatus, type LeagueId } from '@/lib/football-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get('league') || 'laliga';
  const date = searchParams.get('date'); // Filter by date YYYY-MM-DD
  const status = searchParams.get('status'); // Filter by status: NS, FT, LIVE, etc.
  const limit = searchParams.get('limit'); // Limit number of results

  try {
    const competitionCode = COMPETITION_CODES[league as LeagueId];

    if (!competitionCode) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
    }

    // Fetch matches - if date provided, use date range, otherwise get recent matches
    let matches;
    if (date) {
      matches = await getMatches(competitionCode, date, date);
    } else {
      // Get matches for a range around today
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const weekAhead = new Date(today);
      weekAhead.setDate(today.getDate() + 7);

      matches = await getMatches(
        competitionCode,
        weekAgo.toISOString().split('T')[0],
        weekAhead.toISOString().split('T')[0]
      );
    }

    // Transform API response to our format
    let transformedMatches = matches.map((match) => {
      const matchDate = new Date(match.utcDate);
      const { status: displayStatus, time } = mapStatus(match.status, match.minute);

      // Format date in UTC to avoid timezone shifts
      const utcDate = matchDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
      const [year, month, day] = utcDate.split('-').map(Number);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[month - 1]} ${day}`;

      // Format time in UTC
      const hours = matchDate.getUTCHours();
      const minutes = matchDate.getUTCMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: match.id,
        league: match.competition.name,
        leagueCode: match.competition.code,
        leagueLogo: match.competition.emblem,
        home: match.homeTeam.shortName || match.homeTeam.name,
        away: match.awayTeam.shortName || match.awayTeam.name,
        homeId: match.homeTeam.id,
        awayId: match.awayTeam.id,
        homeScore: match.score.fullTime.home,
        awayScore: match.score.fullTime.away,
        homeLogo: match.homeTeam.crest,
        awayLogo: match.awayTeam.crest,
        status: displayStatus,
        time: displayStatus === 'NS' ? displayTime : time,
        venue: match.venue || 'TBD',
        date: displayDate,
        fullDate: utcDate,
        timestamp: matchDate.getTime(),
        matchday: match.matchday,
        stage: match.stage,
      };
    });

    // Filter by status if provided
    if (status) {
      transformedMatches = transformedMatches.filter(m => m.status === status);
    }

    // Sort by date/time
    transformedMatches.sort((a, b) => a.timestamp - b.timestamp);

    // Limit results if specified
    if (limit) {
      transformedMatches = transformedMatches.slice(0, parseInt(limit));
    }

    return NextResponse.json({ matches: transformedMatches });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a rate limit error
    if (errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'Rate limited - please wait a moment and try again',
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
