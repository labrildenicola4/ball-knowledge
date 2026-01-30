import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const sport = searchParams.get('sport') || 'soccer';

  // Default to today in Eastern Time if no date provided
  const targetDate = date || getEasternDate(new Date());

  try {
    const { data: fixtures, error } = await supabase
      .from('fixtures_cache')
      .select('*')
      .eq('match_date', targetDate)
      .eq('sport_type', sport)
      .order('kickoff', { ascending: true });

    if (error) {
      console.error('[Fixtures/Cached] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
    }

    // Transform to frontend format
    const matches = (fixtures || []).map((f) => {
      const matchDate = new Date(f.kickoff);

      // Format date in Eastern Time
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
      });
      const displayDate = dateFormatter.format(matchDate);

      // Format time in Eastern Time
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const displayTime = timeFormatter.format(matchDate);

      return {
        id: f.api_id,
        league: f.league_name,
        leagueCode: f.league_code,
        leagueLogo: f.league_logo,
        home: f.home_team_name,
        away: f.away_team_name,
        homeId: f.home_team_id,
        awayId: f.away_team_id,
        homeScore: f.home_score,
        awayScore: f.away_score,
        homeLogo: f.home_team_logo,
        awayLogo: f.away_team_logo,
        status: f.status,
        time: f.status === 'NS' ? displayTime : f.status === 'FT' ? 'FT' : (f.minute ? `${f.minute}'` : f.status),
        venue: f.venue || 'TBD',
        date: displayDate,
        fullDate: f.match_date,
        timestamp: matchDate.getTime(),
        matchday: f.matchday,
        stage: f.stage,
      };
    });

    // Sort: Live first, then by timestamp
    matches.sort((a, b) => {
      const aIsLive = ['LIVE', '1H', '2H', 'HT'].includes(a.status);
      const bIsLive = ['LIVE', '1H', '2H', 'HT'].includes(b.status);
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return a.timestamp - b.timestamp;
    });

    return NextResponse.json({
      matches,
      count: matches.length,
      cached: true,
      source: 'supabase',
    });

  } catch (error) {
    console.error('[Fixtures/Cached] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
