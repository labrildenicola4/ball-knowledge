import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getFixturesByDate, mapStatus, parseRound } from '@/lib/api-football';
import { LEAGUE_ID_TO_CODE, SUPPORTED_LEAGUE_IDS } from '@/lib/constants/leagues';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ALL_LEAGUE_IDS = Array.from(SUPPORTED_LEAGUE_IDS);

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;

  // Allow custom start date, default to Aug 1, 2025 (start of European season)
  const startDateParam = searchParams.get('start') || '2025-08-01';
  const endDateParam = searchParams.get('end') || new Date().toISOString().split('T')[0];

  console.log(`[Backfill] Starting historical sync from ${startDateParam} to ${endDateParam}`);

  try {
    const supabase = createServiceClient();

    // Generate date range
    const dates: string[] = [];
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    console.log(`[Backfill] Will fetch ${dates.length} days of fixtures`);

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

    // Process in batches of 5 dates at a time to avoid rate limits
    const batchSize = 5;
    let processedDates = 0;

    for (let i = 0; i < dates.length; i += batchSize) {
      const dateBatch = dates.slice(i, i + batchSize);

      const batchPromises = dateBatch.map(async (date) => {
        try {
          const fixtures = await getFixturesByDate(date);
          return fixtures.filter(f => ALL_LEAGUE_IDS.includes(f.league.id));
        } catch (error) {
          console.error(`[Backfill] Error fetching ${date}:`, error);
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

      processedDates += dateBatch.length;
      console.log(`[Backfill] Processed ${processedDates}/${dates.length} days, ${allFixtures.length} fixtures so far`);

      // Rate limit delay between batches (300ms)
      if (i + batchSize < dates.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log(`[Backfill] Total fixtures to upsert: ${allFixtures.length}`);

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
    console.log(`[Backfill] Found ${allTeams.length} unique teams`);

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
        console.error(`[Backfill] Batch upsert error:`, error);
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
        console.error(`[Backfill] Teams upsert error:`, error);
      } else {
        teamsUpserted += batch.length;
      }
    }

    // Log the sync
    const duration = Date.now() - startTime;
    await supabase.from('sync_log').insert({
      sync_type: 'backfill',
      sport_type: 'soccer',
      records_synced: totalUpserted,
      status: 'success',
      completed_at: new Date().toISOString(),
    });

    console.log(`[Backfill] Completed in ${duration}ms. Synced ${totalUpserted} fixtures, ${teamsUpserted} teams.`);

    return NextResponse.json({
      success: true,
      dateRange: { start: startDateParam, end: endDateParam },
      daysProcessed: dates.length,
      fixturesSynced: totalUpserted,
      teamsSynced: teamsUpserted,
      duration: `${Math.round(duration / 1000)}s`,
    });

  } catch (error) {
    console.error('[Backfill] Fatal error:', error);

    try {
      const supabase = createServiceClient();
      await supabase.from('sync_log').insert({
        sync_type: 'backfill',
        sport_type: 'soccer',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json(
      { error: 'Backfill failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
