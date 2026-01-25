import { NextRequest, NextResponse } from 'next/server';
import { getMatches, COMPETITION_CODES, mapStatus, type LeagueId } from '@/lib/football-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// In-memory cache for combined fixtures (keyed by date)
const fixturesCache = new Map<string, { data: TransformedMatch[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

interface TransformedMatch {
  id: number;
  league: string;
  leagueCode: string;
  leagueLogo: string;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
  homeScore: number | null;
  awayScore: number | null;
  homeLogo: string;
  awayLogo: string;
  status: string;
  time: string;
  venue: string;
  date: string;
  fullDate: string;
  timestamp: number;
  matchday: number;
  stage: string;
}

// All supported leagues
const ALL_LEAGUES: LeagueId[] = [
  'laliga', 'premier', 'seriea', 'bundesliga', 'ligue1',
  'brasileirao', 'eredivisie', 'primeiraliga', 'championship',
  'championsleague', 'copalibertadores'
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // YYYY-MM-DD format

  // Default to today if no date provided
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = targetDate;

  // Check cache first
  const cached = fixturesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Fixtures/All] Cache hit for ${targetDate}`);
    return NextResponse.json({
      matches: cached.data,
      cached: true,
      cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
    });
  }

  console.log(`[Fixtures/All] Fetching all leagues for ${targetDate}`);

  try {
    // Fetch all leagues in parallel - football-data.org handles its own rate limiting
    // The server-side cache in football-data.ts will prevent redundant API calls
    const leaguePromises = ALL_LEAGUES.map(async (league) => {
      try {
        const competitionCode = COMPETITION_CODES[league];
        const matches = await getMatches(competitionCode, targetDate, targetDate);
        return { league, matches };
      } catch (error) {
        console.error(`[Fixtures/All] Error fetching ${league}:`, error);
        return { league, matches: [] };
      }
    });

    const results = await Promise.all(leaguePromises);

    // Transform and combine all matches
    const allMatches: TransformedMatch[] = [];

    for (const { matches } of results) {
      for (const match of matches) {
        const matchDate = new Date(match.utcDate);
        const { status: displayStatus, time } = mapStatus(match.status, match.minute);

        // Format date in UTC
        const utcDate = matchDate.toISOString().split('T')[0];
        const [year, month, day] = utcDate.split('-').map(Number);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayDate = `${monthNames[month - 1]} ${day}`;

        // Format time in UTC
        const hours = matchDate.getUTCHours();
        const minutes = matchDate.getUTCMinutes();
        const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        allMatches.push({
          id: match.id,
          league: match.competition.name,
          leagueCode: match.competition.code,
          leagueLogo: match.competition.emblem || `https://crests.football-data.org/${match.competition.code}.png`,
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
        });
      }
    }

    // Sort: Live first, then by timestamp
    allMatches.sort((a, b) => {
      const aIsLive = ['LIVE', '1H', '2H', 'HT'].includes(a.status);
      const bIsLive = ['LIVE', '1H', '2H', 'HT'].includes(b.status);
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return a.timestamp - b.timestamp;
    });

    // Cache the result
    fixturesCache.set(cacheKey, { data: allMatches, timestamp: Date.now() });

    return NextResponse.json({
      matches: allMatches,
      cached: false,
      count: allMatches.length
    });

  } catch (error) {
    console.error('[Fixtures/All] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch fixtures',
      matches: []
    }, { status: 500 });
  }
}
