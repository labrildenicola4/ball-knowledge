'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Trophy, TableIcon, Sun, Moon, BarChart3, Heart, Users } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MatchStandings } from '@/components/MatchStandings';
import { LiveStats, LiveStatsData } from '@/components/LiveStats';
import { MatchLineup, LineupPlayer } from '@/components/MatchLineup';
import { useLiveMatch } from '@/lib/use-live-scores';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Match not found' : 'Failed to fetch');
  return res.json();
});

// Create Supabase client outside component to avoid recreation
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Team {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  score: number | null;
  form: string[];
  lineup: LineupPlayer[];
  bench: LineupPlayer[];
  formation: string | null;
  coach: string | null;
}

interface Standing {
  position: number;
  teamId: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  points: number;
  form: string[];
}

interface MatchDetails {
  id: number;
  league: string;
  leagueCode: string | null;
  date: string;
  venue: string;
  status: string;
  minute: number | null;
  matchday: number;
  home: Team;
  away: Team;
  h2h: { total: number; homeWins: number; draws: number; awayWins: number };
  halfTimeScore: { home: number | null; away: number | null };
  stats: LiveStatsData | null;
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const matchId = params.id;
  const numericMatchId = matchId ? parseInt(String(matchId)) : null;

  // STEP 1: Get cached data instantly (basic match info)
  const { data: cachedMatch, isLoading: cachedLoading } = useSWR<MatchDetails>(
    matchId ? `/api/match/cached/${matchId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // STEP 2: Load full match data in background (H2H, stats, form)
  const { data: fullMatch, error: swrError } = useSWR<MatchDetails>(
    matchId ? `/api/match/${matchId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      refreshInterval: (data) => {
        const isLive = data && ['LIVE', '1H', '2H', 'HT'].includes(data.status);
        return isLive ? 60000 : 0;
      },
    }
  );

  // Subscribe to realtime score updates from Supabase
  const { match: liveMatch, isConnected: realtimeConnected } = useLiveMatch(numericMatchId);

  // Check if cached response has actual match data (not just a "notCached" indicator)
  // Also check if cache is stale (FT match with null scores)
  const isCachedStale = cachedMatch && cachedMatch.status === 'FT' &&
    (cachedMatch.home?.score === null || cachedMatch.away?.score === null);
  const hasCachedMatchData = cachedMatch && 'home' in cachedMatch && !('notCached' in cachedMatch) && !isCachedStale;

  // Use full data if available, otherwise cached data (only if it has actual fresh data)
  const baseMatch = fullMatch || (hasCachedMatchData ? cachedMatch : null);

  // Merge with realtime scores (realtime takes priority)
  // Add safety checks for home/away being undefined
  const match = baseMatch && baseMatch.home && baseMatch.away ? {
    ...baseMatch,
    status: liveMatch?.status || baseMatch.status,
    minute: liveMatch?.minute ?? baseMatch.minute,
    home: {
      ...baseMatch.home,
      score: liveMatch?.home_score ?? baseMatch.home.score,
    },
    away: {
      ...baseMatch.away,
      score: liveMatch?.away_score ?? baseMatch.away.score,
    },
  } : null;

  // Show loading if:
  // 1. Cached is still loading, OR
  // 2. Cached has no real/fresh data AND full API is still loading
  const isFullLoading = !fullMatch && !swrError;
  const loading = cachedLoading || (!hasCachedMatchData && isFullLoading);
  const error = swrError?.message || null;

