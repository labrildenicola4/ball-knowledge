'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { NFLGame } from '@/lib/types/nfl';

interface NFLGameCardProps {
  game: NFLGame;
}

export function NFLGameCard({ game }: NFLGameCardProps) {
  const { theme } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  const getQuarterDisplay = () => {
    if (!isLive) return null;
    const quarter = game.quarter;
    if (quarter === 0) return '';
    if (quarter <= 4) return `Q${quarter} ${game.clock}`;
    return `OT ${game.clock}`;
  };

  const homePossession = isLive && game.possession === game.homeTeam.id;
  const awayPossession = isLive && game.possession === game.awayTeam.id;

  return (
    <Link href={`/nfl/game/${game.id}`}>
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
            {game.broadcast && (
              <span
                className="text-[10px] font-medium"
                style={{ color: theme.textSecondary }}
              >
                {game.broadcast}
              </span>
            )}
            {game.week && (
              <span
                className="text-[9px]"
                style={{ color: theme.textSecondary }}
              >
                Week {game.week}
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
            {isLive ? getQuarterDisplay() : isFinal ? 'Final' : game.startTime}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center">
          {/* Away Team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            {game.awayTeam.logo ? (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="h-8 w-8 flex-shrink-0 object-contain"
                loading="lazy"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: game.awayTeam.color || theme.bgTertiary }}
              />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Away
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="text-base font-medium truncate max-w-[80px] sm:max-w-[120px]"
                  style={{
                    color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                    fontWeight: awayWon ? 600 : 500,
                  }}
                >
                  {game.awayTeam.shortDisplayName}
                </span>
                {awayPossession && (
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.gold }}
                    title="Has possession"
                  />
                )}
              </div>
              {game.awayTeam.record && (
                <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                  {game.awayTeam.record}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div
            className="font-mono rounded-lg px-4 py-2 text-lg font-semibold flex-shrink-0"
            style={{ backgroundColor: theme.bgTertiary, color: theme.text }}
          >
            {(isLive || isFinal)
              ? `${game.awayTeam.score ?? 0} - ${game.homeTeam.score ?? 0}`
              : 'vs'}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-2 justify-end">
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Home
              </span>
              <div className="flex items-center gap-1">
                {homePossession && (
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.gold }}
                    title="Has possession"
                  />
                )}
                <span
                  className="text-base font-medium truncate max-w-[80px] sm:max-w-[120px] text-right"
                  style={{
                    color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
                    fontWeight: homeWon ? 600 : 500,
                  }}
                >
                  {game.homeTeam.shortDisplayName}
                </span>
              </div>
              {game.homeTeam.record && (
                <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                  {game.homeTeam.record}
                </span>
              )}
            </div>
            {game.homeTeam.logo ? (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="h-8 w-8 flex-shrink-0 object-contain"
                loading="lazy"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full flex-shrink-0"
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
}
