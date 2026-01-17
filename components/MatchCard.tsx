'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';

interface MatchCardProps {
  match: {
    id: number;
    league: string;
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

export function MatchCard({ match }: MatchCardProps) {
  const { theme } = useTheme();
  const isFinished = match.status === 'FT';
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status);

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className="card-hover cursor-pointer rounded-xl p-4 transition-theme"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className="text-xs uppercase tracking-wider font-medium"
            style={{ color: theme.textSecondary }}
          >
            {match.league}
          </span>
          <span
            className="font-mono rounded-lg px-3 py-1 text-sm"
            style={{
              backgroundColor: isLive ? theme.red : theme.bgTertiary,
              color: isLive ? '#fff' : theme.textSecondary,
            }}
          >
            {isLive && '● '}{isLive ? `${match.status} ${match.time}` : match.time}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            {match.homeLogo.startsWith('http') ? (
              <img src={match.homeLogo} alt={match.home} className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-2xl">{match.homeLogo}</span>
            )}
            <span className="text-base font-medium" style={{ color: theme.text }}>{match.home}</span>
          </div>

          <div
            className="font-mono rounded-lg px-5 py-2 text-lg font-semibold"
            style={{ backgroundColor: theme.bgTertiary, color: theme.text }}
          >
            {match.homeScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : 'vs'}
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="text-base font-medium" style={{ color: theme.text }}>{match.away}</span>
            {match.awayLogo.startsWith('http') ? (
              <img src={match.awayLogo} alt={match.away} className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-2xl">{match.awayLogo}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
