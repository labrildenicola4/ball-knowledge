import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getMatches, COMPETITION_CODES, type LeagueId } from '@/lib/football-data';

// All leagues to sync
const ALL_LEAGUES: LeagueId[] = [
  'laliga', 'premier', 'seriea', 'bundesliga', 'ligue1',
  'brasileirao', 'eredivisie', 'primeiraliga', 'championship',
  'championsleague', 'copalibertadores'
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Sync] Starting fixtures sync...');

  try {
    const supabase = createServiceClient();

    // Get date range: 60 days ago to 6 months ahead (covers most of season)
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 60); // 60 days of past results
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + 6); // 6 months ahead

    const dateFrom = pastDate.toISOString().split('T')[0];
    const dateTo = futureDate.toISOString().split('T')[0];

    console.log(`[Sync] Fetching fixtures from ${dateFrom} to ${dateTo}`);

    // Fetch from all leagues
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

    for (const league of ALL_LEAGUES) {
      try {
        const competitionCode = COMPETITION_CODES[league];
        console.log(`[Sync] Fetching ${league} (${competitionCode})...`);

        const matches = await getMatches(competitionCode, dateFrom, dateTo);
        console.log(`[Sync] Found ${matches.length} matches for ${league}`);

        for (const match of matches) {
          const matchDate = new Date(match.utcDate);

          // Map status to our format
          let status = 'NS';
          switch (match.status) {
            case 'FINISHED': status = 'FT'; break;
            case 'IN_PLAY': status = match.minute && match.minute <= 45 ? '1H' : '2H'; break;
            case 'PAUSED': status = 'HT'; break;
            case 'SCHEDULED':
            case 'TIMED': status = 'NS'; break;
            case 'POSTPONED': status = 'PST'; break;
            case 'CANCELLED': status = 'CAN'; break;
            default: status = match.status;
          }

          allFixtures.push({
            api_id: match.id,
            sport_type: 'soccer',
            match_date: matchDate.toISOString().split('T')[0],
            kickoff: match.utcDate,
            status,
            minute: match.minute,
            venue: match.venue,
            matchday: match.matchday,
            stage: match.stage,
            league_name: match.competition.name,
            league_code: match.competition.code,
            league_logo: match.competition.emblem,
            home_team_id: match.homeTeam.id,
            home_team_name: match.homeTeam.shortName || match.homeTeam.name,
            home_team_short: match.homeTeam.tla,
            home_team_logo: match.homeTeam.crest,
            home_score: match.score.fullTime.home,
            away_team_id: match.awayTeam.id,
            away_team_name: match.awayTeam.shortName || match.awayTeam.name,
            away_team_short: match.awayTeam.tla,
            away_team_logo: match.awayTeam.crest,
            away_score: match.score.fullTime.away,
          });
        }
      } catch (error) {
        console.error(`[Sync] Error fetching ${league}:`, error);
        // Continue with other leagues
      }
    }

    console.log(`[Sync] Total fixtures to upsert: ${allFixtures.length}`);

    // Extract unique teams from fixtures
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

    // Upsert fixtures in batches of 100
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < allFixtures.length; i += batchSize) {
      const batch = allFixtures.slice(i, i + batchSize);

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
    for (let i = 0; i < allTeams.length; i += batchSize) {
      const batch = allTeams.slice(i, i + batchSize);

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
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('[Sync] Fatal error:', error);

    // Try to log the error
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
