'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { CollegeFootballGame } from '@/lib/types/college-football';

interface FootballGameCardProps {
  game: CollegeFootballGame;
}

export function FootballGameCard({ game }: FootballGameCardProps) {
  const { theme, darkMode } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);

  // Check if either team is ranked
  const hasRankedTeam = game.homeTeam.rank || game.awayTeam.rank;

  return (
    <Link href={`/football/game/${game.id}`}>
      <div
        className={`card-press cursor-pointer p-4 transition-theme ${darkMode ? 'glass-match-card' : 'card-hover rounded-xl'}`}
        style={darkMode ? undefined : {
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
              CFB
            </span>
            {game.conferenceGame && (
              <span
                className="text-[9px] font-medium"
                style={{ color: theme.gold }}
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
              backgroundColor: isLive ? theme.red : (darkMode ? 'rgba(255, 255, 255, 0.06)' : theme.bgTertiary),
              color: isLive ? '#fff' : theme.textSecondary,
            }}
          >
            {isLive && '● '}
            {isLive ? `Q${game.period} ${game.clock}` : isFinal ? 'Final' : game.startTime}
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
                {game.awayTeam.rank ? (
                  <span style={{ color: theme.gold }}>#{game.awayTeam.rank} </span>
                ) : null}
                Away {game.awayTeam.record && `(${game.awayTeam.record})`}
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
            className="font-mono rounded-lg px-4 py-2 text-lg font-semibold flex-shrink-0"
            style={{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : theme.bgTertiary, color: theme.text }}
          >
            {(isLive || isFinal)
              ? `${game.awayTeam.score ?? 0} - ${game.homeTeam.score ?? 0}`
              : 'vs'}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-2 justify-end">
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                {game.homeTeam.rank ? (
                  <span style={{ color: theme.gold }}>#{game.homeTeam.rank} </span>
                ) : null}
                Home {game.homeTeam.record && `(${game.homeTeam.record})`}
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
