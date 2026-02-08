'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, ChevronDown, ChevronUp, RefreshCw, Calendar, Trophy, BarChart3, GitBranch } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { shouldUseWhiteFilterByCode } from '@/lib/constants/dark-mode-logos';
import { getLeagueBySlug } from '@/lib/constants/leagues';
import { TournamentBracket } from '@/components/TournamentBracket';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'League not found' : 'Failed to fetch');
  return res.json();
});

interface LeagueTeam {
  id: number;
  name: string;
  logo: string;
}

interface StandingRow {
  rank: number;
  team: LeagueTeam;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form: string;
}

interface TeamStatRow {
  team: LeagueTeam;
  played: number;
  ppg: number;
  goalsPerGame: number;
  goalsAgainstPerGame: number;
  winPct: number;
  goalDiffPerGame: number;
  cleanSheets: number;
  homeCleanSheets: number;
  awayCleanSheets: number;
  homeWinPct: number;
  awayWinPct: number;
  homeGoalsPerGame: number;
  awayGoalsPerGame: number;
  drawPct: number;
  lossPct: number;
  goalsScored: number;
  goalsConceded: number;
}

interface PlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
    nationality: string;
  };
  team: LeagueTeam | null;
  games: {
    appearances: number;
    minutes: number;
    lineups: number;
    position: string | null;
  };
  goals: number;
  assists: number;
  shots: { total: number; onTarget: number };
  passes: { total: number; key: number; accuracy: number };
  tackles: { total: number; blocks: number; interceptions: number };
  duels: { total: number; won: number };
  dribbles: { attempts: number; success: number };
  fouls: { drawn: number; committed: number };
  cards: { yellow: number; red: number };
  penalty: { won: number; scored: number; missed: number };
}

interface TopScorerRow {
  player: {
    id: number;
    name: string;
    photo: string;
    nationality: string;
  };
  team: LeagueTeam;
  goals: number;
  assists: number;
  appearances: number;
  penaltyGoals: number;
}

interface FixtureRow {
  id: number;
  date: string;
  status: string;
  elapsed: number | null;
  round: string;
  venue: string | null;
  homeTeam: LeagueTeam;
  awayTeam: LeagueTeam;
  homeScore: number | null;
  awayScore: number | null;
}

interface LeagueData {
  league: {
    id: number;
    key: string;
    slug: string;
    name: string;
    shortName: string;
    country: string;
    type: string;
    logo: string;
    code: string;
  };
  standings: StandingRow[];
  teamStats: TeamStatRow[];
  topScorers: TopScorerRow[];
  topAssists: TopScorerRow[];
  yellowCards: PlayerStats[];
  redCards: PlayerStats[];
  playerLeaders: {
    appearances: PlayerStats[];
    minutes: PlayerStats[];
    shots: PlayerStats[];
    shotsOnTarget: PlayerStats[];
    keyPasses: PlayerStats[];
    passAccuracy: PlayerStats[];
    tackles: PlayerStats[];
    interceptions: PlayerStats[];
    duelsWon: PlayerStats[];
    dribbles: PlayerStats[];
    foulsDrawn: PlayerStats[];
  };
  recentFixtures: FixtureRow[];
  upcomingFixtures: FixtureRow[];
}

type Tab = 'schedule' | 'stats' | 'standings' | 'bracket';
type StatsView = 'players' | 'teams';

interface BracketMatch {
  id: number;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  time: string;
  venue: string;
}

