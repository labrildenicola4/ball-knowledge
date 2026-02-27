'use client';

import useSWR from 'swr';

export interface OddsData {
  homeWin: number;
  draw: number;
  awayWin: number;
  hasDraw?: boolean;
}

export interface UseOddsParams {
  sport: string;
  homeAbbrev: string;
  awayAbbrev: string;
  gameDate: string;
  isLive: boolean;
  isUpcoming: boolean;
  matchId?: number;
  homeTeamName?: string;
  awayTeamName?: string;
  leagueCode?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useOdds({
  sport, homeAbbrev, awayAbbrev, gameDate,
  isLive, isUpcoming,
  matchId, homeTeamName, awayTeamName, leagueCode
}: UseOddsParams): { odds: OddsData | null; isLoading: boolean } {
  const showOdds = isUpcoming || isLive;

  const oddsUrl = showOdds
    ? sport === 'soccer' && matchId
      ? `/api/odds/${matchId}?home=${encodeURIComponent(homeTeamName || '')}&away=${encodeURIComponent(awayTeamName || '')}&league=${encodeURIComponent(leagueCode || '')}`
      : (gameDate && homeAbbrev && awayAbbrev)
        ? `/api/odds/game?sport=${sport}&homeAbbrev=${encodeURIComponent(homeAbbrev)}&awayAbbrev=${encodeURIComponent(awayAbbrev)}&date=${encodeURIComponent(gameDate)}${homeTeamName ? `&homeName=${encodeURIComponent(homeTeamName)}` : ''}${awayTeamName ? `&awayName=${encodeURIComponent(awayTeamName)}` : ''}`
        : null
    : null;

  const { data, isLoading } = useSWR<{ odds: OddsData | null }>(
    oddsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: isLive ? 30000 : 300000,
      refreshInterval: isLive ? 30000 : 0,
      revalidateOnReconnect: false,
    }
  );

  return { odds: data?.odds ?? null, isLoading };
}
