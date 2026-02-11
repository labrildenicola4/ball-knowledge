'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { BasketballGameCard } from '@/components/basketball/BasketballGameCard';
import { NBAGameCard } from '@/components/nba/NBAGameCard';
import { MLBGameCard } from '@/components/mlb/MLBGameCard';
import { useTheme } from '@/lib/theme';
import { shouldUseWhiteFilterByCode } from '@/lib/constants/dark-mode-logos';
import { NATIONS, getNationsForMatch, type Nation } from '@/lib/nations';
import { useFixtures } from '@/lib/use-fixtures';
import { useFavorites } from '@/lib/use-favorites';
import { BasketballGame } from '@/lib/types/basketball';
import { MLBGame } from '@/lib/types/mlb';
import { NFLGame } from '@/lib/types/nfl';
import { NFLGameCard } from '@/components/nfl/NFLGameCard';
import { SOCCER_ICON, BASKETBALL_ICON, FOOTBALL_ICON } from '@/lib/sport-icons';

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

// Nation filter options - only show nations with domestic leagues
const MAIN_NATIONS = NATIONS.filter(n => n.domesticLeagues.length > 0);
const nationFilters = [
  { id: 'all', name: 'All Nations' },
  ...MAIN_NATIONS.map(n => ({ id: n.id, name: n.name, flag: n.flag }))
];

// International tournaments configuration
const INTERNATIONAL_TOURNAMENTS: Record<string, { name: string; shortName: string }> = {
  'CL': { name: 'Champions League', shortName: 'UCL' },
  'EL': { name: 'Europa League', shortName: 'UEL' },
  'CLI': { name: 'Copa Libertadores', shortName: 'Lib' },
};

// Available years for dropdown
const AVAILABLE_YEARS = [2025, 2026];

