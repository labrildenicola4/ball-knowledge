import { NextRequest, NextResponse } from 'next/server';
import { getFixturesByDate, mapStatus, parseRound } from '@/lib/api-football';
import { createServiceClient } from '@/lib/supabase-server';
import { LEAGUE_ID_TO_CODE, SUPPORTED_LEAGUE_IDS } from '@/lib/constants/leagues';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get date in Eastern Time as YYYY-MM-DD
function getEasternDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

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

  // Default to today in Eastern Time if no date provided
  const targetDate = date || getEasternDate(new Date());

  try {
    // Fetch all fixtures for the date from API-Football
    const fixtures = await getFixturesByDate(targetDate);

    // Filter to only supported leagues
    const relevantFixtures = fixtures.filter(f => SUPPORTED_LEAGUE_IDS.has(f.league.id));

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

      // Get date in Eastern Time for proper grouping
      const matchDateET = getEasternDate(matchDate);

      // Format date for display (use Eastern Time)
      const etFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
      });
      const displayDate = etFormatter.format(matchDate);

      // Format time in Eastern Time
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const displayTime = timeFormatter.format(matchDate);

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
        fullDate: matchDateET,
        timestamp: matchDate.getTime(),
        matchday: parseRound(fixture.league.round),
        stage: fixture.league.round,
      });

      // For database
      fixturesForDb.push({
        api_id: fixture.fixture.id,
        sport_type: 'soccer',
        match_date: matchDateET,
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
        .then(() => {
          // silently ignore
        });
    }

    return NextResponse.json({
      matches: allMatches,
      cached: false,
      count: allMatches.length,
      source: 'api-football',
    });

  } catch {
    return NextResponse.json({
      error: 'Failed to fetch fixtures',
      matches: [],
    }, { status: 500 });
  }
}
