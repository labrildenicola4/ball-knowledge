import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getStandings } from '@/lib/api-football';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// All domestic leagues to sync standings for (API-Football league IDs)
const STANDINGS_LEAGUES: Array<{ id: number; code: string; name: string }> = [
  { id: 140, code: 'PD', name: 'La Liga' },
  { id: 39, code: 'PL', name: 'Premier League' },
  { id: 135, code: 'SA', name: 'Serie A' },
  { id: 78, code: 'BL1', name: 'Bundesliga' },
  { id: 61, code: 'FL1', name: 'Ligue 1' },
  { id: 71, code: 'BSA', name: 'Brasileirao' },
  { id: 88, code: 'DED', name: 'Eredivisie' },
  { id: 94, code: 'PPL', name: 'Primeira Liga' },
  { id: 40, code: 'ELC', name: 'Championship' },
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Sync] Starting standings sync (API-Football)...');

  try {
    const supabase = createServiceClient();
    const currentYear = new Date().getFullYear();
    // Football seasons typically span two calendar years (e.g., 2024-25)
    const season = new Date().getMonth() >= 7 ? currentYear : currentYear - 1;

    let totalSynced = 0;

    for (const league of STANDINGS_LEAGUES) {
      try {
        console.log(`[Sync] Fetching standings for ${league.name} (${league.code})...`);

        const standings = await getStandings(league.id);

        if (standings.length > 0) {
          // Transform standings to our format
          const transformedStandings = standings.map((team) => ({
            position: team.rank,
            teamId: team.team.id,
            team: team.team.name,
            logo: team.team.logo,
            played: team.all.played,
            won: team.all.win,
            drawn: team.all.draw,
            lost: team.all.lose,
            goalsFor: team.all.goals.for,
            goalsAgainst: team.all.goals.against,
            gd: team.goalsDiff > 0 ? `+${team.goalsDiff}` : `${team.goalsDiff}`,
            points: team.points,
            form: team.form ? team.form.split('').filter(r => r) : [],
          }));

          // Upsert to standings_cache
          const { error } = await supabase
            .from('standings_cache')
            .upsert({
              sport_type: 'soccer',
              league_code: league.code,
              league_name: league.name,
              season,
              standings: transformedStandings,
            }, {
              onConflict: 'league_code,season,sport_type',
              ignoreDuplicates: false,
            });

          if (error) {
            console.error(`[Sync] Error upserting standings for ${league.name}:`, error);
          } else {
            totalSynced++;
            console.log(`[Sync] Synced standings for ${league.name} (${standings.length} teams)`);
          }
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (error) {
        console.error(`[Sync] Error fetching standings for ${league.name}:`, error);
        // Continue with other leagues
      }
    }

    // Log the sync
    const duration = Date.now() - startTime;
    await supabase.from('sync_log').insert({
      sync_type: 'standings',
      sport_type: 'soccer',
      records_synced: totalSynced,
      status: 'success',
      completed_at: new Date().toISOString(),
    });

    console.log(`[Sync] Completed standings sync in ${duration}ms. Synced ${totalSynced} leagues.`);

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync] Fatal error:', error);

    // Try to log the error
    try {
      const supabase = createServiceClient();
      await supabase.from('sync_log').insert({
        sync_type: 'standings',
        sport_type: 'soccer',
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
