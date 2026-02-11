'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, Trophy, BarChart3, ChevronLeft, GitMerge } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { FootballGameCard } from '@/components/football/FootballGameCard';
import { CFBPlayoffBracket } from '@/components/football/CFBPlayoffBracket';
import { ConferenceStandingsTable, ConferenceStandingsTeam } from '@/components/ConferenceStandingsTable';
import { CFBPlayoffBracket as CFBPlayoffBracketData } from '@/lib/api-espn-cfb-bracket';
import { useTheme } from '@/lib/theme';
import { CollegeFootballGame, CollegeFootballRanking } from '@/lib/types/college-football';
import { MULTI_SPORT_CONFERENCES } from '@/lib/constants/unified-conferences';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'schedule' | 'bracket' | 'rankings' | 'standings';

// Football conferences for dropdown (only ones with football)
const FOOTBALL_CONFERENCES = [
  ...MULTI_SPORT_CONFERENCES.filter(c => c.football).slice(0, 4), // Power 4: ACC, Big 12, Big Ten, SEC
  ...MULTI_SPORT_CONFERENCES.filter(c => c.football).slice(4), // Group of 5
];

interface StandingsTeam {
  id: string;
  name: string;
  shortName?: string;
  logo: string;
  rank?: number;
  conferenceRecord?: string;
  overallRecord?: string;
}

