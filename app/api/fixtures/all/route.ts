import { NextRequest, NextResponse } from 'next/server';
import { getFixturesByDate, mapStatus, parseRound } from '@/lib/api-football';
import { createServiceClient } from '@/lib/supabase-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Map API-Football league IDs to our league codes
const LEAGUE_ID_TO_CODE: Record<number, string> = {
  39: 'PL',    // Premier League
  140: 'PD',   // La Liga
  135: 'SA',   // Serie A
  78: 'BL1',   // Bundesliga
  61: 'FL1',   // Ligue 1
  94: 'PPL',   // Primeira Liga
  88: 'DED',   // Eredivisie
  40: 'ELC',   // Championship
  71: 'BSA',   // Brasileirao
  2: 'CL',     // Champions League
  3: 'EL',     // Europa League
  13: 'CLI',   // Copa Libertadores
  143: 'CDR',  // Copa del Rey
  45: 'FAC',   // FA Cup
  66: 'CDF',   // Coupe de France
  137: 'CIT',  // Coppa Italia
  81: 'DFB',   // DFB Pokal
};

const SUPPORTED_LEAGUE_IDS = new Set(Object.keys(LEAGUE_ID_TO_CODE).map(Number));

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  // Default to today if no date provided
  const targetDate = date || new Date().toISOString().split('T')[0];

  console.log(`[Fixtures/All] Fetching fixtures for ${targetDate} (API-Football)`);

  try {
    // Fetch all fixtures for the date from API-Football
    const fixtures = await getFixturesByDate(targetDate);

    // Filter to only supported leagues
    const relevantFixtures = fixtures.filter(f => SUPPORTED_LEAGUE_IDS.has(f.league.id));

    console.log(`[Fixtures/All] Found ${relevantFixtures.length} fixtures in supported leagues`);

    // Transform to our format
    const allMatches: TransformedMatch[] = [];
    const fixturesForDb: Array<{
      api_id: number;
      sport_type: string;
      match_date: string;
      kickoff: string;
      status: string;
      minute: number | null;
      venue: string | null;
      matchday: number;
      stage: string;
      league_name: string;
      league_code: string;
      league_logo: string | null;
      home_team_id: number;
      home_team_name: string;
      home_team_short: string | null;
      home_team_logo: string | null;
      home_score: number | null;
      away_team_id: number;
      away_team_name: string;
      away_team_short: string | null;
      away_team_logo: string | null;
      away_score: number | null;
    }> = [];

    for (const fixture of relevantFixtures) {
      const leagueCode = LEAGUE_ID_TO_CODE[fixture.league.id];
      if (!leagueCode) continue;

      const matchDate = new Date(fixture.fixture.date);
      const { status, time } = mapStatus(fixture.fixture.status.short, fixture.fixture.status.elapsed);

      // Format date for display
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()}`;
      const displayTime = `${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')}`;

      // For frontend response
      allMatches.push({
        id: fixture.fixture.id,
        league: fixture.league.name,
        leagueCode,
        leagueLogo: fixture.league.logo,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        homeId: fixture.teams.home.id,
        awayId: fixture.teams.away.id,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        status,
        time: status === 'NS' ? displayTime : time,
        venue: fixture.fixture.venue?.name || 'TBD',
        date: displayDate,
        fullDate: matchDate.toISOString().split('T')[0],
        timestamp: matchDate.getTime(),
        matchday: parseRound(fixture.league.round),
        stage: fixture.league.round,
      });

      // For database
      fixturesForDb.push({
        api_id: fixture.fixture.id,
        sport_type: 'soccer',
        match_date: matchDate.toISOString().split('T')[0],
        kickoff: fixture.fixture.date,
        status,
        minute: fixture.fixture.status.elapsed,
        venue: fixture.fixture.venue?.name || null,
        matchday: parseRound(fixture.league.round),
        stage: fixture.league.round,
        league_name: fixture.league.name,
        league_code: leagueCode,
        league_logo: fixture.league.logo,
        home_team_id: fixture.teams.home.id,
        home_team_name: fixture.teams.home.name,
        home_team_short: fixture.teams.home.name.substring(0, 3).toUpperCase(),
        home_team_logo: fixture.teams.home.logo,
        home_score: fixture.goals.home,
        away_team_id: fixture.teams.away.id,
        away_team_name: fixture.teams.away.name,
        away_team_short: fixture.teams.away.name.substring(0, 3).toUpperCase(),
        away_team_logo: fixture.teams.away.logo,
        away_score: fixture.goals.away,
      });
    }

    // Sort: Live first, then by timestamp
    allMatches.sort((a, b) => {
      const aIsLive = ['LIVE', '1H', '2H', 'HT'].includes(a.status);
      const bIsLive = ['LIVE', '1H', '2H', 'HT'].includes(b.status);
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return a.timestamp - b.timestamp;
    });

    // CRITICAL FIX: Write to Supabase (fire-and-forget) so next user gets fast DB read
    if (fixturesForDb.length > 0) {
      const supabase = createServiceClient();
      supabase
        .from('fixtures_cache')
        .upsert(fixturesForDb, {
          onConflict: 'api_id,sport_type',
          ignoreDuplicates: false,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[Fixtures/All] Error writing to cache:', error);
          } else {
            console.log(`[Fixtures/All] Cached ${fixturesForDb.length} fixtures to Supabase`);
          }
        });
    }

    return NextResponse.json({
      matches: allMatches,
      cached: false,
      count: allMatches.length,
      source: 'api-football',
    });

  } catch (error) {
    console.error('[Fixtures/All] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch fixtures',
      matches: [],
    }, { status: 500 });
  }
}
