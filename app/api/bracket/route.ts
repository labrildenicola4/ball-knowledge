import { NextRequest, NextResponse } from 'next/server';
import { getLeagueByKey, LEAGUES } from '@/lib/constants/leagues';

export const dynamic = 'force-dynamic';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string } | null;
    status: { short: string; elapsed: number | null };
  };
  league: {
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// Map round names to stage keys
function getRoundStage(round: string): string | null {
  const roundLower = round.toLowerCase();

  // Skip fractional rounds like "1/128-finals", "1/64-finals" - these are early qualifying rounds
  if (/^\d+\/\d+-?finals?$/.test(roundLower)) {
    return null;
  }

  // Semi-finals
  if (roundLower === 'semi-finals' || roundLower === 'semi-final' || roundLower === 'semifinals' || roundLower === 'semifinal') {
    return 'SEMI_FINALS';
  }

  // Quarter-finals
  if (roundLower === 'quarter-finals' || roundLower === 'quarter-final' || roundLower === 'quarterfinals' || roundLower === 'quarterfinal') {
    return 'QUARTER_FINALS';
  }

  // Round of 16
  if (roundLower === 'round of 16' || roundLower === 'last 16' || roundLower === '8th finals') {
    return 'LAST_16';
  }

  // Round of 32
  if (roundLower === 'round of 32' || roundLower === '16th finals') {
    return 'ROUND_OF_32';
  }

  // Round of 64
  if (roundLower === 'round of 64' || roundLower === '32nd finals') {
    return 'ROUND_OF_64';
  }

  // Round of 128
  if (roundLower === 'round of 128') {
    return 'ROUND_OF_128';
  }

  // THE Final - must be exactly "Final" or "Finals"
  if (roundLower === 'final' || roundLower === 'finals' || roundLower === 'the final') {
    return 'FINAL';
  }

  // Skip everything else (early rounds, qualifying, etc.)
  return null;
}

// Get current season year for domestic cups
// Domestic cups typically run Aug-May, so:
// - Aug 2025 to May 2026 = season 2025
// - If we're past May and no upcoming matches, use next season
function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // If July or later, we're in the new season that started this year
  // If before July, we're still in the season that started last year
  return month >= 6 ? year : year - 1;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competition = searchParams.get('competition') || 'championsleague';

  // Find the league config
  const leagueConfig = getLeagueByKey(competition) || LEAGUES.find(l => l.slug === competition);

  if (!leagueConfig) {
    return NextResponse.json({
      error: 'Competition not found',
      competition,
      stages: [],
      stageNames: {},
      bracket: {},
    });
  }

  // Check if API key is available
  if (!API_KEY) {
    console.error('[Bracket API] No API key configured');
    return NextResponse.json({
      competition: leagueConfig.code,
      competitionName: leagueConfig.name,
      stages: ['ROUND_OF_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      stageNames: {
        'ROUND_OF_32': 'Round of 32',
        'LAST_16': 'Round of 16',
        'QUARTER_FINALS': 'Quarterfinals',
        'SEMI_FINALS': 'Semifinals',
        'FINAL': 'Final',
      },
      bracket: {},
      isHypothetical: false,
    });
  }

  try {
    const season = getCurrentSeason();

    // Fetch fixtures for this cup competition
    const response = await fetch(
      `${API_BASE}/fixtures?league=${leagueConfig.id}&season=${season}`,
      {
        headers: {
          'x-apisports-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const fixtures: ApiFixture[] = data.response || [];

    // Organize fixtures by knockout round
    const bracket: Record<string, any[]> = {
      ROUND_OF_128: [],
      ROUND_OF_64: [],
      ROUND_OF_32: [],
      LAST_16: [],
      QUARTER_FINALS: [],
      SEMI_FINALS: [],
      FINAL: [],
    };

    const now = new Date();
    let hasUpcomingMatches = false;
    let tournamentComplete = false;
    let finalCompleted = false;

    for (const fixture of fixtures) {
      const stage = getRoundStage(fixture.league.round);
      if (stage && bracket[stage]) {
        const matchDate = new Date(fixture.fixture.date);
        const status = fixture.fixture.status.short;

        // Check if this is an upcoming or live match
        const isUpcoming = ['NS', 'TBD', 'PST', 'CANC'].includes(status);
        const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(status);

        if (isUpcoming || isLive) {
          hasUpcomingMatches = true;
        }

        // Check if final is completed
        if (stage === 'FINAL' && ['FT', 'AET', 'PEN'].includes(status)) {
          finalCompleted = true;
        }

        bracket[stage].push({
          id: fixture.fixture.id,
          home: fixture.teams.home.name,
          away: fixture.teams.away.name,
          homeId: fixture.teams.home.id,
          awayId: fixture.teams.away.id,
          homeLogo: fixture.teams.home.logo,
          awayLogo: fixture.teams.away.logo,
          homeScore: fixture.goals.home,
          awayScore: fixture.goals.away,
          status: fixture.fixture.status.short,
          date: matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          venue: fixture.fixture.venue?.name || '',
        });
      }
    }

    // Tournament is complete if final is done and no upcoming matches
    tournamentComplete = finalCompleted && !hasUpcomingMatches;

    // Determine which stages to show based on available data
    const stagesWithData = Object.entries(bracket)
      .filter(([_, matches]) => matches.length > 0)
      .map(([stage]) => stage);

    // Define the order of stages
    const stageOrder = ['ROUND_OF_128', 'ROUND_OF_64', 'ROUND_OF_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
    const orderedStages = stageOrder.filter(stage => stagesWithData.includes(stage));

    // If no stages have data, show default stages
    const stages = orderedStages.length > 0
      ? orderedStages
      : ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

    return NextResponse.json({
      competition: leagueConfig.code,
      competitionName: leagueConfig.name,
      stages,
      stageNames: {
        'ROUND_OF_128': 'Round of 128',
        'ROUND_OF_64': 'Round of 64',
        'ROUND_OF_32': 'Round of 32',
        'LAST_16': 'Round of 16',
        'QUARTER_FINALS': 'Quarterfinals',
        'SEMI_FINALS': 'Semifinals',
        'FINAL': 'Final',
      },
      bracket,
      isHypothetical: false,
      tournamentComplete,
    });
  } catch (error) {
    console.error('[Bracket API] Error fetching bracket:', error);

    return NextResponse.json({
      competition: leagueConfig.code,
      competitionName: leagueConfig.name,
      stages: ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      stageNames: {
        'LAST_16': 'Round of 16',
        'QUARTER_FINALS': 'Quarterfinals',
        'SEMI_FINALS': 'Semifinals',
        'FINAL': 'Final',
      },
      bracket: {
        LAST_16: [],
        QUARTER_FINALS: [],
        SEMI_FINALS: [],
        FINAL: [],
      },
      isHypothetical: false,
    });
  }
}
