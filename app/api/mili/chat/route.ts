// POST /api/mili/chat — Ball Knowledge wrapper around Mili's chat handler
// This route handles auth + rate limiting, then delegates to Mili

import { NextRequest } from 'next/server';
// @mili package is external — stub until available
const handleMiliChat = async (_body: any, _opts: any) => new Response(JSON.stringify({ error: 'Mili not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
const registerToolHandlers = (_handlers: any) => {};
import { createClient, createServiceClient } from '@/lib/supabase-server';

// Import Ball Knowledge's fetchers and register them with Mili
import { getNBAGames, getNBAGameSummary, getNBAStandings, getNBALeaders, getNBATeam, getNBARoster, getNBATeamRankings } from '@/lib/api-espn-nba';
import { getNFLGames, getNFLGameSummary, getNFLStandings, getNFLLeaders, getNFLTeamStats } from '@/lib/api-espn-nfl';
import { getMLBGames, getMLBGameSummary, getMLBStandings, getMLBTeam, getMLBRoster } from '@/lib/api-espn-mlb';
import { getBasketballGames, getBasketballGameSummary, getBasketballStandings, getBasketballRankings } from '@/lib/api-espn-basketball';
import { getCollegeFootballGames, getCollegeFootballStandings, getCollegeFootballRankings } from '@/lib/api-espn-college-football';
import { getFixturesByDate, getFixture, getFixtureStatistics, getFixtureLineups, getStandings, getTopScorers, getTeamInfo, getTeamSquad, getTeamFixtures } from '@/lib/api-football';

// Register all Ball Knowledge fetchers with Mili (runs once on first import)
registerToolHandlers({
  // NBA
  get_nba_games: (args: any) => getNBAGames(args.date),
  get_nba_game_details: (args: any) => getNBAGameSummary(args.game_id),
  get_nba_standings: () => getNBAStandings(),
  get_nba_leaders: () => getNBALeaders(),
  get_nba_team_details: async (args: any) => {
    const [team, roster] = await Promise.all([getNBATeam(args.team_id), getNBARoster(args.team_id)]);
    return { team, roster };
  },
  get_nba_team_rankings: () => getNBATeamRankings(),

  // NFL
  get_nfl_games: (args: any) => getNFLGames(args.date),
  get_nfl_game_details: (args: any) => getNFLGameSummary(args.game_id),
  get_nfl_standings: () => getNFLStandings(),
  get_nfl_leaders: () => getNFLLeaders(),
  get_nfl_team_stats: (args: any) => getNFLTeamStats(args.team_id),

  // MLB
  get_mlb_games: (args: any) => getMLBGames(args.date),
  get_mlb_game_details: (args: any) => getMLBGameSummary(args.game_id),
  get_mlb_standings: () => getMLBStandings(),
  get_mlb_team_details: async (args: any) => {
    const [team, roster] = await Promise.all([getMLBTeam(args.team_id), getMLBRoster(args.team_id)]);
    return { team, roster };
  },

  // NCAA Basketball
  get_college_basketball_games: (args: any) => getBasketballGames(args.date),
  get_college_basketball_game_details: (args: any) => getBasketballGameSummary(args.game_id),
  get_college_basketball_standings: (args: any) => getBasketballStandings(args.conference_id),
  get_college_basketball_rankings: () => getBasketballRankings(),

  // College Football
  get_college_football_games: (args: any) => getCollegeFootballGames(args.date),
  get_college_football_standings: (args: any) => getCollegeFootballStandings(args.conference_id),
  get_college_football_rankings: () => getCollegeFootballRankings(),

  // Soccer
  get_soccer_fixtures: (args: any) => getFixturesByDate(args.date, args.league_id),
  get_soccer_match_details: async (args: any) => {
    const [fixture, statistics, lineups] = await Promise.all([
      getFixture(args.fixture_id),
      getFixtureStatistics(args.fixture_id),
      getFixtureLineups(args.fixture_id),
    ]);
    return { fixture, statistics, lineups };
  },
  get_soccer_standings: (args: any) => getStandings(args.league_id),
  get_soccer_top_scorers: (args: any) => getTopScorers(args.league_id),
  get_soccer_team_info: async (args: any) => {
    const [info, squad, fixtures] = await Promise.all([
      getTeamInfo(args.team_id),
      getTeamSquad(args.team_id),
      getTeamFixtures(args.team_id, undefined, 5),
    ]);
    return { info, squad, recentFixtures: fixtures };
  },
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Sign in to use Mili' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get tier + count
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single();

    const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date();
    const tier = (isExpired ? 'free' : (profile?.subscription_tier || 'free')) as 'free' | 'pro';

    let dailyCount = 0;
    if (tier === 'free') {
      const { data: countData } = await supabase.rpc('get_daily_query_count', { p_user_id: user.id });
      dailyCount = countData || 0;
    }

    const body = await request.json();

    // Delegate to Mili's handler
    return handleMiliChat(body, {
      userId: user.id,
      tier,
      dailyCount,
      onQueryComplete: async (data) => {
        const serviceClient = createServiceClient();
        await serviceClient.from('chat_queries').insert({
          user_id: data.userId,
          query_text: data.queryText,
          response_text: data.responseText,
          tools_used: data.toolsUsed,
        });
      },
    });
  } catch (error) {
    console.error('Mili chat route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
