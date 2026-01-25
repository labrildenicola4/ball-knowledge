import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';

// Force dynamic rendering - no caching at Vercel edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate realistic mock stats for demo purposes
// In production, replace with API-Football or similar
function generateMockStats(isLive: boolean, isFinished: boolean, minute: number | null) {
  if (!isLive && !isFinished) return null;

  // Scale stats based on match progress
  const progress = minute ? Math.min(minute / 90, 1) : (isFinished ? 1 : 0.5);

  const generateStat = (baseHome: number, baseAway: number) => ({
    home: Math.round(baseHome * progress + Math.random() * baseHome * 0.3),
    away: Math.round(baseAway * progress + Math.random() * baseAway * 0.3),
  });

  const allStats = [
    { label: 'Expected goals (xG)', ...generateDecimalStat(0.8, 0.6, progress), type: 'decimal' as const },
    { label: 'Big chances', home: Math.round(2 * progress), away: Math.round(1 * progress) },
    { label: 'Total shots', ...generateStat(12, 10) },
    { label: 'Shots on target', ...generateStat(5, 4) },
    { label: 'Corner kicks', ...generateStat(6, 5) },
    { label: 'Fouls', ...generateStat(10, 12) },
    { label: 'Passes', ...generateStat(450, 420) },
    { label: 'Tackles', ...generateStat(18, 16) },
    { label: 'Free kicks', ...generateStat(12, 14) },
    { label: 'Yellow cards', home: Math.round(1.5 * progress), away: Math.round(2 * progress) },
    { label: 'Red cards', home: 0, away: 0 },
  ];

  // First half stats (roughly half the values)
  const firstHalfStats = allStats.map(stat => ({
    ...stat,
    home: Math.round(stat.home * 0.45),
    away: Math.round(stat.away * 0.45),
  }));

  // Second half is the difference
  const secondHalfStats = minute && minute > 45 ? allStats.map((stat, i) => ({
    ...stat,
    home: stat.home - firstHalfStats[i].home,
    away: stat.away - firstHalfStats[i].away,
  })) : [];

  return {
    all: allStats,
    firstHalf: firstHalfStats,
    secondHalf: secondHalfStats.length > 0 ? secondHalfStats : undefined,
  };
}

function generateDecimalStat(baseHome: number, baseAway: number, progress: number) {
  return {
    home: Math.round((baseHome * progress + Math.random() * 0.3) * 100) / 100,
    away: Math.round((baseAway * progress + Math.random() * 0.3) * 100) / 100,
  };
}

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
      timeline: [], // Not available in free tier
      h2h: h2hStats,
      halfTimeScore: {
        home: match.score.halfTime.home,
        away: match.score.halfTime.away,
      },
      // Live stats - using mock data for demo
      // TODO: Replace with API-Football integration for real stats
      stats: generateMockStats(
        ['LIVE', '1H', '2H', 'HT'].includes(displayStatus),
        displayStatus === 'FT',
        match.minute
      ),
    };

    // Return with no-cache headers for live data
    return NextResponse.json(matchDetails, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
