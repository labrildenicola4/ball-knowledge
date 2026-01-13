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
  const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(match.status);

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
            className="text-[10px] uppercase tracking-wider"
            style={{ color: theme.textSecondary }}
          >
            {match.league}
          </span>
          <span
            className="font-mono rounded-lg px-3 py-1 text-[11px]"
            style={{
              backgroundColor: isLive ? theme.accent : theme.bgTertiary,
              color: isLive ? '#fff' : theme.textSecondary,
            }}
          >
            {isLive && '● '}{match.time}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-xl">{match.homeLogo}</span>
            <span className="text-sm font-medium">{match.home}</span>
          </div>

          <div
            className="font-mono rounded-md px-4 py-2 text-base font-semibold"
            style={{ backgroundColor: theme.bgTertiary }}
          >
            {match.homeScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : 'vs'}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <span className="text-sm font-medium">{match.away}</span>
            <span className="text-xl">{match.awayLogo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
