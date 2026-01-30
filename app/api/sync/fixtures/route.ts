import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getFixturesByDate, mapStatus, parseRound, type Fixture } from '@/lib/api-football';
import { LEAGUE_ID_TO_CODE, SUPPORTED_LEAGUE_IDS } from '@/lib/constants/leagues';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// All leagues to sync
const ALL_LEAGUE_IDS = Array.from(SUPPORTED_LEAGUE_IDS);

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Sync] Starting fixtures sync (API-Football)...');

  try {
    const supabase = createServiceClient();

    // Get date range: 7 days ago to 30 days ahead
    // Historical data is populated via backfill, daily sync just keeps recent/upcoming fresh
    const today = new Date();
    const dates: string[] = [];

    for (let i = -7; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    console.log(`[Sync] Fetching fixtures for ${dates.length} days`);

    const allFixtures: Array<{
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

    // Fetch fixtures for each date (API-Football requires date-based queries)
    // Process in batches to avoid rate limits
    const batchSize = 5; // 5 dates at a time

    for (let i = 0; i < dates.length; i += batchSize) {
      const dateBatch = dates.slice(i, i + batchSize);

      const batchPromises = dateBatch.map(async (date) => {
        try {
          // Fetch all leagues for this date in one call (no league filter)
          const fixtures = await getFixturesByDate(date);

          // Filter to only our supported leagues
          return fixtures.filter(f => ALL_LEAGUE_IDS.includes(f.league.id));
        } catch (error) {
          console.error(`[Sync] Error fetching ${date}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const fixtures of batchResults) {
        for (const fixture of fixtures) {
          const leagueCode = LEAGUE_ID_TO_CODE[fixture.league.id];
          if (!leagueCode) continue;

          const matchDate = new Date(fixture.fixture.date);
          const { status } = mapStatus(fixture.fixture.status.short, fixture.fixture.status.elapsed);

          allFixtures.push({
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
      }

      console.log(`[Sync] Processed dates ${i + 1}-${Math.min(i + batchSize, dates.length)} of ${dates.length}, total fixtures: ${allFixtures.length}`);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < dates.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`[Sync] Total fixtures to upsert: ${allFixtures.length}`);

    // Extract unique teams
    const teamsMap = new Map<number, {
      api_id: number;
      sport_type: string;
      name: string;
      short_name: string | null;
      tla: string | null;
      crest: string | null;
    }>();

    for (const fixture of allFixtures) {
      if (!teamsMap.has(fixture.home_team_id)) {
        teamsMap.set(fixture.home_team_id, {
          api_id: fixture.home_team_id,
          sport_type: 'soccer',
          name: fixture.home_team_name,
          short_name: fixture.home_team_name,
          tla: fixture.home_team_short,
          crest: fixture.home_team_logo,
        });
      }
      if (!teamsMap.has(fixture.away_team_id)) {
        teamsMap.set(fixture.away_team_id, {
          api_id: fixture.away_team_id,
          sport_type: 'soccer',
          name: fixture.away_team_name,
          short_name: fixture.away_team_name,
          tla: fixture.away_team_short,
          crest: fixture.away_team_logo,
        });
      }
    }

    const allTeams = Array.from(teamsMap.values());
    console.log(`[Sync] Found ${allTeams.length} unique teams`);

    // Upsert fixtures in batches
    const upsertBatchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < allFixtures.length; i += upsertBatchSize) {
      const batch = allFixtures.slice(i, i + upsertBatchSize);

      const { error } = await supabase
        .from('fixtures_cache')
        .upsert(batch, {
          onConflict: 'api_id,sport_type',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[Sync] Batch upsert error:`, error);
      } else {
        totalUpserted += batch.length;
      }
    }

    // Upsert teams
    let teamsUpserted = 0;
    for (let i = 0; i < allTeams.length; i += upsertBatchSize) {
      const batch = allTeams.slice(i, i + upsertBatchSize);

      const { error } = await supabase
        .from('teams_cache')
        .upsert(batch, {
          onConflict: 'api_id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[Sync] Teams upsert error:`, error);
      } else {
        teamsUpserted += batch.length;
      }
    }

    console.log(`[Sync] Upserted ${teamsUpserted} teams`);

    // Log the sync
    const duration = Date.now() - startTime;
    await supabase.from('sync_log').insert({
      sync_type: 'fixtures',
      sport_type: 'soccer',
      records_synced: totalUpserted,
      status: 'success',
      completed_at: new Date().toISOString(),
    });

    console.log(`[Sync] Completed in ${duration}ms. Synced ${totalUpserted} fixtures.`);

    return NextResponse.json({
      success: true,
      synced: totalUpserted,
      teams: teamsUpserted,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync] Fatal error:', error);

    try {
      const supabase = createServiceClient();
      await supabase.from('sync_log').insert({
        sync_type: 'fixtures',
        sport_type: 'soccer',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