interface BracketData {
  stages: string[];
  stageNames: Record<string, string>;
  bracket: Record<string, BracketMatch[]>;
  tournamentComplete?: boolean;
}

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const leagueSlug = params.id as string;

  // Detect if this is a cup competition
  const leagueConfig = getLeagueBySlug(leagueSlug);
  const isCup = leagueConfig?.type === 'cup';
  // Domestic cups (not UCL, UEL, Libertadores) should show bracket
  const isDomesticCup = isCup && !['champions-league', 'europa-league', 'copa-libertadores'].includes(leagueSlug);

  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [statsView, setStatsView] = useState<StatsView>('players');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);

  const { data, error, isLoading, mutate, isValidating } = useSWR<LeagueData>(
    `/api/league/${leagueSlug}`,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
    }
  );

  // Fetch bracket data for domestic cups
  useEffect(() => {
    if (isDomesticCup && activeTab === 'bracket') {
      setBracketLoading(true);
      fetch(`/api/bracket?competition=${leagueConfig?.key}`)
        .then(res => res.json())
        .then(data => {
          setBracketData(data);
        })
        .catch(err => {
          console.error('Error fetching bracket:', err);
        })
        .finally(() => {
          setBracketLoading(false);
        });
    }
  }, [isDomesticCup, activeTab, leagueConfig?.key]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-sm" style={{ color: theme.textSecondary }}>Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-sm" style={{ color: theme.red }}>{error?.message || 'League not found'}</p>
        <button
          onClick={() => router.back()}
          className="tap-highlight mt-4 rounded-lg px-4 py-2.5 text-sm"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.text }}
        >
          Go back
        </button>
      </div>
    );
  }

  // Categorize fixtures
  const isLive = (status: string) => ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(status);
  const isFinished = (status: string) => ['FT', 'AET', 'PEN'].includes(status);

  const allFixtures = [...data.recentFixtures, ...data.upcomingFixtures];
  const liveGames = allFixtures.filter(f => isLive(f.status));
  const upcomingGames = data.upcomingFixtures.filter(f => !isLive(f.status) && !isFinished(f.status));
  const completedGames = data.recentFixtures.filter(f => isFinished(f.status));

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusDisplay = (fixture: FixtureRow) => {
    if (isLive(fixture.status)) {
      return fixture.elapsed ? `${fixture.elapsed}'` : fixture.status;
    }
    if (isFinished(fixture.status)) return 'FT';
    return formatTime(fixture.date);
  };

  const useWhiteFilter = darkMode && shouldUseWhiteFilterByCode(data.league.code);

  const tabs = isDomesticCup
    ? [
        { id: 'schedule' as Tab, label: 'Schedule', icon: Calendar },
        { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
        { id: 'bracket' as Tab, label: 'Bracket', icon: GitBranch },
      ]
    : [
        { id: 'schedule' as Tab, label: 'Schedule', icon: Calendar },
        { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
        { id: 'standings' as Tab, label: 'Standings', icon: Trophy },
      ];

  // Game Card Component
  const GameCard = ({ fixture }: { fixture: FixtureRow }) => {
    const live = isLive(fixture.status);
    const finished = isFinished(fixture.status);
    const homeWin = finished && (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0);
    const awayWin = finished && (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0);

    return (
      <Link href={`/match/${fixture.id}`}>
        <div
          className="rounded-xl p-3 transition-all hover:scale-[1.02] cursor-pointer"
          style={{
            backgroundColor: theme.bgTertiary,
            border: `1px solid ${live ? theme.red : theme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px]" style={{ color: theme.textSecondary }}>
              {formatDate(fixture.date)}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: live ? theme.red : theme.bgSecondary,
                color: live ? '#fff' : theme.textSecondary,
              }}
            >
              {live && '● '}{getStatusDisplay(fixture)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={fixture.homeTeam.logo} alt="" className="h-5 w-5 object-contain logo-glow" />
                <span
                  className="text-xs truncate"
                  style={{
                    color: homeWin ? theme.accent : theme.text,
                    fontWeight: homeWin ? 600 : 400,
                  }}
                >
                  {fixture.homeTeam.name}
                </span>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: homeWin ? theme.accent : theme.text }}
              >
                {fixture.homeScore ?? '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={fixture.awayTeam.logo} alt="" className="h-5 w-5 object-contain logo-glow" />
                <span
                  className="text-xs truncate"
                  style={{
                    color: awayWin ? theme.accent : theme.text,
                    fontWeight: awayWin ? 600 : 400,
                  }}
                >
                  {fixture.awayTeam.name}
                </span>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: awayWin ? theme.accent : theme.text }}
              >
                {fixture.awayScore ?? '-'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Player Stat Card Component
  const PlayerStatCard = ({
    title,
    players,
    statKey,
    statLabel,
    formatter = (v: number) => String(v)
  }: {
    title: string;
    players: PlayerStats[] | TopScorerRow[];
    statKey: string;
    statLabel?: string;
    formatter?: (value: number) => string;
  }) => {
    const getValue = (p: PlayerStats | TopScorerRow): number => {
      const keys = statKey.split('.');
      let value: unknown = p;
      for (const key of keys) {
        value = (value as Record<string, unknown>)?.[key];
      }
      return (value as number) || 0;
    };

    return (
      <section
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{title}</h3>
        </div>
        <div>
          {players.slice(0, 5).map((p, index) => (
            <div
              key={p.player.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: index < 4 ? `1px solid ${theme.border}` : 'none' }}
            >
              <span
                className="text-sm font-bold w-5"
                style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
              >
                {index + 1}
              </span>
              <img
                src={p.player.photo}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
                  {p.player.name}
                </p>
                <div className="flex items-center gap-1">
                  {p.team && <img src={p.team.logo} alt="" className="h-3 w-3 object-contain logo-glow" />}
                  <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                    {p.team?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <span className="text-lg font-bold" style={{ color: index === 0 ? theme.gold : theme.text }}>
                {formatter(getValue(p))}
              </span>
            </div>
          ))}
          {players.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: theme.textSecondary }}>No data available</p>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Team Stat Card Component
  const TeamStatCard = ({
    title,
    teams,
    statKey,
    formatter = (v: number) => String(v),
    sortAsc = false
  }: {
    title: string;
    teams: TeamStatRow[];
    statKey: keyof TeamStatRow;
    formatter?: (value: number) => string;
    sortAsc?: boolean;
  }) => {
    const sorted = [...teams].sort((a, b) => {
      const aVal = a[statKey] as number;
      const bVal = b[statKey] as number;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return (
      <section
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{title}</h3>
        </div>
        <div>
          {sorted.slice(0, 5).map((team, index) => (
            <Link
              key={team.team.id}
              href={`/team/${team.team.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5"
              style={{ borderBottom: index < 4 ? `1px solid ${theme.border}` : 'none' }}
            >
              <span
                className="text-sm font-bold w-5"
                style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
              >
                {index + 1}
              </span>
              <img src={team.team.logo} alt="" className="h-6 w-6 object-contain logo-glow" />
              <span className="flex-1 text-sm font-medium truncate" style={{ color: theme.text }}>
                {team.team.name}
              </span>
              <span className="text-lg font-bold" style={{ color: index === 0 ? theme.gold : theme.text }}>
                {formatter(team[statKey] as number)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg }}
    >
      <Header />

      {/* Page Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="tap-highlight flex items-center justify-center rounded-full p-2.5 -ml-1.5 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: theme.bgSecondary }}
            >
              <ChevronLeft size={20} style={{ color: theme.text }} />
            </button>
            <img
              src={data.league.logo}
              alt={data.league.name}
              className="h-8 w-8 object-contain logo-glow"
              style={{ filter: useWhiteFilter ? 'brightness(0) invert(1)' : undefined }}
            />
            <div>
              <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
                {data.league.shortName}
              </h1>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                {dateStr}
              </p>
            </div>
          </div>
          {activeTab === 'schedule' && (
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
              }}
            >
              <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? theme.accent : theme.bgSecondary,
              color: activeTab === tab.id ? '#fff' : theme.textSecondary,
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
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
                    {liveGames.map(fixture => (
                      <GameCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => setUpcomingCollapsed(!upcomingCollapsed)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: upcomingCollapsed ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
                      Upcoming
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      {upcomingGames.length}
                    </span>
                  </div>
                  {upcomingCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>
                {!upcomingCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {upcomingGames.map(fixture => (
                      <GameCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Completed Games */}
            {completedGames.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <button
                  onClick={() => setCompletedCollapsed(!completedCollapsed)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: completedCollapsed ? 'none' : `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
                      Completed
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      {completedGames.length}
                    </span>
                  </div>
                  {completedCollapsed ? (
                    <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                  )}
                </button>
                {!completedCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {completedGames.map(fixture => (
                      <GameCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {liveGames.length === 0 && upcomingGames.length === 0 && completedGames.length === 0 && (
              <div className="rounded-lg py-8 text-center" style={{ backgroundColor: theme.bgSecondary }}>
                <p className="text-sm" style={{ color: theme.textSecondary }}>No fixtures available</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4">
            {/* Players/Teams Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatsView('players')}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: statsView === 'players' ? theme.accent : theme.bgSecondary,
                  color: statsView === 'players' ? '#fff' : theme.textSecondary,
                }}
              >
                Players
              </button>
              <button
                onClick={() => setStatsView('teams')}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: statsView === 'teams' ? theme.accent : theme.bgSecondary,
                  color: statsView === 'teams' ? '#fff' : theme.textSecondary,
                }}
              >
                Teams
              </button>
            </div>

            {/* Player Stats */}
            {statsView === 'players' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Goals */}
                <PlayerStatCard
                  title="Top Scorers"
                  players={data.topScorers}
                  statKey="goals"
                />

                {/* Assists */}
                <PlayerStatCard
                  title="Top Assists"
                  players={data.topAssists || []}
                  statKey="assists"
                />

                {/* Appearances */}
                <PlayerStatCard
                  title="Most Appearances"
                  players={data.playerLeaders?.appearances || []}
                  statKey="games.appearances"
                />

                {/* Minutes */}
                <PlayerStatCard
                  title="Most Minutes"
                  players={data.playerLeaders?.minutes || []}
                  statKey="games.minutes"
                  formatter={(v) => v.toLocaleString()}
                />

                {/* Shots */}
                <PlayerStatCard
                  title="Most Shots"
                  players={data.playerLeaders?.shots || []}
                  statKey="shots.total"
                />

                {/* Shots on Target */}
                <PlayerStatCard
                  title="Shots on Target"
                  players={data.playerLeaders?.shotsOnTarget || []}
                  statKey="shots.onTarget"
                />

                {/* Key Passes */}
                <PlayerStatCard
                  title="Key Passes"
                  players={data.playerLeaders?.keyPasses || []}
                  statKey="passes.key"
                />

                {/* Pass Accuracy */}
                <PlayerStatCard
                  title="Pass Accuracy"
                  players={data.playerLeaders?.passAccuracy || []}
                  statKey="passes.accuracy"
                  formatter={(v) => `${v}%`}
                />

                {/* Tackles */}
                <PlayerStatCard
                  title="Most Tackles"
                  players={data.playerLeaders?.tackles || []}
                  statKey="tackles.total"
                />

                {/* Interceptions */}
                <PlayerStatCard
                  title="Most Interceptions"
                  players={data.playerLeaders?.interceptions || []}
                  statKey="tackles.interceptions"
                />

                {/* Duels Won */}
                <PlayerStatCard
                  title="Duels Won"
                  players={data.playerLeaders?.duelsWon || []}
                  statKey="duels.won"
                />

                {/* Dribbles */}
                <PlayerStatCard
                  title="Successful Dribbles"
                  players={data.playerLeaders?.dribbles || []}
                  statKey="dribbles.success"
                />

                {/* Fouls Drawn */}
                <PlayerStatCard
                  title="Fouls Won"
                  players={data.playerLeaders?.foulsDrawn || []}
                  statKey="fouls.drawn"
                />

                {/* Yellow Cards */}
                <PlayerStatCard
                  title="Yellow Cards"
                  players={data.yellowCards || []}
                  statKey="cards.yellow"
                />

                {/* Red Cards */}
                <PlayerStatCard
                  title="Red Cards"
                  players={data.redCards || []}
                  statKey="cards.red"
                />
              </div>
            )}

            {/* Team Stats */}
            {statsView === 'teams' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Stats */}
                <TeamStatCard
                  title="Points Per Game"
                  teams={data.teamStats || []}
                  statKey="ppg"
                  formatter={(v) => v.toFixed(2)}
                />

                <TeamStatCard
                  title="Win %"
                  teams={data.teamStats || []}
                  statKey="winPct"
                  formatter={(v) => `${v.toFixed(1)}%`}
                />

                <TeamStatCard
                  title="Draw %"
                  teams={data.teamStats || []}
                  statKey="drawPct"
                  formatter={(v) => `${v.toFixed(1)}%`}
                />

                <TeamStatCard
                  title="Loss %"
                  teams={data.teamStats || []}
                  statKey="lossPct"
                  sortAsc={true}
                  formatter={(v) => `${v.toFixed(1)}%`}
                />

                {/* Home/Away Win % */}
                <TeamStatCard
                  title="Home Win %"
                  teams={data.teamStats || []}
                  statKey="homeWinPct"
                  formatter={(v) => `${v.toFixed(1)}%`}
                />

                <TeamStatCard
                  title="Away Win %"
                  teams={data.teamStats || []}
                  statKey="awayWinPct"
                  formatter={(v) => `${v.toFixed(1)}%`}
                />

                {/* Goals */}
                <TeamStatCard
                  title="Goals Per Game"
                  teams={data.teamStats || []}
                  statKey="goalsPerGame"
                  formatter={(v) => v.toFixed(2)}
                />

                <TeamStatCard
                  title="Best Defense (GA/G)"
                  teams={data.teamStats || []}
                  statKey="goalsAgainstPerGame"
                  formatter={(v) => v.toFixed(2)}
                  sortAsc={true}
                />

                <TeamStatCard
                  title="Goal Difference/Game"
                  teams={data.teamStats || []}
                  statKey="goalDiffPerGame"
                  formatter={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)}
                />

                <TeamStatCard
                  title="Total Goals Scored"
                  teams={data.teamStats || []}
                  statKey="goalsScored"
                />

                <TeamStatCard
                  title="Total Goals Conceded"
                  teams={data.teamStats || []}
                  statKey="goalsConceded"
                  sortAsc={true}
                />

                {/* Home/Away Goals */}
                <TeamStatCard
                  title="Home Goals/Game"
                  teams={data.teamStats || []}
                  statKey="homeGoalsPerGame"
                  formatter={(v) => v.toFixed(2)}
                />

                <TeamStatCard
                  title="Away Goals/Game"
                  teams={data.teamStats || []}
                  statKey="awayGoalsPerGame"
                  formatter={(v) => v.toFixed(2)}
                />

                {/* Clean Sheets */}
                <TeamStatCard
                  title="Clean Sheets"
                  teams={data.teamStats || []}
                  statKey="cleanSheets"
                />

                <TeamStatCard
                  title="Home Clean Sheets"
                  teams={data.teamStats || []}
                  statKey="homeCleanSheets"
                />

                <TeamStatCard
                  title="Away Clean Sheets"
                  teams={data.teamStats || []}
                  statKey="awayCleanSheets"
                />
              </div>
            )}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <section
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div
              className="grid items-center gap-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                gridTemplateColumns: '24px minmax(0, 1fr) 32px 32px 32px 32px 32px 32px',
                color: theme.textSecondary,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <span>#</span>
              <span>Team</span>
              <span className="text-center">P</span>
              <span className="text-center">W</span>
              <span className="text-center">D</span>
              <span className="text-center">L</span>
              <span className="text-center">GD</span>
              <span className="text-center">Pts</span>
            </div>

            {data.standings.map((row, index) => (
              <Link
                key={row.team.id}
                href={`/team/${row.team.id}`}
                className="grid items-center gap-1 px-3 py-2.5 transition-colors hover:bg-black/5"
                style={{
                  gridTemplateColumns: '24px minmax(0, 1fr) 32px 32px 32px 32px 32px 32px',
                  borderBottom: index < data.standings.length - 1 ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: row.rank <= 4 ? theme.green : row.rank >= data.standings.length - 2 ? theme.red : theme.textSecondary,
                  }}
                >
                  {row.rank}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={row.team.logo}
                    alt={row.team.name}
                    className="h-5 w-5 flex-shrink-0 object-contain logo-glow"
                    loading="lazy"
                  />
                  <span className="text-xs font-medium truncate" style={{ color: theme.text }}>
                    {row.team.name}
                  </span>
                </div>
                <span className="text-center text-xs" style={{ color: theme.textSecondary }}>{row.played}</span>
                <span className="text-center text-xs" style={{ color: theme.textSecondary }}>{row.won}</span>
                <span className="text-center text-xs" style={{ color: theme.textSecondary }}>{row.drawn}</span>
                <span className="text-center text-xs" style={{ color: theme.textSecondary }}>{row.lost}</span>
                <span
                  className="text-center text-xs font-medium"
                  style={{ color: row.goalDiff > 0 ? theme.green : row.goalDiff < 0 ? theme.red : theme.textSecondary }}
                >
                  {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                </span>
                <span className="text-center text-xs font-bold" style={{ color: theme.text }}>{row.points}</span>
              </Link>
            ))}

            {data.standings.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>No standings available</p>
              </div>
            )}
          </section>
        )}

        {/* Bracket Tab (for domestic cups) */}
        {activeTab === 'bracket' && (
          <div className="flex flex-col gap-4">
            {bracketLoading ? (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading bracket...
                </p>
              </div>
            ) : bracketData && Object.values(bracketData.bracket).some(matches => matches.length > 0) ? (
              <>
                {bracketData.tournamentComplete && (
                  <div
                    className="rounded-lg px-4 py-3 mb-4"
                    style={{ backgroundColor: theme.gold + '20', border: `1px solid ${theme.gold}` }}
                  >
                    <p className="text-sm font-medium" style={{ color: theme.gold }}>
                      Tournament Complete
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                      This season's competition has ended. Showing final results.
                    </p>
                  </div>
                )}
                <TournamentBracket
                  bracket={bracketData.bracket}
                  stages={bracketData.stages}
                  stageNames={bracketData.stageNames}
                />
              </>
            ) : (
              <div
                className="rounded-lg py-8 text-center"
                style={{ backgroundColor: theme.bgSecondary }}
              >
                <GitBranch size={32} className="mx-auto mb-3" style={{ color: theme.textSecondary }} />
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No bracket data available yet
                </p>
                <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
                  Bracket will appear once knockout rounds begin
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
