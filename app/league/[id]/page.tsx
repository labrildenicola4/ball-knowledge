'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, Sun, Moon, Trophy, Calendar, Target } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';

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
  };
  standings: StandingRow[];
  topScorers: TopScorerRow[];
  recentFixtures: FixtureRow[];
  upcomingFixtures: FixtureRow[];
}

type Tab = 'fixtures' | 'standings' | 'scorers';

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const leagueSlug = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('standings');

  const { data, error, isLoading } = useSWR<LeagueData>(
    `/api/league/${leagueSlug}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading league...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'League not found'}</p>
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusDisplay = (fixture: FixtureRow) => {
    switch (fixture.status) {
      case 'NS':
        return formatTime(fixture.date);
      case 'FT':
      case 'AET':
      case 'PEN':
        return 'FT';
      case '1H':
      case '2H':
        return fixture.elapsed ? `${fixture.elapsed}'` : fixture.status;
      case 'HT':
        return 'HT';
      default:
        return fixture.status;
    }
  };

  const isLive = (status: string) => ['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(status);

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
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>
            {data.league.name}
          </p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {data.league.country}
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {[
          { id: 'standings' as Tab, label: 'Standings', icon: Trophy },
          { id: 'fixtures' as Tab, label: 'Fixtures', icon: Calendar },
          { id: 'scorers' as Tab, label: 'Top Scorers', icon: Target },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? theme.accent : theme.bgSecondary,
              color: activeTab === tab.id ? '#fff' : theme.textSecondary,
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <section
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {/* Table Header */}
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

            {/* Table Rows */}
            {data.standings.map((row, index) => (
              <Link
                key={row.team.id}
                href={`/soccer/team/${row.team.id}`}
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
                    className="h-5 w-5 flex-shrink-0 object-contain"
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

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="flex flex-col gap-4">
            {/* Upcoming Fixtures */}
            {data.upcomingFixtures.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Upcoming</h3>
                </div>
                {data.upcomingFixtures.map((fixture, index) => (
                  <div
                    key={fixture.id}
                    className="px-4 py-3"
                    style={{ borderBottom: index < data.upcomingFixtures.length - 1 ? `1px solid ${theme.border}` : 'none' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: theme.textSecondary }}>{formatDate(fixture.date)}</span>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: isLive(fixture.status) ? theme.red : theme.bgTertiary,
                          color: isLive(fixture.status) ? '#fff' : theme.textSecondary,
                        }}
                      >
                        {getStatusDisplay(fixture)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <img src={fixture.homeTeam.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                        <span className="text-xs font-medium truncate" style={{ color: theme.text }}>{fixture.homeTeam.name}</span>
                      </div>
                      <span className="text-xs font-mono px-2" style={{ color: theme.textSecondary }}>vs</span>
                      <div className="flex-1 flex items-center gap-2 justify-end">
                        <span className="text-xs font-medium truncate" style={{ color: theme.text }}>{fixture.awayTeam.name}</span>
                        <img src={fixture.awayTeam.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Recent Results */}
            {data.recentFixtures.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Recent Results</h3>
                </div>
                {data.recentFixtures.map((fixture, index) => (
                  <div
                    key={fixture.id}
                    className="px-4 py-3"
                    style={{ borderBottom: index < data.recentFixtures.length - 1 ? `1px solid ${theme.border}` : 'none' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: theme.textSecondary }}>{formatDate(fixture.date)}</span>
                      <span className="text-[10px]" style={{ color: theme.textSecondary }}>FT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <img src={fixture.homeTeam.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                        <span
                          className="text-xs font-medium truncate"
                          style={{
                            color: (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0) ? theme.text : theme.textSecondary,
                            fontWeight: (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0) ? 600 : 400,
                          }}
                        >
                          {fixture.homeTeam.name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-mono font-bold px-3 py-1 rounded"
                        style={{ backgroundColor: theme.bgTertiary, color: theme.text }}
                      >
                        {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                      </span>
                      <div className="flex-1 flex items-center gap-2 justify-end">
                        <span
                          className="text-xs font-medium truncate"
                          style={{
                            color: (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0) ? theme.text : theme.textSecondary,
                            fontWeight: (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0) ? 600 : 400,
                          }}
                        >
                          {fixture.awayTeam.name}
                        </span>
                        <img src={fixture.awayTeam.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {data.upcomingFixtures.length === 0 && data.recentFixtures.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>No fixtures available</p>
              </div>
            )}
          </div>
        )}

        {/* Top Scorers Tab */}
        {activeTab === 'scorers' && (
          <section
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {/* Table Header */}
            <div
              className="grid items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                gridTemplateColumns: '24px minmax(0, 1fr) minmax(0, 80px) 40px 40px',
                color: theme.textSecondary,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <span>#</span>
              <span>Player</span>
              <span>Team</span>
              <span className="text-center">G</span>
              <span className="text-center">A</span>
            </div>

            {/* Player Rows */}
            {data.topScorers.map((scorer, index) => (
              <div
                key={scorer.player.id}
                className="grid items-center gap-2 px-3 py-2.5"
                style={{
                  gridTemplateColumns: '24px minmax(0, 1fr) minmax(0, 80px) 40px 40px',
                  borderBottom: index < data.topScorers.length - 1 ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={scorer.player.photo}
                    alt={scorer.player.name}
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                  <span className="text-xs font-medium truncate" style={{ color: theme.text }}>
                    {scorer.player.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <img
                    src={scorer.team.logo}
                    alt={scorer.team.name}
                    className="h-4 w-4 flex-shrink-0 object-contain"
                    loading="lazy"
                  />
                  <span className="text-[10px] truncate" style={{ color: theme.textSecondary }}>
                    {scorer.team.name}
                  </span>
                </div>
                <span className="text-center text-sm font-bold" style={{ color: theme.text }}>
                  {scorer.goals}
                </span>
                <span className="text-center text-sm" style={{ color: theme.textSecondary }}>
                  {scorer.assists}
                </span>
              </div>
            ))}

            {data.topScorers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>No top scorers available</p>
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
