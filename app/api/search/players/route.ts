import { NextRequest, NextResponse } from 'next/server';

interface PlayerSearchResult {
  id: string;
  name: string;
  sport: string;
  sportDisplay: string;
  team: string;
  headshot: string;
  jersey: string;
}

const LEAGUE_TO_SPORT: Record<string, string> = {
  nba: 'nba',
  nfl: 'nfl',
  mlb: 'mlb',
  nhl: 'nhl',
  'mens-college-basketball': 'ncaab',
  'college-football': 'cfb',
  f1: 'f1',
  pga: 'golf',
  ufc: 'ufc',
};

const SPORT_DISPLAY: Record<string, string> = {
  nba: 'NBA',
  nfl: 'NFL',
  mlb: 'MLB',
  nhl: 'NHL',
  ncaab: 'NCAA Basketball',
  cfb: 'College Football',
  f1: 'F1',
  golf: 'Golf',
  ufc: 'UFC',
  soccer: 'Soccer',
};

// Major soccer leagues for API-Football search (search requires league param)
const AF_SEARCH_LEAGUES = [39, 140, 135, 78, 61, 253]; // PL, La Liga, Serie A, Bundesliga, Ligue 1, MLS

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const apiFootballKey = process.env.API_FOOTBALL_KEY;
    const encodedQ = encodeURIComponent(q);

    // Build parallel fetches: ESPN (all sports) + API-Football (soccer across top leagues)
    const espnPromise = fetch(
      `https://site.web.api.espn.com/apis/common/v3/search?query=${encodedQ}&limit=10&type=player`
    );

    // API-Football: search requires league param, so search across top leagues in parallel
    // next.revalidate caches each unique URL server-side for 5 min (saves API quota)
    const afPromises = (q.length >= 3 && apiFootballKey)
      ? AF_SEARCH_LEAGUES.map(league =>
          fetch(
            `https://v3.football.api-sports.io/players?search=${encodedQ}&league=${league}&season=2024`,
            {
              headers: { 'x-apisports-key': apiFootballKey },
              next: { revalidate: 300 },
            }
          )
        )
      : [];

    const allPromises: Promise<Response>[] = [espnPromise, ...afPromises];
    const settled = await Promise.allSettled(allPromises);

    // Parse ESPN results — SKIP soccer (ESPN IDs don't match API-Football IDs)
    const players: PlayerSearchResult[] = [];
    const espnResult = settled[0];
    if (espnResult.status === 'fulfilled' && espnResult.value.ok) {
      const data = await espnResult.value.json();
      const items = data?.results?.[0]?.items || data?.items || [];

      for (const item of items) {
        const league = item.league?.toLowerCase?.() || '';
        let sport = LEAGUE_TO_SPORT[league];
        if (!sport) {
          if (league.includes('.')) {
            // Soccer — skip ESPN results, we'll use API-Football instead
            continue;
          } else {
            continue;
          }
        }

        players.push({
          id: item.id || '',
          name: item.displayName || '',
          sport,
          sportDisplay: SPORT_DISPLAY[sport] || sport.toUpperCase(),
          team: item.teamRelationships?.[0]?.core?.displayName || item.label?.split(' - ')?.[1] || '',
          headshot: item.headshot?.href || '',
          jersey: item.jersey || '',
        });
      }
    }

    // Parse API-Football results from all league searches, dedup by player ID
    const seenAfIds = new Set<string>();
    for (let i = 1; i < settled.length; i++) {
      const result = settled[i];
      if (result.status !== 'fulfilled' || !result.value.ok) continue;
      try {
        const afData = await result.value.json();
        const afItems: any[] = afData?.response || [];

        for (const entry of afItems) {
          const p = entry.player;
          if (!p?.id || !p?.name) continue;
          const pid = String(p.id);
          if (seenAfIds.has(pid)) continue;
          seenAfIds.add(pid);

          players.push({
            id: pid,
            name: p.name,
            sport: 'soccer',
            sportDisplay: 'Soccer',
            team: entry.statistics?.[0]?.team?.name || '',
            headshot: p.photo || '',
            jersey: '',
          });
        }
      } catch {
        // Individual league parse failed, continue
      }
    }

    return NextResponse.json(players, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}
