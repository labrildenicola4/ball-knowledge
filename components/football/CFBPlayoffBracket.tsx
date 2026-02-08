'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { CFBBracketGame, CFBBracketTeam } from '@/lib/api-espn-cfb-bracket';

interface CFBPlayoffBracketProps {
  firstRound: CFBBracketGame[];
  quarterfinals: CFBBracketGame[];
  semifinals: CFBBracketGame[];
  championship: CFBBracketGame | null;
}

function TeamRow({
  team,
  isWinner,
  isLive,
}: {
  team: CFBBracketTeam;
  isWinner?: boolean;
  isLive?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center justify-between gap-1.5 py-1.5 px-2"
      style={{ opacity: isWinner === false ? 0.5 : 1 }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {team.seed && (
          <span
            className="text-[10px] font-bold w-4 text-center flex-shrink-0"
            style={{ color: theme.gold }}
          >
            {team.seed}
          </span>
        )}
        {team.logo && (
          <img src={team.logo} alt={team.name} className="h-4 w-4 object-contain logo-glow flex-shrink-0" />
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

function BracketMatchCard({ game }: { game: CFBBracketGame }) {
  const { theme } = useTheme();
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';

  return (
    <Link href={`/football/game/${game.id}`} className="block w-full">
      <div className="flex flex-col items-center w-full">
        {/* Bowl Name */}
        {game.bowlName && (
          <span className="text-[9px] font-medium truncate max-w-full mb-0.5" style={{ color: theme.gold }}>
            {game.bowlName}
          </span>
        )}

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

export function CFBPlayoffBracket({ firstRound, quarterfinals, semifinals, championship }: CFBPlayoffBracketProps) {
  const { theme } = useTheme();

  const hasGames = firstRound.length > 0 || quarterfinals.length > 0 || semifinals.length > 0 || championship;

  if (!hasGames) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-base font-medium mb-2" style={{ color: theme.text }}>
          CFP Bracket Coming Soon
        </p>
        <p className="text-sm" style={{ color: theme.textSecondary }}>
          The College Football Playoff bracket will be available once selections are made.
        </p>
      </div>
    );
  }

  // Fill arrays to expected lengths
  const firstRoundGames = [...firstRound, ...Array(4 - firstRound.length).fill(null)].slice(0, 4);
  const qfGames = [...quarterfinals, ...Array(4 - quarterfinals.length).fill(null)].slice(0, 4);
  const sfGames = [...semifinals, ...Array(2 - semifinals.length).fill(null)].slice(0, 2);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px] px-2">
        {/* Stage Headers */}
        <div className="flex mb-2">
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              First Round
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              Quarterfinals
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              Semifinals
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.gold }}>
              Championship
            </span>
          </div>
        </div>

        {/* Bracket Grid */}
        <div className="flex items-stretch" style={{ minHeight: '400px' }}>
          {/* First Round */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {firstRoundGames.map((game, i) => (
              <div key={`fr-${i}`} className="px-1">
                {game ? <BracketMatchCard game={game} /> : <EmptyMatchCard label="Seeds 5-12" />}
              </div>
            ))}
          </div>

          {/* FR to QF Connectors */}
          <div className="flex flex-col justify-around py-2" style={{ width: '12px' }}>
            {[0, 1].map((i) => (
              <div key={`fr-qf-${i}`} className="flex-1 flex items-center">
                <svg width="12" height="100%" preserveAspectRatio="none">
                  <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ))}
          </div>

          {/* Quarterfinals */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {qfGames.map((game, i) => (
              <div key={`qf-${i}`} className="px-1 flex items-center" style={{ flex: 1 }}>
                {game ? <BracketMatchCard game={game} /> : <EmptyMatchCard label={i < 2 ? 'Seeds 1-4 + FR Winner' : 'Seeds 1-4 + FR Winner'} />}
              </div>
            ))}
          </div>

          {/* QF to SF Connectors */}
          <div className="flex flex-col justify-around py-2" style={{ width: '12px' }}>
            {[0, 1].map((i) => (
              <div key={`qf-sf-${i}`} className="flex-1 flex items-center">
                <svg width="12" height="100%" preserveAspectRatio="none">
                  <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ))}
          </div>

          {/* Semifinals */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {sfGames.map((game, i) => (
              <div key={`sf-${i}`} className="px-1 flex items-center" style={{ flex: 2 }}>
                {game ? <BracketMatchCard game={game} /> : <EmptyMatchCard label="Semifinal" />}
              </div>
            ))}
          </div>

          {/* SF to Championship Connector */}
          <div className="flex flex-col justify-center py-2" style={{ width: '12px' }}>
            <svg width="12" height="100%" preserveAspectRatio="none">
              <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* Championship */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="px-1">
              {championship ? (
                <BracketMatchCard game={championship} />
              ) : (
                <EmptyMatchCard label="National Championship" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
