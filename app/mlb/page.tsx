'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, Trophy, BarChart3, ChevronLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MLBGameCard } from '@/components/mlb/MLBGameCard';
import { useTheme } from '@/lib/theme';
import { MLBGame, MLBStanding } from '@/lib/types/mlb';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'schedule' | 'stats' | 'standings';
type StatsView = 'players' | 'teams';
type League = 'AL' | 'NL';

interface MLBStandingsResponse {
  standings: Array<{
    division: string;
    standings: MLBStanding[];
  }>;
  count: number;
}

// MLB Teams by Division (for offseason display)
const MLB_TEAMS = {
  'American League East': [
    { id: '2', name: 'Baltimore Orioles', abbreviation: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png' },
    { id: '1', name: 'Boston Red Sox', abbreviation: 'BOS', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png' },
    { id: '10', name: 'New York Yankees', abbreviation: 'NYY', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png' },
    { id: '30', name: 'Tampa Bay Rays', abbreviation: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png' },
    { id: '14', name: 'Toronto Blue Jays', abbreviation: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png' },
  ],
  'American League Central': [
    { id: '4', name: 'Chicago White Sox', abbreviation: 'CHW', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png' },
    { id: '5', name: 'Cleveland Guardians', abbreviation: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png' },
    { id: '6', name: 'Detroit Tigers', abbreviation: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png' },
    { id: '7', name: 'Kansas City Royals', abbreviation: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png' },
    { id: '9', name: 'Minnesota Twins', abbreviation: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png' },
  ],
  'American League West': [
    { id: '11', name: 'Athletics', abbreviation: 'ATH', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/ath.png' },
    { id: '18', name: 'Houston Astros', abbreviation: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png' },
    { id: '3', name: 'Los Angeles Angels', abbreviation: 'LAA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png' },
    { id: '12', name: 'Seattle Mariners', abbreviation: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png' },
    { id: '13', name: 'Texas Rangers', abbreviation: 'TEX', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png' },
  ],
  'National League East': [
    { id: '15', name: 'Atlanta Braves', abbreviation: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png' },
    { id: '28', name: 'Miami Marlins', abbreviation: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png' },
    { id: '21', name: 'New York Mets', abbreviation: 'NYM', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png' },
    { id: '22', name: 'Philadelphia Phillies', abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png' },
    { id: '20', name: 'Washington Nationals', abbreviation: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png' },
  ],
  'National League Central': [
    { id: '16', name: 'Chicago Cubs', abbreviation: 'CHC', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
    { id: '17', name: 'Cincinnati Reds', abbreviation: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png' },
    { id: '8', name: 'Milwaukee Brewers', abbreviation: 'MIL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png' },
    { id: '23', name: 'Pittsburgh Pirates', abbreviation: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png' },
    { id: '24', name: 'St. Louis Cardinals', abbreviation: 'STL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png' },
  ],
  'National League West': [
    { id: '29', name: 'Arizona Diamondbacks', abbreviation: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png' },
    { id: '27', name: 'Colorado Rockies', abbreviation: 'COL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png' },
    { id: '19', name: 'Los Angeles Dodgers', abbreviation: 'LAD', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png' },
    { id: '25', name: 'San Diego Padres', abbreviation: 'SD', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png' },
    { id: '26', name: 'San Francisco Giants', abbreviation: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png' },
  ],
};

// Get offseason divisions with teams sorted alphabetically
function getOffseasonDivisions(league: League) {
  const prefix = league === 'AL' ? 'American League' : 'National League';
  const divisions = ['East', 'Central', 'West'];

  return divisions.map(div => {
    const divisionName = `${prefix} ${div}`;
    const teams = MLB_TEAMS[divisionName as keyof typeof MLB_TEAMS] || [];
    // Sort alphabetically by name
    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    return {
      division: divisionName,
      teams: sortedTeams,
    };
  });
}

export default function MLBHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [statsView, setStatsView] = useState<StatsView>('players');
  const [selectedLeague, setSelectedLeague] = useState<League>('AL');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const { theme } = useTheme();

  // Fetch games
  const { data: gamesData, isLoading: gamesLoading, mutate, isValidating } = useSWR<{
    games: MLBGame[];
  }>('/api/mlb/games', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Fetch standings
  const { data: standingsData, isLoading: standingsLoading } = useSWR<MLBStandingsResponse>(
    activeTab === 'standings' ? '/api/mlb/standings' : null,
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

  // Filter standings by league
  const alDivisions = standingsData?.standings?.filter(d =>
    d.division.includes('American League')
  ) || [];
  const nlDivisions = standingsData?.standings?.filter(d =>
    d.division.includes('National League')
  ) || [];
  const currentDivisions = selectedLeague === 'AL' ? alDivisions : nlDivisions;

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg }}
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
              className="tap-highlight flex items-center justify-center rounded-full p-2.5 -ml-1.5 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: theme.bgSecondary }}
            >
              <ChevronLeft size={20} style={{ color: theme.text }} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                MLB
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
              className="tap-highlight flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
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
            className="tap-highlight flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
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
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
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
                          <MLBGameCard key={game.id} game={game} />
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
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
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
                          <MLBGameCard key={game.id} game={game} />
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
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
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
                          <MLBGameCard key={game.id} game={game} />
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
                  className="tap-highlight flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize"
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

            {/* Stats Content */}
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            >
              <BarChart3 size={48} style={{ color: theme.textSecondary, margin: '0 auto 16px' }} />
              <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
                Stats Available During Season
              </p>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                {statsView === 'players'
                  ? 'Player leaders will be available when the MLB season begins.'
                  : 'Team rankings will be available when the MLB season begins.'
                }
              </p>
            </div>
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
                {/* League Toggle */}
                <div className="flex gap-2 mb-4">
                  {(['AL', 'NL'] as const).map((league) => (
                    <button
                      key={league}
                      onClick={() => setSelectedLeague(league)}
                      className="tap-highlight flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: selectedLeague === league ? theme.accent : theme.bgSecondary,
                        color: selectedLeague === league ? '#fff' : theme.textSecondary,
                        border: `1px solid ${selectedLeague === league ? theme.accent : theme.border}`,
                      }}
                    >
                      {league === 'AL' ? 'American League' : 'National League'}
                    </button>
                  ))}
                </div>

                {/* Offseason Notice */}
                {standingsData?.standings?.length === 0 && (
                  <div
                    className="rounded-lg px-4 py-3 mb-4 text-center text-sm"
                    style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                  >
                    Offseason - Teams shown alphabetically
                  </div>
                )}

                {/* Divisions - Use offseason data if no standings */}
                <div className="flex flex-col gap-4">
                  {(standingsData?.standings?.length === 0 ? getOffseasonDivisions(selectedLeague) : currentDivisions).map((division) => {
                    const isOffseason = standingsData?.standings?.length === 0;
                    const teams = isOffseason
                      ? (division as { division: string; teams: typeof MLB_TEAMS['American League East'] }).teams
                      : (division as { division: string; standings: MLBStanding[] }).standings;

                    return (
                      <div
                        key={division.division}
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                      >
                        {/* Division Header */}
                        <div
                          className="px-4 py-2.5 text-[11px] font-semibold uppercase"
                          style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                        >
                          {division.division.replace('American League ', '').replace('National League ', '')}
                        </div>

                        {/* Table Header */}
                        <div
                          className="flex items-center px-4 py-2 text-[9px] font-semibold uppercase"
                          style={{ color: theme.textSecondary, borderBottom: `1px solid ${theme.border}` }}
                        >
                          <span className="flex-1 pl-2">Team</span>
                          {!isOffseason && (
                            <>
                              <span className="w-10 text-center">W</span>
                              <span className="w-10 text-center">L</span>
                              <span className="w-12 text-center">PCT</span>
                              <span className="w-10 text-center">GB</span>
                            </>
                          )}
                        </div>

                        {/* Teams */}
                        {isOffseason ? (
                          // Offseason: Simple team list (alphabetical)
                          (teams as typeof MLB_TEAMS['American League East']).map((team, index) => (
                            <Link
                              key={team.id}
                              href={`/mlb/team/${team.id}`}
                              className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                              style={{
                                borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                              }}
                            >
                              <div className="flex-1 flex items-center gap-2 min-w-0">
                                <img
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
                          (teams as MLBStanding[]).map((team, index) => (
                            <div key={team.team.id}>
                              <Link
                                href={`/mlb/team/${team.team.id}`}
                                className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                                style={{
                                  borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                                }}
                              >
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <img
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
                                <span className="w-12 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                                  {team.pct}
                                </span>
                                <span className="w-10 text-center text-[12px] font-mono" style={{ color: theme.textSecondary }}>
                                  {team.gamesBack === '0' || team.gamesBack === '-' ? '-' : team.gamesBack}
                                </span>
                              </Link>

                              {/* Playoff Cutoff Line after 1st place (division winner) */}
                              {index === 0 && (teams as MLBStanding[]).length > 1 && (
                                <div className="flex items-center gap-2 px-4 py-1.5" style={{ backgroundColor: theme.bgTertiary }}>
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
                {(standingsData?.standings?.length ?? 0) > 0 && (
                  <div
                    className="flex items-center justify-center gap-6 mt-4 py-2.5 text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.green }} />
                      <span style={{ color: theme.textSecondary }}>Playoff Position</span>
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
