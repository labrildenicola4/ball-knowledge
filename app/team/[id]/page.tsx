'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, MapPin, Trophy, Users, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';

interface MatchTeam {
  id: number;
  name: string;
  logo: string;
  score: number | null;
}

interface TeamMatch {
  id: number;
  competition: string;
  competitionCode?: string;
  competitionLogo: string;
  date: string;
  fullDate: string;
  time: string;
  status: string;
  matchday?: number;
  home: MatchTeam;
  away: MatchTeam;
  isHome: boolean;
}

interface Competition {
  id: number;
  name: string;
  code: string;
  logo: string;
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
}

interface Player {
  id: number;
  name: string;
  position: string;
  nationality: string;
}

interface SquadGroup {
  position: string;
  players: Player[];
}

interface Statistics {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  ppg: string;
  cleanSheets: number;
  homeRecord: { wins: number; draws: number; losses: number };
  awayRecord: { wins: number; draws: number; losses: number };
  biggestWin: string;
  biggestLoss: string;
  winRate: number;
}

interface TeamData {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  founded: number;
  venue: string;
  clubColors: string;
  website: string;
  coach: string | null;
  coachNationality: string | null;
  competitions: Competition[];
  form: string[];
  finishedMatches: TeamMatch[];
  scheduledMatches: TeamMatch[];
  squad: SquadGroup[];
  statistics: Statistics;
}

type TabType = 'schedule' | 'tables' | 'squad' | 'statistics';

