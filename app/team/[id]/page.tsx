'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Calendar, Trophy } from 'lucide-react';
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

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <section className="px-4 py-8" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex flex-col items-center text-center">
          {/* Crest */}
          <div className="mb-4 h-28 w-28">
            <img src={team.crest} alt={team.name} className="h-full w-full object-contain" />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>{team.name}</h1>

          {/* Club colors */}
          {team.clubColors && (
            <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>{team.clubColors}</p>
          )}

          {/* Form */}
          {team.form.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Recent Form
              </p>
              <FormIndicator form={team.form} />
            </div>
          )}
        </div>
      </section>

      {/* Team Info */}
      <section className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex flex-wrap justify-center gap-6">
          {team.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: theme.textSecondary }} />
              <span className="text-sm" style={{ color: theme.text }}>{team.venue}</span>
            </div>
          )}
          {team.founded && (
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: theme.textSecondary }} />
              <span className="text-sm" style={{ color: theme.text }}>Est. {team.founded}</span>
            </div>
          )}
          {team.coach && (
            <div className="flex items-center gap-2">
              <Trophy size={14} style={{ color: theme.textSecondary }} />
              <span className="text-sm" style={{ color: theme.text }}>{team.coach}</span>
            </div>
          )}
        </div>
      </section>

      {/* Competitions */}
      {team.competitions.length > 0 && (
        <section className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
            Competitions
          </h3>
          <div className="flex flex-wrap gap-2">
            {team.competitions.map((comp) => (
              <Link key={comp.id} href={`/standings?league=${comp.code}`}>
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <img src={comp.logo} alt={comp.name} className="h-4 w-4 object-contain" />
                  <span className="text-xs font-medium" style={{ color: theme.text }}>{comp.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {team.upcomingMatches.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
            Upcoming Matches
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
        <section className="px-4 py-4">
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
        <section className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            No match data available
          </p>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
