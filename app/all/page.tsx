'use client';

import Link from 'next/link';
import { ChevronRight, Trophy, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { SOCCER_ICON, BASKETBALL_ICON, FOOTBALL_ICON } from '@/lib/sport-icons';
import { SafeImage } from '@/components/SafeImage';

export default function AllPage() {
  const { theme, darkMode, toggleDarkMode } = useTheme();

  // Sports Hubs
  const sportsHubs = [
    { name: 'Soccer', href: '/soccer', logo: SOCCER_ICON, description: 'Leagues, cups & fixtures' },
    { name: 'NBA', href: '/nba', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', description: 'Games, stats & standings' },
    { name: 'MLB', href: '/mlb', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png', description: 'Baseball' },
    { name: 'NCAA Basketball', href: '/basketball', logo: BASKETBALL_ICON, description: 'College hoops' },
    { name: 'NHL', href: '/nhl', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', description: 'Hockey' },
    { name: 'NFL', href: '/nfl', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', description: 'Pro football' },
    { name: 'F1', href: '/f1', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png', description: 'Formula 1 racing' },
    { name: 'Golf', href: '/golf', logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png', description: 'PGA, DP World, LPGA & LIV' },
    { name: 'UFC', href: '/ufc', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png', description: 'Mixed martial arts' },
    { name: 'College Football', href: '/football', logo: FOOTBALL_ICON, description: 'CFB games' },
  ];

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: 'transparent' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 glass-header">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Browse</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="tap-highlight flex h-11 w-11 items-center justify-center rounded-full"
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* Sports Hubs */}
        <section className="mb-6">
          <h2
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={darkMode ? undefined : { color: theme.textSecondary }}
          >
            <Trophy size={14} />
            Sports
          </h2>
          <div className="flex flex-col gap-2">
            {sportsHubs.map(hub => (
              <Link
                key={hub.name}
                href={hub.href}
                className="card-press flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80 glass-card"
              >
                <SafeImage src={hub.logo} alt={hub.name} className="h-8 w-8 object-contain logo-glow" />
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{hub.name}</span>
                  <p className="text-[11px]" style={{ color: theme.textSecondary }}>{hub.description}</p>
                </div>
                <ChevronRight size={16} style={{ color: theme.textSecondary }} />
              </Link>
            ))}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
