'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MLBGameCard } from '@/components/mlb/MLBGameCard';
import { MLBGame } from '@/lib/types/mlb';

export default function MLBPage() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();

  const [games, setGames] = useState<MLBGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchGames = () => {
    setIsLoading(true);
    setError(false);
    fetch('/api/mlb/games')
      .then(res => res.json())
      .then(data => {
        setGames(data.games || []);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const liveGames = games.filter(g => g.status === 'in_progress');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const finishedGames = games.filter(g => g.status === 'final');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>
            MLB Baseball
          </p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {dateStr}
          </p>
        </div>
        <button
          onClick={fetchGames}
          disabled={isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <RefreshCw
            size={16}
            className={isLoading ? 'animate-spin' : ''}
            style={{ color: theme.text }}
          />
        </button>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? (
            <Sun size={18} style={{ color: theme.text }} />
          ) : (
            <Moon size={18} style={{ color: theme.text }} />
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && games.length === 0 ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading games...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.red }}>
              Failed to load games
            </p>
            <button
              onClick={fetchGames}
              className="mt-3 rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Try Again
            </button>
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
          <div className="space-y-6">
            {/* Live Games */}
            {liveGames.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {liveGames.map(game => (
                    <MLBGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <section>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-3"
                  style={{ color: theme.textSecondary }}
                >
                  Upcoming ({upcomingGames.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {upcomingGames.map(game => (
                    <MLBGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Finished Games */}
            {finishedGames.length > 0 && (
              <section>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-3"
                  style={{ color: theme.textSecondary }}
                >
                  Final ({finishedGames.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {finishedGames.map(game => (
                    <MLBGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
