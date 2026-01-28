import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

// Map API-Football league IDs to our league codes
const LEAGUE_ID_TO_CODE: Record<number, string> = {
  // Top 5 European leagues
  39: 'PL',    // Premier League
  140: 'PD',   // La Liga
  135: 'SA',   // Serie A
  78: 'BL1',   // Bundesliga
  61: 'FL1',   // Ligue 1
  // Additional leagues
  94: 'PPL',   // Primeira Liga
  88: 'DED',   // Eredivisie
  40: 'ELC',   // Championship
  71: 'BSA',   // Brasileirao
  // International
  2: 'CL',     // Champions League
  3: 'EL',     // Europa League
  13: 'CLI',   // Copa Libertadores
};

// Supported league IDs (only sync leagues we care about)
const SUPPORTED_LEAGUES = new Set(Object.keys(LEAGUE_ID_TO_CODE).map(Number));

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

export async function GET() {
  const startTime = Date.now();
  console.log('[Sync/LiveAll] Starting bulk live sync...');

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
      console.error(`[Sync/LiveAll] API error: ${response.status}`);
      return NextResponse.json({ error: 'API request failed' }, { status: 500 });
    }

    const data = await response.json();
    const allLiveFixtures: LiveFixture[] = data.response || [];

    console.log(`[Sync/LiveAll] API returned ${allLiveFixtures.length} live matches globally`);

    // Filter to only leagues we support
    const relevantFixtures = allLiveFixtures.filter(f =>
      SUPPORTED_LEAGUES.has(f.league.id)
    );

    console.log(`[Sync/LiveAll] ${relevantFixtures.length} matches in supported leagues`);

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

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];

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
            // Find and update the fixture by league code and team names
            // Using ILIKE for case-insensitive partial matching
            const { data: matchingFixtures, error: findError } = await supabase
              .from('fixtures_cache')
              .select('id, api_id, home_team_name, away_team_name')
              .eq('league_code', update.league_code)
              .eq('match_date', today)
              .or(`home_team_name.ilike.%${update.home_team_name.split(' ')[0]}%,home_team_name.ilike.%${update.home_team_name.split(' ').pop()}%`);

            if (findError) {
              return { success: false, error: `Find error: ${findError.message}` };
            }

            // Find best match by comparing team names
            const normalize = (name: string) => name.toLowerCase()
              .replace(/[^a-z0-9]/g, '')  // Remove all non-alphanumeric
              .replace(/^fc|fc$/g, '')     // Remove FC prefix/suffix
              .replace(/^atletico/, 'atleti')  // Common alias
              .replace(/^manchester/, 'man')   // Common alias
              .replace(/parissg|parissaintgermain/, 'psg')  // PSG alias
              .replace(/bodo/, 'bodo');        // Normalize ø to o

            const homeNorm = normalize(update.home_team_name);
            const awayNorm = normalize(update.away_team_name);

            const match = matchingFixtures?.find(f => {
              const fHome = normalize(f.home_team_name);
              const fAway = normalize(f.away_team_name);
              // Check if names share a significant prefix (4+ chars) or one contains the other
              const homeMatch = fHome.slice(0, 4) === homeNorm.slice(0, 4) ||
                               fHome.includes(homeNorm.slice(0, 4)) ||
                               homeNorm.includes(fHome.slice(0, 4));
              const awayMatch = fAway.slice(0, 4) === awayNorm.slice(0, 4) ||
                               fAway.includes(awayNorm.slice(0, 4)) ||
                               awayNorm.includes(fAway.slice(0, 4));
              return homeMatch && awayMatch;
            });

            if (!match) {
              return { success: false, error: `No match found for ${update.home_team_name} vs ${update.away_team_name}` };
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

            console.log(`[Sync/LiveAll] Updated: ${update.home_team_name} ${update.home_score}-${update.away_score} ${update.away_team_name} (${update.status} ${update.minute || ''})`);
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

    const duration = Date.now() - startTime;
    console.log(`[Sync/LiveAll] Completed in ${duration}ms. Updated ${updated}/${relevantFixtures.length} matches.`);

    return NextResponse.json({
      success: true,
      updated,
      total: relevantFixtures.length,
      globalLive: allLiveFixtures.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit error output
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync/LiveAll] Fatal error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
