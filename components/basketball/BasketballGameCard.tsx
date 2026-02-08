'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { BasketballGame } from '@/lib/types/basketball';

interface BasketballGameCardProps {
  game: BasketballGame;
}

export const BasketballGameCard = memo(function BasketballGameCard({ game }: BasketballGameCardProps) {
  const { theme } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  return (
    <Link href={`/basketball/game/${game.id}`}>
      <div
        className="card-hover cursor-pointer rounded-xl p-3 md:p-4 transition-theme"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {game.conference || 'NCAA'}
            </span>
            {game.broadcast && (
              <span
                className="text-[10px] font-medium"
                style={{ color: theme.textSecondary }}
              >
                {game.broadcast}
              </span>
            )}
          </div>
          <span
            className="font-mono rounded-lg px-3 py-1 text-sm"
            style={{
              backgroundColor: isLive ? theme.red : theme.bgTertiary,
              color: isLive ? '#fff' : theme.textSecondary,
            }}
          >
            {isLive && '● '}
            {isLive ? `${game.period > 2 ? 'OT' : game.period === 2 ? '2H' : '1H'} ${game.clock}` : isFinal ? 'Final' : game.startTime}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center">
          {/* Away Team */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pr-1 md:pr-2">
            {game.awayTeam.logo ? (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 object-contain"
                loading="lazy"
              />
            ) : (
              <div
                className="h-7 w-7 md:h-8 md:w-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: game.awayTeam.color || theme.bgTertiary }}
              />
            )}
            <div className="flex flex-col min-w-0">
              <span className="hidden md:block text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Away {game.awayTeam.rank ? `#${game.awayTeam.rank}` : ''}
              </span>
              <span
                className="text-sm md:text-base font-medium truncate"
                style={{
                  color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: awayWon ? 600 : 500,
                }}
              >
                {game.awayTeam.shortDisplayName}
              </span>
            </div>
          </div>

          {/* Score */}
          <div
            className="font-mono rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-base md:text-lg font-semibold flex-shrink-0"
            style={{ backgroundColor: theme.bgTertiary, color: theme.text }}
          >
            {(isLive || isFinal)
              ? `${game.awayTeam.score ?? 0} - ${game.homeTeam.score ?? 0}`
              : 'vs'}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pl-1 md:pl-2 justify-end">
            <div className="flex flex-col items-end min-w-0">
              <span className="hidden md:block text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Home {game.homeTeam.rank ? `#${game.homeTeam.rank}` : ''}
              </span>
              <span
                className="text-sm md:text-base font-medium truncate text-right"
                style={{
                  color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: homeWon ? 600 : 500,
                }}
              >
                {game.homeTeam.shortDisplayName}
              </span>
            </div>
            {game.homeTeam.logo ? (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 object-contain"
                loading="lazy"
              />
            ) : (
              <div
                className="h-7 w-7 md:h-8 md:w-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: game.homeTeam.color || theme.bgTertiary }}
              />
            )}
          </div>
        </div>

        {/* Venue (optional) */}
        {game.venue && (
          <p
            className="mt-2 text-[10px] truncate"
            style={{ color: theme.textSecondary }}
          >
            {game.venue}
          </p>
        )}
      </div>
    </Link>
  );
});
