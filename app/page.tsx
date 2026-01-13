'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { LeagueTabs, leagues } from '@/components/LeagueTabs';
import { MatchCard } from '@/components/MatchCard';
import { StandingsTable } from '@/components/StandingsTable';
import { useTheme } from '@/lib/theme';

// Mock data - replace with API calls
const mockMatches = [
  { id: 1, league: 'LaLiga', home: 'Real Madrid', away: 'Barcelona', homeScore: 2, awayScore: 1, status: 'FT', time: 'FT', homeLogo: '⚪', awayLogo: '🔵' },
  { id: 2, league: 'Premier League', home: 'Arsenal', away: 'Man City', homeScore: null, awayScore: null, status: 'NS', time: '15:00', homeLogo: '🔴', awayLogo: '🔵' },
  { id: 3, league: 'Serie A', home: 'Inter Milan', away: 'AC Milan', homeScore: 1, awayScore: 1, status: 'FT', time: 'FT', homeLogo: '⚫', awayLogo: '🔴' },
  { id: 4, league: 'LaLiga', home: 'Atlético Madrid', away: 'Sevilla', homeScore: 3, awayScore: 0, status: 'FT', time: 'FT', homeLogo: '🔴', awayLogo: '⚪' },
];

const mockStandings = [
  { position: 1, teamId: 541, team: 'Real Madrid', played: 20, won: 15, drawn: 3, lost: 2, gd: '+32', points: 48, form: ['W', 'W', 'D', 'W', 'W'] },
  { position: 2, teamId: 529, team: 'Barcelona', played: 20, won: 14, drawn: 4, lost: 2, gd: '+28', points: 46, form: ['W', 'L', 'W', 'W', 'D'] },
  { position: 3, teamId: 530, team: 'Atlético Madrid', played: 20, won: 12, drawn: 5, lost: 3, gd: '+18', points: 41, form: ['W', 'W', 'W', 'D', 'W'] },
  { position: 4, teamId: 531, team: 'Athletic Club', played: 20, won: 10, drawn: 6, lost: 4, gd: '+12', points: 36, form: ['D', 'W', 'D', 'W', 'W'] },
  { position: 5, teamId: 532, team: 'Villarreal', played: 20, won: 9, drawn: 7, lost: 4, gd: '+8', points: 34, form: ['W', 'D', 'D', 'W', 'L'] },
];

export default function HomePage() {
  const [activeLeague, setActiveLeague] = useState('laliga');
  const { theme } = useTheme();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const currentLeague = leagues.find((l) => l.id === activeLeague);

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />
      <LeagueTabs activeLeague={activeLeague} onLeagueChange={setActiveLeague} />

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Fixtures Section */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              Fixtures & Results
            </h2>
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>
              {currentDate}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {mockMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        {/* Standings Section */}
        <StandingsTable
          standings={mockStandings}
          leagueName={currentLeague?.name || 'LaLiga'}
        />
      </main>

      <BottomNav />
    </div>
  );
}
