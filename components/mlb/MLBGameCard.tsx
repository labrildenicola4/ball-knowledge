'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { MLBGame } from '@/lib/types/mlb';

interface MLBGameCardProps {
  game: MLBGame;
}

export const MLBGameCard = memo(function MLBGameCard({ game }: MLBGameCardProps) {
  const { theme, darkMode } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  const getInningDisplay = () => {
    if (!isLive) return null;
    const half = game.inningHalf === 'top' ? 'Top' : 'Bot';
    return `${half} ${game.inning}`;
  };

  return (
    <Link href={`/mlb/game/${game.id}`}>
      <div
        className="card-press cursor-pointer p-3 md:p-4 transition-theme glass-match-card"
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
            {game.date && (
              <span
                className="text-[9px]"
                style={{ color: theme.textSecondary }}
              >
                · {game.date}
              </span>
            )}
            {game.seriesInfo && (
              <span
                className="text-[9px]"
                style={{ color: theme.textSecondary }}
              >
                · {game.seriesInfo}
              </span>
            )}
          </div>
          <span
            className={`font-mono rounded-lg px-3 py-1 text-sm ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
            style={{ color: isLive ? '#fff' : theme.textSecondary }}
          >
            {isLive && '● '}
            {isLive ? getInningDisplay() : isFinal ? 'Final' : game.startTime}
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
                className="h-8 w-8 flex-shrink-0 object-contain logo-glow"
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
              <span
                className="text-base font-medium truncate max-w-[80px] sm:max-w-[120px]"
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
            className="font-mono rounded-lg px-4 py-2 text-lg font-semibold flex-shrink-0 glass-score score-text"
            style={{ color: theme.text }}
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
            {game.homeTeam.logo ? (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="h-8 w-8 flex-shrink-0 object-contain logo-glow"
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

        {/* Live Situation */}
        {isLive && game.situation && (
          <div
            className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 glass-badge"
          >
            {/* Base diagram */}
            <div className="relative h-8 w-8 flex-shrink-0">
              <div
                className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rotate-45"
                style={{
                  backgroundColor: game.situation.onSecond ? theme.gold : theme.border,
                }}
              />
              <div
                className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45"
                style={{
                  backgroundColor: game.situation.onThird ? theme.gold : theme.border,
                }}
              />
              <div
                className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45"
                style={{
                  backgroundColor: game.situation.onFirst ? theme.gold : theme.border,
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: theme.textSecondary }}>
                  {game.situation.balls}-{game.situation.strikes}
                </span>
                <span style={{ color: theme.textSecondary }}>
                  {game.outs} out{game.outs !== 1 ? 's' : ''}
                </span>
              </div>
              {game.situation.batter && (
                <p className="text-[10px] truncate" style={{ color: theme.text }}>
                  AB: {game.situation.batter}
                </p>
              )}
            </div>
          </div>
        )}

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
