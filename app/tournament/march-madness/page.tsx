'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Sun, Moon, Trophy, Calendar } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';

export default function MarchMadnessPage() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();

  // Check if we're in tournament season (March-April)
  const now = new Date();
  const month = now.getMonth();
  const isTournamentSeason = month >= 2 && month <= 3; // March (2) and April (3)

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
            NCAA March Madness
          </p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            Men's Basketball Tournament
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

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {/* Tournament Status Card */}
        <section
          className="rounded-xl p-6 text-center mb-4"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <Trophy size={48} className="mx-auto mb-4" style={{ color: theme.gold }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
            NCAA Tournament
          </h2>

          {isTournamentSeason ? (
            <>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
                style={{ backgroundColor: theme.green, color: '#fff' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Tournament Active
              </span>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Follow the bracket and all the action from the 2026 NCAA Tournament.
              </p>
            </>
          ) : (
            <>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
                style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
              >
                Off Season
              </span>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                The tournament bracket will be available in March when Selection Sunday occurs.
              </p>
            </>
          )}
        </section>

        {/* Quick Links */}
        <section
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
              Quick Links
            </h3>
          </div>
          <div className="flex flex-col">
            <button
              onClick={() => router.push('/basketball')}
              className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <Calendar size={18} style={{ color: theme.accent }} />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text }}>
                  Today's College Basketball Games
                </p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  View all NCAA games
                </p>
              </div>
            </button>
            <button
              onClick={() => router.push('/conference/acc')}
              className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <Trophy size={18} style={{ color: theme.gold }} />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text }}>
                  Conference Standings
                </p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  View conference standings and teams
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Bracket Placeholder */}
        {isTournamentSeason && (
          <section
            className="rounded-xl p-4 mt-4"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>
              Tournament Bracket
            </h3>
            <div
              className="rounded-lg p-8 text-center"
              style={{ backgroundColor: theme.bgTertiary, border: `1px dashed ${theme.border}` }}
            >
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Bracket visualization coming soon
              </p>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
