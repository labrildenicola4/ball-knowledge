'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, Trophy, BarChart3, ChevronLeft, Heart } from 'lucide-react';
import { useFavorites } from '@/lib/use-favorites';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { NBAGameCard } from '@/components/nba/NBAGameCard';
import { useTheme } from '@/lib/theme';
import { BasketballGame } from '@/lib/types/basketball';
import { NBALeaders, NBAStandings, NBATeamRankings } from '@/lib/api-espn-nba';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'schedule' | 'stats' | 'standings';
type StatsView = 'players' | 'teams';

export default function NBAHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [statsView, setStatsView] = useState<StatsView>('players');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [selectedConference, setSelectedConference] = useState<'Eastern' | 'Western'>('Eastern');
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();

  // Fetch games
  const { data: gamesData, isLoading: gamesLoading, mutate, isValidating } = useSWR<{
    games: BasketballGame[];
    count: number;
  }>('/api/nba/games', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Fetch standings
  const { data: standingsData, isLoading: standingsLoading } = useSWR<NBAStandings>(
    activeTab === 'standings' ? '/api/nba/standings' : null,
    fetcher
  );

  // Fetch player leaders
  const { data: leadersData, isLoading: leadersLoading } = useSWR<NBALeaders>(
    activeTab === 'stats' && statsView === 'players' ? '/api/nba/leaders' : null,
    fetcher
  );

  // Fetch team rankings
  const { data: teamRankingsData, isLoading: teamRankingsLoading } = useSWR<NBATeamRankings>(
    activeTab === 'stats' && statsView === 'teams' ? '/api/nba/team-rankings' : null,
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
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/all"
              className="flex items-center justify-center rounded-full p-1.5 -ml-1.5 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: theme.bgSecondary }}
            >
              <ChevronLeft size={20} style={{ color: theme.text }} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                NBA
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
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
              style={{
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
              }}
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

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {gamesLoading ? (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading games...
                </p>
              </div>
            ) : games.length === 0 ? (
              <div
                className="rounded-lg py-8 text-center"
                style={{ backgroundColor: theme.bgSecondary }}
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
                          <NBAGameCard key={game.id} game={game} />
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
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
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
                        {upcomingGames.map((game) => (
                          <NBAGameCard key={game.id} game={game} />
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
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
                          Final
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
                        {completedGames.map((game) => (
                          <NBAGameCard key={game.id} game={game} />
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
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize"
                  style={{
                    backgroundColor: statsView === view ? theme.accent : theme.bgSecondary,
                    color: statsView === view ? '#fff' : theme.textSecondary,
                    border: `1px solid ${statsView === view ? theme.accent : theme.border}`,
                  }}
                >
                  {view === 'players' ? 'Player Leaders' : 'Team Rankings'}
                </button>
              ))}
            </div>

            {/* Player Leaders */}
            {statsView === 'players' && (
              <>
                {leadersLoading ? (
                  <div className="py-8 text-center">
                    <div
                      className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                      style={{ color: theme.accent }}
                    />
                    <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                      Loading player leaders...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LeaderCard
                      title="Points Per Game"
                      leaders={leadersData?.points || []}
                      theme={theme}
                    />
                    <LeaderCard
                      title="Rebounds Per Game"
                      leaders={leadersData?.rebounds || []}
                      theme={theme}
                    />
                    <LeaderCard
                      title="Assists Per Game"
                      leaders={leadersData?.assists || []}
                      theme={theme}
                    />
                    <LeaderCard
                      title="Steals Per Game"
                      leaders={leadersData?.steals || []}
                      theme={theme}
                    />
                    <LeaderCard
                      title="Blocks Per Game"
                      leaders={leadersData?.blocks || []}
                      theme={theme}
                    />
                  </div>
                )}
              </>
            )}

            {/* Team Rankings */}
            {statsView === 'teams' && (
              <>
                {teamRankingsLoading ? (
                  <div className="py-8 text-center">
                    <div
                      className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                      style={{ color: theme.accent }}
                    />
                    <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                      Loading team rankings...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TeamRankingCard
                      title="Points Per Game"
                      rankings={teamRankingsData?.points || []}
                      theme={theme}
                    />
                    <TeamRankingCard
                      title="Rebounds Per Game"
                      rankings={teamRankingsData?.rebounds || []}
                      theme={theme}
                    />
                    <TeamRankingCard
                      title="Assists Per Game"
                      rankings={teamRankingsData?.assists || []}
                      theme={theme}
                    />
                    <TeamRankingCard
                      title="Field Goal %"
                      rankings={teamRankingsData?.fieldGoalPct || []}
                      theme={theme}
                    />
                    <TeamRankingCard
                      title="3-Point %"
                      rankings={teamRankingsData?.threePointPct || []}
                      theme={theme}
                    />
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
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading standings...
                </p>
              </div>
            ) : (
              <>
                {/* Conference Toggle */}
                <div className="flex gap-2 mb-4">
                  {(['Eastern', 'Western'] as const).map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setSelectedConference(conf)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: selectedConference === conf ? theme.accent : theme.bgSecondary,
                        color: selectedConference === conf ? '#fff' : theme.textSecondary,
                        border: `1px solid ${selectedConference === conf ? theme.accent : theme.border}`,
                      }}
                    >
                      {conf}
                    </button>
                  ))}
                </div>

                {/* Standings Table */}
                {(() => {
                  const currentConf = standingsData?.conferences?.find(c =>
                    c.name.includes(selectedConference)
                  );
                  if (!currentConf) return null;

                  return (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center px-4 py-2.5 text-[10px] font-semibold uppercase"
                        style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                      >
                        <span className="w-7">#</span>
                        <span className="flex-1">Team</span>
                        <span className="w-10 text-center">W</span>
                        <span className="w-10 text-center">L</span>
                        <span className="w-12 text-center">PCT</span>
                        <span className="w-10 text-center">GB</span>
                      </div>

                      {/* Teams */}
                      {currentConf.teams.map((team, index) => {
                        const isPlayoffSpot = team.seed <= 6;
                        const isPlayIn = team.seed >= 7 && team.seed <= 10;
                        const isPlayoffCutoff = team.seed === 6;
                        const isPlayInCutoff = team.seed === 10;

                        return (
                          <div key={team.id}>
                            <div
                              className="flex items-center px-4 py-2.5"
                              style={{
                                borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                              }}
                            >
                              <Link
                                href={`/nba/team/${team.id}`}
                                className="flex items-center flex-1 hover:opacity-80 transition-opacity"
                              >
                                <span
                                  className="w-7 text-[12px] font-mono font-bold"
                                  style={{ color: isPlayoffSpot ? theme.green : isPlayIn ? theme.gold : theme.textSecondary }}
                                >
                                  {team.seed}
                                </span>
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="h-6 w-6 object-contain flex-shrink-0"
                                  />
                                  <span
                                    className="text-[13px] font-medium truncate"
                                    style={{ color: theme.text }}
                                  >
                                    {team.abbreviation}
                                  </span>
                                </div>
                                <span className="w-10 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                  {team.wins}
                                </span>
                                <span className="w-10 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                  {team.losses}
                                </span>
                                <span className="w-12 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                                  {(team.winPct * 100).toFixed(1)}
                                </span>
                                <span className="w-10 text-center text-[12px] font-mono" style={{ color: theme.textSecondary }}>
                                  {team.gamesBehind === 0 ? '-' : team.gamesBehind}
                                </span>
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!isLoggedIn) {
                                    alert('Please sign in to save favorites');
                                    return;
                                  }
                                  toggleFavorite('nba_team', Number(team.id));
                                }}
                                className="ml-2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
                              >
                                <Heart
                                  size={16}
                                  color={isFavorite('nba_team', Number(team.id)) ? '#D4AF37' : theme.textSecondary}
                                  fill={isFavorite('nba_team', Number(team.id)) ? '#D4AF37' : 'transparent'}
                                />
                              </button>
                            </div>

                            {/* Playoff Cutoff Line */}
                            {isPlayoffCutoff && (
                              <div className="flex items-center gap-2 px-4 py-1.5" style={{ backgroundColor: theme.bgTertiary }}>
                                <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                <span className="text-[9px] uppercase font-semibold" style={{ color: theme.green }}>
                                  Playoff Line
                                </span>
                                <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                              </div>
                            )}

                            {/* Play-In Cutoff Line */}
                            {isPlayInCutoff && (
                              <div className="flex items-center gap-2 px-4 py-1.5" style={{ backgroundColor: theme.bgTertiary }}>
                                <div className="flex-1 h-px" style={{ backgroundColor: theme.gold }} />
                                <span className="text-[9px] uppercase font-semibold" style={{ color: theme.gold }}>
                                  Play-In Line
                                </span>
                                <div className="flex-1 h-px" style={{ backgroundColor: theme.gold }} />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Legend */}
                      <div
                        className="flex items-center justify-center gap-6 px-4 py-2.5 text-[10px]"
                        style={{ backgroundColor: theme.bgTertiary, borderTop: `1px solid ${theme.border}` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.green }} />
                          <span style={{ color: theme.textSecondary }}>Playoffs (1-6)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.gold }} />
                          <span style={{ color: theme.textSecondary }}>Play-In (7-10)</span>
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

// Leader Card Component
function LeaderCard({
  title,
  leaders,
  theme,
}: {
  title: string;
  leaders: Array<{
    player: { id: string; name: string; headshot: string };
    team: { id: string; name: string; abbreviation: string; logo: string };
    value: number;
    displayValue: string;
  }>;
  theme: any;
}) {
  if (leaders.length === 0) return null;

  return (
    <section
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {title}
        </h3>
      </div>

      {leaders.map((leader, index) => (
        <Link
          key={leader.player.id}
          href={`/nba/team/${leader.team.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
          style={{ borderBottom: index < leaders.length - 1 ? `1px solid ${theme.border}` : 'none' }}
        >
          <span
            className="w-5 text-center text-sm font-bold"
            style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
          >
            {index + 1}
          </span>
          <div className="relative">
            {leader.player.headshot ? (
              <img
                src={leader.player.headshot}
                alt={leader.player.name}
                className="h-10 w-10 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full"
                style={{ backgroundColor: theme.bgTertiary }}
              />
            )}
            {leader.team.logo && (
              <img
                src={leader.team.logo}
                alt={leader.team.abbreviation}
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white object-contain p-0.5"
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

// Team Ranking Card Component
function TeamRankingCard({
  title,
  rankings,
  theme,
}: {
  title: string;
  rankings: Array<{
    team: { id: string; name: string; abbreviation: string; logo: string };
    value: number;
    displayValue: string;
  }>;
  theme: any;
}) {
  if (rankings.length === 0) return null;

  return (
    <section
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {title}
        </h3>
      </div>

      {rankings.map((ranking, index) => (
        <Link
          key={ranking.team.id}
          href={`/nba/team/${ranking.team.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
          style={{ borderBottom: index < rankings.length - 1 ? `1px solid ${theme.border}` : 'none' }}
        >
          <span
            className="w-5 text-center text-sm font-bold"
            style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
          >
            {index + 1}
          </span>
          {ranking.team.logo ? (
            <img
              src={ranking.team.logo}
              alt={ranking.team.name}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full"
              style={{ backgroundColor: theme.bgTertiary }}
            />
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
