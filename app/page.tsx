'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { useTheme } from '@/lib/theme';
import { NATIONS, getNationsForMatch, type Nation } from '@/lib/nations';
import { useLiveFixtures } from '@/lib/use-fixtures';

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

interface NationGroup {
  nation: Nation;
  matches: Match[];
}

export default function HomePage() {
  const [collapsedNations, setCollapsedNations] = useState<Set<string>>(new Set());
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const { theme } = useTheme();

  // Use SWR hook for data fetching with caching
  const { matches, isLoading, isRefreshing, isError, refresh } = useLiveFixtures();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Toggle nation collapse
  const toggleNation = (nationId: string) => {
    setCollapsedNations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nationId)) {
        newSet.delete(nationId);
      } else {
        newSet.add(nationId);
      }
      return newSet;
    });
  };

  // Separate live and other matches
  const liveMatches = matches.filter((m) =>
    ['LIVE', '1H', '2H', 'HT'].includes(m.status)
  );
  const otherMatches = matches.filter(
    (m) => !['LIVE', '1H', '2H', 'HT'].includes(m.status)
  );

  // Group matches by nation (memoized to avoid recalculating on every render)
  const nationGroups = useMemo<NationGroup[]>(() => {
    return NATIONS.map((nation) => {
      const nationMatches: Match[] = [];
      const seenMatchIds = new Set<number>();

      for (const match of otherMatches) {
        // Skip if we've already added this match to this nation
        if (seenMatchIds.has(match.id)) continue;

        // Get nations for this match
        const matchNations = getNationsForMatch(
          match.leagueCode || '',
          match.homeId || 0,
          match.awayId || 0
        );

        // If this match belongs to this nation, add it
        if (matchNations.includes(nation.id)) {
          nationMatches.push(match);
          seenMatchIds.add(match.id);
        }
      }

      return {
        nation,
        matches: nationMatches,
      };
    }).filter((group) => group.matches.length > 0);
  }, [otherMatches]);

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
            <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>Today's Matches</h1>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {dateStr}
            </p>
          </div>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {isRefreshing && (
          <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
            Updating...
          </p>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && matches.length === 0 ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading today's matches...
            </p>
          </div>
        ) : isError ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.red }}>
              Failed to load matches
            </p>
            <button
              onClick={() => refresh()}
              className="mt-3 rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Try Again
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No matches scheduled for today
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              Check the Calendar for upcoming fixtures
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Live Matches Section */}
            {liveMatches.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                {/* Live Header - Collapsible */}
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
                      {liveMatches.length}
                    </span>
                  </div>
                  {liveCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>

                {/* Live Matches - grid on desktop */}
                {!liveCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {liveMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Nation Sections */}
            {nationGroups.map(({ nation, matches: nationMatches }) => {
              const isCollapsed = collapsedNations.has(nation.id);
              return (
                <section
                  key={nation.id}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  {/* Nation Header - Collapsible */}
                  <button
                    onClick={() => toggleNation(nation.id)}
                    className="w-full flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${theme.border}` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{nation.flag}</span>
                      <h2 className="text-base font-medium" style={{ color: theme.text }}>
                        {nation.name}
                      </h2>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs"
                        style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                      >
                        {nationMatches.length}
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                    ) : (
                      <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                    )}
                  </button>

                  {/* Nation Matches - grid on desktop */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                      {nationMatches.map((match) => (
                        <MatchCard key={`${nation.id}-${match.id}`} match={match} />
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