// Format date as YYYY-MM-DD in Eastern Time (matching the rest of the app)
function formatDateET(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default function CalendarPage() {
  const triggerHaptic = (duration: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const { theme, darkMode } = useTheme();
  const { favorites, getFavoritesByType, isLoggedIn } = useFavorites();
  const router = useRouter();
  // Initialize with null, will be set from localStorage or default to today
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedNation, setSelectedNation] = useState('all');
  const [collapsedNations, setCollapsedNations] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [lastViewedMatch, setLastViewedMatch] = useState<string | null>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>('all');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Dynamic year bounds based on selected year
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31);

  // Use SWR hook for data fetching (soccer)
  const { matches: allMatches, isLoading: soccerLoading, isError: soccerError } = useFixtures(selectedDate || undefined);

  // Fetch basketball games when CBB is selected
  const [basketballGames, setBasketballGames] = useState<BasketballGame[]>([]);
  const [basketballLoading, setBasketballLoading] = useState(false);
  const [basketballError, setBasketballError] = useState(false);

  // Fetch NBA games when NBA is selected
  const [nbaGames, setNbaGames] = useState<BasketballGame[]>([]);
  const [nbaLoading, setNbaLoading] = useState(false);
  const [nbaError, setNbaError] = useState(false);

  // Fetch MLB games when MLB is selected
  const [mlbGames, setMlbGames] = useState<MLBGame[]>([]);
  const [mlbLoading, setMlbLoading] = useState(false);
  const [mlbError, setMlbError] = useState(false);

  // Fetch NFL games when NFL is selected
  const [nflGames, setNflGames] = useState<NFLGame[]>([]);
  const [nflLoading, setNflLoading] = useState(false);
  const [nflError, setNflError] = useState(false);

  useEffect(() => {
    if ((selectedSport === 'cbb' || selectedSport === 'all' || selectedSport === 'myteams') && selectedDate) {
      setBasketballLoading(true);
      setBasketballError(false);
      const dateStr = formatDateET(selectedDate);
      fetch(`/api/basketball/games?date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setBasketballGames(data.games || []);
          setBasketballLoading(false);
        })
        .catch(() => {
          setBasketballError(true);
          setBasketballLoading(false);
        });
    }
  }, [selectedSport, selectedDate]);

  useEffect(() => {
    if ((selectedSport === 'nba' || selectedSport === 'all' || selectedSport === 'myteams') && selectedDate) {
      setNbaLoading(true);
      setNbaError(false);
      const dateStr = formatDateET(selectedDate);
      fetch(`/api/nba/games?date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setNbaGames(data.games || []);
          setNbaLoading(false);
        })
        .catch(() => {
          setNbaError(true);
          setNbaLoading(false);
        });
    }
  }, [selectedSport, selectedDate]);

  useEffect(() => {
    if ((selectedSport === 'mlb' || selectedSport === 'all' || selectedSport === 'myteams') && selectedDate) {
      setMlbLoading(true);
      setMlbError(false);
      const dateStr = formatDateET(selectedDate);
      fetch(`/api/mlb/games?date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setMlbGames(data.games || []);
          setMlbLoading(false);
        })
        .catch(() => {
          setMlbError(true);
          setMlbLoading(false);
        });
    }
  }, [selectedSport, selectedDate]);

  useEffect(() => {
    if ((selectedSport === 'nfl' || selectedSport === 'all' || selectedSport === 'myteams') && selectedDate) {
      setNflLoading(true);
      setNflError(false);
      const dateStr = formatDateET(selectedDate);
      fetch(`/api/nfl/games?date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setNflGames(data.games || []);
          setNflLoading(false);
        })
        .catch(() => {
          setNflError(true);
          setNflLoading(false);
        });
    }
  }, [selectedSport, selectedDate]);

  // Determine loading/error states based on selected sport
  const isLoading = selectedSport === 'all' || selectedSport === 'myteams'
    ? soccerLoading || basketballLoading || nbaLoading || mlbLoading || nflLoading
    : selectedSport === 'cbb'
      ? basketballLoading
      : selectedSport === 'nba'
        ? nbaLoading
        : selectedSport === 'mlb'
          ? mlbLoading
          : selectedSport === 'nfl'
            ? nflLoading
            : soccerLoading;
  const isError = selectedSport === 'cbb' ? basketballError : selectedSport === 'nba' ? nbaError : selectedSport === 'mlb' ? mlbError : selectedSport === 'nfl' ? nflError : soccerError;

  // Compute which international tournaments have matches today (with logos)
  const activeTournaments = Object.keys(INTERNATIONAL_TOURNAMENTS)
    .map(code => {
      const match = allMatches.find(m => m.leagueCode === code);
      return match ? { code, logo: match.leagueLogo } : null;
    })
    .filter((t): t is { code: string; logo: string } => t !== null);

  // Filter matches by selected tournament or nation
  const matches = selectedTournament
    ? allMatches.filter(match => match.leagueCode === selectedTournament)
    : selectedNation === 'all'
      ? allMatches
      : allMatches.filter((match) => {
          const matchNations = getNationsForMatch(
            match.leagueCode || '',
            match.homeId || 0,
            match.awayId || 0
          );
          return matchNations.includes(selectedNation);
        });

  // Filter games for "My Teams" - memoized for performance
  const myTeamsMatches = useMemo(() => {
    const soccerFavs = getFavoritesByType('team').map(String);
    return matches.filter(match => {
      const homeId = String(match.homeId || '');
      const awayId = String(match.awayId || '');
      return soccerFavs.includes(homeId) || soccerFavs.includes(awayId);
    });
  }, [matches, getFavoritesByType]);

  const myTeamsBasketball = useMemo(() => {
    const ncaabFavs = getFavoritesByType('ncaab_team').map(String);
    return basketballGames.filter(game =>
      ncaabFavs.includes(game.homeTeam.id) || ncaabFavs.includes(game.awayTeam.id)
    );
  }, [basketballGames, getFavoritesByType]);

  const myTeamsNba = useMemo(() => {
    const nbaFavs = getFavoritesByType('nba_team').map(String);
    return nbaGames.filter(game =>
      nbaFavs.includes(game.homeTeam.id) || nbaFavs.includes(game.awayTeam.id)
    );
  }, [nbaGames, getFavoritesByType]);

  const myTeamsMlb = useMemo(() => {
    const mlbFavs = getFavoritesByType('mlb_team').map(String);
    return mlbGames.filter(game =>
      mlbFavs.includes(game.homeTeam.id) || mlbFavs.includes(game.awayTeam.id)
    );
  }, [mlbGames, getFavoritesByType]);

  const myTeamsNfl = useMemo(() => {
    const nflFavs = getFavoritesByType('nfl_team').map(String);
    return nflGames.filter(game =>
      nflFavs.includes(game.homeTeam.id) || nflFavs.includes(game.awayTeam.id)
    );
  }, [nflGames, getFavoritesByType]);

  const myTeamsTotal = myTeamsMatches.length + myTeamsBasketball.length + myTeamsNba.length + myTeamsMlb.length + myTeamsNfl.length;

  // Load saved date and last match from localStorage on mount
  useEffect(() => {
    const savedDate = localStorage.getItem('calendar_selectedDate');
    const savedNation = localStorage.getItem('calendar_selectedNation');
    const savedMatch = localStorage.getItem('lastViewedMatch');

    if (savedDate) {
      const parsed = new Date(savedDate);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setSelectedYear(parsed.getFullYear());
      } else {
        setSelectedDate(new Date());
        setSelectedYear(new Date().getFullYear());
      }
    } else {
      setSelectedDate(new Date());
      setSelectedYear(new Date().getFullYear());
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

  // Ref for the date dial scroll container
  const dialRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate all days across available years (for continuous scrolling)
  const getAllDays = useCallback(() => {
    const days: Date[] = [];
    const startYear = Math.min(...AVAILABLE_YEARS);
    const endYear = Math.max(...AVAILABLE_YEARS);
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, []);

  const allDays = getAllDays();

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  // Scroll to selected date
  const scrollToDate = useCallback((date: Date, smooth = true) => {
    if (!dialRef.current) return;
    const dayIndex = allDays.findIndex(d => isSameDay(d, date));
    if (dayIndex === -1) return;

    const itemWidth = 56; // Width of each day item
    // With the spacer at start (50% - 28px), when scrollLeft = N * itemWidth,
    // item N's center aligns with the viewport center
    const scrollPosition = dayIndex * itemWidth;

    isScrollingRef.current = true;
    dialRef.current.scrollTo({
      left: scrollPosition,
      behavior: smooth ? 'smooth' : 'auto'
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, smooth ? 300 : 50);
  }, [allDays]);

  // Handle scroll to detect centered date
  const handleDialScroll = useCallback(() => {
    if (!dialRef.current || isScrollingRef.current) return;

    // Debounce the scroll handling
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!dialRef.current) return;

      const scrollLeft = dialRef.current.scrollLeft;
      const itemWidth = 56;
      // Simple calculation: scrollLeft / itemWidth gives us the centered index
      const centeredIndex = Math.round(scrollLeft / itemWidth);

      if (centeredIndex >= 0 && centeredIndex < allDays.length) {
        const centeredDate = allDays[centeredIndex];
        if (!isSameDay(centeredDate, selectedDate!)) {
          setSelectedDate(centeredDate);
          // Update year if needed
          if (centeredDate.getFullYear() !== selectedYear) {
            setSelectedYear(centeredDate.getFullYear());
          }
        }
      }
    }, 100);
  }, [allDays, selectedDate, selectedYear]);

  // Scroll to selected date on mount and when date changes externally
  useEffect(() => {
    if (selectedDate && initialized) {
      scrollToDate(selectedDate, false);
    }
  }, [initialized]); // Only on init

  // Scroll when month quick nav is clicked
  useEffect(() => {
    if (selectedDate && initialized && !isScrollingRef.current) {
      scrollToDate(selectedDate, true);
    }
  }, [selectedDate?.getMonth()]);

  // Quick navigation months for selected year
  const calendarMonths = [
    { label: 'Jan', date: new Date(selectedYear, 0, 15) },
    { label: 'Feb', date: new Date(selectedYear, 1, 15) },
    { label: 'Mar', date: new Date(selectedYear, 2, 15) },
    { label: 'Apr', date: new Date(selectedYear, 3, 15) },
    { label: 'May', date: new Date(selectedYear, 4, 15) },
    { label: 'Jun', date: new Date(selectedYear, 5, 15) },
    { label: 'Jul', date: new Date(selectedYear, 6, 15) },
    { label: 'Aug', date: new Date(selectedYear, 7, 15) },
    { label: 'Sep', date: new Date(selectedYear, 8, 15) },
    { label: 'Oct', date: new Date(selectedYear, 9, 15) },
    { label: 'Nov', date: new Date(selectedYear, 10, 15) },
    { label: 'Dec', date: new Date(selectedYear, 11, 15) },
  ];

  // Handle year change
  const handleYearChange = (year: number) => {
    triggerHaptic(15);
    setSelectedYear(year);
    setYearDropdownOpen(false);
    // Update selected date to same month/day in new year
    if (selectedDate) {
      const newDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate());
      setSelectedDate(newDate);
    }
  };

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
        style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
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
      style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
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
            className="tap-highlight flex items-center gap-2 flex-1"
          >
            <span className="text-sm font-medium text-white">Continue watching match</span>
            <ChevronRight size={18} className="text-white" />
          </button>
          <button
            onClick={() => {
              setLastViewedMatch(null);
              localStorage.removeItem('lastViewedMatch');
            }}
            className="tap-highlight text-white/70 text-xs ml-4 px-2 py-2.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Year Selector */}
      <div
        className={`px-4 py-2 flex justify-center ${darkMode ? 'glass-pill' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
      >
        <div className="relative">
          <button
            onClick={() => { triggerHaptic(15); setYearDropdownOpen(!yearDropdownOpen); }}
            className={`tap-highlight flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${darkMode ? 'glass-pill' : ''}`}
            style={darkMode ? { color: theme.text } : { backgroundColor: theme.bgTertiary, color: theme.text }}
          >
            <CalendarIcon size={14} />
            {selectedYear}
            <ChevronDown size={14} className={`transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {yearDropdownOpen && (
            <div
              className={`absolute top-full mt-1 left-0 right-0 rounded-lg overflow-hidden shadow-lg z-10 ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}` }}
            >
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className="tap-highlight w-full px-3 py-2.5 text-sm text-left hover:opacity-80"
                  style={{
                    backgroundColor: year === selectedYear ? theme.accent : 'transparent',
                    color: year === selectedYear ? '#fff' : theme.text,
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Month Quick Nav */}
      <div
        className="grid grid-cols-6 md:grid-cols-12 gap-1 px-2 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        {calendarMonths.map((month) => (
          <button
            key={month.label}
            onClick={() => { triggerHaptic(); setSelectedDate(month.date); }}
            className={`tap-highlight rounded-lg py-2.5 text-xs font-medium text-center ${darkMode ? (isCurrentMonth(month.date) ? 'glass-pill-active' : 'glass-pill') : ''}`}
            style={{
              ...(darkMode ? {} : { backgroundColor: isCurrentMonth(month.date) ? theme.accent : theme.bgTertiary }),
              color: isCurrentMonth(month.date) ? '#fff' : theme.textSecondary,
            }}
          >
            {month.label}
          </button>
        ))}
      </div>

      {/* Date Dial */}
      <div style={{ borderBottom: `1px solid ${theme.border}` }}>
        {/* Month/Year Display */}
        <div className="py-2 text-center">
          <h2 className="text-base font-medium" style={{ color: theme.text }}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* Scrollable Day Dial */}
        <div className="relative">
          {/* Center indicator - behind content */}
          <div
            className={`absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-14 rounded-lg pointer-events-none ${darkMode ? 'glass-pill-active' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.accent }}
          />

          {/* Scrollable container */}
          <div
            ref={dialRef}
            onScroll={handleDialScroll}
            className="flex overflow-x-auto py-3 px-4 relative z-10"
            style={{
              scrollbarWidth: 'none',
              scrollSnapType: 'x mandatory',
            }}
          >
            {/* Spacer for centering first item */}
            <div className="flex-shrink-0" style={{ width: 'calc(50% - 28px)' }} />

            {allDays.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={index}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDate(date);
                    if (date.getFullYear() !== selectedYear) {
                      setSelectedYear(date.getFullYear());
                    }
                    scrollToDate(date, true);
                  }}
                  className="tap-highlight flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-14 py-2"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <span
                    className="text-[10px] uppercase font-medium"
                    style={{
                      color: isSelected ? '#fff' : theme.textSecondary,
                    }}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span
                    className="text-lg font-semibold"
                    style={{
                      color: isSelected ? '#fff' : theme.text,
                    }}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && !isSelected && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  )}
                </button>
              );
            })}

            {/* Spacer for centering last item */}
            <div className="flex-shrink-0" style={{ width: 'calc(50% - 28px)' }} />
          </div>
        </div>
      </div>

      {/* Sport Pills */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', borderBottom: selectedSport === 'all' || selectedSport === 'myteams' || !selectedSport ? `1px solid ${theme.border}` : 'none' }}
      >
        <button
          onClick={() => { triggerHaptic(); setSelectedSport('all'); }}
          className={`tap-highlight whitespace-nowrap rounded-full px-3 md:px-4 py-2 text-sm font-medium flex items-center gap-2 ${darkMode ? (selectedSport === 'all' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'all' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'all' ? theme.accent : theme.border}` }),
            color: selectedSport === 'all' ? '#fff' : theme.textSecondary,
          }}
        >
          <span className="hidden md:inline">All Sports</span>
          <span className="md:hidden">All</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport('myteams'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'myteams' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'myteams' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'myteams' ? theme.accent : theme.border}` }),
            color: selectedSport === 'myteams' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <Star size={16} fill={selectedSport === 'myteams' ? '#fff' : '#D4AF37'} color={selectedSport === 'myteams' ? '#fff' : '#D4AF37'} />
          <span className="hidden md:inline">My Teams</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'soccer' ? null : 'soccer'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'soccer' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'soccer' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'soccer' ? theme.accent : theme.border}` }),
            color: selectedSport === 'soccer' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src={SOCCER_ICON} alt="Soccer" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">Soccer</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'cbb' ? null : 'cbb'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'cbb' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'cbb' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'cbb' ? theme.accent : theme.border}` }),
            color: selectedSport === 'cbb' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src={BASKETBALL_ICON} alt="CBB" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">CBB</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'mlb' ? null : 'mlb'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'mlb' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'mlb' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'mlb' ? theme.accent : theme.border}` }),
            color: selectedSport === 'mlb' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src="https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png" alt="MLB" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">MLB</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'nba' ? null : 'nba'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'nba' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'nba' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'nba' ? theme.accent : theme.border}` }),
            color: selectedSport === 'nba' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">NBA</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'nfl' ? null : 'nfl'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'nfl' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'nfl' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'nfl' ? theme.accent : theme.border}` }),
            color: selectedSport === 'nfl' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="NFL" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">NFL</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'nhl' ? null : 'nhl'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'nhl' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'nhl' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'nhl' ? theme.accent : theme.border}` }),
            color: selectedSport === 'nhl' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png" alt="NHL" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">NHL</span>
        </button>
        <button
          onClick={() => { triggerHaptic(); setSelectedSport(selectedSport === 'cfb' ? null : 'cfb'); }}
          className={`tap-highlight rounded-full px-2.5 md:px-4 py-2 text-sm font-medium flex items-center justify-center md:gap-2 ${darkMode ? (selectedSport === 'cfb' ? 'glass-pill-active' : 'glass-pill') : ''}`}
          style={{
            ...(darkMode ? {} : { backgroundColor: selectedSport === 'cfb' ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedSport === 'cfb' ? theme.accent : theme.border}` }),
            color: selectedSport === 'cfb' ? '#fff' : theme.textSecondary,
            minWidth: '40px',
          }}
        >
          <img src={FOOTBALL_ICON} alt="CFB" className="h-5 w-5 object-contain" />
          <span className="hidden md:inline">CFB</span>
        </button>
      </div>

      {/* Soccer Filters - Shows when Soccer is selected */}
      {selectedSport === 'soccer' && (
        <div
          className="flex gap-1 md:gap-2 overflow-x-auto px-2 md:px-4 pb-3"
          style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
        >
          {/* All filter first */}
          <button
            onClick={() => {
              setSelectedNation('all');
              setSelectedTournament(null);
            }}
            className={`tap-highlight whitespace-nowrap rounded-full px-3 md:px-4 py-2 text-sm font-medium flex items-center gap-1 md:gap-2 ${darkMode ? (selectedNation === 'all' && !selectedTournament ? 'glass-pill-active' : 'glass-pill') : ''}`}
            style={{
              ...(darkMode ? {} : { backgroundColor: selectedNation === 'all' && !selectedTournament ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedNation === 'all' && !selectedTournament ? theme.accent : theme.border}` }),
              color: selectedNation === 'all' && !selectedTournament ? '#fff' : theme.textSecondary,
            }}
          >
            <span>All</span>
          </button>

          {/* Dynamic tournament pills - only show if matches exist today */}
          {activeTournaments.map(({ code, logo }) => {
            const tournament = INTERNATIONAL_TOURNAMENTS[code];
            return (
              <button
                key={code}
                onClick={() => {
                  setSelectedTournament(selectedTournament === code ? null : code);
                  if (selectedTournament !== code) setSelectedNation('all');
                }}
                className={`tap-highlight whitespace-nowrap rounded-full px-3 md:px-4 py-2 text-sm font-medium flex items-center gap-1.5 md:gap-2 ${darkMode ? (selectedTournament === code ? 'glass-pill-active' : 'glass-pill') : ''}`}
                style={{
                  ...(darkMode ? {} : { backgroundColor: selectedTournament === code ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedTournament === code ? theme.accent : theme.border}` }),
                  color: selectedTournament === code ? '#fff' : theme.textSecondary,
                }}
              >
                {logo && (
                  <img
                    src={logo}
                    alt={tournament.name}
                    className="w-5 h-5 object-contain logo-glow"
                    style={{ filter: darkMode && shouldUseWhiteFilterByCode(code) ? 'brightness(0) invert(1)' : undefined }}
                  />
                )}
                <span className="hidden md:inline">{tournament.name}</span>
              </button>
            );
          })}

          {/* Nation filters (skip 'all' since it's already first) */}
          {nationFilters.filter(f => f.id !== 'all').map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setSelectedNation(filter.id);
                setSelectedTournament(null);
              }}
              className={`tap-highlight whitespace-nowrap rounded-full px-3 md:px-4 py-2 text-sm font-medium flex items-center gap-1 md:gap-2 ${darkMode ? (selectedNation === filter.id && !selectedTournament ? 'glass-pill-active' : 'glass-pill') : ''}`}
              style={{
                ...(darkMode ? {} : { backgroundColor: selectedNation === filter.id && !selectedTournament ? theme.accent : theme.bgSecondary, border: `1px solid ${selectedNation === filter.id && !selectedTournament ? theme.accent : theme.border}` }),
                color: selectedNation === filter.id && !selectedTournament ? '#fff' : theme.textSecondary,
              }}
            >
              {'flag' in filter ? <span>{filter.flag}</span> : null}
              <span className="hidden md:inline">{filter.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* CBB Conference Filter - Shows when CBB is selected */}
      {selectedSport === 'cbb' && (
        <div
          className="flex gap-1 md:gap-2 overflow-x-auto px-2 md:px-4 pb-3"
          style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
        >
          <span className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium" style={{ color: theme.textSecondary }}>
            {basketballGames.length} games
          </span>
        </div>
      )}

      {/* MLB League Filter - Shows when MLB is selected */}
      {selectedSport === 'mlb' && (
        <div
          className="flex gap-1 md:gap-2 overflow-x-auto px-2 md:px-4 pb-3"
          style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${theme.border}` }}
        >
          <span className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium" style={{ color: theme.textSecondary }}>
            {mlbGames.length} games
          </span>
        </div>
      )}

      {/* Fixtures */}
      <main className="flex-1 overflow-y-auto pb-24 px-2 md:px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textSecondary }}
          >
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <span className="text-sm" style={{ color: theme.textSecondary }}>
            {selectedSport === 'all'
              ? matches.length + basketballGames.length + nbaGames.length + mlbGames.length + nflGames.length
              : selectedSport === 'myteams'
                ? myTeamsTotal
                : selectedSport === 'cbb'
                  ? basketballGames.length
                  : selectedSport === 'nba'
                    ? nbaGames.length
                    : selectedSport === 'mlb'
                      ? mlbGames.length
                      : selectedSport === 'nfl'
                        ? nflGames.length
                        : matches.length
            } {(selectedSport === 'all'
              ? matches.length + basketballGames.length + nbaGames.length + mlbGames.length + nflGames.length
              : selectedSport === 'myteams'
                ? myTeamsTotal
                : selectedSport === 'cbb'
                  ? basketballGames.length
                  : selectedSport === 'nba'
                    ? nbaGames.length
                    : selectedSport === 'mlb'
                      ? mlbGames.length
                      : selectedSport === 'nfl'
                        ? nflGames.length
                        : matches.length
            ) === 1 ? 'game' : 'games'}
          </span>
        </div>

        {/* All Sports - when All is selected */}
        {selectedSport === 'all' ? (
          <div className="flex flex-col gap-6">
            {/* Soccer Section */}
            {matches.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <img src={SOCCER_ICON} alt="" className="h-4 w-4 object-contain logo-glow inline" /> Soccer ({matches.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {/* Basketball Section */}
            {basketballGames.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <span>🏀</span> College Basketball ({basketballGames.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {basketballGames.map((game) => (
                    <BasketballGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* NBA Section */}
            {nbaGames.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> NBA ({nbaGames.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {nbaGames.map((game) => (
                    <NBAGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* MLB Section */}
            {mlbGames.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <img src="https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> MLB ({mlbGames.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {mlbGames.map((game) => (
                    <MLBGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* NFL Section */}
            {nflGames.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> NFL ({nflGames.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {nflGames.map((game) => (
                    <NFLGameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* No games message */}
            {matches.length === 0 && basketballGames.length === 0 && nbaGames.length === 0 && mlbGames.length === 0 && nflGames.length === 0 && !isLoading && (
              <div
                className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No games on this date
                </p>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && matches.length === 0 && basketballGames.length === 0 && nbaGames.length === 0 && mlbGames.length === 0 && nflGames.length === 0 && (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading games...
                </p>
              </div>
            )}
          </div>
        ) : selectedSport === 'myteams' ? (
          isLoading ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                style={{ color: theme.accent }}
              />
              <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                Loading your teams' games...
              </p>
            </div>
          ) : !isLoggedIn ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <Star size={24} style={{ color: theme.textSecondary, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium" style={{ color: theme.text }}>
                Sign in to track your teams
              </p>
              <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
                Add teams to your favorites to see their games here
              </p>
            </div>
          ) : myTeamsTotal === 0 ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <Star size={24} style={{ color: theme.textSecondary, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium" style={{ color: theme.text }}>
                No games for your teams on this date
              </p>
              <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
                Add more teams to your favorites or check another date
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* My Teams - Soccer */}
              {myTeamsMatches.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                    <img src={SOCCER_ICON} alt="" className="h-4 w-4 object-contain logo-glow inline" /> Soccer ({myTeamsMatches.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {myTeamsMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </section>
              )}

              {/* My Teams - Basketball */}
              {myTeamsBasketball.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                    <span>🏀</span> College Basketball ({myTeamsBasketball.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTeamsBasketball.map((game) => (
                      <BasketballGameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* My Teams - NBA */}
              {myTeamsNba.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                    <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> NBA ({myTeamsNba.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTeamsNba.map((game) => (
                      <NBAGameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* My Teams - MLB */}
              {myTeamsMlb.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                    <img src="https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> MLB ({myTeamsMlb.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTeamsMlb.map((game) => (
                      <MLBGameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* My Teams - NFL */}
              {myTeamsNfl.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                    <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="" className="h-4 w-4 object-contain logo-glow inline" /> NFL ({myTeamsNfl.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTeamsNfl.map((game) => (
                      <NFLGameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        ) : selectedSport === 'cbb' ? (
          basketballLoading ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                style={{ color: theme.accent }}
              />
              <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                Loading basketball games...
              </p>
            </div>
          ) : basketballError ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm font-medium" style={{ color: theme.red }}>
                Failed to load games
              </p>
            </div>
          ) : basketballGames.length === 0 ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No basketball games on this date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {basketballGames.map((game) => (
                <BasketballGameCard key={game.id} game={game} />
              ))}
            </div>
          )
        ) : selectedSport === 'nba' ? (
          nbaLoading ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                style={{ color: theme.accent }}
              />
              <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                Loading NBA games...
              </p>
            </div>
          ) : nbaError ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm font-medium" style={{ color: theme.red }}>
                Failed to load games
              </p>
            </div>
          ) : nbaGames.length === 0 ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No NBA games on this date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {nbaGames.map((game) => (
                <NBAGameCard key={game.id} game={game} />
              ))}
            </div>
          )
        ) : selectedSport === 'mlb' ? (
          mlbLoading ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                style={{ color: theme.accent }}
              />
              <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                Loading MLB games...
              </p>
            </div>
          ) : mlbError ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm font-medium" style={{ color: theme.red }}>
                Failed to load games
              </p>
            </div>
          ) : mlbGames.length === 0 ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No MLB games on this date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {mlbGames.map((game) => (
                <MLBGameCard key={game.id} game={game} />
              ))}
            </div>
          )
        ) : selectedSport === 'nfl' ? (
          nflLoading ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                style={{ color: theme.accent }}
              />
              <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                Loading NFL games...
              </p>
            </div>
          ) : nflError ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm font-medium" style={{ color: theme.red }}>
                Failed to load games
              </p>
            </div>
          ) : nflGames.length === 0 ? (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No NFL games on this date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {nflGames.map((game) => (
                <NFLGameCard key={game.id} game={game} />
              ))}
            </div>
          )
        ) : selectedSport === 'nhl' ? (
          <div
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
          >
            <p className="text-2xl mb-2">🏒</p>
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              NHL Coming Soon
            </p>
            <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
              NHL game data will be available soon
            </p>
          </div>
        ) : selectedSport === 'cfb' ? (
          <div
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
          >
            <p className="text-2xl mb-2">🏈</p>
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              College Football Coming Soon
            </p>
            <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
              CFB game data will be available soon
            </p>
          </div>
        ) : isLoading && matches.length === 0 ? (
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
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
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
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
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
                  className={`rounded-xl overflow-hidden ${darkMode ? 'glass-section' : ''}`}
                  style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  {/* Nation Header - Collapsible */}
                  <button
                    onClick={() => toggleNation(nation.id)}
                    className="tap-highlight w-full flex items-center justify-between px-4 py-3"
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
