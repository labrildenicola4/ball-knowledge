import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Placeholder endpoint - bracket feature temporarily disabled during API migration
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competition = searchParams.get('competition') || 'championsleague';

  // Return empty bracket data - page will show "No knockout matches available" message
  return NextResponse.json({
    competition: competition === 'copalibertadores' ? 'CLI' : 'CL',
    competitionName: competition === 'copalibertadores' ? 'Copa Libertadores' : 'UEFA Champions League',
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
