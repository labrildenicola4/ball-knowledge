'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Calendar, Trophy, TableIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MatchStandings } from '@/components/MatchStandings';

interface Team {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  score: number | null;
  form: string[];
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
  matchday: number;
  home: Team;
  away: Team;
  h2h: { total: number; homeWins: number; draws: number; awayWins: number };
  halfTimeScore: { home: number | null; away: number | null };
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const matchId = params.id;

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/match/${matchId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Match not found');
          } else {
            throw new Error('Failed to fetch match');
          }
          return;
        }
        const data = await res.json();
        setMatch(data);
      } catch (err) {
        console.error('Error fetching match:', err);
        setError('Failed to load match details');
      } finally {
        setLoading(false);
      }
    }
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  // Fetch standings when match is loaded and has a league code
  useEffect(() => {
    async function fetchStandings() {
      if (!match?.leagueCode) return;

      setStandingsLoading(true);
      try {
        const res = await fetch(`/api/standings?league=${match.leagueCode}`);
        if (res.ok) {
          const data = await res.json();
          setStandings(data.standings || []);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
      } finally {
        setStandingsLoading(false);
      }
    }

    fetchStandings();
  }, [match?.leagueCode]);

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

  // Form indicator component
  const FormIndicator = ({ form }: { form: string[] }) => (
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
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>{match.league}</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>Matchday {match.matchday}</p>
        </div>
        {isLive && (
          <span
            className="rounded-full px-3 py-1 text-[10px] font-medium"
            style={{ backgroundColor: theme.red, color: '#fff' }}
          >
            LIVE
          </span>
        )}
      </header>

      {/* Main Score Section */}
      <section className="px-4 py-8" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="mx-auto mb-3 h-20 w-20">
              <img src={match.home.logo} alt={match.home.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text }}>{match.home.name}</p>
            <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.home.shortName}</p>
            {homeForm.length > 0 && <FormIndicator form={homeForm} />}
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
                <span
                  className="mt-3 inline-block rounded-full px-4 py-1 text-[10px] font-medium"
                  style={{
                    backgroundColor: isLive ? theme.red : theme.bgTertiary,
                    color: isLive ? '#fff' : theme.textSecondary,
                  }}
                >
                  {match.status}
                </span>
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
            <div className="mx-auto mb-3 h-20 w-20">
              <img src={match.away.logo} alt={match.away.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text }}>{match.away.name}</p>
            <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.away.shortName}</p>
            {awayForm.length > 0 && <FormIndicator form={awayForm} />}
          </div>
        </div>
      </section>

      {/* Match Info */}
      <section className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
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

      {/* Head to Head */}
      {match.h2h.total > 0 && (
        <section className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} style={{ color: theme.accent }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Head to Head
            </h3>
            <span className="text-[10px]" style={{ color: theme.textSecondary }}>
              (Last {match.h2h.total} meetings)
            </span>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
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
              {match.h2h.total > 0 && (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* League Standings */}
      {match.leagueCode && standings.length > 0 && (
        <section className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <TableIcon size={14} style={{ color: theme.accent }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              League Table
            </h3>
          </div>
          <MatchStandings
            standings={standings}
            homeTeamId={match.home.id}
            awayTeamId={match.away.id}
            leagueName={match.league}
          />
        </section>
      )}

      {/* Standings loading */}
      {match.leagueCode && standingsLoading && (
        <section className="px-4 py-6">
          <div className="flex justify-center">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
          </div>
        </section>
      )}

      {/* Placeholder for no data */}
      {!match.h2h.total && !match.leagueCode && (
        <section className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-[12px]" style={{ color: theme.textSecondary }}>
              {isUpcoming ? 'Match details will be available after kickoff' : 'No additional data available'}
            </p>
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
