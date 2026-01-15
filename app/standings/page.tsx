'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { LeagueTabs, leagues } from '@/components/LeagueTabs';
import { StandingsTable } from '@/components/StandingsTable';
import { useTheme } from '@/lib/theme';

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

export default function StandingsPage() {
  const [activeLeague, setActiveLeague] = useState('laliga');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/standings?league=${activeLeague}`);
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json();
        setStandings(data.standings || []);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setStandings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [activeLeague]);

  const currentLeague = leagues.find((l) => l.id === activeLeague);

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />
      <LeagueTabs activeLeague={activeLeague} onLeagueChange={setActiveLeague} />

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-2 text-[12px]" style={{ color: theme.textSecondary }}>
              Loading standings...
            </p>
          </div>
        ) : standings.length > 0 ? (
          <StandingsTable
            standings={standings}
            leagueName={currentLeague?.name || 'League'}
          />
        ) : (
          <div
            className="rounded-lg py-8 text-center"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <p className="text-[12px]" style={{ color: theme.textSecondary }}>
              No standings available
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
