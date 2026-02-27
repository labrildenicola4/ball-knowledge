'use client';

import { useParams } from 'next/navigation';
import { useSafeBack } from '@/lib/use-safe-back';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { GameOdds } from '@/components/GameOdds';
import { CollegeFootballGame } from '@/lib/types/college-football';

import { PullToRefresh } from '@/components/PullToRefresh';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Game not found' : 'Failed to fetch');
  return res.json();
});

export default function FootballGamePage() {
  const params = useParams();
  const goBack = useSafeBack('/football');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const gameId = params.id as string;

  // For now, fetch from games list and find the specific game
  // TODO: Add dedicated game detail endpoint
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    games: CollegeFootballGame[];
  }>(
    '/api/football/games',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const game = data?.games?.find(g => g.id === gameId);

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
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>College Football</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {game.conferenceGame ? 'Conference Game' : 'Non-Conference'}
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
          <Link href={`/football/team/${game.awayTeam.id}`} className="flex-1 text-center logo-press">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Away
            </span>
            {game.awayTeam.rank && (
              <span className="block text-[11px] font-bold mb-1" style={{ color: theme.gold }}>
                #{game.awayTeam.rank}
              </span>
            )}
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
                      Q{game.period} {game.clock}
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
          <Link href={`/football/team/${game.homeTeam.id}`} className="flex-1 text-center logo-press">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Home
            </span>
            {game.homeTeam.rank && (
              <span className="block text-[11px] font-bold mb-1" style={{ color: theme.gold }}>
                #{game.homeTeam.rank}
              </span>
            )}
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
          sport="cfb"
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
      <section className="px-4 py-4" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <div className="flex flex-col gap-3">
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
          {game.broadcast && (
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ color: theme.textSecondary }}>
                TV: {game.broadcast}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="flex-1 overflow-y-auto pb-24">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
      {/* Team Links */}
      <section className="px-4 py-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
          Team Pages
        </h3>
        <div className="flex gap-3">
          <Link
            href={`/football/team/${game.awayTeam.id}`}
            className={`flex-1 flex items-center gap-3 rounded-xl p-3 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {game.awayTeam.logo && (
              <SafeImage src={game.awayTeam.logo} alt={game.awayTeam.name} className="h-8 w-8 object-contain logo-glow" />
            )}
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              {game.awayTeam.shortDisplayName}
            </span>
          </Link>
          <Link
            href={`/football/team/${game.homeTeam.id}`}
            className={`flex-1 flex items-center gap-3 rounded-xl p-3 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {game.homeTeam.logo && (
              <SafeImage src={game.homeTeam.logo} alt={game.homeTeam.name} className="h-8 w-8 object-contain logo-glow" />
            )}
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              {game.homeTeam.shortDisplayName}
            </span>
          </Link>
        </div>
      </section>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
}