export default function CollegeFootballHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [rankedCollapsed, setRankedCollapsed] = useState(false);
  const [otherCollapsed, setOtherCollapsed] = useState(false);
  const [selectedConference, setSelectedConference] = useState('acc');
  const { theme, darkMode } = useTheme();

  // Fetch games
  const { data: gamesData, isLoading: gamesLoading, mutate, isValidating } = useSWR<{
    games: CollegeFootballGame[];
    count: number;
  }>('/api/football/games', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Fetch rankings
  const { data: rankingsData, isLoading: rankingsLoading } = useSWR<{
    rankings: CollegeFootballRanking[];
  }>(
    activeTab === 'rankings' ? '/api/football/standings?rankings=true' : null,
    fetcher
  );

  // Fetch conference standings
  const { data: standingsData, isLoading: standingsLoading } = useSWR<{
    standings: StandingsTeam[];
  }>(
    activeTab === 'standings'
      ? `/api/football/standings?conference=${selectedConference}&rankings=false`
      : null,
    fetcher
  );

  // Fetch playoff bracket
  const { data: bracketData, isLoading: bracketLoading } = useSWR<CFBPlayoffBracketData>(
    activeTab === 'bracket' ? '/api/football/bracket' : null,
    fetcher
  );

  const games = gamesData?.games || [];
  const rankings = rankingsData?.rankings || [];
  const standings = standingsData?.standings || [];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Separate games into categories
  const liveGames = games.filter(g => g.status === 'in_progress');
  const rankedGames = games.filter(g =>
    g.status !== 'in_progress' &&
    (g.homeTeam.rank || g.awayTeam.rank)
  );
  const otherGames = games.filter(g =>
    g.status !== 'in_progress' &&
    !g.homeTeam.rank &&
    !g.awayTeam.rank
  );

  const tabs = [
    { id: 'schedule' as Tab, label: 'Schedule', icon: Calendar },
    { id: 'bracket' as Tab, label: 'Bracket', icon: GitMerge },
    { id: 'rankings' as Tab, label: 'Rankings', icon: Trophy },
    { id: 'standings' as Tab, label: 'Standings', icon: BarChart3 },
  ];

  const selectedConferenceInfo = FOOTBALL_CONFERENCES.find(c => c.id === selectedConference);

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
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
              className={`tap-highlight flex items-center justify-center rounded-full p-2.5 -ml-1.5 hover:opacity-70 transition-opacity ${darkMode ? 'glass-pill' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
            >
              <ChevronLeft size={20} style={{ color: theme.text }} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                College Football
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
              className={`tap-highlight flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${darkMode ? 'glass-pill' : ''}`}
              style={{
                ...(darkMode ? {} : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }),
                color: theme.textSecondary,
              }}
            >
              <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
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
            className={`tap-highlight flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${darkMode ? (activeTab === tab.id ? 'glass-pill-active' : 'glass-pill') : ''}`}
            style={{
              ...(darkMode ? {} : { backgroundColor: activeTab === tab.id ? theme.accent : theme.bgSecondary }),
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
                className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No games scheduled for today
                </p>
                <p className="text-xs mt-2" style={{ color: theme.textSecondary }}>
                  College football season runs August - January
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Live Games */}
                {liveGames.length > 0 && (
                  <section
                    className={`rounded-xl overflow-hidden ${darkMode ? 'glass-section live-glow' : ''}`}
                    style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
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
                          <FootballGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Ranked Matchups */}
                {rankedGames.length > 0 && (
                  <section
                    className={`rounded-xl overflow-hidden ${darkMode ? 'glass-section' : ''}`}
                    style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <button
                      onClick={() => setRankedCollapsed(!rankedCollapsed)}
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: rankedCollapsed ? 'none' : `1px solid ${theme.border}` }}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy size={16} style={{ color: theme.gold }} />
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
                          Ranked Matchups
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs ${darkMode ? 'glass-badge' : ''}`}
                          style={darkMode ? { color: theme.textSecondary } : { backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                        >
                          {rankedGames.length}
                        </span>
                      </div>
                      {rankedCollapsed ? (
                        <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                      ) : (
                        <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                      )}
                    </button>

                    {!rankedCollapsed && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                        {rankedGames.map((game) => (
                          <FootballGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Other Games */}
                {otherGames.length > 0 && (
                  <section
                    className={`rounded-xl overflow-hidden ${darkMode ? 'glass-section' : ''}`}
                    style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <button
                      onClick={() => setOtherCollapsed(!otherCollapsed)}
                      className="tap-highlight w-full flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: otherCollapsed ? 'none' : `1px solid ${theme.border}` }}
                    >
                      <div className="flex items-center gap-2">
                        <h2
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: theme.text }}
                        >
                          All Games
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs ${darkMode ? 'glass-badge' : ''}`}
                          style={darkMode ? { color: theme.textSecondary } : { backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                        >
                          {otherGames.length}
                        </span>
                      </div>
                      {otherCollapsed ? (
                        <ChevronDown size={18} style={{ color: theme.textSecondary }} />
                      ) : (
                        <ChevronUp size={18} style={{ color: theme.textSecondary }} />
                      )}
                    </button>

                    {!otherCollapsed && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                        {otherGames.map((game) => (
                          <FootballGameCard key={game.id} game={game} />
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
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading playoff bracket...
                </p>
              </div>
            ) : bracketData ? (
              <CFBPlayoffBracket
                firstRound={bracketData.firstRound}
                quarterfinals={bracketData.quarterfinals}
                semifinals={bracketData.semifinals}
                championship={bracketData.championship}
              />
            ) : (
              <div
                className={`rounded-xl p-8 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <GitMerge size={48} style={{ color: theme.textSecondary, margin: '0 auto 16px' }} />
                <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
                  CFP Bracket Coming Soon
                </p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  The College Football Playoff bracket will be available once selections are made.
                </p>
              </div>
            )}
          </>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <>
            {rankingsLoading ? (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
                <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
                  Loading rankings...
                </p>
              </div>
            ) : rankings.length === 0 ? (
              <div
                className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Rankings not available
                </p>
                <p className="text-xs mt-2" style={{ color: theme.textSecondary }}>
                  Rankings are released during the season
                </p>
              </div>
            ) : (
              <div
                className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <Trophy size={18} style={{ color: theme.gold }} />
                  <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                    AP Top 25
                  </h3>
                </div>

                {/* Header */}
                <div
                  className={`flex items-center px-4 py-2 text-[10px] font-semibold uppercase ${darkMode ? 'glass-badge' : ''}`}
                  style={darkMode ? { color: theme.textSecondary } : { backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                >
                  <span className="w-8">#</span>
                  <span className="flex-1">Team</span>
                  <span className="w-16 text-center">Record</span>
                  <span className="w-12 text-center">Pts</span>
                </div>

                {rankings.slice(0, 25).map((ranking, index) => (
                  <Link
                    key={ranking.team.id}
                    href={`/football/team/${ranking.team.id}`}
                    className="card-press flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                    style={{ borderTop: `1px solid ${theme.border}` }}
                  >
                    <span
                      className="w-8 text-[13px] font-bold"
                      style={{ color: index < 4 ? theme.gold : theme.textSecondary }}
                    >
                      {ranking.rank}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <img
                        src={ranking.team.logo}
                        alt={ranking.team.name}
                        className="h-6 w-6 object-contain logo-glow flex-shrink-0"
                      />
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{ color: theme.text }}
                      >
                        {ranking.team.name}
                      </span>
                    </div>
                    <span className="w-16 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                      {ranking.record || '-'}
                    </span>
                    <span className="w-12 text-center text-[12px] font-mono" style={{ color: theme.textSecondary }}>
                      -
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <>
            {/* Conference Dropdown */}
            <div className="mb-4">
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium appearance-none cursor-pointer ${darkMode ? 'glass-pill' : ''}`}
                style={{
                  ...(darkMode ? {} : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }),
                  color: theme.text,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                }}
              >
                {FOOTBALL_CONFERENCES.map(conf => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conference Standings View */}
            {standingsLoading ? (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
              </div>
            ) : (
              <ConferenceStandingsTable
                teams={standings.map((team): ConferenceStandingsTeam => {
                  const [confW, confL] = (team.conferenceRecord || '0-0').split('-').map(Number);
                  const [overallW, overallL] = (team.overallRecord || '0-0').split('-').map(Number);
                  return {
                    id: team.id,
                    name: team.name,
                    shortName: team.shortName,
                    logo: team.logo,
                    rank: team.rank,
                    conferenceWins: confW || 0,
                    conferenceLosses: confL || 0,
                    overallWins: overallW || 0,
                    overallLosses: overallL || 0,
                  };
                })}
                sport="football"
                emptyMessage={`Standings not available for ${selectedConferenceInfo?.shortName}`}
              />
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
