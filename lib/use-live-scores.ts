'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveMatch {
  id: number;
  api_id: number;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_team_name: string;
  away_team_name: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  league_name: string;
  league_code: string;
  kickoff: string;
}

interface UseLiveScoresOptions {
  matchIds?: number[]; // Specific match API IDs to watch
  watchAll?: boolean;  // Watch all live matches
}

export function useLiveScores(options: UseLiveScoresOptions = {}) {
  const { matchIds, watchAll = false } = options;
  const [matches, setMatches] = useState<Map<number, LiveMatch>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Update a single match in state
  const updateMatch = useCallback((match: LiveMatch) => {
    setMatches(prev => {
      const next = new Map(prev);
      next.set(match.api_id, match);
      return next;
    });
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function setupSubscription() {
      // Build the filter based on options
      let filter = 'sport_type=eq.soccer';

      if (matchIds && matchIds.length > 0) {
        filter += `,api_id=in.(${matchIds.join(',')})`;
      }

      // Subscribe to changes on fixtures_cache
      channel = supabase
        .channel('live-scores')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fixtures_cache',
            filter: matchIds ? `api_id=in.(${matchIds.join(',')})` : undefined,
          },
          (payload) => {
            const match = payload.new as LiveMatch;
            console.log('[LiveScores] Match updated:', match.api_id, match.status, `${match.home_score}-${match.away_score}`);
            updateMatch(match);
          }
        )
        .subscribe((status) => {
          console.log('[LiveScores] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    }

    setupSubscription();

    return () => {
      if (channel) {
        console.log('[LiveScores] Unsubscribing...');
        supabase.removeChannel(channel);
      }
    };
  }, [matchIds?.join(','), watchAll, updateMatch]);

  // Get a specific match by API ID
  const getMatch = useCallback((apiId: number) => matches.get(apiId), [matches]);

  // Get all matches as array
  const allMatches = Array.from(matches.values());

  return {
    matches: allMatches,
    getMatch,
    isConnected,
  };
}

// Hook for a single match - simpler API
export function useLiveMatch(matchApiId: number | null) {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!matchApiId) return;

    let channel: RealtimeChannel | null = null;

    // First, fetch initial data
    async function fetchInitial() {
      const { data } = await supabase
        .from('fixtures_cache')
        .select('*')
        .eq('api_id', matchApiId)
        .single();

      if (data) {
        setMatch(data as LiveMatch);
      }
    }

    fetchInitial();

    // Then subscribe to updates
    channel = supabase
      .channel(`live-match-${matchApiId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fixtures_cache',
          filter: `api_id=eq.${matchApiId}`,
        },
        (payload) => {
          const updated = payload.new as LiveMatch;
          console.log('[LiveMatch] Updated:', updated.status, `${updated.home_score}-${updated.away_score}`);
          setMatch(updated);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchApiId]);

  return { match, isConnected };
}

// Hook for today's live matches
export function useTodayLiveMatches() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    const today = new Date().toISOString().split('T')[0];

    // Fetch initial data
    async function fetchInitial() {
      const { data } = await supabase
        .from('fixtures_cache')
        .select('*')
        .eq('match_date', today)
        .order('kickoff', { ascending: true });

      if (data) {
        setMatches(data as LiveMatch[]);
      }
    }

    fetchInitial();

    // Subscribe to all updates for today
    channel = supabase
      .channel('today-live-matches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fixtures_cache',
          filter: `match_date=eq.${today}`,
        },
        (payload) => {
          const updated = payload.new as LiveMatch;
          setMatches(prev => {
            const idx = prev.findIndex(m => m.api_id === updated.api_id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { matches, isConnected };
}
