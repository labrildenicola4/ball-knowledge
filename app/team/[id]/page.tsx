'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, MapPin, Calendar, Trophy } from 'lucide-react';
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
  time: string;
  status: string;
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
  competitions: Competition[];
  form: string[];
  recentMatches: TeamMatch[];
  upcomingMatches: TeamMatch[];
}

// Domestic league codes - these should be prioritized
const DOMESTIC_LEAGUES = ['PD', 'PL', 'SA', 'BL1', 'FL1', 'BSA', 'DED', 'PPL', 'ELC'];

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'schedule' | 'tables'>('schedule');

  // Tables tab state
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
          <div className="w-16 text-center">
            <p className="text-xs" style={{ color: theme.textSecondary }}>{match.date}</p>
          </div>

          {/* Home/Away indicator */}
          <span
            className="w-8 rounded px-2 py-0.5 text-center text-[10px] font-medium"
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
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              {opponent.name}
            </span>
          </div>

          {/* Score/Time */}
          <div className="text-right">
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

  // Get selected competition details
  const selectedCompetitionData = team?.competitions.find(c => c.code === selectedCompetition);

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
      </header>

      {/* Team Hero Section */}
      <section className="px-4 py-6" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex flex-col items-center text-center">
          {/* Crest */}
          <div className="mb-3 h-24 w-24">
            <img src={team.crest} alt={team.name} className="h-full w-full object-contain" />
          </div>

          {/* Name */}
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>{team.name}</h1>

          {/* Club colors */}
          {team.clubColors && (
            <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>{team.clubColors}</p>
          )}

          {/* Form */}
          {team.form.length > 0 && (
            <div className="mt-3">
              <FormIndicator form={team.form} />
            </div>
          )}

          {/* Team Info Row */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs" style={{ color: theme.textSecondary }}>
            {team.venue && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{team.venue}</span>
              </div>
            )}
            {team.founded && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Est. {team.founded}</span>
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
      <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button
          onClick={() => setActiveTab('schedule')}
          className="flex-1 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'schedule' ? theme.accent : theme.textSecondary,
            borderBottom: activeTab === 'schedule' ? `2px solid ${theme.accent}` : '2px solid transparent',
          }}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className="flex-1 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'tables' ? theme.accent : theme.textSecondary,
            borderBottom: activeTab === 'tables' ? `2px solid ${theme.accent}` : '2px solid transparent',
          }}
        >
          Tables
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'schedule' ? (
          /* Schedule Tab */
          <div className="px-4 py-4">
            {/* Upcoming Matches */}
            {team.upcomingMatches.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Upcoming
                </h3>
                <div className="flex flex-col gap-2">
                  {team.upcomingMatches.map((match) => (
                    <MatchRow key={match.id} match={match} showResult={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Results */}
            {team.recentMatches.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Recent Results
                </h3>
                <div className="flex flex-col gap-2">
                  {team.recentMatches.map((match) => (
                    <MatchRow key={match.id} match={match} showResult={true} />
                  ))}
                </div>
              </section>
            )}

            {/* No matches fallback */}
            {team.upcomingMatches.length === 0 && team.recentMatches.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  No match data available
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Tables Tab */
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
                <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
                  Loading standings...
                </p>
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
                  No standings available for this competition
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
