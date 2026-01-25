import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';

// Force dynamic rendering - no caching at Vercel edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Reverse mapping from competition code to league key
const CODE_TO_LEAGUE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([key, code]) => [code, key])
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
    // Fetch match details from football-data.org
    const match = await getMatch(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const statusInfo = mapStatus(match.status, match.minute);

    const isLive = ['1H', '2H', 'HT', 'LIVE'].includes(statusInfo.status);

    // Fetch H2H and team forms in parallel
    const [h2hData, homeForm, awayForm] = await Promise.all([
      getHeadToHead(matchId, 10).catch(() => []),
      getTeamForm(match.homeTeam.id, 5).catch(() => []),
      getTeamForm(match.awayTeam.id, 5).catch(() => []),
    ]);

    // Calculate H2H stats
    let h2hStats = { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
    if (h2hData.length > 0) {
      h2hStats.total = h2hData.length;
      h2hData.forEach((m) => {
        const homeGoals = m.score.fullTime.home ?? 0;
        const awayGoals = m.score.fullTime.away ?? 0;
        const isCurrentHomeTeamHome = m.homeTeam.id === match.homeTeam.id;

        if (homeGoals === awayGoals) {
          h2hStats.draws++;
        } else if (
          (homeGoals > awayGoals && isCurrentHomeTeamHome) ||
          (awayGoals > homeGoals && !isCurrentHomeTeamHome)
        ) {
          h2hStats.homeWins++;
        } else {
          h2hStats.awayWins++;
        }
      });
    }

    // Format date
    const matchDate = new Date(match.utcDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[matchDate.getMonth()]} ${matchDate.getDate()}`;

    // Get league key for standings lookup
    const leagueKey = CODE_TO_LEAGUE[match.competition.code] || null;

    // Mock stats for live/finished matches (football-data.org free tier doesn't provide stats)
    const mockStats = (isLive || statusInfo.status === 'FT') ? {
      all: [
        { label: 'Expected goals (xG)', home: 1.2, away: 0.8, type: 'decimal' as const },
        { label: 'Possession %', home: 55, away: 45 },
        { label: 'Total shots', home: 12, away: 8 },
        { label: 'Shots on target', home: 5, away: 3 },
        { label: 'Corner kicks', home: 6, away: 4 },
        { label: 'Fouls', home: 10, away: 12 },
      ],
    } : null;

    const matchDetails = {
      id: match.id,
      league: match.competition.name,
      leagueCode: leagueKey,
      date: displayDate,
      venue: match.venue || 'TBD',
      attendance: null,
      status: statusInfo.status,
      minute: match.minute,
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
      h2h: h2hStats,
      halfTimeScore: {
        home: match.score.halfTime.home,
        away: match.score.halfTime.away,
      },
      stats: mockStats,
    };

    return NextResponse.json(matchDetails, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}
