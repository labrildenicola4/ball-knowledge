'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { BracketGame, BracketTeam } from '@/lib/api-espn-nfl-bracket';

interface NFLPlayoffBracketProps {
  afc: {
    wildCard: BracketGame[];
    divisional: BracketGame[];
    championship: BracketGame | null;
  };
  nfc: {
    wildCard: BracketGame[];
    divisional: BracketGame[];
    championship: BracketGame | null;
  };
  superBowl: BracketGame | null;
}

function TeamRow({
  team,
  isWinner,
  isLive,
  showSeed = true,
}: {
  team: BracketTeam;
  isWinner?: boolean;
  isLive?: boolean;
  showSeed?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center justify-between gap-1.5 py-1.5 px-2"
      style={{ opacity: isWinner === false ? 0.5 : 1 }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {showSeed && team.seed && (
          <span
            className="text-[10px] font-bold w-4 text-center flex-shrink-0"
            style={{ color: theme.gold }}
          >
            {team.seed}
          </span>
        )}
        {team.logo && (
          <img src={team.logo} alt={team.name} className="h-4 w-4 object-contain flex-shrink-0" />
        )}
        <span
          className="text-xs font-medium truncate"
          style={{ color: isWinner ? theme.accent : theme.text }}
        >
          {team.abbreviation || team.name}
        </span>
      </div>
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: isWinner ? theme.accent : theme.text }}
      >
        {team.score ?? '-'}
      </span>
    </div>
  );
}

function BracketMatchCard({ game }: { game: BracketGame }) {
  const { theme } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';

  return (
    <Link href={`/nfl/game/${game.id}`} className="block w-full">
      <div className="flex flex-col items-center w-full">
        {/* Date/Time and Venue */}
        <div className="text-center mb-1">
          <span className="text-[9px] block" style={{ color: isLive ? theme.red : theme.textSecondary }}>
            {isLive ? '● LIVE' : isFinal ? 'Final' : `${game.date} • ${game.time}`}
          </span>
          {game.venue && (
            <span className="text-[8px] block truncate max-w-[140px]" style={{ color: theme.textSecondary }}>
              {game.venue}
            </span>
          )}
        </div>

        {/* Match Box */}
        <div
          className="rounded p-1 transition-all hover:scale-[1.02] cursor-pointer w-full"
          style={{
            backgroundColor: theme.bgTertiary,
            border: `1px solid ${isLive ? theme.red : theme.border}`,
          }}
        >
          <TeamRow
            team={game.awayTeam}
            isWinner={isFinal ? game.awayTeam.isWinner : undefined}
            isLive={isLive}
          />
          <div style={{ borderTop: `1px solid ${theme.border}` }} />
          <TeamRow
            team={game.homeTeam}
            isWinner={isFinal ? game.homeTeam.isWinner : undefined}
            isLive={isLive}
          />
        </div>
      </div>
    </Link>
  );
}

function EmptyMatchCard({ label }: { label?: string }) {
  const { theme } = useTheme();

  return (
    <div
      className="rounded p-2 flex items-center justify-center w-full"
      style={{
        backgroundColor: theme.bgTertiary,
        border: `1px dashed ${theme.border}`,
        minHeight: '60px',
        opacity: 0.5,
      }}
    >
      <span className="text-[10px]" style={{ color: theme.textSecondary }}>
        {label || 'TBD'}
      </span>
    </div>
  );
}

function RoundColumn({
  name,
  games,
  emptyLabel,
}: {
  name: string;
  games: (BracketGame | null)[];
  emptyLabel?: string;
}) {
  const { theme } = useTheme();
  const hasGames = games.some(g => g !== null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Column Header */}
      <div className="text-center mb-2">
        <span
          className="text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: theme.textSecondary }}
        >
          {name}
        </span>
      </div>

      {/* Games */}
      <div className="flex flex-col justify-around flex-1 gap-2">
        {hasGames ? (
          games.filter(g => g !== null).map((game, idx) => (
            <div key={game!.id} className="px-0.5">
              <BracketMatchCard game={game!} />
            </div>
          ))
        ) : (
          <div className="px-0.5">
            <EmptyMatchCard label={emptyLabel} />
          </div>
        )}
      </div>
    </div>
  );
}

function ConferenceBracket({
  conference,
  data,
  reverse = false,
}: {
  conference: 'AFC' | 'NFC';
  data: {
    wildCard: BracketGame[];
    divisional: BracketGame[];
    championship: BracketGame | null;
  };
  reverse?: boolean;
}) {
  const { theme } = useTheme();

  const columns = [
    { name: 'Wild Card', games: data.wildCard, emptyLabel: 'Wild Card' },
    { name: 'Divisional', games: data.divisional, emptyLabel: 'Divisional' },
    { name: 'Conf Champ', games: data.championship ? [data.championship] : [], emptyLabel: 'Championship' },
  ];

  if (reverse) {
    columns.reverse();
  }

  return (
    <div className="flex-1">
      {/* Conference Header */}
      <div
        className="text-center py-2 mb-2 rounded-lg"
        style={{ backgroundColor: conference === 'AFC' ? '#D50A0A' : '#003069' }}
      >
        <span className="text-sm font-bold text-white">{conference}</span>
      </div>

      {/* Bracket Grid */}
      <div className="flex gap-1">
        {columns.map((column) => (
          <RoundColumn
            key={column.name}
            name={column.name}
            games={column.games}
            emptyLabel={column.emptyLabel}
          />
        ))}
      </div>
    </div>
  );
}

export function NFLPlayoffBracket({ afc, nfc, superBowl }: NFLPlayoffBracketProps) {
  const { theme } = useTheme();

  const hasGames = afc.wildCard.length > 0 || nfc.wildCard.length > 0 || superBowl;

  if (!hasGames) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
          Playoff Bracket Coming Soon
        </p>
        <p className="text-sm" style={{ color: theme.textSecondary }}>
          The NFL playoff bracket will be available once the postseason begins.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Conference Brackets */}
      <div className="flex gap-4 mb-4">
        <ConferenceBracket conference="AFC" data={afc} />
        <ConferenceBracket conference="NFC" data={nfc} reverse />
      </div>

      {/* Super Bowl */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div className="text-center mb-3">
          <span
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color: theme.gold }}
          >
            Super Bowl LX
          </span>
        </div>

        <div className="max-w-xs mx-auto">
          {superBowl ? (
            <BracketMatchCard game={superBowl} />
          ) : (
            <EmptyMatchCard label="AFC Champion vs NFC Champion" />
          )}
        </div>
      </div>
    </div>
  );
}
