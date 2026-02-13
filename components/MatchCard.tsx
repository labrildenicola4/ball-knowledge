'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { shouldUseWhiteFilterByCode } from '@/lib/constants/dark-mode-logos';

interface MatchCardProps {
  match: {
    id: number;
    league: string;
    leagueCode?: string;
    leagueLogo?: string;
    home: string;
    away: string;
    homeScore: number | null;
    awayScore: number | null;
    homeLogo: string;
    awayLogo: string;
    status: string;
    time: string;
  };
}

export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const { theme, darkMode } = useTheme();
  const isFinished = match.status === 'FT';
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status);
  const useWhiteFilter = darkMode && match.leagueCode && shouldUseWhiteFilterByCode(match.leagueCode);

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className="card-press cursor-pointer p-3 md:p-4 transition-theme glass-match-card"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.leagueLogo && (
              <img
                src={match.leagueLogo}
                alt={match.league}
                className="h-5 w-5 object-contain logo-glow"
                style={{ filter: useWhiteFilter ? 'brightness(0) invert(1)' : undefined }}
                loading="lazy"
              />
            )}
            <span
              className="text-sm uppercase tracking-wider font-medium"
              style={{ color: theme.textSecondary }}
            >
              {match.league}
            </span>
          </div>
          <span
            className={`font-mono rounded-lg px-3 py-1 text-sm ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
            style={{ color: isLive ? '#fff' : theme.textSecondary }}
          >
            {isLive && '● '}{isLive ? `${match.status}${match.time ? ` ${match.time}` : ''}` : match.time}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center">
          {/* Home Team */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pr-1 md:pr-2">
            {match.homeLogo.startsWith('http') ? (
              <img src={match.homeLogo} alt={match.home} className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 object-contain logo-glow" loading="lazy" />
            ) : (
              <span className="text-xl md:text-2xl flex-shrink-0">{match.homeLogo}</span>
            )}
            <div className="flex flex-col min-w-0">
              <span className="hidden md:block text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Home</span>
              <span className="text-sm md:text-base font-medium truncate" style={{ color: theme.text }}>{match.home}</span>
            </div>
          </div>

          {/* Score */}
          <div
            className="font-mono rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-base md:text-lg font-semibold flex-shrink-0 glass-score score-text"
            style={{ color: theme.text }}
          >
            {match.homeScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : 'vs'}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pl-1 md:pl-2 justify-end">
            <div className="flex flex-col items-end min-w-0">
              <span className="hidden md:block text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Away</span>
              <span className="text-sm md:text-base font-medium truncate text-right" style={{ color: theme.text }}>{match.away}</span>
            </div>
            {match.awayLogo.startsWith('http') ? (
              <img src={match.awayLogo} alt={match.away} className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 object-contain logo-glow" loading="lazy" />
            ) : (
              <span className="text-xl md:text-2xl flex-shrink-0">{match.awayLogo}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
