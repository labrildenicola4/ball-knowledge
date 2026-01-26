import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = parseInt(params.id);

  if (isNaN(matchId)) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    // Get match from cache
    const { data: match, error } = await supabase
      .from('fixtures_cache')
      .select('*')
      .eq('api_id', matchId)
      .single();

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found in cache' }, { status: 404 });
    }

    // Format the cached data to match the expected format
    const matchDate = new Date(match.kickoff);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const hours = matchDate.getUTCHours();
    const minutes = matchDate.getUTCMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const dateStr = `${dayNames[matchDate.getUTCDay()]}, ${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()} · ${timeStr}`;

    return NextResponse.json({
      id: match.api_id,
      league: match.league_name,
      leagueCode: match.league_code,
      date: dateStr,
      venue: match.venue || 'TBD',
      status: match.status,
      minute: match.minute,
      matchday: match.matchday || 0,
      home: {
        id: match.home_team_id,
        name: match.home_team_name,
        shortName: match.home_team_short || match.home_team_name,
        logo: match.home_team_logo,
        score: match.home_score,
        form: [], // Will be loaded from full API
        lineup: [], // Will be loaded from full API
        bench: [],
        formation: null,
        coach: null,
      },
      away: {
        id: match.away_team_id,
        name: match.away_team_name,
        shortName: match.away_team_short || match.away_team_name,
        logo: match.away_team_logo,
        score: match.away_score,
        form: [], // Will be loaded from full API
        lineup: [], // Will be loaded from full API
        bench: [],
        formation: null,
        coach: null,
      },
      // Placeholders - will be loaded from full API
      h2h: { total: 0, homeWins: 0, draws: 0, awayWins: 0 },
      halfTimeScore: { home: null, away: null },
      stats: null,
      cached: true,
      partial: true, // Indicates this is partial data
    });
  } catch (error) {
    console.error('[Match/Cached] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}
