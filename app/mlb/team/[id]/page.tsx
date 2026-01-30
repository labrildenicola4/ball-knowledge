'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MLBTeamInfo } from '@/lib/types/mlb';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function MLBTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const { data: teamInfo, error, isLoading } = useSWR<MLBTeamInfo>(
    teamId ? `/api/mlb/team/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading team...</p>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Team not found'}</p>
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

  const { team, division, record, venue, schedule } = teamInfo;

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
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>Team Info</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>MLB Baseball</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Team Header */}
      <section className="px-4 py-8" style={{ backgroundColor: theme.bgSecondary }}>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="h-full w-full object-contain" />
            ) : (
              <div
                className="h-full w-full rounded-full"
                style={{ backgroundColor: team.color || theme.bgTertiary }}
              />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
              {team.displayName}
            </h1>
            <p className="text-[12px] mt-1" style={{ color: theme.textSecondary }}>
              {division.name}
            </p>
            {record && (
              <p className="text-lg font-mono mt-2" style={{ color: theme.accent }}>
                {record}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Venue Info */}
      {venue && (
        <section className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: theme.textSecondary }} />
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text }}>{venue.name}</p>
              {venue.city && (
                <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                  {venue.city} {venue.capacity && `· Capacity: ${venue.capacity.toLocaleString()}`}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      <section className="px-4 py-6">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: theme.textSecondary }}
        >
          Upcoming Games
        </h2>

        {schedule && schedule.length > 0 ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {schedule.map((game, idx) => (
              <Link
                key={game.id}
                href={`/mlb/game/${game.id}`}
                className="block"
              >
                <div
                  className="flex items-center gap-4 px-4 py-3 hover:opacity-80 transition-opacity"
                  style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none' }}
                >
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textSecondary }}>
                    <Calendar size={14} />
                    {game.date}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                      {game.isHome ? 'vs' : '@'}
                    </span>
                    {game.opponent.logo && (
                      <img
                        src={game.opponent.logo}
                        alt={game.opponent.name}
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium" style={{ color: theme.text }}>
                      {game.opponent.shortDisplayName}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[12px]" style={{ color: theme.textSecondary }}>
              No upcoming games scheduled
            </p>
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
