import { NextRequest, NextResponse } from 'next/server';
import { getMatches, getStandings, COMPETITION_CODES, mapStatus, type LeagueId } from '@/lib/football-data';

// Knockout stages in order
const KNOCKOUT_STAGES = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

// Display names for stages
const STAGE_NAMES: Record<string, string> = {
  'LAST_16': 'Round of 16',
  'QUARTER_FINALS': 'Quarterfinals',
  'SEMI_FINALS': 'Semifinals',
  'FINAL': 'Final',
};

interface BracketMatch {
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
  hypothetical?: boolean;
}

// Generate hypothetical bracket from standings using UEFA seeding rules
async function generateHypotheticalBracket(competitionCode: string): Promise<Record<string, BracketMatch[]>> {
  const standings = await getStandings(competitionCode);

  if (!standings || standings.length < 16) {
    return { LAST_16: [], QUARTER_FINALS: [], SEMI_FINALS: [], FINAL: [] };
  }

  // Get top 16 teams from standings
  const top16 = standings.slice(0, 16);

  // UEFA Champions League new format seeding for R16:
  // 1st vs 16th, 2nd vs 15th, 3rd vs 14th, 4th vs 13th
  // 5th vs 12th, 6th vs 11th, 7th vs 10th, 8th vs 9th
  // Higher seed plays second leg at home (listed as "away" here for display)
  const r16Pairings = [
    [0, 15],  // 1st vs 16th
    [1, 14],  // 2nd vs 15th
    [2, 13],  // 3rd vs 14th
    [3, 12],  // 4th vs 13th
    [4, 11],  // 5th vs 12th
    [5, 10],  // 6th vs 11th
    [6, 9],   // 7th vs 10th
    [7, 8],   // 8th vs 9th
  ];

  // Generate R16 matches
  const r16Matches: BracketMatch[] = r16Pairings.map(([highSeed, lowSeed], index) => {
    const homeTeam = top16[lowSeed];  // Lower seed at home first leg
    const awayTeam = top16[highSeed]; // Higher seed away first leg

    return {
      id: 100000 + index, // Fake ID for hypothetical matches
      home: homeTeam.team.shortName || homeTeam.team.name,
      away: awayTeam.team.shortName || awayTeam.team.name,
      homeId: homeTeam.team.id,
      awayId: awayTeam.team.id,
      homeLogo: homeTeam.team.crest,
      awayLogo: awayTeam.team.crest,
      homeScore: null,
      awayScore: null,
      status: 'TBD',
      date: 'Feb 2026',
      time: 'TBD',
      venue: 'TBD',
      hypothetical: true,
    };
  });

  // Generate QF matches (winners of R16 paired)
  // Bracket: Winner of M1 vs Winner of M2, M3 vs M4, M5 vs M6, M7 vs M8
  const qfPairings = [[0, 1], [2, 3], [4, 5], [6, 7]];
  const qfMatches: BracketMatch[] = qfPairings.map(([m1, m2], index) => {
    // Use higher seeds as placeholders
    const team1 = top16[r16Pairings[m1][0]]; // Higher seed from first match
    const team2 = top16[r16Pairings[m2][0]]; // Higher seed from second match

    return {
      id: 100100 + index,
      home: team2.team.shortName || team2.team.name,
      away: team1.team.shortName || team1.team.name,
      homeId: team2.team.id,
      awayId: team1.team.id,
      homeLogo: team2.team.crest,
      awayLogo: team1.team.crest,
      homeScore: null,
      awayScore: null,
      status: 'TBD',
      date: 'Apr 2026',
      time: 'TBD',
      venue: 'TBD',
      hypothetical: true,
    };
  });

  // Generate SF matches
  const sfMatches: BracketMatch[] = [
    {
      id: 100200,
      home: top16[2].team.shortName || top16[2].team.name, // 3rd seed placeholder
      away: top16[0].team.shortName || top16[0].team.name, // 1st seed placeholder
      homeId: top16[2].team.id,
      awayId: top16[0].team.id,
      homeLogo: top16[2].team.crest,
      awayLogo: top16[0].team.crest,
      homeScore: null,
      awayScore: null,
      status: 'TBD',
      date: 'May 2026',
      time: 'TBD',
      venue: 'TBD',
      hypothetical: true,
    },
    {
      id: 100201,
      home: top16[4].team.shortName || top16[4].team.name, // 5th seed placeholder
      away: top16[1].team.shortName || top16[1].team.name, // 2nd seed placeholder
      homeId: top16[4].team.id,
      awayId: top16[1].team.id,
      homeLogo: top16[4].team.crest,
      awayLogo: top16[1].team.crest,
      homeScore: null,
      awayScore: null,
      status: 'TBD',
      date: 'May 2026',
      time: 'TBD',
      venue: 'TBD',
      hypothetical: true,
    },
  ];

  // Generate Final
  const finalMatch: BracketMatch = {
    id: 100300,
    home: top16[1].team.shortName || top16[1].team.name, // 2nd seed placeholder
    away: top16[0].team.shortName || top16[0].team.name, // 1st seed placeholder
    homeId: top16[1].team.id,
    awayId: top16[0].team.id,
    homeLogo: top16[1].team.crest,
    awayLogo: top16[0].team.crest,
    homeScore: null,
    awayScore: null,
    status: 'TBD',
    date: 'May 31, 2026',
    time: 'TBD',
    venue: 'Munich',
    hypothetical: true,
  };

  return {
    LAST_16: r16Matches,
    QUARTER_FINALS: qfMatches,
    SEMI_FINALS: sfMatches,
    FINAL: [finalMatch],
  };
}

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

    let bracket: Record<string, BracketMatch[]>;
    let isHypothetical = false;

    // If no real knockout matches, generate hypothetical bracket from standings
    if (knockoutMatches.length === 0) {
      bracket = await generateHypotheticalBracket(competitionCode);
      isHypothetical = true;
    } else {
      // Use real knockout matches
      bracket = { LAST_16: [], QUARTER_FINALS: [], SEMI_FINALS: [], FINAL: [] };

      for (const match of knockoutMatches) {
        const matchDate = new Date(match.utcDate);
        const { status: displayStatus, time } = mapStatus(match.status, match.minute);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayDate = `${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()}`;

        const hours = matchDate.getUTCHours();
        const minutes = matchDate.getUTCMinutes();
        const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const transformedMatch: BracketMatch = {
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
        bracket[stage].sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    return NextResponse.json({
      competition: competitionCode,
      competitionName: competitionCode === 'CL' ? 'UEFA Champions League' : 'Copa Libertadores',
      stages: KNOCKOUT_STAGES,
      stageNames: STAGE_NAMES,
      bracket,
      isHypothetical,
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