// Domestic league codes - these should be prioritized
const DOMESTIC_LEAGUES = ['PD', 'PL', 'SA', 'BL1', 'FL1', 'BSA', 'DED', 'PPL', 'ELC'];

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Tables tab state
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Schedule filter
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'upcoming' | 'results'>('all');

  const teamId = params.id;

  useEffect(() => {
    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/team/${teamId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Team not found');
          } else if (res.status === 429) {
            setError('Rate limited - please wait a moment');
          } else {
            throw new Error('Failed to fetch team');
          }
          return;
        }
        const data = await res.json();
        setTeam(data);

        // Set default competition to domestic league
        if (data.competitions && data.competitions.length > 0) {
          const domesticLeague = data.competitions.find((c: Competition) =>
            DOMESTIC_LEAGUES.includes(c.code)
          );
          setSelectedCompetition(domesticLeague?.code || data.competitions[0].code);
        }
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Failed to load team details');
      } finally {
        setLoading(false);
      }
    }
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  // Fetch standings when competition changes
  useEffect(() => {
    async function fetchStandings() {
      if (!selectedCompetition) return;

      setStandingsLoading(true);
      try {
        const res = await fetch(`/api/standings?league=${selectedCompetition}`);
        if (res.ok) {
          const data = await res.json();
          setStandings(data.standings || []);
        } else {
          setStandings([]);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
        setStandings([]);
      } finally {
        setStandingsLoading(false);
      }
    }

    if (activeTab === 'tables') {
      fetchStandings();
    }
  }, [selectedCompetition, activeTab]);

  // Form indicator component
  const FormIndicator = ({ form }: { form: string[] }) => (
    <div className="flex gap-1">
      {form.map((result, i) => (
        <span
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
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

  // Match row component
  const MatchRow = ({ match, showResult }: { match: TeamMatch; showResult: boolean }) => {
    const opponent = match.isHome ? match.away : match.home;
    const teamScore = match.isHome ? match.home.score : match.away.score;
    const opponentScore = match.isHome ? match.away.score : match.home.score;

    // Determine result color
    let resultColor = theme.textSecondary;
    if (showResult && teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) resultColor = theme.green;
      else if (teamScore < opponentScore) resultColor = theme.red;
      else resultColor = theme.gold;
    }

    return (
      <Link href={`/match/${match.id}`}>
        <div
          className="flex items-center gap-3 rounded-lg p-3 transition-opacity hover:opacity-80"
          style={{ backgroundColor: theme.bgTertiary }}
        >
          {/* Competition logo */}
          <img src={match.competitionLogo} alt="" className="h-5 w-5 object-contain" />

          {/* Date */}
          <div className="w-14 text-center">
            <p className="text-xs" style={{ color: theme.textSecondary }}>{match.date}</p>
          </div>

          {/* Home/Away indicator */}
          <span
            className="w-7 rounded px-1.5 py-0.5 text-center text-[10px] font-medium"
            style={{
              backgroundColor: match.isHome ? theme.accent : theme.bgSecondary,
              color: match.isHome ? '#fff' : theme.textSecondary,
            }}
          >
            {match.isHome ? 'H' : 'A'}
          </span>

          {/* Opponent */}
          <div className="flex flex-1 items-center gap-2">
            <img src={opponent.logo} alt={opponent.name} className="h-6 w-6 object-contain" />
            <span className="text-sm font-medium truncate" style={{ color: theme.text }}>
              {opponent.name}
            </span>
          </div>

          {/* Score/Time */}
          <div className="text-right min-w-[50px]">
            {showResult ? (
              <span className="font-mono text-sm font-semibold" style={{ color: resultColor }}>
                {teamScore} - {opponentScore}
              </span>
            ) : (
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                {match.time}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  // Stat card component
  const StatCard = ({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) => (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <p className="text-2xl font-semibold" style={{ color: theme.text }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{label}</p>
      {subValue && (
        <p className="text-[10px] mt-0.5" style={{ color: theme.accent }}>{subValue}</p>
      )}
    </div>
  );

  // Get selected competition details
  const selectedCompetitionData = team?.competitions.find(c => c.code === selectedCompetition);

  // Get filtered matches for schedule
  const getFilteredMatches = () => {
    if (!team) return [];

    if (scheduleFilter === 'upcoming') {
      return team.scheduledMatches;
    } else if (scheduleFilter === 'results') {
      return team.finishedMatches;
    } else {
      // All - combine and sort by date
      const all = [...team.finishedMatches, ...team.scheduledMatches];
      return all.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center transition-theme" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-sm" style={{ color: theme.textSecondary }}>Loading team...</p>
      </div>
    );
  }

  // Error state
  if (error || !team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center transition-theme" style={{ backgroundColor: theme.bg }}>
        <p className="text-sm" style={{ color: theme.red }}>{error || 'Team not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg px-4 py-2 text-sm"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

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
          <p className="text-base font-semibold" style={{ color: theme.text }}>{team.name}</p>
          {team.tla && (
            <p className="text-xs" style={{ color: theme.textSecondary }}>{team.tla}</p>
          )}
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Team Hero Section */}
      <section className="px-4 py-5" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex flex-col items-center text-center">
          {/* Crest */}
          <div className="mb-3 h-20 w-20">
            <img src={team.crest} alt={team.name} className="h-full w-full object-contain" />
          </div>

          {/* Name */}
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>{team.name}</h1>

          {/* Form */}
          {team.form.length > 0 && (
            <div className="mt-3">
              <FormIndicator form={team.form} />
            </div>
          )}

          {/* Team Info Row */}
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs" style={{ color: theme.textSecondary }}>
            {team.venue && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{team.venue}</span>
              </div>
            )}
            {team.coach && (
              <div className="flex items-center gap-1">
                <Trophy size={12} />
                <span>{team.coach}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {(['schedule', 'tables', 'squad', 'statistics'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors capitalize"
            style={{
              color: activeTab === tab ? theme.accent : theme.textSecondary,
              borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="px-4 py-4">
            {/* Filter buttons */}
            <div className="flex gap-2 mb-4">
              {(['all', 'upcoming', 'results'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setScheduleFilter(filter)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium capitalize"
                  style={{
                    backgroundColor: scheduleFilter === filter ? theme.accent : theme.bgSecondary,
                    color: scheduleFilter === filter ? '#fff' : theme.textSecondary,
                    border: `1px solid ${scheduleFilter === filter ? theme.accent : theme.border}`,
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Matches list */}
            {filteredMatches.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    showResult={match.status === 'FT'}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No matches found
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="px-4 py-4">
            {/* Competition Dropdown */}
            {team.competitions.length > 0 && (
              <div className="relative mb-4">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-3">
                    {selectedCompetitionData && (
                      <img src={selectedCompetitionData.logo} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="text-sm font-medium" style={{ color: theme.text }}>
                      {selectedCompetitionData?.name || 'Select Competition'}
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      color: theme.textSecondary,
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg shadow-lg"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    {team.competitions.map((comp) => (
                      <button
                        key={comp.code}
                        onClick={() => {
                          setSelectedCompetition(comp.code);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: comp.code === selectedCompetition ? `${theme.accent}20` : 'transparent',
                          borderBottom: `1px solid ${theme.border}`,
                        }}
                      >
                        <img src={comp.logo} alt="" className="h-5 w-5 object-contain" />
                        <span
                          className="text-sm"
                          style={{
                            color: comp.code === selectedCompetition ? theme.accent : theme.text,
                            fontWeight: comp.code === selectedCompetition ? 600 : 400,
                          }}
                        >
                          {comp.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Standings Table */}
            {standingsLoading ? (
              <div className="py-8 text-center">
                <div
                  className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
              </div>
            ) : standings.length > 0 ? (
              <div
                className="overflow-hidden rounded-xl"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                {/* Header */}
                <div
                  className="grid grid-cols-[28px_1fr_36px_36px_44px] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                >
                  <span>#</span>
                  <span>Club</span>
                  <span className="text-center">P</span>
                  <span className="text-center">GD</span>
                  <span className="text-center">Pts</span>
                </div>

                {/* Rows */}
                {standings.map((standing) => {
                  const isCurrentTeam = standing.teamId === team.id;
                  return (
                    <Link
                      key={standing.teamId}
                      href={`/team/${standing.teamId}`}
                      className="grid grid-cols-[28px_1fr_36px_36px_44px] items-center px-3 py-3 transition-opacity hover:opacity-80"
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                        backgroundColor: isCurrentTeam ? `${theme.accent}30` : 'transparent',
                        borderLeft: isCurrentTeam ? `3px solid ${theme.accent}` : '3px solid transparent',
                      }}
                    >
                      <span
                        className="font-mono text-sm"
                        style={{
                          color: standing.position <= 4 ? theme.accent : theme.textSecondary,
                          fontWeight: standing.position <= 4 || isCurrentTeam ? 600 : 400,
                        }}
                      >
                        {standing.position}
                      </span>

                      <span
                        className="flex items-center gap-2 text-[14px]"
                        style={{ fontWeight: isCurrentTeam ? 600 : 500, color: theme.text }}
                      >
                        {standing.logo && (
                          <img src={standing.logo} alt={standing.team} className="h-5 w-5 object-contain" />
                        )}
                        <span className="truncate">{standing.team}</span>
                      </span>

                      <span
                        className="font-mono text-center text-[13px]"
                        style={{ color: theme.textSecondary }}
                      >
                        {standing.played}
                      </span>

                      <span
                        className="font-mono text-center text-[13px]"
                        style={{
                          color: standing.gd.startsWith('+') ? theme.accent : standing.gd.startsWith('-') ? theme.red : theme.textSecondary,
                        }}
                      >
                        {standing.gd}
                      </span>

                      <span
                        className="font-mono text-center text-[14px]"
                        style={{ fontWeight: isCurrentTeam ? 700 : 600, color: theme.text }}
                      >
                        {standing.points}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-lg py-8 text-center"
                style={{ backgroundColor: theme.bgSecondary }}
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No standings available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Squad Tab */}
        {activeTab === 'squad' && (
          <div className="px-4 py-4">
            {/* Coach */}
            {team.coach && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Manager
                </h3>
                <div
                  className="flex items-center gap-3 rounded-xl p-4"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <Users size={20} color="#fff" />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: theme.text }}>{team.coach}</p>
                    {team.coachNationality && (
                      <p className="text-xs" style={{ color: theme.textSecondary }}>{team.coachNationality}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Squad by position */}
            {team.squad.length > 0 ? (
              team.squad.map((group) => (
                <div key={group.position} className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                    {group.position}
                  </h3>
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    {group.players.map((player, idx) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none' }}
                      >
                        <p className="text-sm font-medium" style={{ color: theme.text }}>{player.name}</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>{player.nationality}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Squad data not available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="px-4 py-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Played" value={team.statistics.played} />
              <StatCard label="Points" value={team.statistics.points} subValue={`${team.statistics.ppg} PPG`} />
              <StatCard label="Win Rate" value={`${team.statistics.winRate}%`} />
            </div>

            {/* Record */}
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Record
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Wins" value={team.statistics.wins} />
              <StatCard label="Draws" value={team.statistics.draws} />
              <StatCard label="Losses" value={team.statistics.losses} />
            </div>

            {/* Goals */}
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Goals
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Scored" value={team.statistics.goalsFor} />
              <StatCard label="Conceded" value={team.statistics.goalsAgainst} />
              <StatCard
                label="Difference"
                value={team.statistics.goalDifference > 0 ? `+${team.statistics.goalDifference}` : team.statistics.goalDifference}
              />
            </div>

            {/* Home/Away */}
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Home Record
            </h3>
            <div
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.green }}>{team.statistics.homeRecord.wins}W</span>
                <span style={{ color: theme.gold }}>{team.statistics.homeRecord.draws}D</span>
                <span style={{ color: theme.red }}>{team.statistics.homeRecord.losses}L</span>
              </div>
            </div>

            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Away Record
            </h3>
            <div
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.green }}>{team.statistics.awayRecord.wins}W</span>
                <span style={{ color: theme.gold }}>{team.statistics.awayRecord.draws}D</span>
                <span style={{ color: theme.red }}>{team.statistics.awayRecord.losses}L</span>
              </div>
            </div>

            {/* Other stats */}
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Other
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Clean Sheets" value={team.statistics.cleanSheets} />
              <StatCard label="Biggest Win" value={team.statistics.biggestWin} />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
