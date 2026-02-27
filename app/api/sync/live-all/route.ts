import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { LEAGUE_ID_TO_CODE, SUPPORTED_LEAGUE_IDS } from '@/lib/constants/leagues';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Get date in Eastern Time as YYYY-MM-DD
function getEasternDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

// Supported league IDs (only sync leagues we care about)
const SUPPORTED_LEAGUES = SUPPORTED_LEAGUE_IDS;

// Map API-Football status to our status format
function mapStatus(status: string): string {
  switch (status) {
    case 'TBD':
    case 'NS':
      return 'NS';
    case '1H':
      return '1H';
    case 'HT':
      return 'HT';
    case '2H':
      return '2H';
    case 'ET':
      return 'ET';
    case 'P':
    case 'PEN':
      return 'PEN';
    case 'FT':
    case 'AET':
      return 'FT';
    case 'BT':
      return 'BT';
    case 'SUSP':
      return 'SUSP';
    case 'INT':
      return 'INT';
    case 'PST':
      return 'PST';
    case 'CANC':
      return 'CAN';
    case 'ABD':
      return 'ABD';
    case 'LIVE':
      return 'LIVE';
    default:
      return status;
  }
}

interface LiveFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const supabase = createServiceClient();

    // ONE API call to get ALL live matches across ALL leagues
    const response = await fetch(`${API_FOOTBALL_BASE}/fixtures?live=all`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'API request failed' }, { status: 500 });
    }

    const data = await response.json();
    const allLiveFixtures: LiveFixture[] = data.response || [];

    // Filter to only leagues we support
    const relevantFixtures = allLiveFixtures.filter(f =>
      SUPPORTED_LEAGUES.has(f.league.id)
    );

    if (relevantFixtures.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        total: allLiveFixtures.length,
        message: 'No live matches in supported leagues',
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Prepare batch update data
    // We need to find existing fixtures by team names since API IDs differ between providers
    const updates: Array<{
      league_code: string;
      home_team_name: string;
      away_team_name: string;
      status: string;
      minute: number | null;
      home_score: number | null;
      away_score: number | null;
    }> = relevantFixtures.map(f => ({
      league_code: LEAGUE_ID_TO_CODE[f.league.id],
      home_team_name: f.teams.home.name,
      away_team_name: f.teams.away.name,
      status: mapStatus(f.fixture.status.short),
      minute: f.fixture.status.elapsed,
      home_score: f.goals.home,
      away_score: f.goals.away,
    }));

    // Get today's date for filtering (in Eastern Time)
    const today = getEasternDate(new Date());

    // Batch update: For each live match, update the corresponding fixture in our cache
    let updated = 0;
    const errors: string[] = [];

    // Process updates in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (update) => {
          try {
            // Find and update the fixture by league code and date
            // Then match team names in JS for flexibility with different naming conventions
            const { data: matchingFixtures, error: findError } = await supabase
              .from('fixtures_cache')
              .select('id, api_id, home_team_name, away_team_name')
              .eq('league_code', update.league_code)
              .eq('match_date', today);

            if (findError) {
              return { success: false, error: `Find error: ${findError.message}` };
            }

            // Find best match by comparing team names
            const normalize = (name: string) => name.toLowerCase()
              .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')  // Handle Nordic chars that don't NFD decompose
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remove diacritics (ç→c, etc.)
              .replace(/[^a-z0-9]/g, '')  // Remove all non-alphanumeric
              .replace(/^fc|fc$/g, '')     // Remove FC prefix/suffix
              .replace(/atleticomadrid|atletico/, 'atleti')
              .replace(/manchestercity|manchester/, 'mancity')
              .replace(/manchesterunited/, 'manutd')
              .replace(/parissaintgermain|parissaint|parisstgermain/, 'psg')
              .replace(/fccopenhagen|copenhagen/, 'kobenhavn')
              .replace(/barcelona/, 'barca')
              .replace(/^pafos$/, 'paphosfc')
              .replace(/bodoglimt/, 'bodoglimt')
              .replace(/newcastleunited|newcastle/, 'newcastle');

            const homeNorm = normalize(update.home_team_name);
            const awayNorm = normalize(update.away_team_name);

            const match = matchingFixtures?.find(f => {
              const fHome = normalize(f.home_team_name);
              const fAway = normalize(f.away_team_name);
              // Check if names share a significant prefix (3+ chars) or one contains the other
              const homeMatch = fHome.slice(0, 3) === homeNorm.slice(0, 3) ||
                fHome.includes(homeNorm.slice(0, 4)) ||
                homeNorm.includes(fHome.slice(0, 4));
              const awayMatch = fAway.slice(0, 3) === awayNorm.slice(0, 3) ||
                fAway.includes(awayNorm.slice(0, 4)) ||
                awayNorm.includes(fAway.slice(0, 4));
              return homeMatch && awayMatch;
            });

            if (!match) {
              const debugInfo = {
                search: { home: homeNorm, away: awayNorm, league: update.league_code },
                candidates: matchingFixtures?.slice(0, 3).map(f => ({
                  home: normalize(f.home_team_name),
                  away: normalize(f.away_team_name)
                }))
              };
              return { success: false, error: `No match: ${update.home_team_name} vs ${update.away_team_name} | debug: ${JSON.stringify(debugInfo)}` };
            }

            // Update the fixture
            const { error: updateError } = await supabase
              .from('fixtures_cache')
              .update({
                status: update.status,
                minute: update.minute,
                home_score: update.home_score,
                away_score: update.away_score,
                updated_at: new Date().toISOString(),
              })
              .eq('id', match.id);

            if (updateError) {
              return { success: false, error: `Update error: ${updateError.message}` };
            }

            return { success: true };
          } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
          }
        })
      );

      // Count successes and collect errors
      results.forEach((r, idx) => {
        if (r.success) {
          updated++;
        } else if (r.error) {
          errors.push(`${batch[idx].home_team_name} vs ${batch[idx].away_team_name}: ${r.error}`);
        }
      });
    }

    // ALSO: Mark "orphaned" live matches as finished
    // These are matches in our DB that show as live but aren't in the API response anymore
    const liveStatuses = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN', 'IN_PLAY', 'PAUSED'];

    // Cup competitions can have extra time - use 2 hour cutoff
    // League games use 105 min cutoff (no extra time possible)
    const cupCompetitions = ['CL', 'EL', 'CLI', 'CDR', 'FAC', 'CDF', 'CIT', 'DFB'];
    const leagueCutoff = new Date(Date.now() - 105 * 60 * 1000).toISOString();  // 105 min
    const cupCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();   // 2 hours

    const { data: orphanedMatches } = await supabase
      .from('fixtures_cache')
      .select('id, api_id, home_team_name, away_team_name, kickoff, league_code')
      .eq('match_date', today)
      .in('status', liveStatuses)
      .lt('kickoff', leagueCutoff);  // Started more than 105 min ago (we'll filter cups below)

    let finalized = 0;
    if (orphanedMatches && orphanedMatches.length > 0) {
      for (const orphan of orphanedMatches) {
        // Cup competitions need longer cutoff (extra time possible)
        const isCup = cupCompetitions.includes(orphan.league_code);
        const kickoffTime = new Date(orphan.kickoff).getTime();
        const cutoffTime = isCup
          ? new Date(cupCutoff).getTime()
          : new Date(leagueCutoff).getTime();

        // Skip if cup match hasn't passed the 2-hour cutoff yet
        if (isCup && kickoffTime > cutoffTime) {
          continue;
        }

        // Only finalize if this match wasn't in the live API response
        const isStillLive = relevantFixtures.some(f => {
          const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
          return normalize(f.teams.home.name) === normalize(orphan.home_team_name).slice(0, 5);
        });

        if (!isStillLive) {
          await supabase
            .from('fixtures_cache')
            .update({ status: 'FT', updated_at: new Date().toISOString() })
            .eq('id', orphan.id);
          finalized++;
        }
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      updated,
      finalized,
      total: relevantFixtures.length,
      globalLive: allLiveFixtures.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit error output
      duration: `${duration}ms`,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
