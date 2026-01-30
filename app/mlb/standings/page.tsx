'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MLBStandings } from '@/components/mlb/MLBStandings';
import { MLBStanding } from '@/lib/types/mlb';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MLBStandingsPage() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();

  const { data, isLoading } = useSWR<{
    standings: { division: string; standings: MLBStanding[] }[];
  }>(
    '/api/mlb/standings',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  // Separate into AL and NL
  const alDivisions = data?.standings?.filter(d =>
    d.division.includes('American') || d.division.includes('AL')
  ) || [];
  const nlDivisions = data?.standings?.filter(d =>
    d.division.includes('National') || d.division.includes('NL')
  ) || [];

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
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>Standings</p>
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isLoading ? (
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
            {/* American League */}
            {alDivisions.length > 0 && (
              <div>
                <h2
                  className="text-sm font-bold uppercase tracking-wider mb-4"
                  style={{ color: theme.text }}
                >
                  American League
                </h2>
                <div className="space-y-4">
                  {alDivisions.map(({ division, standings }) => (
                    <MLBStandings
                      key={division}
                      standings={standings}
                      divisionName={division.replace('American League ', '')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* National League */}
            {nlDivisions.length > 0 && (
              <div>
                <h2
                  className="text-sm font-bold uppercase tracking-wider mb-4"
                  style={{ color: theme.text }}
                >
                  National League
                </h2>
                <div className="space-y-4">
                  {nlDivisions.map(({ division, standings }) => (
                    <MLBStandings
                      key={division}
                      standings={standings}
                      divisionName={division.replace('National League ', '')}
                    />
                  ))}
                </div>
              </div>
            )}

            {(!data?.standings || data.standings.length === 0) && (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  No standings available
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
