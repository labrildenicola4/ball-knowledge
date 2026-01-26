import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getHeadToHead, getTeamForm, mapStatus, COMPETITION_CODES } from '@/lib/football-data';
import { getLineupsForMatch, FixtureLineup } from '@/lib/api-football';

// Force dynamic rendering - no caching at Vercel edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Reverse mapping from competition code to league key
const CODE_TO_LEAGUE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([key, code]) => [code, key])
);

// Sport-specific stat generators
// TODO: Add generators for other sports (basketball, american football, etc.)
// Each sport will have its own stat structure and period breakdowns

interface MatchStat {
  label: string;
  home: number;
  away: number;
  type?: 'decimal';
}

interface MatchStats {
  all: MatchStat[];
  firstHalf?: MatchStat[];
  secondHalf?: MatchStat[];
}

function generateSoccerStats(status: string): MatchStats {
  // Mock data - in production this would come from a real stats API
  // First half stats (typically lower numbers)
  const firstHalf: MatchStat[] = [
    { label: 'Expected goals (xG)', home: 0.5, away: 0.3, type: 'decimal' },
    { label: 'Possession %', home: 52, away: 48 },
    { label: 'Total shots', home: 5, away: 4 },
    { label: 'Shots on target', home: 2, away: 1 },
    { label: 'Corner kicks', home: 3, away: 2 },
    { label: 'Fouls', home: 5, away: 6 },
  ];

  // Second half stats (only if match is in 2H or finished)
  const showSecondHalf = ['2H', 'HT', 'FT'].includes(status);
  const secondHalf: MatchStat[] = showSecondHalf ? [
    { label: 'Expected goals (xG)', home: 0.7, away: 0.5, type: 'decimal' },
    { label: 'Possession %', home: 58, away: 42 },
    { label: 'Total shots', home: 7, away: 4 },
    { label: 'Shots on target', home: 3, away: 2 },
    { label: 'Corner kicks', home: 3, away: 2 },
    { label: 'Fouls', home: 5, away: 6 },
  ] : [];

  // Combined stats (sum of both halves, or just first half if still in 1H)
  const all: MatchStat[] = firstHalf.map((stat, i) => {
    const secondHalfStat = secondHalf[i];
    if (stat.type === 'decimal') {
      return {
        ...stat,
        home: parseFloat((stat.home + (secondHalfStat?.home || 0)).toFixed(2)),
        away: parseFloat((stat.away + (secondHalfStat?.away || 0)).toFixed(2)),
      };
    }
    // For possession, average instead of sum
    if (stat.label === 'Possession %') {
      if (secondHalfStat) {
        return {
          ...stat,
          home: Math.round((stat.home + secondHalfStat.home) / 2),
          away: Math.round((stat.away + secondHalfStat.away) / 2),
        };
      }
      return stat;
    }
    return {
      ...stat,
      home: stat.home + (secondHalfStat?.home || 0),
      away: stat.away + (secondHalfStat?.away || 0),
    };
  });

  return {
    all,
    firstHalf,
    secondHalf: showSecondHalf ? secondHalf : undefined,
  };
}

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
    // TODO: When adding new sports, create sport-specific stat generators
    // e.g., basketball: points by quarter, rebounds, assists
    // e.g., american football: yards, touchdowns, turnovers by quarter
    const mockStats = (isLive || statusInfo.status === 'FT') ? generateSoccerStats(statusInfo.status) : null;

    // Fetch lineups from API-Football (they have lineup data, football-data.org free tier doesn't)
    let homeLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayLineup: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let awayBench: Array<{ id: number; name: string; position: string; shirtNumber: number | null }> = [];
    let homeFormation: string | null = null;
    let awayFormation: string | null = null;
    let homeCoach: string | null = null;
    let awayCoach: string | null = null;

    // Only fetch lineups for live or finished matches (lineups aren't available for future matches)
    if (leagueKey && (isLive || statusInfo.status === 'FT')) {
      try {
        const matchDateStr = matchDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const lineups = await getLineupsForMatch(
          leagueKey,
          matchDateStr,
          match.homeTeam.name,
          match.awayTeam.name
        );

        // Map API-Football lineup to our format
        const mapLineupPlayer = (p: { player: { id: number; name: string; number: number; pos: string } }) => ({
          id: p.player.id,
          name: p.player.name,
          position: p.player.pos || 'Unknown',
          shirtNumber: p.player.number || null,
        });

        if (lineups.length >= 2) {
          const homeLineupData = lineups.find(l =>
            l.team.name.toLowerCase().includes(match.homeTeam.name.toLowerCase().split(' ')[0]) ||
            match.homeTeam.name.toLowerCase().includes(l.team.name.toLowerCase().split(' ')[0])
          ) || lineups[0];

          const awayLineupData = lineups.find(l =>
            l.team.name.toLowerCase().includes(match.awayTeam.name.toLowerCase().split(' ')[0]) ||
            match.awayTeam.name.toLowerCase().includes(l.team.name.toLowerCase().split(' ')[0])
          ) || lineups[1];

          homeLineup = homeLineupData.startXI.map(mapLineupPlayer);
          homeBench = homeLineupData.substitutes.map(mapLineupPlayer);
          homeFormation = homeLineupData.formation || null;
          homeCoach = homeLineupData.coach?.name || null;

          awayLineup = awayLineupData.startXI.map(mapLineupPlayer);
          awayBench = awayLineupData.substitutes.map(mapLineupPlayer);
          awayFormation = awayLineupData.formation || null;
          awayCoach = awayLineupData.coach?.name || null;
        }
      } catch (lineupError) {
        console.error('[Match API] Error fetching lineups:', lineupError);
        // Continue without lineups - they're optional
      }
    }

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
        lineup: homeLineup,
        bench: homeBench,
        formation: homeFormation,
        coach: homeCoach,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.tla || match.awayTeam.shortName || match.awayTeam.name.substring(0, 3).toUpperCase(),
        logo: match.awayTeam.crest,
        score: match.score.fullTime.away,
        form: awayForm,
        lineup: awayLineup,
        bench: awayBench,
        formation: awayFormation,
        coach: awayCoach,
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
