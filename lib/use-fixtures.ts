'use client';

import useSWR from 'swr';

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
}

const fetcher = (url: string): Promise<FixturesResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// Hook for live-focused updates (shorter refresh interval)
export function useLiveFixtures(date?: Date) {
  const dateStr = date ? formatDate(date) : formatDate(new Date());

  const { data, error, isLoading, mutate } = useSWR<FixturesResponse>(
    `/api/fixtures/all?date=${dateStr}`,
    fetcher,
    {
      // Refresh every 30 seconds for live matches
      refreshInterval: 30000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  return {
    matches: data?.matches || [],
    isLoading: isLoading && !data,
    isRefreshing: isLoading && !!data,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
