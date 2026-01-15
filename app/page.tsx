'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { useTheme } from '@/lib/theme';

interface Match {
  id: number;
  league: string;
  leagueCode?: string;
  leagueLogo?: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homeLogo: string;
  awayLogo: string;
  status: string;
  time: string;
  timestamp?: number;
}

interface LeagueGroup {
  name: string;
  code: string;
  logo: string | null;
  flag: string;
  matches: Match[];
}

// Fallback flags for leagues
const LEAGUE_FLAGS: Record<string, string> = {
  'PD': '🇪🇸',      // La Liga - Spain
  'PL': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',      // Premier League - England
  'SA': '🇮🇹',      // Serie A - Italy
  'BL1': '🇩🇪',     // Bundesliga - Germany
  'FL1': '🇫🇷',     // Ligue 1 - France
};

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const { theme } = useTheme();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Format date for API
  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStr = formatDateForApi(today);
      const leagueIds = ['laliga', 'premier', 'seriea', 'bundesliga', 'ligue1'];
      const allMatches: Match[] = [];

      // Fetch sequentially to avoid rate limits
      for (const league of leagueIds) {
        try {
          const res = await fetch(`/api/fixtures?league=${league}&date=${todayStr}`);
          const data = await res.json();
          if (data.matches) {
            allMatches.push(...data.matches);
          }
        } catch {
          // Continue with other leagues
        }
      }

      // Sort: Live matches first, then by time
      allMatches.sort((a, b) => {
        const aIsLive = ['LIVE', '1H', '2H', 'HT'].includes(a.status);
        const bIsLive = ['LIVE', '1H', '2H', 'HT'].includes(b.status);
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      setMatches(allMatches);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Refresh every 60 seconds for live updates
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // Toggle league collapse
  const toggleLeague = (leagueName: string) => {
    setCollapsedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueName)) {
        newSet.delete(leagueName);
      } else {
        newSet.add(leagueName);
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

  // Group other matches by league with metadata
  const leagueGroups: LeagueGroup[] = Object.values(
    otherMatches.reduce((acc, match) => {
      const leagueName = match.league;
      if (!acc[leagueName]) {
        acc[leagueName] = {
          name: leagueName,
          code: match.leagueCode || '',
          logo: match.leagueLogo || null,
          flag: LEAGUE_FLAGS[match.leagueCode || ''] || '⚽',
          matches: [],
        };
      }
      acc[leagueName].matches.push(match);
      return acc;
    }, {} as Record<string, LeagueGroup>)
  );

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
            <h1 className="text-xl font-semibold">Today's Matches</h1>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              {dateStr}
            </p>
          </div>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading && matches.length === 0 ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading today's matches...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.red }}>
              {error}
            </p>
            <button
              onClick={fetchMatches}
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

                {/* Live Matches */}
                {!liveCollapsed && (
                  <div className="flex flex-col gap-3 p-3">
                    {liveMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* League Sections */}
            {leagueGroups.map((league) => {
              const isCollapsed = collapsedLeagues.has(league.name);
              return (
                <section
                  key={league.name}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  {/* League Header - Collapsible */}
                  <button
                    onClick={() => toggleLeague(league.name)}
                    className="w-full flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${theme.border}` }}
                  >
                    <div className="flex items-center gap-3">
                      {/* League Logo or Flag */}
                      {league.logo ? (
                        <img
                          src={league.logo}
                          alt={league.name}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <span className="text-xl">{league.flag}</span>
                      )}
                      <h2 className="text-sm font-medium">
                        {league.name}
                      </h2>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs"
                        style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                      >
                        {league.matches.length}
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                    ) : (
                      <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                    )}
                  </button>

                  {/* League Matches */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-3 p-3">
                      {league.matches.map((match) => (
                        <MatchCard key={match.id} match={match} />
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
