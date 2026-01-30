'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { BasketballGameCard } from '@/components/basketball/BasketballGameCard';
import { useTheme } from '@/lib/theme';
import { BasketballGame, BasketballRanking } from '@/lib/types/basketball';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BasketballHomePage() {
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [rankedCollapsed, setRankedCollapsed] = useState(false);
  const [otherCollapsed, setOtherCollapsed] = useState(false);
  const { theme } = useTheme();

  // Fetch games
  const { data: gamesData, isLoading, mutate, isValidating } = useSWR<{
    games: BasketballGame[];
    count: number;
  }>('/api/basketball/games', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds for live scores
    revalidateOnFocus: true,
  });

  // Fetch rankings for context
  const { data: rankingsData } = useSWR<{
    rankings: BasketballRanking[];
  }>('/api/basketball/standings?rankings=true', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  const games = gamesData?.games || [];
  const rankings = rankingsData?.rankings || [];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Separate games into categories
  const liveGames = games.filter(g => g.status === 'in_progress');
  const rankedGames = games.filter(g =>
    g.status !== 'in_progress' &&
    (g.homeTeam.rank || g.awayTeam.rank)
  );
  const otherGames = games.filter(g =>
    g.status !== 'in_progress' &&
    !g.homeTeam.rank &&
    !g.awayTeam.rank
  );

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                NCAA Basketball
              </h1>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                NEW
              </span>
            </div>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {dateStr}
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
            }}
          >
            <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {isValidating && (
          <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
            Updating...
          </p>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading games...
            </p>
          </div>
        ) : games.length === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No games scheduled for today
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Live Games */}
            {liveGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => setLiveCollapsed(!liveCollapsed)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: liveCollapsed ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 animate-pulse rounded-full"
                      style={{ backgroundColor: theme.red }}
                    />
                    <h2
                      className="text-sm font-semibold uppercase tracking-wider"
                      style={{ color: theme.red }}
                    >
                      Live Now
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: theme.red, color: '#fff' }}
                    >
                      {liveGames.length}
                    </span>
                  </div>
                  {liveCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>

                {!liveCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {liveGames.map((game) => (
                      <BasketballGameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Ranked Matchups */}
            {rankedGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => setRankedCollapsed(!rankedCollapsed)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: rankedCollapsed ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <Trophy size={16} style={{ color: theme.gold }} />
                    <h2
                      className="text-sm font-semibold uppercase tracking-wider"
                      style={{ color: theme.text }}
                    >
                      Ranked Matchups
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      {rankedGames.length}
                    </span>
                  </div>
                  {rankedCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>

                {!rankedCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {rankedGames.map((game) => (
                      <BasketballGameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Other Games */}
            {otherGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => setOtherCollapsed(!otherCollapsed)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: otherCollapsed ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-sm font-semibold uppercase tracking-wider"
                      style={{ color: theme.text }}
                    >
                      All Games
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      {otherGames.length}
                    </span>
                  </div>
                  {otherCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>

                {!otherCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {otherGames.map((game) => (
                      <BasketballGameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
