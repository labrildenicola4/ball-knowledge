'use client';

import { useTheme } from '@/lib/theme';

const leagues = [
  { id: 'laliga', name: 'LaLiga', icon: '🇪🇸', apiId: 140 },
  { id: 'premier', name: 'Premier', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', apiId: 39 },
  { id: 'seriea', name: 'Serie A', icon: '🇮🇹', apiId: 135 },
  { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪', apiId: 78 },
  { id: 'ligue1', name: 'Ligue 1', icon: '🇫🇷', apiId: 61 },
];

interface LeagueTabsProps {
  activeLeague: string;
  onLeagueChange: (leagueId: string) => void;
}

export function LeagueTabs({ activeLeague, onLeagueChange }: LeagueTabsProps) {
  const { theme } = useTheme();

  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-3 transition-theme"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => onLeagueChange(league.id)}
          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors"
          style={{
            backgroundColor: activeLeague === league.id ? theme.accent : 'transparent',
            color: activeLeague === league.id ? '#fff' : theme.text,
            border: activeLeague === league.id ? 'none' : `1px solid ${theme.border}`,
          }}
        >
          {league.icon} {league.name}
        </button>
      ))}
    </div>
  );
}

export { leagues };
