'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, Trophy, BarChart3, ChevronLeft, GitMerge } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { NFLGameCard } from '@/components/nfl/NFLGameCard';
import { NFLPlayoffBracket } from '@/components/nfl/NFLPlayoffBracket';
import { useTheme } from '@/lib/theme';
import { NFLPlayoffBracket as NFLPlayoffBracketData } from '@/lib/api-espn-nfl-bracket';
import { NFLGame, NFLStandings, NFLStanding, NFLStatLeader } from '@/lib/types/nfl';
import { SectionSkeleton, StandingsSkeleton } from '@/components/Skeleton';
import { SafeImage } from '@/components/SafeImage';

interface NFLLeadersData {
  passingYards: NFLStatLeader[];
  rushingYards: NFLStatLeader[];
  receivingYards: NFLStatLeader[];
  passingTouchdowns: NFLStatLeader[];
  sacks: NFLStatLeader[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'schedule' | 'bracket' | 'stats' | 'standings';
type Conference = 'AFC' | 'NFC';

// NFL Teams by Division (for offseason display)
const NFL_TEAMS = {
  'AFC East': [
    { id: '2', name: 'Buffalo Bills', abbreviation: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
    { id: '15', name: 'Miami Dolphins', abbreviation: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
    { id: '17', name: 'New England Patriots', abbreviation: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
    { id: '20', name: 'New York Jets', abbreviation: 'NYJ', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
  ],
  'AFC North': [
    { id: '33', name: 'Baltimore Ravens', abbreviation: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
    { id: '4', name: 'Cincinnati Bengals', abbreviation: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
    { id: '5', name: 'Cleveland Browns', abbreviation: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
    { id: '23', name: 'Pittsburgh Steelers', abbreviation: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  ],
  'AFC South': [
    { id: '34', name: 'Houston Texans', abbreviation: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
    { id: '11', name: 'Indianapolis Colts', abbreviation: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
    { id: '30', name: 'Jacksonville Jaguars', abbreviation: 'JAX', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
    { id: '10', name: 'Tennessee Titans', abbreviation: 'TEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
  ],
  'AFC West': [
    { id: '7', name: 'Denver Broncos', abbreviation: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
    { id: '12', name: 'Kansas City Chiefs', abbreviation: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
    { id: '13', name: 'Las Vegas Raiders', abbreviation: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
    { id: '24', name: 'Los Angeles Chargers', abbreviation: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
  ],
  'NFC East': [
    { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
    { id: '19', name: 'New York Giants', abbreviation: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
    { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
    { id: '28', name: 'Washington Commanders', abbreviation: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
  ],
  'NFC North': [
    { id: '3', name: 'Chicago Bears', abbreviation: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
    { id: '8', name: 'Detroit Lions', abbreviation: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
    { id: '9', name: 'Green Bay Packers', abbreviation: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
    { id: '16', name: 'Minnesota Vikings', abbreviation: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
  ],
  'NFC South': [
    { id: '1', name: 'Atlanta Falcons', abbreviation: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
    { id: '29', name: 'Carolina Panthers', abbreviation: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
    { id: '18', name: 'New Orleans Saints', abbreviation: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
    { id: '27', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
  ],
  'NFC West': [
    { id: '22', name: 'Arizona Cardinals', abbreviation: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
    { id: '14', name: 'Los Angeles Rams', abbreviation: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
    { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
    { id: '26', name: 'Seattle Seahawks', abbreviation: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
  ],
};

// Get offseason divisions with teams sorted alphabetically
function getOffseasonDivisions(conference: Conference) {
  const divisions = ['East', 'North', 'South', 'West'];

  return divisions.map(div => {
    const divisionName = `${conference} ${div}`;
    const teams = NFL_TEAMS[divisionName as keyof typeof NFL_TEAMS] || [];
    // Sort alphabetically by name
    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    return {
      division: divisionName,
      teams: sortedTeams,
    };
  });
}

export default function NFLHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [selectedConference, setSelectedConference] = useState<Conference>('AFC');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const { theme, darkMode } = useTheme();

  // Fetch games
  const { data: gamesData, isLoading: gamesLoading, mutate, isValidating } = useSWR<{
    games: NFLGame[];
  }>('/api/nfl/games', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Fetch standings
  const { data: standingsData, isLoading: standingsLoading } = useSWR<NFLStandings>(
    activeTab === 'standings' ? '/api/nfl/standings' : null,
    fetcher
  );

  // Fetch player leaders
  const { data: leadersData, isLoading: leadersLoading } = useSWR<NFLLeadersData>(
    activeTab === 'stats' ? '/api/nfl/leaders' : null,
    fetcher
  );

  // Fetch playoff bracket
  const { data: bracketData, isLoading: bracketLoading } = useSWR<NFLPlayoffBracketData>(
    activeTab === 'bracket' ? '/api/nfl/bracket' : null,
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
    { id: 'bracket' as Tab, label: 'Bracket', icon: GitMerge },
    { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
    { id: 'standings' as Tab, label: 'Standings', icon: Trophy },
  ];

  // Get conference data from standings
  const currentConference = standingsData?.conferences?.find(c =>
    c.name.toUpperCase().includes(selectedConference)
  );


  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: 'transparent' }}
    >
      <Header />

      {/* Header */}
      <div
        className="px-4 py-4"
      >
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
                NFL
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
                          <NFLGameCard key={game.id} game={game} />
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
                          className="rounded-full px-2.5 py-0.5 text-xs"
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
                          <NFLGameCard key={game.id} game={game} />
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
                          className="rounded-full px-2.5 py-0.5 text-xs"
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
                          <NFLGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Bracket Tab */}
        {activeTab === 'bracket' && (
          <>
            {bracketLoading ? (
              <SectionSkeleton cards={2} />
            ) : bracketData ? (
              <NFLPlayoffBracket
                afc={bracketData.afc}
                nfc={bracketData.nfc}
                superBowl={bracketData.superBowl}
              />
            ) : (
              <div
                className="rounded-xl p-8 text-center glass-section"
              >
                <GitMerge size={48} style={{ color: theme.textSecondary, margin: '0 auto 16px' }} />
                <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
                  Playoff Bracket Coming Soon
                </p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  The NFL playoff bracket will be available once the postseason begins.
                </p>
              </div>
            )}
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <>
            {leadersLoading ? (
              <StandingsSkeleton rows={5} />
            ) : !leadersData?.passingYards?.length && !leadersData?.rushingYards?.length ? (
              <div
                className="rounded-xl p-8 text-center glass-section"
              >
                <BarChart3 size={48} style={{ color: theme.textSecondary, margin: '0 auto 16px' }} />
                <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
                  Stats Available During Season
                </p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Player statistics will be available during the NFL season.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LeaderCard
                  title="Passing Yards"
                  leaders={leadersData?.passingYards || []}
                  theme={theme}
                  darkMode={darkMode}
                />
                <LeaderCard
                  title="Rushing Yards"
                  leaders={leadersData?.rushingYards || []}
                  theme={theme}
                  darkMode={darkMode}
                />
                <LeaderCard
                  title="Receiving Yards"
                  leaders={leadersData?.receivingYards || []}
                  theme={theme}
                  darkMode={darkMode}
                />
                <LeaderCard
                  title="Passing Touchdowns"
                  leaders={leadersData?.passingTouchdowns || []}
                  theme={theme}
                  darkMode={darkMode}
                />
                <LeaderCard
                  title="Sacks"
                  leaders={leadersData?.sacks || []}
                  theme={theme}
                  darkMode={darkMode}
                />
              </div>
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
                  {(['AFC', 'NFC'] as const).map((conf) => (
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

                {/* Offseason Notice */}
                {!currentConference && (
                  <div
                    className="rounded-lg px-4 py-3 mb-4 text-center text-sm glass-pill"
                    style={{ color: theme.textSecondary }}
                  >
                    Offseason - Teams shown alphabetically
                  </div>
                )}

                {/* Divisions */}
                <div className="flex flex-col gap-4">
                  {(currentConference?.divisions || getOffseasonDivisions(selectedConference)).map((division) => {
                    const isOffseason = !currentConference;
                    const teams = isOffseason
                      ? (division as { division: string; teams: typeof NFL_TEAMS['AFC East'] }).teams
                      : (division as { id: string; name: string; teams: NFLStanding[] }).teams;

                    return (
                      <div
                        key={isOffseason ? (division as { division: string }).division : (division as { id: string }).id}
                        className="rounded-xl overflow-hidden glass-card"
                      >
                        {/* Division Header */}
                        <div
                          className="px-4 py-2.5 text-[11px] font-semibold uppercase"
                          style={{ color: theme.textSecondary }}
                        >
                          {isOffseason
                            ? (division as { division: string }).division.replace(`${selectedConference} `, '')
                            : (division as { name: string }).name.replace('American Football Conference ', '').replace('National Football Conference ', '')}
                        </div>

                        {/* Table Header */}
                        <div
                          className="flex items-center px-4 py-2 text-[9px] font-semibold uppercase"
                          style={{ color: theme.textSecondary }}
                        >
                          <span className="flex-1 pl-2">Team</span>
                          {!isOffseason && (
                            <>
                              <span className="w-10 text-center">W</span>
                              <span className="w-10 text-center">L</span>
                              <span className="w-8 text-center">T</span>
                              <span className="w-12 text-center">PCT</span>
                            </>
                          )}
                        </div>

                        {/* Teams */}
                        {isOffseason ? (
                          // Offseason: Simple team list (alphabetical)
                          (teams as typeof NFL_TEAMS['AFC East']).map((team, index) => (
                            <Link
                              key={team.id}
                              href={`/nfl/team/${team.id}`}
                              className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex-1 flex items-center gap-2 min-w-0">
                                <SafeImage
                                  src={team.logo}
                                  alt={team.name}
                                  className="h-6 w-6 object-contain logo-glow flex-shrink-0"
                                />
                                <span
                                  className="text-[13px] font-medium truncate"
                                  style={{ color: theme.text }}
                                >
                                  {team.name}
                                </span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          // In-season: Full standings
                          (teams as NFLStanding[]).map((team, index) => (
                            <div key={team.team.id}>
                              <Link
                                href={`/nfl/team/${team.team.id}`}
                                className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                              >
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
                                <span className="w-10 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                  {team.wins}
                                </span>
                                <span className="w-10 text-center text-[13px] font-mono" style={{ color: theme.text }}>
                                  {team.losses}
                                </span>
                                <span className="w-8 text-center text-[13px] font-mono" style={{ color: theme.textSecondary }}>
                                  {team.ties || 0}
                                </span>
                                <span className="w-12 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                                  {team.pct}
                                </span>
                              </Link>

                              {/* Playoff Cutoff Line after 1st place (division winner) */}
                              {index === 0 && (teams as NFLStanding[]).length > 1 && (
                                <div className="flex items-center gap-2 px-4 py-1.5">
                                  <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                  <span className="text-[9px] uppercase font-semibold" style={{ color: theme.green }}>
                                    Division Leader
                                  </span>
                                  <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend - only show during season */}
                {currentConference && (
                  <div
                    className="flex items-center justify-center gap-6 mt-4 py-2.5 text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.green }} />
                      <span style={{ color: theme.textSecondary }}>Division Winner</span>
                    </div>
                  </div>
                )}
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
  darkMode,
}: {
  title: string;
  leaders: NFLStatLeader[];
  theme: ReturnType<typeof useTheme>['theme'];
  darkMode: boolean;
}) {
  if (leaders.length === 0) return null;

  return (
    <section
      className="rounded-xl overflow-hidden glass-card"
    >
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {title}
        </h3>
      </div>

      {leaders.map((leader, index) => (
        <Link
          key={leader.player.id}
          href={`/player/nfl/${leader.player.id}`}
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
              <div
                className="h-10 w-10 rounded-full"
              />
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
