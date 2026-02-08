'use client';

import Link from 'next/link';
import { ChevronRight, Trophy, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { TOURNAMENTS } from '@/lib/constants/tournaments';
import { SOCCER_ICON, BASKETBALL_ICON, FOOTBALL_ICON } from '@/lib/sport-icons';

export default function AllPage() {
  const { theme, darkMode, toggleDarkMode } = useTheme();

  // Sports Hubs
  const sportsHubs = [
    { name: 'Soccer', href: '/soccer', logo: SOCCER_ICON, description: 'Leagues, cups & fixtures' },
    { name: 'NFL', href: '/nfl', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', description: 'Pro football' },
    { name: 'NBA', href: '/nba', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', description: 'Games, stats & standings' },
    { name: 'NCAA Basketball', href: '/basketball', logo: BASKETBALL_ICON, description: 'College hoops' },
    { name: 'College Football', href: '/football', logo: FOOTBALL_ICON, description: 'CFB games' },
    { name: 'MLB', href: '/mlb', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png', description: 'Baseball' },
  ];

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Browse</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Sports Hubs */}
        <section className="mb-6">
          <h2
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            <Trophy size={14} />
            Sports
          </h2>
          <div className="flex flex-col gap-2">
            {sportsHubs.map(hub => (
              <Link
                key={hub.name}
                href={hub.href}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <img src={hub.logo} alt={hub.name} className="h-8 w-8 object-contain logo-glow" />
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{hub.name}</span>
                  <p className="text-[11px]" style={{ color: theme.textSecondary }}>{hub.description}</p>
                </div>
                <ChevronRight size={16} style={{ color: theme.textSecondary }} />
              </Link>
            ))}
          </div>
        </section>

        {/* Tournaments */}
        <section className="mb-6">
          <h2
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            <Trophy size={14} style={{ color: theme.gold }} />
            Tournaments
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TOURNAMENTS.filter(t => ['march-madness', 'champions-league'].includes(t.id)).map(tournament => (
              <Link
                key={tournament.slug}
                href={`/tournament/${tournament.slug}`}
                className="flex flex-col gap-1 rounded-xl p-4 transition-colors hover:opacity-80"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <span className="text-sm font-medium" style={{ color: theme.text }}>
                  {tournament.shortName}
                </span>
                <span className="text-[10px] capitalize" style={{ color: theme.textSecondary }}>
                  {tournament.sport}
                </span>
                {tournament.active && (
                  <span
                    className="inline-flex self-start mt-1 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{ backgroundColor: theme.green, color: '#fff' }}
                  >
                    Active
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
