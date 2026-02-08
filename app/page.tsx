'use client';

import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { BasketballGameCard } from '@/components/basketball/BasketballGameCard';
import { NBAGameCard } from '@/components/nba/NBAGameCard';
import { MLBGameCard } from '@/components/mlb/MLBGameCard';
import { useTheme } from '@/lib/theme';
import { useLiveFixtures } from '@/lib/use-fixtures';
import { useFavorites } from '@/lib/use-favorites';
import { BasketballGame } from '@/lib/types/basketball';
import { MLBGame } from '@/lib/types/mlb';
import { NFLGame } from '@/lib/types/nfl';
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

// Get today's date in Eastern Time as YYYY-MM-DD
function getTodayET(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Combined game type for chronological display
interface CombinedGame {
  type: 'soccer' | 'basketball' | 'nba' | 'mlb' | 'nfl';
  id: string;
  time: string;
  timeValue: number; // For sorting
  isLive: boolean;
  isFinished?: boolean;
  soccerMatch?: Match;
  basketballGame?: BasketballGame;
  nbaGame?: BasketballGame;
  mlbGame?: MLBGame;
  nflGame?: NFLGame;
}

export default function HomePage() {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { theme } = useTheme();
  const { favorites, getFavoritesByType, isLoggedIn } = useFavorites();

  // Use SWR hook for soccer data fetching
  const { matches, isLoading: soccerLoading, isRefreshing, isError: soccerError, refresh } = useLiveFixtures();

  // Basketball games state
  const [basketballGames, setBasketballGames] = useState<BasketballGame[]>([]);
  const [basketballLoading, setBasketballLoading] = useState(true);
  const [basketballError, setBasketballError] = useState(false);

  // NBA games state
  const [nbaGames, setNbaGames] = useState<BasketballGame[]>([]);
  const [nbaLoading, setNbaLoading] = useState(true);
  const [nbaError, setNbaError] = useState(false);

  // MLB games state
  const [mlbGames, setMlbGames] = useState<MLBGame[]>([]);
  const [mlbLoading, setMlbLoading] = useState(true);
  const [mlbError, setMlbError] = useState(false);

  // NFL games state
  const [nflGames, setNflGames] = useState<NFLGame[]>([]);
  const [nflLoading, setNflLoading] = useState(true);
  const [nflError, setNflError] = useState(false);

  // Fetch basketball games for today (NCAA)
  useEffect(() => {
    setBasketballLoading(true);
    const todayStr = getTodayET();
    fetch(`/api/basketball/games?date=${todayStr}`)
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

  // Fetch NBA games for today
  useEffect(() => {
    setNbaLoading(true);
    const todayStr = getTodayET();
    fetch(`/api/nba/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setNbaGames(data.games || []);
        setNbaLoading(false);
      })
      .catch(() => {
        setNbaError(true);
        setNbaLoading(false);
      });
  }, []);

  // Fetch MLB games for today
  useEffect(() => {
    setMlbLoading(true);
    const todayStr = getTodayET();
    fetch(`/api/mlb/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setMlbGames(data.games || []);
        setMlbLoading(false);
      })
      .catch(() => {
        setMlbError(true);
        setMlbLoading(false);
      });
  }, []);

  // Fetch NFL games for today
  useEffect(() => {
    setNflLoading(true);
    const todayStr = getTodayET();
    fetch(`/api/nfl/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setNflGames(data.games || []);
        setNflLoading(false);
      })
      .catch(() => {
        setNflError(true);
        setNflLoading(false);
      });
  }, []);

  const refreshAll = () => {
    refresh();
    const todayStr = getTodayET();
    setBasketballLoading(true);
    fetch(`/api/basketball/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setBasketballGames(data.games || []);
        setBasketballLoading(false);
      })
      .catch(() => {
        setBasketballError(true);
        setBasketballLoading(false);
      });
    setNbaLoading(true);
    fetch(`/api/nba/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setNbaGames(data.games || []);
        setNbaLoading(false);
      })
      .catch(() => {
        setNbaError(true);
        setNbaLoading(false);
      });
    setMlbLoading(true);
    fetch(`/api/mlb/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setMlbGames(data.games || []);
        setMlbLoading(false);
      })
      .catch(() => {
        setMlbError(true);
        setMlbLoading(false);
      });
    setNflLoading(true);
    fetch(`/api/nfl/games?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setNflGames(data.games || []);
        setNflLoading(false);
      })
      .catch(() => {
        setNflError(true);
        setNflLoading(false);
      });
  };

  const isLoading = soccerLoading && basketballLoading && nbaLoading && mlbLoading && nflLoading;
  const isError = soccerError && basketballError && nbaError && mlbError && nflError;

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

    // Add soccer matches (exclude finished games from upcoming)
    matches.forEach(match => {
      const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'P'].includes(match.status);
      const isFinished = match.status === 'FT';
      combined.push({
        type: 'soccer',
        id: `soccer-${match.id}`,
        time: match.time,
        timeValue: parseTimeToEST(match.time),
        isLive,
        isFinished,
        soccerMatch: match,
      });
    });

    // Add basketball games (NCAA)
    basketballGames.forEach(game => {
      const isLive = game.status === 'in_progress';
      const isFinished = game.status === 'final';
      combined.push({
        type: 'basketball',
        id: `basketball-${game.id}`,
        time: game.startTime,
        timeValue: parseTimeToEST(game.startTime),
        isLive,
        isFinished,
        basketballGame: game,
      });
    });

    // Add NBA games
    nbaGames.forEach(game => {
      const isLive = game.status === 'in_progress';
      const isFinished = game.status === 'final';
      combined.push({
        type: 'nba',
        id: `nba-${game.id}`,
        time: game.startTime,
        timeValue: parseTimeToEST(game.startTime),
        isLive,
        isFinished,
        nbaGame: game,
      });
    });

    // Add MLB games
    mlbGames.forEach(game => {
      const isLive = game.status === 'in_progress';
      const isFinished = game.status === 'final';
      combined.push({
        type: 'mlb',
        id: `mlb-${game.id}`,
        time: game.startTime,
        timeValue: parseTimeToEST(game.startTime),
        isLive,
        isFinished,
        mlbGame: game,
      });
    });

    // Add NFL games
    nflGames.forEach(game => {
      const isLive = game.status === 'in_progress';
      const isFinished = game.status === 'final';
      combined.push({
        type: 'nfl',
        id: `nfl-${game.id}`,
        time: game.startTime,
        timeValue: parseTimeToEST(game.startTime),
        isLive,
        isFinished,
        nflGame: game,
      });
    });

    return combined;
  }, [matches, basketballGames, nbaGames, mlbGames, nflGames]);

  // Filter games based on selected filter
  const filteredGames = useMemo(() => {
    if (selectedFilter === 'all') return allGames;

    if (selectedFilter === 'myteams') {
      const soccerFavs = getFavoritesByType('team').map(String);
      const ncaabFavs = getFavoritesByType('ncaab_team').map(String);
      const nbaFavs = getFavoritesByType('nba_team').map(String);
      const mlbFavs = getFavoritesByType('mlb_team').map(String);
      const nflFavs = getFavoritesByType('nfl_team').map(String);

      return allGames.filter(game => {
        if (game.type === 'soccer' && game.soccerMatch) {
          const homeId = String(game.soccerMatch.homeId || '');
          const awayId = String(game.soccerMatch.awayId || '');
          return soccerFavs.includes(homeId) || soccerFavs.includes(awayId);
        }
        if (game.type === 'basketball' && game.basketballGame) {
          return ncaabFavs.includes(game.basketballGame.homeTeam.id) ||
                 ncaabFavs.includes(game.basketballGame.awayTeam.id);
        }
        if (game.type === 'nba' && game.nbaGame) {
          return nbaFavs.includes(game.nbaGame.homeTeam.id) ||
                 nbaFavs.includes(game.nbaGame.awayTeam.id);
        }
        if (game.type === 'mlb' && game.mlbGame) {
          return mlbFavs.includes(game.mlbGame.homeTeam.id) ||
                 mlbFavs.includes(game.mlbGame.awayTeam.id);
        }
        if (game.type === 'nfl' && game.nflGame) {
          return nflFavs.includes(game.nflGame.homeTeam.id) ||
                 nflFavs.includes(game.nflGame.awayTeam.id);
        }
        return false;
      });
    }

    // Filter by sport type
    const sportMap: Record<string, CombinedGame['type'][]> = {
      'soccer': ['soccer'],
      'ncaa': ['basketball'],
      'nba': ['nba'],
      'mlb': ['mlb'],
      'nfl': ['nfl'],
    };

    const types = sportMap[selectedFilter] || [];
    return allGames.filter(game => types.includes(game.type));
  }, [allGames, selectedFilter, getFavoritesByType]);

  // Separate live, finished, and upcoming games
  const liveGames = filteredGames.filter(g => g.isLive);
  const finishedGames = filteredGames.filter(g => g.isFinished);
  const upcomingGames = filteredGames
    .filter(g => !g.isLive && !g.isFinished)
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

  const totalGames = matches.length + basketballGames.length + nbaGames.length + mlbGames.length;

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
            <RefreshCw size={16} className={isRefreshing || basketballLoading || nbaLoading || mlbLoading || nflLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {(isRefreshing || basketballLoading || nbaLoading || mlbLoading || nflLoading) && (
          <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
            Updating...
          </p>
        )}
        {/* Sport filter pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedFilter('all')}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: selectedFilter === 'all' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'all' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'all' ? theme.accent : theme.border}`,
            }}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('myteams')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center"
            style={{
              backgroundColor: selectedFilter === 'myteams' ? theme.accent : theme.bgSecondary,
              border: `1px solid ${selectedFilter === 'myteams' ? theme.accent : theme.border}`,
              minWidth: '36px',
            }}
          >
            <Star size={14} fill={selectedFilter === 'myteams' ? '#fff' : '#D4AF37'} color={selectedFilter === 'myteams' ? '#fff' : '#D4AF37'} />
          </button>
          <button
            onClick={() => setSelectedFilter('soccer')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: selectedFilter === 'soccer' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'soccer' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'soccer' ? theme.accent : theme.border}`,
            }}
          >
            <img src={SOCCER_ICON} alt="" className="h-4 w-4 object-contain" />
            {matches.length}
          </button>
          <button
            onClick={() => setSelectedFilter('ncaa')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: selectedFilter === 'ncaa' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'ncaa' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'ncaa' ? theme.accent : theme.border}`,
            }}
          >
            <img src={BASKETBALL_ICON} alt="" className="h-4 w-4 object-contain" />
            {basketballGames.length}
          </button>
          <button
            onClick={() => setSelectedFilter('nba')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: selectedFilter === 'nba' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'nba' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'nba' ? theme.accent : theme.border}`,
            }}
          >
            <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="" className="h-4 w-4 object-contain" />
            {nbaGames.length}
          </button>
          <button
            onClick={() => setSelectedFilter('mlb')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: selectedFilter === 'mlb' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'mlb' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'mlb' ? theme.accent : theme.border}`,
            }}
          >
            <img src="https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png" alt="" className="h-4 w-4 object-contain" />
            {mlbGames.length}
          </button>
          <button
            onClick={() => setSelectedFilter('nfl')}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: selectedFilter === 'nfl' ? theme.accent : theme.bgSecondary,
              color: selectedFilter === 'nfl' ? '#fff' : theme.textSecondary,
              border: `1px solid ${selectedFilter === 'nfl' ? theme.accent : theme.border}`,
            }}
          >
            <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="" className="h-4 w-4 object-contain" />
            {nflGames.length}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-2 md:px-4 py-4">
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
        ) : filteredGames.length === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            {selectedFilter === 'myteams' ? (
              !isLoggedIn ? (
                <>
                  <Star size={24} style={{ color: theme.textSecondary, margin: '0 auto 8px' }} />
                  <p className="text-sm font-medium" style={{ color: theme.text }}>
                    Sign in to track your teams
                  </p>
                  <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
                    Add teams to your favorites to see their games here
                  </p>
                </>
              ) : (
                <>
                  <Star size={24} style={{ color: theme.textSecondary, margin: '0 auto 8px' }} />
                  <p className="text-sm font-medium" style={{ color: theme.text }}>
                    No games for your teams today
                  </p>
                  <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
                    Add more teams to your favorites or check the Calendar
                  </p>
                </>
              )
            ) : (
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No games for this filter today
              </p>
            )}
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
                      ) : game.type === 'nba' && game.nbaGame ? (
                        <NBAGameCard key={game.id} game={game.nbaGame} />
                      ) : game.type === 'mlb' && game.mlbGame ? (
                        <MLBGameCard key={game.id} game={game.mlbGame} />
                      ) : null
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Completed Games Section */}
            {finishedGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => toggleSection('completed')}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: collapsedSections.has('completed') ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-medium" style={{ color: theme.textSecondary }}>
                      Completed
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      {finishedGames.length}
                    </span>
                  </div>
                  {collapsedSections.has('completed') ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>

                {!collapsedSections.has('completed') && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {finishedGames.map((game) => (
                      game.type === 'soccer' && game.soccerMatch ? (
                        <MatchCard key={game.id} match={game.soccerMatch} />
                      ) : game.type === 'basketball' && game.basketballGame ? (
                        <BasketballGameCard key={game.id} game={game.basketballGame} />
                      ) : game.type === 'nba' && game.nbaGame ? (
                        <NBAGameCard key={game.id} game={game.nbaGame} />
                      ) : game.type === 'mlb' && game.mlbGame ? (
                        <MLBGameCard key={game.id} game={game.mlbGame} />
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
                        ) : game.type === 'nba' && game.nbaGame ? (
                          <BasketballGameCard key={game.id} game={game.nbaGame} />
                        ) : game.type === 'mlb' && game.mlbGame ? (
                          <MLBGameCard key={game.id} game={game.mlbGame} />
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
