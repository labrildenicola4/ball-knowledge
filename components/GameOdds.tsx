'use client';

import { useTheme } from '@/lib/theme';
import { useOdds } from '@/lib/use-odds';
import { SafeImage } from '@/components/SafeImage';

interface GameOddsProps {
  sport: string;
  homeAbbrev: string;
  awayAbbrev: string;
  gameDate: string;
  isLive: boolean;
  isUpcoming: boolean;
  matchId?: number;
  homeTeamName?: string;
  awayTeamName?: string;
  leagueCode?: string;
}

export function GameOdds({ homeAbbrev, awayAbbrev, ...rest }: GameOddsProps) {
  const { theme, darkMode } = useTheme();
  const { odds } = useOdds({ homeAbbrev, awayAbbrev, ...rest });

  if (!odds) return null;

  const hasDraw = odds.hasDraw ?? odds.draw > 0;

  return (
    <div className="mt-6 flex justify-center">
      <div
        className={`rounded-xl px-5 py-3 w-full max-w-[280px] ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}` }}
      >
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
              {hasDraw ? 'Home' : homeAbbrev}
            </p>
            <p className="text-[18px] font-bold" style={{ color: theme.green, fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(odds.homeWin * 100)}%
            </p>
          </div>
          {hasDraw && (
            <div className="text-center flex-1">
              <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
                Draw
              </p>
              <p className="text-[18px] font-semibold" style={{ color: theme.gold, fontFamily: "'JetBrains Mono', monospace" }}>
                {Math.round(odds.draw * 100)}%
              </p>
            </div>
          )}
          <div className="text-center flex-1">
            <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
              {hasDraw ? 'Away' : awayAbbrev}
            </p>
            <p className="text-[18px] font-bold" style={{ color: theme.red, fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(odds.awayWin * 100)}%
            </p>
          </div>
        </div>
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <span className="text-[9px]" style={{ color: theme.textSecondary }}>
            Powered by
          </span>
          <SafeImage
            src={darkMode ? '/logo-white.svg' : '/logo-black.svg'}
            alt="Polymarket"
            className="h-3"
          />
        </a>
      </div>
    </div>
  );
}
