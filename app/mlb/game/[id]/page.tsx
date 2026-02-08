'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, BarChart3, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MLBLiveStats } from '@/components/mlb/MLBLiveStats';
import { MLBBoxScore } from '@/components/mlb/MLBBoxScore';
import { MLBGame, MLBBoxScore as BoxScoreType } from '@/lib/types/mlb';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Game not found' : 'Failed to fetch');
  return res.json();
});

export default function MLBGamePage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const gameId = params.id as string;

  const [activeTab, setActiveTab] = useState<'stats' | 'boxscore'>('stats');

  const { data, error, isLoading, isValidating } = useSWR<{
    game: MLBGame;
    boxScore: BoxScoreType | null;
    lastPlay?: string;
  }>(
    gameId ? `/api/mlb/games/${gameId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        return data?.game.status === 'in_progress' ? 15000 : 0;
      },
      revalidateOnFocus: true,
    }
  );

  const game = data?.game;
  const boxScore = data?.boxScore;
  const lastPlay = data?.lastPlay;

  const isLive = game?.status === 'in_progress';
  const isFinal = game?.status === 'final';

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
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
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Game not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg px-4 py-2 text-[12px]"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  const getInningDisplay = () => {
    if (!isLive) return '';
    const half = game.inningHalf === 'top' ? 'Top' : 'Bot';
    return `${half} ${game.inning}`;
  };

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>MLB Baseball</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {game.seriesInfo || 'Regular Season'}
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
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Score Section */}
      <section className="px-4 py-8" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex items-start justify-between">
          {/* Away Team */}
          <Link href={`/mlb/team/${game.awayTeam.id}`} className="flex-1 text-center">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Away
            </span>
            <div className="mx-auto mb-3 h-16 w-16">
              {game.awayTeam.logo ? (
                <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="h-full w-full object-contain logo-glow" />
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
                      {getInningDisplay()} · {game.outs} Out{game.outs !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <span
                    className="mt-3 inline-block rounded-full px-4 py-1 text-[10px] font-medium"
                    style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                  >
                    {game.statusDetail}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Home Team */}
          <Link href={`/mlb/team/${game.homeTeam.id}`} className="flex-1 text-center">
            <span className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Home
            </span>
            <div className="mx-auto mb-3 h-16 w-16">
              {game.homeTeam.logo ? (
                <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="h-full w-full object-contain logo-glow" />
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

        {/* Last Play */}
        {isLive && lastPlay && (
          <div
            className="mt-4 rounded-lg p-3 text-center"
            style={{ backgroundColor: theme.bgTertiary }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
              Last Play
            </p>
            <p className="text-[12px]" style={{ color: theme.text }}>
              {lastPlay}
            </p>
          </div>
        )}
      </section>

      {/* Game Info */}
      <section className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
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

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {[
          { key: 'stats', label: 'Stats', icon: BarChart3 },
          { key: 'boxscore', label: 'Box Score', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition-colors"
              style={{
                color: activeTab === tab.key ? theme.accent : theme.textSecondary,
                borderBottom: activeTab === tab.key ? `2px solid ${theme.accent}` : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {activeTab === 'stats' && (
          <MLBLiveStats
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            homeStats={boxScore?.homeTeam.stats || null}
            awayStats={boxScore?.awayTeam.stats || null}
            lineScore={boxScore?.lineScore}
            isLoading={isValidating && !boxScore}
          />
        )}

        {activeTab === 'boxscore' && (
          <MLBBoxScore
            boxScore={boxScore ?? null}
            isLoading={isValidating && !boxScore}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
