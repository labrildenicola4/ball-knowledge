'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, Sun, Moon, Trophy, Users } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Conference not found' : 'Failed to fetch');
  return res.json();
});

interface StandingTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
}

interface ConferenceData {
  conference: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    hasBaskeball: boolean;
    hasFootball: boolean;
  };
  basketball: {
    id: string;
    name: string;
    teams: StandingTeam[];
  } | null;
  football: {
    id: string;
    name: string;
    teams: StandingTeam[];
  } | null;
}

type Sport = 'basketball' | 'football';

export default function ConferencePage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const conferenceId = params.id as string;

  const [selectedSport, setSelectedSport] = useState<Sport>('basketball');

  const { data, error, isLoading } = useSWR<ConferenceData>(
    `/api/conference/${conferenceId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Update selected sport if current selection is not available
  const hasBasketball = data?.conference?.hasBaskeball ?? false;
  const hasFootball = data?.conference?.hasFootball ?? false;

  // Default to basketball if available, otherwise football
  const effectiveSport = selectedSport === 'basketball' && !hasBasketball && hasFootball
    ? 'football'
    : selectedSport === 'football' && !hasFootball && hasBasketball
    ? 'basketball'
    : selectedSport;

  const standings = effectiveSport === 'basketball' ? data?.basketball : data?.football;
  const teamLink = (teamId: string) =>
    effectiveSport === 'basketball'
      ? `/basketball/team/${teamId}`
      : `/football/team/${teamId}`;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading conference...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Conference not found'}</p>
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

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg }}>
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
            {data.conference.name}
          </p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {data.conference.shortName} Conference
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

      {/* Sport Selector (only show if both sports available) */}
      {hasBasketball && hasFootball && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSport('basketball')}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: effectiveSport === 'basketball' ? theme.accent : theme.bgSecondary,
                color: effectiveSport === 'basketball' ? '#fff' : theme.textSecondary,
                border: `1px solid ${effectiveSport === 'basketball' ? theme.accent : theme.border}`,
              }}
            >
              <span>Basketball</span>
            </button>
            <button
              onClick={() => setSelectedSport('football')}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: effectiveSport === 'football' ? theme.accent : theme.bgSecondary,
                color: effectiveSport === 'football' ? '#fff' : theme.textSecondary,
                border: `1px solid ${effectiveSport === 'football' ? theme.accent : theme.border}`,
              }}
            >
              <span>Football</span>
            </button>
          </div>
        </div>
      )}

      {/* Sport indicator if only one sport */}
      {(!hasBasketball || !hasFootball) && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: theme.bgSecondary, color: theme.textSecondary }}
          >
            {hasBasketball ? 'Basketball Only' : 'Football Only'}
          </span>
        </div>
      )}

      {/* Standings Section */}
      <main className="flex-1 px-4 py-4">
        <section
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          {/* Section Header */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <Trophy size={16} style={{ color: theme.gold }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
              {effectiveSport === 'basketball' ? 'Basketball' : 'Football'} Standings
            </h2>
            {standings?.teams && (
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs"
                style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
              >
                {standings.teams.length} teams
              </span>
            )}
          </div>

          {/* Table Header */}
          <div
            className="grid items-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: 'minmax(0, 1fr) 70px 70px',
              color: theme.textSecondary,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <span>Team</span>
            <span className="text-center">Conf</span>
            <span className="text-center">Overall</span>
          </div>

          {/* Team Rows */}
          {standings?.teams?.map((team, index) => (
            <Link
              key={team.id}
              href={teamLink(team.id)}
              className="grid items-center gap-2 px-4 py-3 transition-colors hover:bg-black/5"
              style={{
                gridTemplateColumns: 'minmax(0, 1fr) 70px 70px',
                borderBottom: index < (standings.teams.length - 1) ? `1px solid ${theme.border}` : 'none',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-5 text-center text-[11px] font-medium"
                  style={{ color: theme.textSecondary }}
                >
                  {index + 1}
                </span>
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="h-7 w-7 flex-shrink-0 object-contain logo-glow"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: theme.bgTertiary }}
                  />
                )}
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: theme.text }}
                >
                  {team.name}
                </span>
              </div>
              <span
                className="text-center text-sm font-mono"
                style={{ color: theme.text }}
              >
                {team.conferenceWins}-{team.conferenceLosses}
              </span>
              <span
                className="text-center text-sm font-mono"
                style={{ color: theme.textSecondary }}
              >
                {team.overallWins}-{team.overallLosses}
              </span>
            </Link>
          ))}

          {/* Empty state */}
          {(!standings?.teams || standings.teams.length === 0) && (
            <div className="px-4 py-8 text-center">
              <Users size={32} className="mx-auto mb-2" style={{ color: theme.textSecondary }} />
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No standings available for {effectiveSport}
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
