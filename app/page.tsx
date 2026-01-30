'use client';

import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { BasketballGameCard } from '@/components/basketball/BasketballGameCard';
import { useTheme } from '@/lib/theme';
import { useLiveFixtures } from '@/lib/use-fixtures';
import { BasketballGame } from '@/lib/types/basketball';

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
  timestamp?: number;
}

// Helper to convert time to EST for sorting
function parseTimeToEST(timeStr: string): number {
  // Parse time like "7:00 PM" or "19:00" to minutes since midnight EST
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Combined game type for chronological display
interface CombinedGame {
  type: 'soccer' | 'basketball';
  id: string;
  time: string;
  timeValue: number; // For sorting
  isLive: boolean;
  soccerMatch?: Match;
  basketballGame?: BasketballGame;
}

export default function HomePage() {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const { theme } = useTheme();

  // Use SWR hook for soccer data fetching
  const { matches, isLoading: soccerLoading, isRefreshing, isError: soccerError, refresh } = useLiveFixtures();

  // Basketball games state
  const [basketballGames, setBasketballGames] = useState<BasketballGame[]>([]);
  const [basketballLoading, setBasketballLoading] = useState(true);
  const [basketballError, setBasketballError] = useState(false);

  // Fetch basketball games
  useEffect(() => {
    setBasketballLoading(true);
    fetch('/api/basketball/games')
      .then(res => res.json())
      .then(data => {
        setBasketballGames(data.games || []);
        setBasketballLoading(false);
      })
      .catch(() => {
        setBasketballError(true);
        setBasketballLoading(false);
      });
  }, []);

  const refreshAll = () => {
    refresh();
    setBasketballLoading(true);
    fetch('/api/basketball/games')
      .then(res => res.json())
      .then(data => {
        setBasketballGames(data.games || []);
        setBasketballLoading(false);
      })
      .catch(() => {
        setBasketballError(true);
        setBasketballLoading(false);
      });
  };

  const isLoading = soccerLoading && basketballLoading;
  const isError = soccerError && basketballError;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Combine and sort all games chronologically
  const allGames = useMemo<CombinedGame[]>(() => {
    const combined: CombinedGame[] = [];

    // Add soccer matches
    matches.forEach(match => {
      const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.status);
      combined.push({
        type: 'soccer',
        id: `soccer-${match.id}`,
        time: match.time,
        timeValue: parseTimeToEST(match.time),
        isLive,
        soccerMatch: match,
      });
    });

    // Add basketball games
    basketballGames.forEach(game => {
      const isLive = game.status === 'in_progress';
      combined.push({
        type: 'basketball',
        id: `basketball-${game.id}`,
        time: game.startTime,
        timeValue: parseTimeToEST(game.startTime),
        isLive,
        basketballGame: game,
      });
    });

    return combined;
  }, [matches, basketballGames]);

  // Separate live and upcoming games
  const liveGames = allGames.filter(g => g.isLive);
  const upcomingGames = allGames
    .filter(g => !g.isLive)
    .sort((a, b) => a.timeValue - b.timeValue);

  // Group upcoming games by hour for better organization
  const gamesByHour = useMemo(() => {
    const groups: { hour: string; games: CombinedGame[] }[] = [];
    const hourMap = new Map<string, CombinedGame[]>();

    upcomingGames.forEach(game => {
      // Extract hour from time (e.g., "7:00 PM" -> "7 PM")
      const match = game.time.match(/(\d{1,2}):\d{2}\s*(AM|PM)?/i);
      let hourKey = game.time;
      if (match) {
        hourKey = match[2] ? `${match[1]} ${match[2].toUpperCase()}` : `${match[1]}:00`;
      }

      if (!hourMap.has(hourKey)) {
        hourMap.set(hourKey, []);
      }
      hourMap.get(hourKey)!.push(game);
    });

    hourMap.forEach((games, hour) => {
      groups.push({ hour, games });
    });

    return groups;
  }, [upcomingGames]);

  const totalGames = matches.length + basketballGames.length;

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Today's Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>Today's Games</h1>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {dateStr} · Eastern Time
            </p>
          </div>
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
            }}
          >
            <RefreshCw size={16} className={isRefreshing || basketballLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {(isRefreshing || basketballLoading) && (
          <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
            Updating...
          </p>
        )}
        {/* Sport counts */}
        <div className="flex gap-3 mt-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
            ⚽ {matches.length} soccer
          </span>
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
            🏀 {basketballGames.length} basketball
          </span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && totalGames === 0 ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading today's games...
            </p>
          </div>
        ) : isError ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.red }}>
              Failed to load games
            </p>
            <button
              onClick={() => refreshAll()}
              className="mt-3 rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Try Again
            </button>
          </div>
        ) : totalGames === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No games scheduled for today
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              Check the Calendar for upcoming fixtures
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Live Games Section */}
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
                      game.type === 'soccer' && game.soccerMatch ? (
                        <MatchCard key={game.id} match={game.soccerMatch} />
                      ) : game.type === 'basketball' && game.basketballGame ? (
                        <BasketballGameCard key={game.id} game={game.basketballGame} />
                      ) : null
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Games by Hour - Chronological */}
            {gamesByHour.map(({ hour, games }) => {
              const isCollapsed = collapsedSections.has(hour);
              return (
                <section
                  key={hour}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <button
                    onClick={() => toggleSection(hour)}
                    className="w-full flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${theme.border}` }}
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-medium" style={{ color: theme.text }}>
                        {hour} ET
                      </h2>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs"
                        style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                      >
                        {games.length}
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                    ) : (
                      <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                      {games.map((game) => (
                        game.type === 'soccer' && game.soccerMatch ? (
                          <MatchCard key={game.id} match={game.soccerMatch} />
                        ) : game.type === 'basketball' && game.basketballGame ? (
                          <BasketballGameCard key={game.id} game={game.basketballGame} />
                        ) : null
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
