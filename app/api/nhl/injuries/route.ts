export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';

interface InjuredPlayer {
  id: string;
  name: string;
  position: string;
  status: string;
  injury: string;
  details?: string;
  date?: string;
}

interface InjuryEntry {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  players: InjuredPlayer[];
}

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries';
const FRESHNESS_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    // 1. Try cache first
    const { data: cached, error: cacheError } = await supabase
      .from('standings_cache')
      .select('standings, updated_at')
      .eq('sport_type', 'hockey_nhl')
      .eq('league_code', 'NHL_INJURIES')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cached?.standings && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < FRESHNESS_MS) {
        return NextResponse.json(cached.standings);
      }
    }

    // 2. Cache miss or stale — fetch from ESPN
    const res = await fetch(ESPN_URL, { next: { revalidate: 300 } });
    if (!res.ok) {
      // Return stale cache if available, else empty
      if (cached?.standings) return NextResponse.json(cached.standings);
      return NextResponse.json([] as InjuryEntry[]);
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injuries: InjuryEntry[] = (data?.injuries ?? []).map((teamGroup: any) => {
      const team = teamGroup?.team ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const players: InjuredPlayer[] = (teamGroup?.injuries ?? []).map((entry: any) => {
        const athlete = entry?.athlete ?? {};
        return {
          id: String(athlete.id ?? ''),
          name: athlete.displayName ?? athlete.fullName ?? '',
          position: athlete.position?.abbreviation ?? '',
          status: entry?.status ?? entry?.type?.description ?? 'Unknown',
          injury: entry?.details?.type ?? entry?.description ?? '',
          details: entry?.details?.detail ?? entry?.longComment ?? entry?.shortComment ?? undefined,
          date: entry?.date ?? undefined,
        };
      });

      return {
        team: {
          id: String(team.id ?? ''),
          name: team.displayName ?? team.name ?? '',
          abbreviation: team.abbreviation ?? '',
          logo: team.logos?.[0]?.href ?? team.logo ?? '',
        },
        players,
      };
    });

    // 3. Fire-and-forget write to cache
    const serviceClient = createServiceClient();
    serviceClient
      .from('standings_cache')
      .upsert(
        {
          sport_type: 'hockey_nhl',
          league_code: 'NHL_INJURIES',
          season: new Date().getFullYear().toString(),
          standings: injuries,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_code,season,sport_type' }
      )
      .then(({ error }) => {
        if (error) console.error('[API/NHL/Injuries] Cache write error:', error);
      });

    return NextResponse.json(injuries);
  } catch (error) {
    console.error('Failed to fetch NHL injuries:', error);
    return NextResponse.json([] as InjuryEntry[]);
  }
}
