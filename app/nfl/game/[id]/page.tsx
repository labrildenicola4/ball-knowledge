'use client';

import { useParams } from 'next/navigation';
import { useSafeBack } from '@/lib/use-safe-back';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { GameOdds } from '@/components/GameOdds';
import { NFLGame, NFLBoxScore as BoxScoreType } from '@/lib/types/nfl';

import { PullToRefresh } from '@/components/PullToRefresh';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Game not found' : 'Failed to fetch');
  return res.json();
});

export default function NFLGamePage() {
  const params = useParams();
  const goBack = useSafeBack('/nfl');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const gameId = params.id as string;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    game: NFLGame;
    boxScore: BoxScoreType | null;
    lastPlay?: string;
  }>(
    gameId ? `/api/nfl/games/${gameId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        return data?.game.status === 'in_progress' ? 15000 : 0;
      },
      revalidateOnFocus: true,
    }
  );

  const game = data?.game;

  const isLive = game?.status === 'in_progress';
  const isFinal = game?.status === 'final';

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading game...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Game not found'}</p>
        <button
          onClick={goBack}
          className={`mt-4 rounded-lg px-4 py-2 text-[12px] ${darkMode ? 'glass-pill' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  const getQuarterDisplay = () => {
    if (!isLive) return '';
    const quarter = game.quarter;
    if (quarter === 0) return '';
    if (quarter <= 4) return `Q${quarter}`;
    return 'OT';
  };

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="safe-top flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <button
          onClick={goBack}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NFL Football</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {game.week ? `Week ${game.week}` : 'Regular Season'} {game.seasonType && `· ${game.seasonType}`}
          </p>
        </div>
        {isLive && (
          <div className="flex flex-col items-end gap-1">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-medium"
              style={{ backgroundColor: theme.red, color: '#fff' }}
            >
              LIVE
            </span>
            <span className="text-[9px] flex items-center gap-1" style={{ color: theme.textSecondary }}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${isValidating ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: theme.green }}
              />
              {isValidating ? 'Updating...' : 'Auto-refresh'}
            </span>
          </div>
        )}
        <button
          onClick={toggleDarkMode}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Score Section */}
      <section className={`px-4 py-8 ${darkMode ? 'glass-section' : ''}`} style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}>
        <div className="flex items-start justify-between">
          {/* Away Team */}
          <Link href={`/nfl/team/${game.awayTeam.id}`} className="flex-1 text-center logo-press">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Away
            </span>
            <div className="mx-auto mb-3 h-16 w-16">
              {game.awayTeam.logo ? (
                <SafeImage src={game.awayTeam.logo} alt={game.awayTeam.name} className="h-full w-full object-contain logo-glow" />
              ) : (
                <div className="h-full w-full rounded-full" style={{ backgroundColor: game.awayTeam.color || theme.bgTertiary }} />
              )}
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text }}
            >
              {game.awayTeam.shortDisplayName}
            </p>
            {game.awayTeam.record && (
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                {game.awayTeam.record}
              </p>
            )}
          </Link>

          {/* Score */}
          <div className="px-4 text-center">
            {game.status === 'scheduled' ? (
              <div>
                <p className="font-mono text-3xl font-light" style={{ color: theme.textSecondary }}>vs</p>
                <p className="mt-2 text-[11px]" style={{ color: theme.textSecondary }}>
                  {game.startTime}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <span
                    className="font-mono text-4xl font-light"
                    style={{ color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text }}
                  >
                    {game.awayTeam.score ?? 0}
                  </span>
                  <span className="text-xl" style={{ color: theme.textSecondary }}>-</span>
                  <span
                    className="font-mono text-4xl font-light"
                    style={{ color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text }}
                  >
                    {game.homeTeam.score ?? 0}
                  </span>
                </div>

                {isLive ? (
                  <div className="mt-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-4 py-1 text-[12px] font-semibold"
                      style={{ backgroundColor: theme.red, color: '#fff' }}
                    >
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      {getQuarterDisplay()} · {game.clock}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`mt-3 inline-block rounded-full px-4 py-1 text-[10px] font-medium ${darkMode ? 'glass-pill' : ''}`}
                    style={darkMode ? { color: theme.textSecondary } : { backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                  >
                    {game.statusDetail}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Home Team */}
          <Link href={`/nfl/team/${game.homeTeam.id}`} className="flex-1 text-center logo-press">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Home
            </span>
            <div className="mx-auto mb-3 h-16 w-16">
              {game.homeTeam.logo ? (
                <SafeImage src={game.homeTeam.logo} alt={game.homeTeam.name} className="h-full w-full object-contain logo-glow" />
              ) : (
                <div className="h-full w-full rounded-full" style={{ backgroundColor: game.homeTeam.color || theme.bgTertiary }} />
              )}
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text }}
            >
              {game.homeTeam.shortDisplayName}
            </p>
            {game.homeTeam.record && (
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                {game.homeTeam.record}
              </p>
            )}
          </Link>
        </div>

        <GameOdds
          sport="nfl"
          homeAbbrev={game.homeTeam.abbreviation}
          awayAbbrev={game.awayTeam.abbreviation}
          homeTeamName={game.homeTeam.shortDisplayName}
          awayTeamName={game.awayTeam.shortDisplayName}
          gameDate={game.rawDate || ''}
          isLive={isLive}
          isUpcoming={game.status === 'scheduled'}
        />
      </section>

      {/* Game Info */}
      <section className="px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>{game.date}</span>
          </div>
          {game.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: theme.textSecondary }} />
              <span className="text-[12px]" style={{ color: theme.textSecondary }}>{game.venue}</span>
            </div>
          )}
        </div>
      </section>

      {/* Stats Coming Soon */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-6">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
        <div
          className={`rounded-xl p-8 text-center ${darkMode ? 'glass-card' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
            Game Stats
          </p>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Detailed game statistics and box score available during live games.
          </p>
        </div>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
}
