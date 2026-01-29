import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// League information (static - these don't change)
const LEAGUES = [
  { id: 'laliga', name: 'La Liga', code: 'PD', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 'premier', name: 'Premier League', code: 'PL', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 'seriea', name: 'Serie A', code: 'SA', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 'bundesliga', name: 'Bundesliga', code: 'BL1', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 'ligue1', name: 'Ligue 1', code: 'FL1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { id: 'championship', name: 'Championship', code: 'ELC', country: 'England', logo: 'https://media.api-sports.io/football/leagues/40.png' },
  { id: 'eredivisie', name: 'Eredivisie', code: 'DED', country: 'Netherlands', logo: 'https://media.api-sports.io/football/leagues/88.png' },
  { id: 'primeiraliga', name: 'Primeira Liga', code: 'PPL', country: 'Portugal', logo: 'https://media.api-sports.io/football/leagues/94.png' },
  { id: 'brasileirao', name: 'Brasileirao', code: 'BSA', country: 'Brazil', logo: 'https://media.api-sports.io/football/leagues/71.png' },
  { id: 'championsleague', name: 'Champions League', code: 'CL', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 'copalibertadores', name: 'Copa Libertadores', code: 'CLI', country: 'South America', logo: 'https://media.api-sports.io/football/leagues/13.png' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase().trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ teams: [], leagues: [] });
  }

  try {
    // Search teams in Supabase teams_cache
    const { data: teams, error } = await supabase
      .from('teams_cache')
      .select('api_id, name, short_name, tla, crest')
      .or(`name.ilike.%${query}%,short_name.ilike.%${query}%,tla.ilike.%${query}%`)
      .eq('sport_type', 'soccer')
      .limit(50); // Fetch more to allow client-side ranking

    if (error) {
      console.error('[Search API] Error:', error);
      return NextResponse.json({ teams: [], leagues: [] });
    }

    // Transform and rank teams by relevance
    const transformedTeams = (teams || [])
      .map(t => {
        const nameLower = t.name.toLowerCase();
        const tlaLower = (t.tla || '').toLowerCase();

        // Calculate relevance score (higher is better)
        let score = 0;
        if (nameLower === query) score = 100; // Exact match
        else if (tlaLower === query) score = 90; // Exact TLA match
        else if (nameLower.startsWith(query)) score = 80; // Name starts with query
        else if (tlaLower.startsWith(query)) score = 70; // TLA starts with query
        else if (nameLower.includes(` ${query}`)) score = 60; // Word boundary match
        else score = 50; // Contains somewhere

        // Prefer shorter names (usually main clubs, not B teams)
        score -= t.name.length * 0.1;

        return {
          id: t.api_id,
          name: t.name,
          shortName: t.tla || t.short_name || t.name.substring(0, 3).toUpperCase(),
          logo: t.crest,
          _score: score,
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 15)
      .map(({ _score, ...team }) => team); // Remove score from final output

    // Filter leagues by query
    const filteredLeagues = LEAGUES.filter(
      l => l.name.toLowerCase().includes(query) || l.country.toLowerCase().includes(query)
    ).slice(0, 5);

    return NextResponse.json({
      teams: transformedTeams,
      leagues: filteredLeagues,
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({ teams: [], leagues: [] });
  }
}
