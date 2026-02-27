'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { shouldUseWhiteFilterByCode } from '@/lib/constants/dark-mode-logos';
import { SafeImage } from '@/components/SafeImage';

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
        className="card-press cursor-pointer p-4 md:p-5 transition-theme glass-match-card"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.leagueLogo && (
              <SafeImage
                src={match.leagueLogo}
                alt={match.league}
                className="h-5 w-5 object-contain logo-glow"
                style={{ filter: useWhiteFilter ? 'brightness(0) invert(1)' : undefined }}
                loading="lazy"
              />
            )}
            <span
              className="text-[15px] uppercase tracking-wider font-medium"
              style={{ color: theme.textSecondary }}
            >
              {match.league}
            </span>
          </div>
          <span
            className={`font-mono rounded-lg px-3 py-1 text-[15px] ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
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
              <SafeImage src={match.homeLogo} alt={match.home} className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 object-contain logo-glow" loading="lazy" />
            ) : (
              <span className="text-xl md:text-2xl flex-shrink-0">{match.homeLogo}</span>
            )}
            <div className="flex flex-col min-w-0">
              <span className="hidden md:block text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Home</span>
              <span className="text-[15px] md:text-base font-medium line-clamp-2 break-words" style={{ color: theme.text }}>{match.home}</span>
            </div>
          </div>

          {/* Score */}
          <div
            className="font-mono rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-[17px] md:text-lg font-semibold flex-shrink-0 glass-score score-text"
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
              <span className="text-[15px] md:text-base font-medium line-clamp-2 break-words text-right" style={{ color: theme.text }}>{match.away}</span>
            </div>
            {match.awayLogo.startsWith('http') ? (
              <SafeImage src={match.awayLogo} alt={match.away} className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 object-contain logo-glow" loading="lazy" />
            ) : (
              <span className="text-xl md:text-2xl flex-shrink-0">{match.awayLogo}</span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
});
