'use client';

import { useTheme } from '@/lib/theme';

const leagues = [
  // Top 5 European Leagues
  { id: 'laliga', name: 'LaLiga', icon: '🇪🇸' },
  { id: 'premier', name: 'Premier', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'seriea', name: 'Serie A', icon: '🇮🇹' },
  { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
  { id: 'ligue1', name: 'Ligue 1', icon: '🇫🇷' },
  // Additional Leagues
  { id: 'championship', name: 'Championship', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'eredivisie', name: 'Eredivisie', icon: '🇳🇱' },
  { id: 'primeiraliga', name: 'Primeira Liga', icon: '🇵🇹' },
  { id: 'brasileirao', name: 'Brasileirão', icon: '🇧🇷' },
  // International
  { id: 'championsleague', name: 'UCL', icon: '🏆' },
  { id: 'copalibertadores', name: 'Libertadores', icon: '🏆' },
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
