import { NextRequest, NextResponse } from 'next/server';
import { getMatches, COMPETITION_CODES, mapStatus, type LeagueId } from '@/lib/football-data';

// Knockout stages in order
const KNOCKOUT_STAGES = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

// Display names for stages
const STAGE_NAMES: Record<string, string> = {
  'LAST_16': 'Round of 16',
  'QUARTER_FINALS': 'Quarterfinals',
  'SEMI_FINALS': 'Semifinals',
  'FINAL': 'Final',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competition = searchParams.get('competition') || 'championsleague';

  try {
    const competitionCode = COMPETITION_CODES[competition as LeagueId];

    if (!competitionCode) {
      return NextResponse.json({ error: 'Invalid competition' }, { status: 400 });
    }

    // Only allow CL and CLI for bracket view
    if (!['CL', 'CLI'].includes(competitionCode)) {
      return NextResponse.json({ error: 'Bracket view only available for Champions League and Copa Libertadores' }, { status: 400 });
    }

    // Fetch all matches for the current season (wide date range)
    const today = new Date();
    const seasonStart = new Date(today.getFullYear(), 7, 1); // Aug 1
    const seasonEnd = new Date(today.getFullYear() + 1, 6, 31); // Jul 31 next year

    const matches = await getMatches(
      competitionCode,
      seasonStart.toISOString().split('T')[0],
      seasonEnd.toISOString().split('T')[0]
    );

    // Filter to knockout stage matches only
    const knockoutMatches = matches.filter(match =>
      KNOCKOUT_STAGES.includes(match.stage)
    );

    // Transform and group by stage
    const bracket: Record<string, Array<{
      id: number;
      home: string;
      away: string;
      homeId: number;
      awayId: number;
      homeLogo: string;
      awayLogo: string;
      homeScore: number | null;
      awayScore: number | null;
      status: string;
      date: string;
      time: string;
      venue: string;
    }>> = {};

    // Initialize empty arrays for each stage
    for (const stage of KNOCKOUT_STAGES) {
      bracket[stage] = [];
    }

    // Transform and group matches
    for (const match of knockoutMatches) {
      const matchDate = new Date(match.utcDate);
      const { status: displayStatus, time } = mapStatus(match.status, match.minute);

      // Format date
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()}`;

      // Format time
      const hours = matchDate.getUTCHours();
      const minutes = matchDate.getUTCMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const transformedMatch = {
        id: match.id,
        home: match.homeTeam.shortName || match.homeTeam.name,
        away: match.awayTeam.shortName || match.awayTeam.name,
        homeId: match.homeTeam.id,
        awayId: match.awayTeam.id,
        homeLogo: match.homeTeam.crest,
        awayLogo: match.awayTeam.crest,
        homeScore: match.score.fullTime.home,
        awayScore: match.score.fullTime.away,
        status: displayStatus,
        date: displayDate,
        time: displayStatus === 'NS' ? displayTime : time,
        venue: match.venue || 'TBD',
      };

      if (bracket[match.stage]) {
        bracket[match.stage].push(transformedMatch);
      }
    }

    // Sort matches within each stage by date
    for (const stage of KNOCKOUT_STAGES) {
      bracket[stage].sort((a, b) => {
        // Sort by date string (this is a simple sort, works for same year)
        return a.date.localeCompare(b.date);
      });
    }

    return NextResponse.json({
      competition: competitionCode,
      competitionName: competitionCode === 'CL' ? 'UEFA Champions League' : 'Copa Libertadores',
      stages: KNOCKOUT_STAGES,
      stageNames: STAGE_NAMES,
      bracket,
    });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'Rate limited - please wait a moment and try again',
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to fetch bracket data' }, { status: 500 });
  }
}
