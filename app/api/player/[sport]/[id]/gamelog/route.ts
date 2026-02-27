import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SPORT_MAP: Record<string, { sport: string; league: string }> = {
  nba: { sport: 'basketball', league: 'nba' },
  nfl: { sport: 'football', league: 'nfl' },
  mlb: { sport: 'baseball', league: 'mlb' },
  nhl: { sport: 'hockey', league: 'nhl' },
  ncaab: { sport: 'basketball', league: 'mens-college-basketball' },
  cfb: { sport: 'football', league: 'college-football' },
};

const EMPTY = { games: [], labels: [] };

const NO_GAMELOG_SPORTS = new Set(['f1', 'ufc', 'golf', 'soccer']);

interface GameEntry {
  eventId: string;
  date: string;
  opponent: { name: string; abbreviation: string; logo: string };
  atVs: string;
  score: string;
  result: string;
  stats: Record<string, string>;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sport: string; id: string }> }
) {
  try {
    const { sport, id } = await params;

    if (!sport || !id || NO_GAMELOG_SPORTS.has(sport.toLowerCase())) {
      return NextResponse.json(EMPTY);
    }

    const mapping = SPORT_MAP[sport.toLowerCase()];
    if (!mapping) {
      return NextResponse.json(EMPTY);
    }

    const url = `https://site.web.api.espn.com/apis/common/v3/sports/${mapping.sport}/${mapping.league}/athletes/${id}/gamelog`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return NextResponse.json(EMPTY);
    }

    const data = await res.json();

    const labels: string[] = data.labels || [];
    const eventsMap: Record<string, any> = data.events || {};
    const seasonTypes: any[] = data.seasonTypes || [];

    const gamesMap = new Map<string, GameEntry>();

    for (const seasonType of seasonTypes) {
      const categories = seasonType.categories || [];
      for (const category of categories) {
        const catEvents = category.events || [];
        for (const catEvent of catEvents) {
          const eventId = catEvent.eventId;
          if (!eventId || gamesMap.has(eventId)) continue;

          const eventDetail = eventsMap[eventId];
          if (!eventDetail) continue;

          const statsArr: string[] = catEvent.stats || [];
          const statsRecord: Record<string, string> = {};
          labels.forEach((label, idx) => {
            if (idx < statsArr.length) {
              statsRecord[label] = statsArr[idx];
            }
          });

          gamesMap.set(eventId, {
            eventId,
            date: eventDetail.gameDate || '',
            opponent: {
              name: eventDetail.opponent?.displayName || '',
              abbreviation: eventDetail.opponent?.abbreviation || '',
              logo: eventDetail.opponent?.logo || '',
            },
            atVs: eventDetail.atVs || '',
            score: eventDetail.score || '',
            result: eventDetail.gameResult || '',
            stats: statsRecord,
          });
        }
      }
    }

    const games = Array.from(gamesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const response = NextResponse.json({ games, labels });
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    return response;
  } catch {
    return NextResponse.json(EMPTY);
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