  // Use SWR for standings (with cached endpoint)
  const { data: standingsData, isLoading: standingsLoading } = useSWR(
    match?.leagueCode ? `/api/standings/cached?league=${match.leagueCode}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const standings = standingsData?.standings || [];

  // Tab state - must be at top level with other hooks (before any early returns)
  const [activeTab, setActiveTab] = useState<'stats' | 'lineups' | 'h2h' | 'table'>('stats');

  // Favorites state for both teams
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [homeFavorite, setHomeFavorite] = useState(false);
  const [awayFavorite, setAwayFavorite] = useState(false);

  // Check auth and load favorites
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && match) {
        const { data } = await supabase
          .from('user_favorites')
          .select('favorite_id')
          .eq('user_id', user.id)
          .eq('favorite_type', 'team')
          .in('favorite_id', [match.home.id, match.away.id]);

        if (data) {
          const favIds = data.map(f => f.favorite_id);
          setHomeFavorite(favIds.includes(match.home.id));
          setAwayFavorite(favIds.includes(match.away.id));
        }
      }
    };

    if (match) checkAuth();
  }, [match?.home?.id, match?.away?.id]);

  // Toggle favorite for a team
  const toggleFavorite = async (teamId: number, isHome: boolean) => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    const isFav = isHome ? homeFavorite : awayFavorite;

    if (isFav) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_type', 'team')
        .eq('favorite_id', teamId);
    } else {
      await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          favorite_type: 'team',
          favorite_id: teamId,
        });
    }

    if (isHome) setHomeFavorite(!isFav);
    else setAwayFavorite(!isFav);
  };

  // Save last viewed match to localStorage
  useEffect(() => {
    if (matchId) {
      localStorage.setItem('lastViewedMatch', String(matchId));
    }
  }, [matchId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center transition-theme" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading match details...</p>
      </div>
    );
  }

  // Error state
  if (error || !match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center transition-theme" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error || 'Match not found'}</p>
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

  const isFinished = match.status === 'FT';
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.status);
  const isUpcoming = match.status === 'NS';

  // Get team form from match data (fetched from API)
  const homeForm = match.home.form || [];
  const awayForm = match.away.form || [];

  // Helper to render form indicators inline
  const renderForm = (form: string[]) => (
    <div className="flex justify-center gap-1 mt-2">
      {form.map((result, i) => (
        <span
          key={i}
          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
          style={{
            backgroundColor:
              result === 'W' ? theme.green :
              result === 'D' ? theme.gold :
              result === 'L' ? theme.red : theme.bgTertiary,
          }}
        >
          {result}
        </span>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}>
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
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>{match.league}</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>Matchday {match.matchday}</p>
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
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: realtimeConnected ? theme.green : theme.gold }}
              />
              {realtimeConnected ? 'Realtime' : 'Polling'}
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

      {/* Main Score Section */}
      <section className="px-4 py-8" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <Link href={`/team/${match.home.id}`} className="transition-opacity hover:opacity-80">
              <span
                className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider"
                style={{ color: theme.textSecondary }}
              >
                Home
              </span>
              <div className="mx-auto mb-3 h-20 w-20">
                <img src={match.home.logo} alt={match.home.name} className="h-full w-full object-contain" />
              </div>
            </Link>
            <div className="text-center">
              <p className="text-sm font-medium inline" style={{ color: theme.text }}>{match.home.name}</p>
              <button onClick={(e) => { e.preventDefault(); toggleFavorite(match.home.id, true); }} className="p-0.5 inline-flex align-middle ml-1">
                <Heart size={12} fill={homeFavorite ? '#d68b94' : 'none'} style={{ color: '#d68b94' }} />
              </button>
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.home.shortName}</p>
            </div>
            {homeForm.length > 0 && renderForm(homeForm)}
          </div>

          {/* Score */}
          <div className="px-4 text-center">
            {isUpcoming ? (
              <div>
                <p className="font-mono text-3xl font-light" style={{ color: theme.textSecondary }}>vs</p>
                <p className="mt-2 text-[11px]" style={{ color: theme.textSecondary }}>
                  {match.date}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-5xl font-light" style={{ color: theme.text }}>{match.home.score ?? 0}</span>
                  <span className="text-2xl" style={{ color: theme.textSecondary }}>-</span>
                  <span className="font-mono text-5xl font-light" style={{ color: theme.text }}>{match.away.score ?? 0}</span>
                </div>
                {/* Live minute or status badge */}
                {isLive ? (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    {match.minute !== null ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-4 py-1 text-[12px] font-semibold"
                        style={{ backgroundColor: theme.red, color: '#fff' }}
                      >
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        {match.minute}&apos;
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-4 py-1 text-[10px] font-medium"
                        style={{ backgroundColor: theme.red, color: '#fff' }}
                      >
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {match.status === 'HT' && (
                      <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                        Half Time
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    className="mt-3 inline-block rounded-full px-4 py-1 text-[10px] font-medium"
                    style={{
                      backgroundColor: theme.bgTertiary,
                      color: theme.textSecondary,
                    }}
                  >
                    {match.status}
                  </span>
                )}
                {/* Half-time score */}
                {isFinished && match.halfTimeScore.home !== null && (
                  <p className="mt-2 text-[10px]" style={{ color: theme.textSecondary }}>
                    HT: {match.halfTimeScore.home} - {match.halfTimeScore.away}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <Link href={`/team/${match.away.id}`} className="transition-opacity hover:opacity-80">
              <span
                className="inline-block mb-2 text-[9px] font-medium uppercase tracking-wider"
                style={{ color: theme.textSecondary }}
              >
                Away
              </span>
              <div className="mx-auto mb-3 h-20 w-20">
                <img src={match.away.logo} alt={match.away.name} className="h-full w-full object-contain" />
              </div>
            </Link>
            <div className="text-center">
              <p className="text-sm font-medium inline" style={{ color: theme.text }}>{match.away.name}</p>
              <button onClick={(e) => { e.preventDefault(); toggleFavorite(match.away.id, false); }} className="p-0.5 inline-flex align-middle ml-1">
                <Heart size={12} fill={awayFavorite ? '#d68b94' : 'none'} style={{ color: '#d68b94' }} />
              </button>
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.away.shortName}</p>
            </div>
            {awayForm.length > 0 && renderForm(awayForm)}
          </div>
        </div>
      </section>

      {/* Match Info */}
      <section className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>{match.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>{match.venue || 'TBD'}</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {[
          { key: 'stats', label: 'Stats', icon: BarChart3 },
          { key: 'lineups', label: 'Lineups', icon: Users },
          { key: 'h2h', label: 'H2H', icon: Trophy },
          { key: 'table', label: 'Table', icon: TableIcon },
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
      <div className="flex-1 overflow-y-auto">
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <section className="px-4 py-6">
            <LiveStats
              stats={match.stats}
              homeShortName={match.home.shortName}
              awayShortName={match.away.shortName}
              matchStatus={match.status}
              isLoading={!fullMatch && !swrError}
            />
          </section>
        )}

        {/* Lineups Tab */}
        {activeTab === 'lineups' && (
          <section className="px-4 py-6">
            <MatchLineup
              home={{
                lineup: match.home.lineup || [],
                bench: match.home.bench || [],
                formation: match.home.formation,
                coach: match.home.coach,
              }}
              away={{
                lineup: match.away.lineup || [],
                bench: match.away.bench || [],
                formation: match.away.formation,
                coach: match.away.coach,
              }}
              homeShortName={match.home.shortName}
              awayShortName={match.away.shortName}
              matchStatus={match.status}
            />
          </section>
        )}

        {/* H2H Tab */}
        {activeTab === 'h2h' && (
          <section className="px-4 py-6">
            {match.h2h && match.h2h.total > 0 ? (
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-center text-[11px] mb-4" style={{ color: theme.textSecondary }}>
                  Last {match.h2h.total} meetings
                </p>
                <div className="flex justify-between items-center">
                  {/* Home wins */}
                  <div className="flex-1 text-center">
                    <p className="font-mono text-4xl font-light" style={{ color: theme.green }}>
                      {match.h2h.homeWins}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: theme.text }}>
                      {match.home.shortName}
                    </p>
                  </div>

                  {/* Draws */}
                  <div className="flex-1 text-center">
                    <p className="font-mono text-4xl font-light" style={{ color: theme.gold }}>
                      {match.h2h.draws}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: theme.text }}>
                      Draws
                    </p>
                  </div>

                  {/* Away wins */}
                  <div className="flex-1 text-center">
                    <p className="font-mono text-4xl font-light" style={{ color: theme.red }}>
                      {match.h2h.awayWins}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: theme.text }}>
                      {match.away.shortName}
                    </p>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="mt-4 flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.bgTertiary }}>
                  <div
                    style={{
                      width: `${(match.h2h.homeWins / match.h2h.total) * 100}%`,
                      backgroundColor: theme.green,
                    }}
                  />
                  <div
                    style={{
                      width: `${(match.h2h.draws / match.h2h.total) * 100}%`,
                      backgroundColor: theme.gold,
                    }}
                  />
                  <div
                    style={{
                      width: `${(match.h2h.awayWins / match.h2h.total) * 100}%`,
                      backgroundColor: theme.red,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  No head-to-head data available
                </p>
              </div>
            )}
          </section>
        )}

        {/* Table Tab */}
        {activeTab === 'table' && (
          <section className="px-4 py-6">
            {standingsLoading ? (
              <div className="flex justify-center py-8">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
              </div>
            ) : standings.length > 0 ? (
              <MatchStandings
                standings={standings}
                homeTeamId={match.home.id}
                awayTeamId={match.away.id}
                leagueName={match.league}
              />
            ) : (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  League table not available
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
