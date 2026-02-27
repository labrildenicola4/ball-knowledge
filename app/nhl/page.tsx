'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, Trophy, BarChart3, ChevronLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { NHLGameCard } from '@/components/nhl/NHLGameCard';
import { useTheme } from '@/lib/theme';
import { NHLGame, NHLStandings } from '@/lib/types/nhl';
import { NHLLeaders, NHLTeamRankings } from '@/lib/api-espn-nhl';
import { SectionSkeleton, StandingsSkeleton } from '@/components/Skeleton';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'schedule' | 'stats' | 'standings';
type StatsView = 'players' | 'teams';

export default function NHLHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [statsView, setStatsView] = useState<StatsView>('players');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [selectedConference, setSelectedConference] = useState<'Eastern' | 'Western'>('Eastern');
  const { theme, darkMode } = useTheme();

  // Fetch games
  const { data: gamesData, isLoading: gamesLoading, mutate, isValidating } = useSWR<{
    games: NHLGame[];
    count: number;
  }>('/api/nhl/games', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Fetch standings
  const { data: standingsData, isLoading: standingsLoading } = useSWR<NHLStandings>(
    activeTab === 'standings' ? '/api/nhl/standings' : null,
    fetcher
  );

  // Fetch player leaders
  const { data: leadersData, isLoading: leadersLoading } = useSWR<NHLLeaders>(
    activeTab === 'stats' && statsView === 'players' ? '/api/nhl/leaders' : null,
    fetcher
  );

  // Fetch team rankings
  const { data: teamRankingsData, isLoading: teamRankingsLoading } = useSWR<NHLTeamRankings>(
    activeTab === 'stats' && statsView === 'teams' ? '/api/nhl/team-rankings' : null,
    fetcher
  );

  const games = gamesData?.games || [];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Separate games into categories
  const liveGames = games.filter(g => g.status === 'in_progress');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const completedGames = games.filter(g => g.status === 'final');

  const tabs = [
    { id: 'schedule' as Tab, label: 'Schedule', icon: Calendar },
    { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
    { id: 'standings' as Tab, label: 'Standings', icon: Trophy },
  ];

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: 'transparent' }}
    >
      <Header />

      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/all"
              className="tap-highlight flex items-center justify-center rounded-full p-2.5 -ml-1.5 hover:opacity-70 transition-opacity glass-pill"
            >
              <ChevronLeft size={20} style={{ color: theme.text }} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                NHL
              </h1>
              <p className="text-base" style={{ color: theme.textSecondary }}>
                {dateStr}
              </p>
            </div>
          </div>
          {activeTab === 'schedule' && (
            <button
              onClick={() => mutate()}
              disabled={gamesLoading}
              className="tap-highlight flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm glass-pill"
              style={{ color: theme.textSecondary }}
            >
              <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
        {isValidating && activeTab === 'schedule' && (
          <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
            Updating...
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tap-highlight flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'glass-pill-active' : 'glass-pill'}`}
            style={{ color: activeTab === tab.id ? '#fff' : theme.textSecondary }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {gamesLoading ? (
              <SectionSkeleton cards={4} />
            ) : games.length === 0 ? (
              <div
                className="rounded-lg py-8 text-center glass-section"
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No games scheduled for today
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Live Games */}
                {liveGames.length > 0 && (
                  <section
                    className="rounded-xl overflow-hidden glass-section"
                  >
                    <button
                      onClick={() => setLiveCollapsed(!liveCollapsed)}
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
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
                          <NHLGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Upcoming Games */}
                {upcomingGames.length > 0 && (
                  <section
                    className="rounded-xl overflow-hidden glass-section"
                  >
                    <button
                      onClick={() => setUpcomingCollapsed(!upcomingCollapsed)}
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
                          Upcoming
                        </h2>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs glass-pill"
                          style={{ color: theme.textSecondary }}
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
                        {upcomingGames.map((game) => (
                          <NHLGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Completed Games */}
                {completedGames.length > 0 && (
                  <section
                    className="rounded-xl overflow-hidden glass-section"
                  >
                    <button
                      onClick={() => setCompletedCollapsed(!completedCollapsed)}
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
                          Final
                        </h2>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs glass-pill"
                          style={{ color: theme.textSecondary }}
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
                        {completedGames.map((game) => (
                          <NHLGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <>
            {/* Player/Team Toggle */}
            <div className="flex gap-2 mb-4">
              {(['players', 'teams'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setStatsView(view)}
                  className={`tap-highlight flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${statsView === view ? 'glass-pill-active' : 'glass-pill'}`}
                  style={{ color: statsView === view ? '#fff' : theme.textSecondary }}
                >
                  {view === 'players' ? 'Player Leaders' : 'Team Rankings'}
                </button>
              ))}
            </div>

            {/* Player Leaders */}
            {statsView === 'players' && (
              <>
                {leadersLoading ? (
                  <StandingsSkeleton rows={5} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NHLLeaderCard title="Goals" leaders={leadersData?.goals || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Assists" leaders={leadersData?.assists || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Points" leaders={leadersData?.points || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Plus/Minus" leaders={leadersData?.plusMinus || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Goals Against Avg" leaders={leadersData?.gaa || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Save Percentage" leaders={leadersData?.savePct || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Wins" leaders={leadersData?.wins || []} theme={theme} darkMode={darkMode} />
                    <NHLLeaderCard title="Shutouts" leaders={leadersData?.shutouts || []} theme={theme} darkMode={darkMode} />
                  </div>
                )}
              </>
            )}

            {/* Team Rankings */}
            {statsView === 'teams' && (
              <>
                {teamRankingsLoading ? (
                  <StandingsSkeleton rows={5} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NHLTeamRankingCard title="Goals For (Per Game)" rankings={teamRankingsData?.goalsFor || []} theme={theme} darkMode={darkMode} />
                    <NHLTeamRankingCard title="Goals Against (Per Game)" rankings={teamRankingsData?.goalsAgainst || []} theme={theme} darkMode={darkMode} />
                    <NHLTeamRankingCard title="Goal Differential" rankings={teamRankingsData?.pointDiff || []} theme={theme} darkMode={darkMode} />
                    <NHLTeamRankingCard title="Points" rankings={teamRankingsData?.points || []} theme={theme} darkMode={darkMode} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <>
            {standingsLoading ? (
              <StandingsSkeleton />
            ) : (
              <>
                {/* Conference Toggle */}
                <div className="flex gap-2 mb-4">
                  {(['Eastern', 'Western'] as const).map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setSelectedConference(conf)}
                      className={`tap-highlight flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedConference === conf ? 'glass-pill-active' : 'glass-pill'}`}
                      style={{ color: selectedConference === conf ? '#fff' : theme.textSecondary }}
                    >
                      {conf}
                    </button>
                  ))}
                </div>

                {/* Standings by Division */}
                {(() => {
                  const currentConf = standingsData?.conferences?.find(c =>
                    c.name.includes(selectedConference)
                  );
                  if (!currentConf) return null;

                  return (
                    <div className="flex flex-col gap-4">
                      {currentConf.divisions.map((division) => (
                        <div
                          key={division.id}
                          className="rounded-xl overflow-hidden glass-card"
                        >
                          {/* Division Header */}
                          <div
                            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
                          >
                            {division.name}
                          </div>

                          {/* Column Headers */}
                          <div
                            className="flex items-center px-4 py-2 text-[10px] font-semibold uppercase"
                            style={{ color: theme.textSecondary }}
                          >
                            <span className="w-7">#</span>
                            <span className="flex-1">Team</span>
                            <span className="w-8 text-center">GP</span>
                            <span className="w-8 text-center">W</span>
                            <span className="w-8 text-center">L</span>
                            <span className="w-9 text-center">OTL</span>
                            <span className="w-9 text-center font-bold">PTS</span>
                            <span className="w-8 text-center hidden md:block">GF</span>
                            <span className="w-8 text-center hidden md:block">GA</span>
                            <span className="w-10 text-center hidden md:block">DIFF</span>
                            <span className="w-10 text-center hidden md:block">STK</span>
                          </div>

                          {/* Teams */}
                          {division.teams.map((team, index) => {
                            const isPlayoffSpot = index < 3;
                            const isPlayoffCutoff = index === 2;

                            return (
                              <div key={team.team.id}>
                                <Link
                                  href={`/nhl/team/${team.team.id}`}
                                  className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                                  style={{
                                    borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                                  }}
                                >
                                  <span
                                    className="w-7 text-[12px] font-mono font-bold"
                                    style={{ color: isPlayoffSpot ? theme.green : theme.textSecondary }}
                                  >
                                    {index + 1}
                                  </span>
                                  <div className="flex-1 flex items-center gap-2 min-w-0">
                                    <SafeImage
                                      src={team.team.logo}
                                      alt={team.team.name}
                                      className="h-6 w-6 object-contain logo-glow flex-shrink-0"
                                    />
                                    <span
                                      className="text-[13px] font-medium truncate"
                                      style={{ color: theme.text }}
                                    >
                                      {team.team.abbreviation}
                                    </span>
                                  </div>
                                  <span className="w-8 text-center text-[13px] font-mono" style={{ color: theme.textSecondary }}>
                                    {team.gamesPlayed}
                                  </span>
                                  <span className="w-8 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                    {team.wins}
                                  </span>
                                  <span className="w-8 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                    {team.losses}
                                  </span>
                                  <span className="w-9 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                    {team.otLosses}
                                  </span>
                                  <span className="w-9 text-center text-[13px] font-mono font-bold" style={{ color: theme.accent }}>
                                    {team.points}
                                  </span>
                                  <span className="w-8 text-center text-[12px] font-mono hidden md:block" style={{ color: theme.text }}>
                                    {team.goalsFor}
                                  </span>
                                  <span className="w-8 text-center text-[12px] font-mono hidden md:block" style={{ color: theme.text }}>
                                    {team.goalsAgainst}
                                  </span>
                                  <span
                                    className="w-10 text-center text-[12px] font-mono hidden md:block"
                                    style={{ color: team.goalDiff > 0 ? theme.green : team.goalDiff < 0 ? theme.red : theme.textSecondary }}
                                  >
                                    {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                                  </span>
                                  <span className="w-10 text-center text-[12px] font-mono hidden md:block" style={{ color: theme.textSecondary }}>
                                    {team.streak}
                                  </span>
                                </Link>

                                {/* Playoff Cutoff Line */}
                                {isPlayoffCutoff && (
                                  <div className="flex items-center gap-2 px-4 py-1.5">
                                    <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                    <span className="text-[9px] uppercase font-semibold" style={{ color: theme.green }}>
                                      Playoff Line
                                    </span>
                                    <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Legend */}
                      <div
                        className="flex items-center justify-center gap-6 px-4 py-2.5 text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.green }} />
                          <span style={{ color: theme.textSecondary }}>Top 3 (Auto Playoff)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.gold }} />
                          <span style={{ color: theme.textSecondary }}>Wild Card</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// Leader card component for NHL stats
function NHLLeaderCard({
  title,
  leaders,
  theme,
  darkMode,
}: {
  title: string;
  leaders: Array<{
    player: { id: string; name: string; headshot: string };
    team: { id: string; name: string; abbreviation: string; logo: string };
    value: number;
    displayValue: string;
  }>;
  theme: any;
  darkMode: boolean;
}) {
  if (leaders.length === 0) return null;

  return (
    <section className="rounded-xl overflow-hidden glass-card">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {title}
        </h3>
      </div>

      {leaders.map((leader, index) => (
        <Link
          key={leader.player.id}
          href={`/player/nhl/${leader.player.id}`}
          className="card-press flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
        >
          <span
            className="w-5 text-center text-sm font-bold"
            style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
          >
            {index + 1}
          </span>
          <div className="relative">
            {leader.player.headshot ? (
              <SafeImage
                src={leader.player.headshot}
                alt={leader.player.name}
                className="h-10 w-10 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: theme.bgTertiary }} />
            )}
            {leader.team.logo && (
              <SafeImage
                src={leader.team.logo}
                alt={leader.team.abbreviation}
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white object-contain logo-glow p-0.5"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
              {leader.player.name}
            </p>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {leader.team.abbreviation}
            </p>
          </div>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: index === 0 ? theme.gold : theme.text }}
          >
            {leader.displayValue}
          </span>
        </Link>
      ))}
    </section>
  );
}

// Team ranking card for NHL stats
function NHLTeamRankingCard({
  title,
  rankings,
  theme,
  darkMode,
}: {
  title: string;
  rankings: Array<{
    team: { id: string; name: string; abbreviation: string; logo: string };
    value: number;
    displayValue: string;
  }>;
  theme: any;
  darkMode: boolean;
}) {
  if (rankings.length === 0) return null;

  return (
    <section className="rounded-xl overflow-hidden glass-card">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {title}
        </h3>
      </div>

      {rankings.map((ranking, index) => (
        <Link
          key={ranking.team.id}
          href={`/nhl/team/${ranking.team.id}`}
          className="card-press flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
        >
          <span
            className="w-5 text-center text-sm font-bold"
            style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
          >
            {index + 1}
          </span>
          {ranking.team.logo ? (
            <SafeImage
              src={ranking.team.logo}
              alt={ranking.team.name}
              className="h-10 w-10 object-contain logo-glow"
              loading="lazy"
            />
          ) : (
            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: theme.bgTertiary }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
              {ranking.team.name}
            </p>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {ranking.team.abbreviation}
            </p>
          </div>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: index === 0 ? theme.gold : theme.text }}
          >
            {ranking.displayValue}
          </span>
        </Link>
      ))}
    </section>
  );
}
