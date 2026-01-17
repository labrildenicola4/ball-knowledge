'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { useTheme } from '@/lib/theme';

// Fallback flags for leagues
const LEAGUE_FLAGS: Record<string, string> = {
  'PD': '🇪🇸',      // La Liga - Spain
  'PL': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',      // Premier League - England
  'SA': '🇮🇹',      // Serie A - Italy
  'BL1': '🇩🇪',     // Bundesliga - Germany
  'FL1': '🇫🇷',     // Ligue 1 - France
};

interface LeagueGroup {
  name: string;
  code: string;
  logo: string | null;
  flag: string;
  matches: Match[];
}

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
  date: string;
  fullDate?: string;
}

const leagues = [
  { id: 'all', name: 'All Leagues' },
  { id: 'laliga', name: 'LaLiga' },
  { id: 'premier', name: 'Premier League' },
  { id: 'seriea', name: 'Serie A' },
  { id: 'bundesliga', name: 'Bundesliga' },
  { id: 'ligue1', name: 'Ligue 1' },
];

// 2025-26 season dates (using local time constructor)
const SEASON_START = new Date(2025, 7, 1);  // Aug 1, 2025
const SEASON_END = new Date(2026, 4, 31);    // May 31, 2026

export default function CalendarPage() {
  const { theme } = useTheme();
  // Start with today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());

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

  // Group matches by league
  const leagueGroups: LeagueGroup[] = Object.values(
    matches.reduce((acc, match) => {
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

  // Generate week days around selected date
  const getWeekDays = () => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDateForApi = (date: Date) => {
    // Format as YYYY-MM-DD in local time (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  // Fetch fixtures for the selected date range
  useEffect(() => {
    async function fetchFixtures() {
      setLoading(true);
      setRateLimited(false);
      try {
        const dateStr = formatDateForApi(selectedDate);

        if (selectedLeague === 'all') {
          // Fetch from all leagues sequentially to avoid rate limits
          const leagueIds = ['laliga', 'premier', 'seriea', 'bundesliga', 'ligue1'];
          const allMatches: Match[] = [];
          let wasRateLimited = false;

          for (const league of leagueIds) {
            try {
              const res = await fetch(`/api/fixtures?league=${league}&date=${dateStr}`);
              const data = await res.json();
              if (res.status === 429) {
                wasRateLimited = true;
              }
              if (data.matches) {
                allMatches.push(...data.matches);
              }
            } catch {
              // Continue with other leagues
            }
          }

          if (wasRateLimited && allMatches.length === 0) {
            setRateLimited(true);
          }

          // Sort by league then time
          allMatches.sort((a, b) => {
            if (a.league !== b.league) return a.league.localeCompare(b.league);
            return a.time.localeCompare(b.time);
          });
          setMatches(allMatches);
        } else {
          const res = await fetch(`/api/fixtures?league=${selectedLeague}&date=${dateStr}`);
          const data = await res.json();
          if (res.status === 429) {
            setRateLimited(true);
            setMatches([]);
          } else {
            setMatches(data.matches || []);
          }
        }
      } catch (err) {
        console.error('Error fetching fixtures:', err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFixtures();
  }, [selectedDate, selectedLeague]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    // Keep within season bounds
    if (newDate >= SEASON_START && newDate <= SEASON_END) {
      setSelectedDate(newDate);
    }
  };

  const jumpToDate = (monthOffset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + monthOffset);
    if (newDate >= SEASON_START && newDate <= SEASON_END) {
      setSelectedDate(newDate);
    }
  };

  // Quick navigation months for 2025-26 season
  // Using Date constructor with year, month (0-indexed), day to ensure local time
  const seasonMonths = [
    { label: 'Aug', date: new Date(2025, 7, 15) },
    { label: 'Sep', date: new Date(2025, 8, 15) },
    { label: 'Oct', date: new Date(2025, 9, 15) },
    { label: 'Nov', date: new Date(2025, 10, 15) },
    { label: 'Dec', date: new Date(2025, 11, 15) },
    { label: 'Jan', date: new Date(2026, 0, 15) },
    { label: 'Feb', date: new Date(2026, 1, 15) },
    { label: 'Mar', date: new Date(2026, 2, 15) },
    { label: 'Apr', date: new Date(2026, 3, 15) },
    { label: 'May', date: new Date(2026, 4, 15) },
  ];

  const isCurrentMonth = (monthDate: Date) => {
    return monthDate.getMonth() === selectedDate.getMonth() &&
           monthDate.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Season Banner */}
      <div
        className="px-4 py-2 text-center text-sm"
        style={{ backgroundColor: theme.bgSecondary, color: theme.textSecondary }}
      >
        <CalendarIcon size={14} className="inline mr-1" />
        2025-26 Season
      </div>

      {/* Month Quick Nav */}
      <div
        className="flex gap-1 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
      >
        {seasonMonths.map((month) => (
          <button
            key={month.label}
            onClick={() => setSelectedDate(month.date)}
            className="rounded-lg px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: isCurrentMonth(month.date) ? theme.accent : theme.bgTertiary,
              color: isCurrentMonth(month.date) ? '#fff' : theme.textSecondary,
            }}
          >
            {month.label}
          </button>
        ))}
      </div>

      {/* Date Selector */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {/* Week Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-medium" style={{ color: theme.text }}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateWeek('next')}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Week Days */}
        <div className="flex justify-between">
          {getWeekDays().map((date, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-2"
              style={{
                backgroundColor: isSameDay(date, selectedDate) ? theme.accent : 'transparent',
                minWidth: '48px',
              }}
            >
              <span
                className="text-xs uppercase font-medium"
                style={{
                  color: isSameDay(date, selectedDate) ? '#fff' : theme.textSecondary,
                }}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span
                className="text-base font-medium"
                style={{
                  color: isSameDay(date, selectedDate) ? '#fff' : theme.text,
                }}
              >
                {date.getDate()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* League Filter */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
      >
        {leagues.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: selectedLeague === league.id ? theme.accent : theme.bgSecondary,
              color: selectedLeague === league.id ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedLeague === league.id ? theme.accent : theme.border}`,
            }}
          >
            {league.name}
          </button>
        ))}
      </div>

      {/* Fixtures */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textSecondary }}
          >
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <span className="text-sm" style={{ color: theme.textSecondary }}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading fixtures...
            </p>
          </div>
        ) : rateLimited ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm font-medium" style={{ color: theme.accent }}>
              API rate limit reached
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              The free tier allows 10 requests/minute. Please wait a moment and try again.
            </p>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate))}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Retry
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No fixtures on this date
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              Try navigating to a different day
            </p>
          </div>
        ) : selectedLeague === 'all' && leagueGroups.length > 1 ? (
          // Grouped view for "All Leagues"
          <div className="flex flex-col gap-4">
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
                      <h2 className="text-sm font-medium" style={{ color: theme.text }}>
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
        ) : (
          // Simple list for single league
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
