'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Match {
  id: number;
  league: string;
  leagueCode?: string;
  leagueLogo?: string;
  home: string;
  away: string;
  homeId?: number;
  awayId?: number;
  homeScore: number | null;
  awayScore: number | null;
  homeLogo: string;
  awayLogo: string;
  status: string;
  time: string;
  date?: string;
  fullDate?: string;
  timestamp?: number;
  matchday?: number;
  stage?: string;
  venue?: string;
}

interface FixturesResponse {
  matches: Match[];
  cached?: boolean;
  cacheAge?: number;
  count?: number;
  source?: string;
}

// Smart fetcher: tries Supabase cache first, falls back to direct API
const fetcher = async (url: string): Promise<FixturesResponse> => {
  // Extract date from URL
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const date = urlParams.get('date');

  // Try Supabase cache first (instant response)
  try {
    const cachedRes = await fetch(`/api/fixtures/cached?date=${date}`);
    if (cachedRes.ok) {
      const cachedData = await cachedRes.json();
      // If cache has data, use it immediately for fast loading
      if (cachedData.matches && cachedData.matches.length > 0) {
        return cachedData;
      }
    }
  } catch {
    // Cache miss or error, fall through to direct API
  }

  // Fallback to direct API (slower but always fresh)
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Format date as YYYY-MM-DD in Eastern Time
function formatDate(date: Date): string {
  // Use Eastern Time to determine the date, matching the app's display timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale gives us YYYY-MM-DD format
  return formatter.format(date);
}

export function useFixtures(date?: Date) {
  const dateStr = date ? formatDate(date) : formatDate(new Date());

  const { data, error, isLoading, mutate } = useSWR<FixturesResponse>(
    `/api/fixtures/all?date=${dateStr}`,
    fetcher,
    {
      // Revalidate every 60 seconds for live data
      refreshInterval: 60000,
      // Show stale data while fetching
      revalidateOnFocus: true,
      // Keep previous data while loading new
      keepPreviousData: true,
      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,
    }
  );

  return {
    matches: data?.matches || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    cached: data?.cached,
    cacheAge: data?.cacheAge,
  };
}

// Hook for live-focused updates with realtime subscriptions
export function useLiveFixtures(date?: Date) {
  const dateStr = date ? formatDate(date) : formatDate(new Date());
  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<number, Partial<Match>>>(new Map());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<FixturesResponse>(
    `/api/fixtures/all?date=${dateStr}`,
    fetcher,
    {
      // Slower polling since realtime handles live updates
      refreshInterval: 60000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  // Subscribe to realtime updates for today's matches
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel('fixtures-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fixtures_cache',
          filter: `match_date=eq.${dateStr}`,
        },
        (payload) => {
          const updated = payload.new as any;
          console.log('[Fixtures] Realtime update:', updated.api_id, updated.status, `${updated.home_score}-${updated.away_score}`);

          setRealtimeUpdates(prev => {
            const next = new Map(prev);
            next.set(updated.api_id, {
              status: updated.status,
              homeScore: updated.home_score,
              awayScore: updated.away_score,
              time: updated.minute ? `${updated.minute}'` : '',
            });
            return next;
          });
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [dateStr]);

  // Merge API data with realtime updates
  const matches = (data?.matches || []).map(match => {
    const realtimeData = realtimeUpdates.get(match.id);
    if (realtimeData) {
      return {
        ...match,
        status: realtimeData.status || match.status,
        homeScore: realtimeData.homeScore ?? match.homeScore,
        awayScore: realtimeData.awayScore ?? match.awayScore,
        time: realtimeData.time || match.time,
      };
    }
    return match;
  });

  return {
    matches,
    isLoading: isLoading && !data,
    isRefreshing: isLoading && !!data,
    isError: !!error,
    error,
    refresh: mutate,
    isRealtimeConnected,
  };
}
