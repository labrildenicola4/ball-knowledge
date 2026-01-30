'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ESPN_SPORTS,
  ESPNSportKey,
  ESPN_GAMES_TABLE,
  getEasternDateString,
} from './espn-sync-config';

// Generic game type that works for all sports
export interface ESPNGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed';
  statusDetail: string;
  period: number;
  clock: string;
  date: string;
  startTime: string;
  venue?: string;
  broadcast?: string;
  conferenceGame: boolean;
  neutralSite: boolean;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color?: string;
    record?: string;
    rank?: number;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color?: string;
    record?: string;
    rank?: number;
    score?: number;
  };
  // Sport-specific data
  [key: string]: unknown;
}

interface GamesResponse {
  games: ESPNGame[];
  count: number;
  sport: string;
  date: string;
  cached: boolean;
}

const fetcher = async (url: string): Promise<GamesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Format date as YYYY-MM-DD in Eastern Time
function formatDateET(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Hook for fetching ESPN games from the cached Supabase data
 * Includes realtime updates for live games
 */
export function useESPNGames(sport: ESPNSportKey, date?: Date) {
  const dateStr = date ? formatDateET(date) : formatDateET(new Date());
  const config = ESPN_SPORTS[sport];

  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<string, Partial<ESPNGame>>>(new Map());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<GamesResponse>(
    `/api/games/cached?sport=${sport}&date=${dateStr}`,
    fetcher,
    {
      refreshInterval: config.defaultRefreshSeconds * 1000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  // Subscribe to realtime updates for this sport and date
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`espn-games-${sport}-${dateStr}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: ESPN_GAMES_TABLE,
          filter: `sport_type=eq.${config.sportType}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const gameDate = updated.game_date as string;

          // Only process updates for the current date
          if (gameDate !== dateStr) return;

          console.log(`[ESPN-Games] Realtime update:`, updated.id, updated.status, `${updated.home_score}-${updated.away_score}`);

          setRealtimeUpdates(prev => {
            const next = new Map(prev);
            next.set(updated.espn_game_id as string, {
              status: updated.status as ESPNGame['status'],
              statusDetail: updated.status_detail as string,
              period: updated.period as number,
              clock: updated.clock as string,
              homeTeam: {
                id: updated.home_team_id as string,
                name: updated.home_team_name as string,
                abbreviation: updated.home_team_abbrev as string,
                displayName: updated.home_team_name as string,
                shortDisplayName: updated.home_team_abbrev as string,
                logo: (updated.home_team_logo as string) || '',
                score: updated.home_score as number,
              },
              awayTeam: {
                id: updated.away_team_id as string,
                name: updated.away_team_name as string,
                abbreviation: updated.away_team_abbrev as string,
                displayName: updated.away_team_name as string,
                shortDisplayName: updated.away_team_abbrev as string,
                logo: (updated.away_team_logo as string) || '',
                score: updated.away_score as number,
              },
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
  }, [sport, dateStr, config.sportType]);

  // Merge API data with realtime updates
  const games = (data?.games || []).map(game => {
    const realtimeData = realtimeUpdates.get(game.id);
    if (realtimeData) {
      return {
        ...game,
        ...realtimeData,
        homeTeam: { ...game.homeTeam, ...realtimeData.homeTeam },
        awayTeam: { ...game.awayTeam, ...realtimeData.awayTeam },
      };
    }
    return game;
  });

  // Separate live and other games
  const liveGames = games.filter(g => g.status === 'in_progress');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const finishedGames = games.filter(g => g.status === 'final');

  return {
    games,
    liveGames,
    upcomingGames,
    finishedGames,
    isLoading: isLoading && !data,
    isRefreshing: isLoading && !!data,
    isError: !!error,
    error,
    refresh: mutate,
    isRealtimeConnected,
  };
}

/**
 * Hook for fetching all ESPN games across multiple sports for a given date
 * Useful for the homepage which shows all sports together
 */
export function useAllESPNGames(date?: Date) {
  const dateStr = date ? formatDateET(date) : formatDateET(new Date());

  const sports: ESPNSportKey[] = ['basketball', 'mlb']; // Add more as needed

  // Fetch all sports in parallel
  const results = sports.map(sport => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { games, isLoading, isError } = useESPNGames(sport, date);
    return { sport, games, isLoading, isError };
  });

  const isLoading = results.some(r => r.isLoading);
  const isError = results.every(r => r.isError);

  // Combine all games with sport type annotation
  const allGames = results.flatMap(r =>
    r.games.map(game => ({ ...game, sportType: r.sport }))
  );

  // Sort by start time
  allGames.sort((a, b) => {
    const aIsLive = a.status === 'in_progress';
    const bIsLive = b.status === 'in_progress';
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return a.startTime.localeCompare(b.startTime);
  });

  return {
    games: allGames,
    isLoading,
    isError,
    sportCounts: Object.fromEntries(
      results.map(r => [r.sport, r.games.length])
    ),
  };
}
