import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getNBAStandings } from '@/lib/api-espn-nba';
import { getNFLStandings } from '@/lib/api-espn-nfl';
import { getMLBStandings } from '@/lib/api-espn-mlb';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Professional leagues to sync standings for
const ESPN_STANDINGS_SPORTS = [
  {
    name: 'NBA',
    sportType: 'basketball_nba',
    leagueCode: 'NBA',
    fetchStandings: getNBAStandings,
  },
  {
    name: 'NFL',
    sportType: 'football_nfl',
    leagueCode: 'NFL',
    fetchStandings: getNFLStandings,
  },
  {
    name: 'MLB',
    sportType: 'baseball',
    leagueCode: 'MLB',
    fetchStandings: getMLBStandings,
  },
] as const;

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const year = now.getFullYear();
  // NBA/NFL seasons span calendar years: 2025-26 season = 2025
  // MLB is single year
  // Use July as cutoff: Aug-Dec = current year, Jan-Jul = previous year
  return month >= 7 ? year : year - 1;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[ESPN-Standings-Sync] Starting standings sync...');

  const supabase = createServiceClient();
  const season = getCurrentSeason();
  let totalSynced = 0;
  const errors: string[] = [];

  try {
    for (const sport of ESPN_STANDINGS_SPORTS) {
      try {
        console.log(`[ESPN-Standings-Sync] Fetching ${sport.name} standings...`);

        const standings = await sport.fetchStandings();

        // Store the full response as JSONB
        const { error } = await supabase
          .from('standings_cache')
          .upsert({
            sport_type: sport.sportType,
            league_code: sport.leagueCode,
            league_name: sport.name,
            season,
            standings,
          }, {
            onConflict: 'league_code,season,sport_type',
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`[ESPN-Standings-Sync] Error upserting ${sport.name}:`, error);
          errors.push(`${sport.name}: ${error.message}`);
        } else {
          totalSynced++;
          console.log(`[ESPN-Standings-Sync] Synced ${sport.name} standings`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ESPN-Standings-Sync] Error fetching ${sport.name}:`, message);
        errors.push(`${sport.name}: ${message}`);
      }

      // Rate limit: 200ms delay between sports
      await new Promise(r => setTimeout(r, 200));
    }

    const duration = Date.now() - startTime;

    // Log sync result
    await supabase.from('sync_log').insert({
      sync_type: 'espn_standings',
      sport_type: 'espn',
      records_synced: totalSynced,
      status: errors.length === 0 ? 'success' : totalSynced > 0 ? 'partial' : 'error',
      error_message: errors.length > 0 ? errors.join('; ') : null,
      completed_at: new Date().toISOString(),
    });

    console.log(`[ESPN-Standings-Sync] Completed in ${duration}ms. Synced ${totalSynced} leagues.`);

    return NextResponse.json({
      success: errors.length === 0,
      synced: totalSynced,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error('[ESPN-Standings-Sync] Fatal error:', error);

    try {
      await supabase.from('sync_log').insert({
        sync_type: 'espn_standings',
        sport_type: 'espn',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    } catch { }

    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
