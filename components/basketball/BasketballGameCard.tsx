'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { BasketballGame } from '@/lib/types/basketball';

interface BasketballGameCardProps {
  game: BasketballGame;
}

export function BasketballGameCard({ game }: BasketballGameCardProps) {
  const { theme } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  return (
    <Link href={`/basketball/game/${game.id}`}>
      <div
        className="card-hover cursor-pointer rounded-xl p-4 transition-theme"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.conferenceGame && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                Conf
              </span>
            )}
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
        <div className="space-y-2">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {game.awayTeam.rank && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: theme.accent }}
                >
                  #{game.awayTeam.rank}
                </span>
              )}
              {game.awayTeam.logo ? (
                <img
                  src={game.awayTeam.logo}
                  alt={game.awayTeam.name}
                  className="h-6 w-6 flex-shrink-0 object-contain"
                  loading="lazy"
                />
              ) : (
                <div
                  className="h-6 w-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: game.awayTeam.color || theme.bgTertiary }}
                />
              )}
              <span
                className="text-sm font-medium truncate"
                style={{
                  color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: awayWon ? 600 : 500,
                }}
              >
                {game.awayTeam.shortDisplayName}
              </span>
              {game.awayTeam.record && (
                <span
                  className="text-[10px] hidden sm:inline"
                  style={{ color: theme.textSecondary }}
                >
                  ({game.awayTeam.record})
                </span>
              )}
            </div>
            <span
              className="font-mono text-lg font-semibold w-8 text-right"
              style={{
                color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
              }}
            >
              {game.awayTeam.score ?? '-'}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {game.homeTeam.rank && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: theme.accent }}
                >
                  #{game.homeTeam.rank}
                </span>
              )}
              {game.homeTeam.logo ? (
                <img
                  src={game.homeTeam.logo}
                  alt={game.homeTeam.name}
                  className="h-6 w-6 flex-shrink-0 object-contain"
                  loading="lazy"
                />
              ) : (
                <div
                  className="h-6 w-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: game.homeTeam.color || theme.bgTertiary }}
                />
              )}
              <span
                className="text-sm font-medium truncate"
                style={{
                  color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: homeWon ? 600 : 500,
                }}
              >
                {game.homeTeam.shortDisplayName}
              </span>
              {game.homeTeam.record && (
                <span
                  className="text-[10px] hidden sm:inline"
                  style={{ color: theme.textSecondary }}
                >
                  ({game.homeTeam.record})
                </span>
              )}
            </div>
            <span
              className="font-mono text-lg font-semibold w-8 text-right"
              style={{
                color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
              }}
            >
              {game.homeTeam.score ?? '-'}
            </span>
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
}
