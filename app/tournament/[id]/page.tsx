'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Sun, Moon, Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSafeBack } from '@/lib/use-safe-back';
import { BottomNav } from '@/components/BottomNav';
import { getTournamentBySlug } from '@/lib/constants/tournaments';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const goBack = useSafeBack('/all');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const tournamentSlug = params.id as string;

  const tournament = getTournamentBySlug(tournamentSlug);

  if (!tournament) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>Tournament not found</p>
        <button
          onClick={goBack}
          className={`mt-4 rounded-lg px-4 py-2 text-[12px] ${darkMode ? 'glass-pill' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="safe-top flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <button
          onClick={goBack}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>
            {tournament.name}
          </p>
          <p className="text-[13px] capitalize" style={{ color: theme.textSecondary }}>
            {tournament.sport} • {tournament.type}
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8">
        <div
          className={`rounded-xl p-8 text-center ${darkMode ? 'glass-card' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <Trophy size={48} className="mx-auto mb-4" style={{ color: theme.gold }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
            {tournament.name}
          </h2>
          {tournament.active ? (
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
              Tournament is currently in progress.
            </p>
          ) : (
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
              Tournament is not currently active.
            </p>
          )}

          {/* For UCL and other soccer tournaments, redirect to league page */}
          {tournament.sport === 'soccer' && (
            <button
              onClick={() => router.push(`/league/${tournament.slug}`)}
              className="mt-4 rounded-lg px-6 py-2.5 text-sm font-medium"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              View Fixtures & Standings
            </button>
          )}

          {/* For March Madness, we'd show bracket here */}
          {tournament.id === 'march-madness' && (
            <p className="text-xs mt-4" style={{ color: theme.textSecondary }}>
              The bracket will be available when the tournament begins in March.
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
