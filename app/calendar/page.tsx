'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { useTheme } from '@/lib/theme';
import { NATIONS, getNationsForMatch, type Nation } from '@/lib/nations';
import { useFixtures } from '@/lib/use-fixtures';

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
  date?: string;
  fullDate?: string;
  timestamp?: number;
}

interface NationGroup {
  nation: Nation;
  matches: Match[];
}

// Nation filter options
const nationFilters = [
  { id: 'all', name: 'All Nations' },
  ...NATIONS.map(n => ({ id: n.id, name: n.name, flag: n.flag }))
];

// 2025-26 season dates (using local time constructor)
const SEASON_START = new Date(2025, 7, 1);  // Aug 1, 2025
const SEASON_END = new Date(2026, 4, 31);    // May 31, 2026

export default function CalendarPage() {
  const { theme } = useTheme();
  const router = useRouter();
  // Initialize with null, will be set from localStorage or default to today
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedNation, setSelectedNation] = useState('all');
  const [collapsedNations, setCollapsedNations] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [lastViewedMatch, setLastViewedMatch] = useState<string | null>(null);

  // Use SWR hook for data fetching
  const { matches: allMatches, isLoading, isError } = useFixtures(selectedDate || undefined);

  // Filter matches by selected nation
  const matches = selectedNation === 'all'
    ? allMatches
    : allMatches.filter((match) => {
        const matchNations = getNationsForMatch(
          match.leagueCode || '',
          match.homeId || 0,
          match.awayId || 0
        );
        return matchNations.includes(selectedNation);
      });

  // Load saved date and last match from localStorage on mount
  useEffect(() => {
    const savedDate = localStorage.getItem('calendar_selectedDate');
    const savedNation = localStorage.getItem('calendar_selectedNation');
    const savedMatch = localStorage.getItem('lastViewedMatch');

    if (savedDate) {
      const parsed = new Date(savedDate);
      // Check if date is valid and within season bounds
      if (!isNaN(parsed.getTime()) && parsed >= SEASON_START && parsed <= SEASON_END) {
        setSelectedDate(parsed);
      } else {
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(new Date());
    }

    if (savedNation) {
      setSelectedNation(savedNation);
    }

    if (savedMatch) {
      setLastViewedMatch(savedMatch);
    }

    setInitialized(true);
  }, []);

  // Save date to localStorage whenever it changes
  useEffect(() => {
    if (initialized && selectedDate) {
      localStorage.setItem('calendar_selectedDate', selectedDate.toISOString());
    }
  }, [selectedDate, initialized]);

  // Save nation to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('calendar_selectedNation', selectedNation);
    }
  }, [selectedNation, initialized]);

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

  // Group matches by nation
  const nationGroups: NationGroup[] = NATIONS.map((nation) => {
    const nationMatches: Match[] = [];
    const seenMatchIds = new Set<number>();

    for (const match of matches) {
      if (seenMatchIds.has(match.id)) continue;

      const matchNations = getNationsForMatch(
        match.leagueCode || '',
        match.homeId || 0,
        match.awayId || 0
      );

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

  // Generate week days around selected date
  const getWeekDays = () => {
    if (!selectedDate) return [];
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    // Keep within season bounds
    if (newDate >= SEASON_START && newDate <= SEASON_END) {
      setSelectedDate(newDate);
    }
  };

  // Quick navigation months for 2025-26 season
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
    if (!selectedDate) return false;
    return monthDate.getMonth() === selectedDate.getMonth() &&
           monthDate.getFullYear() === selectedDate.getFullYear();
  };

  // Filter nation groups if a specific nation is selected
  const displayedNationGroups = selectedNation === 'all'
    ? nationGroups
    : nationGroups.filter(g => g.nation.id === selectedNation);

  // Show loading while initializing from localStorage
  if (!selectedDate) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center transition-theme"
        style={{ backgroundColor: theme.bg }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Continue watching banner */}
      {lastViewedMatch && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: theme.accent }}
        >
          <button
            onClick={() => router.push(`/match/${lastViewedMatch}`)}
            className="flex items-center gap-2 flex-1"
          >
            <span className="text-sm font-medium text-white">Continue watching match</span>
            <ChevronRight size={18} className="text-white" />
          </button>
          <button
            onClick={() => {
              setLastViewedMatch(null);
              localStorage.removeItem('lastViewedMatch');
            }}
            className="text-white/70 text-xs ml-4 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

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

      {/* Nation Filter */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
      >
        {nationFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedNation(filter.id)}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: selectedNation === filter.id ? theme.accent : theme.bgSecondary,
              color: selectedNation === filter.id ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedNation === filter.id ? theme.accent : theme.border}`,
            }}
          >
            {'flag' in filter && <span>{filter.flag}</span>}
            {filter.name}
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

        {isLoading && matches.length === 0 ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading fixtures...
            </p>
          </div>
        ) : isError ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm font-medium" style={{ color: theme.red }}>
              Failed to load fixtures
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              Please try again in a moment.
            </p>
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
        ) : displayedNationGroups.length > 0 ? (
          // Grouped view by nation
          <div className="flex flex-col gap-4">
            {displayedNationGroups.map(({ nation, matches: nationMatches }) => {
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

                  {/* Nation Matches */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-3 p-3">
                      {nationMatches.map((match) => (
                        <MatchCard key={`${nation.id}-${match.id}`} match={match} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          // Fallback: simple list if no nation groups
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
